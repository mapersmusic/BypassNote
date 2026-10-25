import type { BpnoteState, Key } from "@/lib/codec";
import type { CollectionId } from "@/constants/collections";

/**
 * Schéma d'édition — transposition de `TONIC_LABELS`, `MODE_LABELS`,
 * `SRC_LABELS`, `buildForm()` et des `<thead>` de `renderMain()` dans l'ancienne
 * version web.
 */

export const SRC_LABELS: Record<number, string> = {
  1: "URL",
  2: "YouTube",
  3: "YouTube Music",
};

export const SRC_BADGE: Record<number, "url" | "yt" | "ytm"> = {
  1: "url",
  2: "yt",
  3: "ytm",
};

export const TONIC_LABELS: Record<number, string> = {
  0: "C",
  1: "C# / D♭",
  2: "D",
  3: "D# / E♭",
  4: "E",
  5: "F",
  6: "F# / G♭",
  7: "G",
  8: "G# / A♭",
  9: "A",
  10: "A# / B♭",
  11: "B",
};

export const MODE_LABELS: Record<number, string> = {
  0: "Majeur",
  1: "Dorien",
  2: "Phrygien",
  3: "Lydien",
  4: "Mixolydien",
  5: "Aeolien",
  6: "Locrien",
  7: "Mineur mélodique",
  8: "Dorien ♭2",
  9: "Lydien augmenté",
  10: "Lydien ♭7",
  11: "Mixolydien ♭6",
  12: "Locrien ♮2",
  13: "Altéré",
  14: "Mineur harmonique",
  15: "Phrygien dominant",
  16: "Lydien ♯2",
  17: "Ultra locrien",
  18: "Harmonique majeur",
  19: "Dorien ♭5",
  20: "Phrygien ♭4",
  21: "Lydien ♭3",
  22: "Mixolydien ♭2",
  23: "Lydien augmenté ♯2",
  24: "Locrien ♭7",
  25: "Whole tone",
  26: "Dim. ton-demi",
  27: "Dim. demi-ton",
  28: "Hungarian minor",
  29: "Hungarian major",
  30: "Hijaz",
  31: "Double harmonique",
  32: "Hirajoshi",
  33: "Pelog",
  34: "Prometheus",
  35: "Enigmatic",
  36: "Neapolitan minor",
  37: "Neapolitan major",
  38: "Oriental",
};

export function formatKeyLabel(key: Key): string {
  if (!key) {
    return "";
  }
  return [TONIC_LABELS[key.tonic], MODE_LABELS[key.mode]].filter(Boolean).join(" - ");
}

/** Résout un nom lié par id dans les métadonnées. */
export function resolveName<T>(items: T[], id: number, field: keyof T): string {
  const found = items.find((item) => (item as { id?: number }).id === id);
  return found ? String((found[field] as string | number) ?? "") : "";
}

/** Texte complet d'une source, comme `resolveSourceText()` côté web. */
export function resolveSourceText(state: BpnoteState, sourceId: number): string {
  const found = state.sources.find((source) => source.id === sourceId);
  if (!found) {
    return "";
  }
  return [
    SRC_LABELS[found.type] ?? "?",
    found.title,
    found.data,
    formatKeyLabel(found.key),
    found.bpm ? `${found.bpm} BPM` : "",
  ]
    .filter(Boolean)
    .join(" — ");
}

/** Extrait l'identifiant vidéo d'une URL YouTube ou conserve un identifiant brut. */
export function extractYouTubeVideoId(value: string): string | null {
  const data = value.trim();

  if (!data) {
    return null;
  }

  const hasProtocol = /^https?:\/\//i.test(data);
  const isProtocolRelative = data.startsWith("//");
  const hasYouTubeHost =
    /^(?:(?:www|music|m)\.)?(?:youtube\.com|youtu\.be)(?:\/|$)/i.test(data);

  if (hasProtocol || isProtocolRelative || hasYouTubeHost) {
    let url: URL;

    try {
      url = new URL(
        isProtocolRelative ? `https:${data}` : hasProtocol ? data : `https://${data}`,
      );
    } catch {
      return null;
    }

    const hostname = url.hostname.toLowerCase();
    const isShortLink = hostname === "youtu.be";
    const isYouTubeHost =
      hostname === "youtube.com" || hostname.endsWith(".youtube.com");

    if (!isShortLink && !isYouTubeHost) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const videoId = isShortLink
      ? segments[0]
      : url.searchParams.get("v") ??
        (["shorts", "embed", "live", "v"].includes(segments[0] ?? "")
          ? segments[1]
          : undefined);

    return videoId || null;
  }

  return data;
}

/** Normalise les sources YouTube pour enregistrer l'identifiant vidéo seul. */
export function normalizeSourceData(type: number, data: string): string {
  if (type !== 2 && type !== 3) {
    return data;
  }

  const trimmed = data.trim();
  return extractYouTubeVideoId(trimmed) ?? trimmed;
}

/**
 * URL ouverte par le bouton « Lien » — transposition de `openSourceLink()`
 * de l'ancienne version web.
 */
export function resolveSourceUrl(
  source: { type?: number; data?: string } | undefined,
  timestamp = 0,
): string | null {
  const data = String(source?.data ?? "").trim();

  if (!data) {
    return null;
  }

  switch (Number(source?.type)) {
    case 2: {
      const videoId = extractYouTubeVideoId(data);
      if (!videoId) {
        return /^https?:\/\//i.test(data) ? data : null;
      }
      return `https://youtu.be/${encodeURIComponent(videoId)}${timestamp ? `?t=${timestamp}` : ""}`;
    }
    case 3: {
      const videoId = extractYouTubeVideoId(data);
      if (!videoId) {
        return /^https?:\/\//i.test(data) ? data : null;
      }
      return `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}${timestamp ? `&t=${timestamp}` : ""}`;
    }
    default:
      return /^https?:\/\//i.test(data) ? data : `https://${data}`;
  }
}

export type FieldKind = "text" | "textarea" | "number" | "select" | "key" | "timestamp";

export type FieldOption = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  /** Alimente le tri et la recherche. */
  searchable?: boolean;
  /** `true` pour un select vide autorisé (ID 0 = non lié). */
  optional?: boolean;
  /** Affiche le bouton « Tap Tempo » à côté du champ (BPM des sources). */
  tapTempo?: boolean;
  options?: (state: BpnoteState) => FieldOption[];
};

const namedOptions = (collection: CollectionId, field: "name" | "description") =>
  (state: BpnoteState): FieldOption[] =>
    (state[collection] as { id: number; name?: string; description?: string }[]).map((item) => ({
      value: String(item.id),
      label: `${item[field] ?? ""} (#${item.id})`,
    }));

export const SOURCE_OPTIONS = (state: BpnoteState): FieldOption[] =>
  state.sources.map((source) => ({
    value: String(source.id),
    label: `${SRC_LABELS[source.type]} — ${source.data} (#${source.id})`,
  }));

/** Champs de formulaire d'une collection — équivalent de `buildForm()`. */
export const FIELDS: Record<CollectionId, Field[]> = {
  tricks: [{ name: "description", label: "Description", kind: "textarea", searchable: true }],

  musicGenres: [{ name: "name", label: "Nom", kind: "text", searchable: true }],
  musicParts: [{ name: "name", label: "Nom", kind: "text", searchable: true }],
  artists: [{ name: "name", label: "Nom", kind: "text", searchable: true }],

  sources: [
    {
      name: "type",
      label: "Type",
      kind: "select",
      searchable: true,
      options: () => [
        { value: "1", label: "URL" },
        { value: "2", label: "YouTube" },
        { value: "3", label: "YouTube Music" },
      ],
    },
    { name: "title", label: "Titre", kind: "text", searchable: true },
    { name: "data", label: "URL / Données", kind: "text", searchable: true },
    { name: "key", label: "Key", kind: "key" },
    { name: "bpm", label: "BPM", kind: "number", searchable: true, tapTempo: true },
  ],

  trickMetadatas: [
    { name: "trickId", label: "Trick", kind: "select", optional: true, searchable: true, options: namedOptions("tricks", "description") },
    { name: "musicGenreId", label: "Genre musical", kind: "select", optional: true, searchable: true, options: namedOptions("musicGenres", "name") },
    { name: "musicPartId", label: "Partie musicale", kind: "select", optional: true, searchable: true, options: namedOptions("musicParts", "name") },
    { name: "artistId", label: "Artiste", kind: "select", optional: true, searchable: true, options: namedOptions("artists", "name") },
    { name: "sourceId", label: "Source", kind: "select", optional: true, searchable: true, options: SOURCE_OPTIONS },
    { name: "timestamp", label: "Timestamp (secondes)", kind: "timestamp", searchable: true },
  ],
};

/* -------------------------------------------------------------------------- */
/* Colonnes                                                                    */
/* -------------------------------------------------------------------------- */

export type Row = Record<string, unknown> & { id?: number };

export type Column = {
  key: string;
  label: string;
  /** Rendu de la cellule ; renvoie `null` pour une cellule vide. */
  cell: (item: Row, state: BpnoteState) => string;
  /** Valeur utilisée pour le tri. */
  sortValue: (item: Row, state: BpnoteState) => string | number;
  mono?: boolean;
  /** `true` si la colonne affiche un badge coloré. */
  badge?: boolean;
  /** Rend un bouton « ouvrir le lien » ; renvoie l'URL cible ou `null`. */
  link?: (item: Row, state: BpnoteState) => string | null;
  /** `false` pour un en-tête non triable (colonne d'action). */
  sortable?: boolean;
};

const idColumn = (label = "ID"): Column => ({
  key: "id",
  label,
  cell: (item) => (item.id !== undefined ? `#${item.id}` : ""),
  sortValue: (item) => item.id ?? 0,
  mono: true,
});

/** Colonne « Lien » : bouton d'ouverture de la source, non triable. */
const linkColumn = (link: Column["link"]): Column => ({
  key: "link",
  label: "Lien",
  cell: () => "",
  sortValue: () => "",
  link,
  sortable: false,
});

/** Colonne « Nom » des collections musicGenres / musicParts / artists. */
const nameColumn = (): Column => ({
  key: "text",
  label: "Nom",
  cell: (item) => String(item.name ?? ""),
  sortValue: (item) => String(item.name ?? ""),
});

export const COLUMNS: Record<CollectionId, Column[]> = {
  tricks: [
    idColumn(),
    { key: "description", label: "Description", cell: (i) => String(i.description ?? ""), sortValue: (i) => String(i.description ?? "") },
  ],

  musicGenres: [idColumn(), nameColumn()],
  musicParts: [idColumn(), nameColumn()],
  artists: [idColumn(), nameColumn()],

  sources: [
    idColumn(),
    { key: "type", label: "Type", cell: (i) => SRC_LABELS[Number(i.type)] ?? "?", sortValue: (i) => Number(i.type) || 0, badge: true },
    { key: "title", label: "Titre", cell: (i) => String(i.title ?? ""), sortValue: (i) => String(i.title ?? "") },
    linkColumn((i) => resolveSourceUrl({ type: Number(i.type), data: String(i.data ?? "") })),
    { key: "data", label: "Données", cell: (i) => String(i.data ?? ""), sortValue: (i) => String(i.data ?? "") },
    { key: "key", label: "Key", cell: (i) => formatKeyLabel(i.key as Key), sortValue: (i) => formatKeyLabel(i.key as Key) },
    { key: "bpm", label: "BPM", cell: (i) => (i.bpm ? String(i.bpm) : ""), sortValue: (i) => Number(i.bpm) || 0, mono: true },
  ],

  trickMetadatas: [
    { key: "trick", label: "Trick", cell: (i, s) => resolveName(s.tricks, Number(i.trickId), "description"), sortValue: (i, s) => resolveName(s.tricks, Number(i.trickId), "description") },
    { key: "genre", label: "Genre", cell: (i, s) => resolveName(s.musicGenres, Number(i.musicGenreId), "name"), sortValue: (i, s) => resolveName(s.musicGenres, Number(i.musicGenreId), "name") },
    { key: "part", label: "Partie", cell: (i, s) => resolveName(s.musicParts, Number(i.musicPartId), "name"), sortValue: (i, s) => resolveName(s.musicParts, Number(i.musicPartId), "name") },
    { key: "artist", label: "Artiste", cell: (i, s) => resolveName(s.artists, Number(i.artistId), "name"), sortValue: (i, s) => resolveName(s.artists, Number(i.artistId), "name") },
    linkColumn((i, s) => {
      const source = s.sources.find((item) => item.id === Number(i.sourceId));
      return resolveSourceUrl(source, Number(i.timestamp) || 0);
    }),
    { key: "source", label: "Source", cell: (i, s) => resolveSourceText(s, Number(i.sourceId)), sortValue: (i, s) => resolveSourceText(s, Number(i.sourceId)) },
    { key: "timestamp", label: "Temps", cell: (i) => formatTimestamp(Number(i.timestamp) || 0), sortValue: (i) => Number(i.timestamp) || 0, mono: true },
  ],
};

export function formatTimestamp(seconds: number): string {
  if (!seconds) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Correspondance « la ligne contient la recherche », comme `itemMatches()`. */
export function matchesQuery(
  collection: CollectionId,
  item: Row,
  state: BpnoteState,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const haystack = COLUMNS[collection].map((column) => column.cell(item, state)).join(" ");

  return haystack.toLowerCase().includes(needle);
}
