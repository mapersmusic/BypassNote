import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import JSZip from "jszip";
import { Platform } from "react-native";

import type { CollectionId } from "@/constants/collections";
import { SRC_LABELS, type Row } from "@/constants/schema";
import type { BpnoteState } from "@/lib/codec";

/**
 * Modules BypassNote.
 *
 * L'ancienne version web exécutait le `.js` du module avec `new Function()`
 * puis ouvrait le HTML retourné dans un nouvel onglet. Hermes interdit
 * l'évaluation dynamique : on garde donc le même contrat de module, mais le
 * code est évalué dans une WebView (mobile) ou dans une page Blob (web).
 */

export type ModuleManifest = {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  entry?: string;
};

export type InstalledModule = {
  id: string;
  name: string;
  description: string;
  version: string;
  source: string;
  manifest: ModuleManifest | null;
  installedAt: string;
};

export type ModuleBridgeMessage =
  | { type: "close" }
  | { type: "open"; url: string }
  | { type: "message"; message: string }
  | { type: "exportCsv"; collection?: string };

const MODULES_FILE = "modules.json";
const STORAGE_KEY = "bpnote.modules.v1";

/* -------------------------------------------------------------------------- */
/* Installation                                                               */
/* -------------------------------------------------------------------------- */

function isWeb() {
  return Platform.OS === "web";
}

/** Lit un fichier choisi en octets, web ou natif. */
async function readAssetBytes(uri: string): Promise<Uint8Array> {
  if (isWeb()) {
    const response = await fetch(uri);
    return new Uint8Array(await response.arrayBuffer());
  }

  return new File(uri).bytes();
}

/** Lit un fichier choisi en texte, web ou natif. */
async function readAssetText(uri: string): Promise<string> {
  if (isWeb()) {
    const response = await fetch(uri);
    return response.text();
  }

  return new File(uri).text();
}

/** Premier champ texte `key: 'valeur'` du source — repli quand on ne peut pas évaluer. */
function stringField(source: string, key: string): string | undefined {
  const match = new RegExp(`\\b${key}\\s*:\\s*['"\`]([^'"\`]*)['"\`]`).exec(source);
  return match?.[1] || undefined;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "module";
}

function createModuleRecord(
  source: string,
  manifest: ModuleManifest | null,
  filename: string,
): InstalledModule {
  const fallback = stripExtension(filename);
  const id = manifest?.id || stringField(source, "id") || fallback;
  const name = manifest?.name || stringField(source, "name") || fallback;

  if (!id || !name) {
    throw new Error("Le module doit exposer {id, name} et createPage, renderPage ou run.");
  }

  return {
    id,
    name,
    description: manifest?.description || stringField(source, "description") || "",
    version: manifest?.version || stringField(source, "version") || "1.0.0",
    source,
    manifest,
    installedAt: new Date().toISOString(),
  };
}

/** Ouvre le sélecteur et retourne le module prêt à être enregistré. */
export async function pickAndReadModule(): Promise<InstalledModule | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const filename = asset.name ?? "module";

  if (/\.zip$/i.test(filename)) {
    const zip = await JSZip.loadAsync(await readAssetBytes(asset.uri));
    const manifestEntry = zip.file("manifest.json");

    if (!manifestEntry) {
      throw new Error("Le paquet ZIP doit contenir un fichier manifest.json.");
    }

    const manifest = JSON.parse(await manifestEntry.async("text")) as ModuleManifest;
    const entryName = manifest.entry || "index.js";
    const entry = zip.file(entryName);

    if (!entry) {
      throw new Error(`Le paquet ZIP ne contient pas l'entrée du module : ${entryName}.`);
    }

    return createModuleRecord(await entry.async("text"), manifest, filename);
  }

  if (!/\.js$/i.test(filename)) {
    throw new Error("Choisissez un fichier .js ou .zip.");
  }

  return createModuleRecord(await readAssetText(asset.uri), null, filename);
}

/* -------------------------------------------------------------------------- */
/* Persistance                                                                */
/* -------------------------------------------------------------------------- */

function isInstalledModule(value: unknown): value is InstalledModule {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<InstalledModule>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.source === "string"
  );
}

export async function loadInstalledModules(): Promise<InstalledModule[]> {
  try {
    let raw: string | null = null;

    if (isWeb()) {
      raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    } else {
      const file = new File(Paths.document, MODULES_FILE);
      raw = file.exists ? await file.text() : null;
    }

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isInstalledModule) : [];
  } catch {
    return [];
  }
}

export async function saveInstalledModules(modules: InstalledModule[]): Promise<void> {
  const raw = JSON.stringify(modules);

  if (isWeb()) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, raw);
    }
    return;
  }

  const file = new File(Paths.document, MODULES_FILE);
  file.create({ overwrite: true });
  file.write(raw);
}

/* -------------------------------------------------------------------------- */
/* Exécution                                                                  */
/* -------------------------------------------------------------------------- */

/** Échappe une chaîne pour l'insérer dans le document hôte. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** JSON sûr à l'intérieur d'un `<script>` (évite `</script>` et U+2028/2029). */
function embedJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Script exécuté dans la page hôte.
 *
 * Il évalue le module (`new Function`), appelle `createPage` / `renderPage` /
 * `run`, puis injecte le HTML retourné dans une iframe `srcdoc` — ce qui permet
 * aux `<script>` du module de s'exécuter, contrairement à `innerHTML`.
 */
const MODULE_RUNTIME = `
(function () {
  var payload = window.__BPNOTE_MODULE__ || {};
  var state = payload.state || {};
  var source = payload.source || "";
  var activeCollection = payload.activeCollection || "tricks";

  function post(message) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      return true;
    }
    return false;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function closePage() {
    if (!post({ type: "close" })) {
      window.close();
    }
  }

  document.getElementById("module-back").onclick = closePage;

  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "bpnote-close") {
      closePage();
    }
  });

  function getVisibleItems(collection) {
    return state[collection] || [];
  }

  function csvValue(value) {
    var text = String(value == null ? "" : value);
    return /[",\\n;]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function buildCsv(collection) {
    var items = getVisibleItems(collection);
    var headers = [];
    var rows = [];

    switch (collection) {
      case "tricks":
        headers = ["ID", "Description"];
        rows = items.map(function (item) { return [item.id, item.description]; });
        break;
      case "musicGenres":
      case "musicParts":
      case "artists":
        headers = ["ID", "Nom"];
        rows = items.map(function (item) { return [item.id, item.name]; });
        break;
      case "sources":
        headers = ["ID", "Type", "Titre", "Données", "Key", "BPM"];
        rows = items.map(function (item) {
          var key = item.key ? item.key.tonic + "/" + item.key.mode : "";
          return [item.id, { 1: "URL", 2: "YouTube", 3: "YouTube Music" }[item.type] || item.type, item.title, item.data, key, item.bpm];
        });
        break;
      case "trickMetadatas":
        headers = ["Trick", "Genre", "Partie", "Artiste", "Source", "Timestamp"];
        rows = items.map(function (item) {
          return [item.trickId, item.musicGenreId, item.musicPartId, item.artistId, item.sourceId, item.timestamp];
        });
        break;
      default:
        return "";
    }

    return [headers].concat(rows).map(function (row) {
      return row.map(csvValue).join(",");
    }).join("\\n");
  }

  var helpers = {
    showMessage: function (message) {
      if (!post({ type: "message", message: String(message) })) {
        alert(message);
      }
    },
    openExternal: function (url) {
      if (!post({ type: "open", url: String(url) })) {
        window.open(String(url), "_blank", "noopener");
      }
    },
    exportCsv: function () {
      if (post({ type: "exportCsv", collection: activeCollection })) {
        return;
      }
      var csv = buildCsv(activeCollection);
      if (!csv) {
        helpers.showMessage("Aucune donnée visible à exporter.");
        return;
      }
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = activeCollection + ".csv";
      link.click();
      URL.revokeObjectURL(link.href);
    },
    closePage: closePage,
  };

  function showHtml(html) {
    var frame = document.getElementById("module-frame");
    var closeScript =
      "<scr" + "ipt>window.close=function(){parent.postMessage({type:'bpnote-close'},'*');};</scr" + "ipt>";
    frame.srcdoc =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<style>html,body{margin:0;min-height:100%;background:#0f0f11;color:#e4e4f0;' +
      'font-family:"IBM Plex Sans",system-ui,sans-serif}' +
      '*,*::before,*::after{box-sizing:border-box}</style></head><body>' +
      closeScript +
      html +
      '</body></html>';
  }

  function showError(error) {
    var message = error && error.message ? error.message : String(error);
    showHtml(
      '<div style="padding:24px;color:#f87171">' +
      '<h1 style="font-size:16px;margin:0 0 8px">Erreur du module</h1>' +
      '<pre style="white-space:pre-wrap;font-size:12px;color:#e4e4f0">' +
      escapeHtml(message) +
      '</pre></div>'
    );
  }

  try {
    var module = { exports: {} };
    var fn = new Function("module", "exports", "state", "helpers", source);
    fn(module, module.exports, state, helpers);

    var mod = module.exports;
    var valid =
      mod &&
      typeof mod.createPage === "function" ||
      mod && typeof mod.renderPage === "function" ||
      mod && typeof mod.run === "function";

    if (!valid) {
      throw new Error("Le module doit exporter createPage, renderPage ou run.");
    }

    var context = { state: state, getVisibleItems: getVisibleItems, helpers: helpers };
    var html = null;

    if (typeof mod.createPage === "function") {
      html = mod.createPage(context);
    } else if (typeof mod.renderPage === "function") {
      html = mod.renderPage(context);
    } else {
      var result = mod.run(context);
      if (typeof result === "string") {
        html = result;
      }
    }

    if (!html) {
      throw new Error("Ce module ne fournit pas de page web.");
    }

    showHtml(html);
  } catch (error) {
    showError(error);
  }
})();
`;

/** Document autonome : barre d'outils, iframe et runtime du module. */
export function buildModuleDocument(
  module: InstalledModule,
  state: BpnoteState,
  activeCollection: CollectionId,
): string {
  const payload = {
    source: module.source,
    state,
    activeCollection,
  };

  const title = escapeHtml(module.name);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  html, body { height: 100%; margin: 0; }
  body { background: #0f0f11; color: #e4e4f0; font-family: "IBM Plex Sans", system-ui, sans-serif; overflow: hidden; }
  .module-shell { height: 100vh; display: flex; flex-direction: column; background: #0f0f11; overflow: hidden; }
  .module-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #2e2e36; background: #18181b; flex-shrink: 0; }
  .module-toolbar .title { font-weight: 600; font-size: 14px; }
  .module-toolbar .btn { padding: 8px 12px; border: 1px solid #3a3a44; border-radius: 8px; background: #1e1e23; color: #e4e4f0; cursor: pointer; font-size: 12px; }
  .module-toolbar .btn:hover { border-color: #6c63ff; color: #6c63ff; }
  .module-body { flex: 1; min-height: 0; }
  #module-frame { display: block; width: 100%; height: 100%; border: 0; background: #0f0f11; }
</style>
</head>
<body>
  <div class="module-shell">
    <div class="module-toolbar">
      <div class="title">${title}</div>
      <button type="button" class="btn" id="module-back">Retour à BypassNote</button>
    </div>
    <div class="module-body"><iframe id="module-frame" sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-same-origin"></iframe></div>
  </div>
  <script>window.__BPNOTE_MODULE__ = ${embedJson(payload)};</script>
  <script>${MODULE_RUNTIME}</script>
</body>
</html>`;
}

/** Ouvre le document du module dans un nouvel onglet (web uniquement). */
export function openModuleInWindow(html: string): boolean {
  if (!isWeb() || typeof window === "undefined") {
    return false;
  }

  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const opened = window.open(url, "_blank");

  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

/** CSV d'une collection, pour le helper `exportCsv` sur mobile. */
export function buildCollectionCsv(
  collection: CollectionId,
  state: BpnoteState,
  rows: Row[] = (state[collection] ?? []) as Row[],
): string {
  const value = (input: unknown) => {
    const text = String(input ?? "");
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  let headers: string[];
  let lines: unknown[][];

  switch (collection) {
    case "tricks":
      headers = ["ID", "Description"];
      lines = rows.map((item) => [item.id, item.description]);
      break;
    case "musicGenres":
    case "musicParts":
    case "artists":
      headers = ["ID", "Nom"];
      lines = rows.map((item) => [item.id, item.name]);
      break;
    case "sources":
      headers = ["ID", "Type", "Titre", "Données", "Key", "BPM"];
      lines = rows.map((item) => [
        item.id,
        SRC_LABELS[Number(item.type)] ?? item.type,
        item.title,
        item.data,
        item.key ? JSON.stringify(item.key) : "",
        item.bpm,
      ]);
      break;
    case "trickMetadatas":
      headers = ["Trick", "Genre", "Partie", "Artiste", "Source", "Timestamp"];
      lines = rows.map((item) => [
        item.trickId,
        item.musicGenreId,
        item.musicPartId,
        item.artistId,
        item.sourceId,
        item.timestamp,
      ]);
      break;
  }

  return [headers, ...lines]
    .map((line) => line.map(value).join(","))
    .join("\n");
}
