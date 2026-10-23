import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { decode, encode, STANDARD_VERSION, type BpnoteState } from "./codec";

/**
 * Import / export des fichiers `.bpnote` pour React Native.
 *
 * Remplace `bpnote-file-io.js` (version web) qui passait par les plugins
 * Capacitor (`window.capacitorFilesystemPluginCapacitor`) ou le DOM
 * (`Blob` + `a.download`) : aucun des deux n'existe dans l'app native.
 *
 * `expo-file-system` n'ayant pas d'implémentation web complète, le web garde
 * le chemin `Blob` + `a.download` de l'ancienne version.
 */

export const FILE_EXTENSION = ".bpnote";

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "") || "export";
}

function isWeb() {
  return Platform.OS === "web";
}

/** Lit un fichier en octets, que l'on soit sur web ou natif. */
async function readBytes(uri: string): Promise<Uint8Array> {
  if (isWeb()) {
    const response = await fetch(uri);
    return new Uint8Array(await response.arrayBuffer());
  }

  return new File(uri).bytes();
}

/** Écrit un fichier et le partage ; sur web, déclenche un téléchargement. */
async function writeAndShare(
  content: Uint8Array | string,
  filename: string,
  options: { mimeType?: string; uti?: string; webType?: string } = {},
): Promise<string> {
  const {
    mimeType = "application/octet-stream",
    uti = "public.data",
    webType = mimeType,
  } = options;

  if (isWeb()) {
    const blob = new Blob([content as unknown as BlobPart], {
      type: webType,
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return url;
  }

  const file = new File(Paths.cache, filename);

  if (file.exists) {
    file.delete();
  }

  file.create({ overwrite: true });
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      dialogTitle: filename,
      UTI: uti,
    });
  }

  return file.uri;
}

/** Ouvre le sélecteur et fusionne les `.bpnote` choisis dans `current`. */
export async function pickBpnoteFiles(
  current: BpnoteState,
): Promise<{ files: string[]; merged: BpnoteState }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return { files: [], merged: current };
  }

  const merged: BpnoteState = {
    version: STANDARD_VERSION,
    tricks: [],
    musicGenres: [],
    musicParts: [],
    artists: [],
    sources: [],
    trickMetadatas: [],
    author: "",
  };

  const files: string[] = [];

  for (const asset of result.assets) {
    if (!asset.name.endsWith(FILE_EXTENSION)) {
      continue;
    }

    const decoded = decode(await readBytes(asset.uri));

    merged.tricks.push(...decoded.tricks);
    merged.musicGenres.push(...decoded.musicGenres);
    merged.musicParts.push(...decoded.musicParts);
    merged.artists.push(...decoded.artists);
    merged.sources.push(...decoded.sources);
    merged.trickMetadatas.push(...decoded.trickMetadatas);

    files.push(asset.name);
  }

  if (files.length === 0) {
    throw new Error(`Aucun fichier ${FILE_EXTENSION} dans la sélection.`);
  }

  return { files, merged };
}

/** Encode l'état puis l'exporte. Retourne l'URI / l'URL du fichier produit. */
export async function shareBpnote(state: BpnoteState, name = "export"): Promise<string> {
  return writeAndShare(encode(state), `${sanitize(name)}${FILE_EXTENSION}`);
}

/** Écrit un CSV et le partage ; sur web, déclenche un téléchargement. */
export async function shareCsv(content: string, name = "export"): Promise<string> {
  return writeAndShare(content, `${sanitize(name)}.csv`, {
    mimeType: "text/csv",
    uti: "public.comma-separated-values-text",
    webType: "text/csv;charset=utf-8;",
  });
}
