import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import {
  formatTimestamp,
  resolveName,
  SRC_LABELS,
  type Row,
} from "@/constants/schema";
import type { BpnoteState } from "@/lib/codec";

/**
 * Éléments inclus dans un export `.bpnote`.
 *
 * Une entrée par collection, alignée sur l'ordre des lignes de l'état : `true`
 * exporte la ligne, `false` la retire du fichier. Une case absente vaut `true`,
 * ce qui inclut par défaut les éléments ajoutés après la création de la
 * sélection.
 *
 * La sauvegarde automatique conservera toujours l'état complet : cette
 * sélection ne sert qu'à choisir ce qui part dans le fichier exporté.
 */
export type ExportSelection = Record<CollectionId, boolean[]>;

/** Sélection initiale : toutes les lignes de toutes les collections. */
export function createExportSelection(state: BpnoteState): ExportSelection {
  return selectAllItems(state, true);
}

/** Coche ou décoche toutes les lignes de toutes les collections. */
export function selectAllItems(state: BpnoteState, selected: boolean): ExportSelection {
  return Object.fromEntries(
    COLLECTIONS.map(({ id }) => [id, (state[id] ?? []).map(() => selected)]),
  ) as ExportSelection;
}

/** Une ligne est exportée sauf si elle a été explicitement décochée. */
export function isItemSelected(
  selection: ExportSelection,
  id: CollectionId,
  index: number,
): boolean {
  return selection[id]?.[index] ?? true;
}

/** Inverse une ligne sans muter la sélection courante. */
export function toggleExportItem(
  selection: ExportSelection,
  id: CollectionId,
  index: number,
  count: number,
): ExportSelection {
  const current = selection[id] ?? [];
  const next = Array.from({ length: count }, (_, itemIndex) => current[itemIndex] ?? true);

  next[index] = !next[index];

  return { ...selection, [id]: next };
}

/** Coche ou décoche toutes les lignes d'une collection. */
export function setCollectionSelected(
  selection: ExportSelection,
  id: CollectionId,
  count: number,
  selected: boolean,
): ExportSelection {
  return {
    ...selection,
    [id]: Array.from({ length: count }, () => selected),
  };
}

/** Nombre total de lignes, toutes collections confondues. */
export function countItems(state: BpnoteState): number {
  return COLLECTIONS.reduce((total, { id }) => total + (state[id] ?? []).length, 0);
}

/** Nombre de lignes d'une collection. */
export function countCollectionItems(state: BpnoteState, id: CollectionId): number {
  return (state[id] ?? []).length;
}

/** Nombre de lignes d'une collection qui seront exportées. */
export function countSelectedCollectionItems(
  state: BpnoteState,
  selection: ExportSelection,
  id: CollectionId,
): number {
  return (state[id] ?? []).filter((_, index) => isItemSelected(selection, id, index)).length;
}

/** Nombre de lignes qui seront exportées, toutes collections confondues. */
export function countSelectedItems(state: BpnoteState, selection: ExportSelection): number {
  return COLLECTIONS.reduce(
    (total, { id }) => total + countSelectedCollectionItems(state, selection, id),
    0,
  );
}

/**
 * Copie l'état en retirant les lignes décochées.
 *
 * La version et l'auteur sont toujours conservés : seules les données des
 * lignes décochées sont retirées du fichier produit.
 */
export function filterStateForExport(
  state: BpnoteState,
  selection: ExportSelection,
): BpnoteState {
  const pick = <T,>(id: CollectionId, items: T[] | undefined): T[] =>
    (items ?? []).filter((_, index) => isItemSelected(selection, id, index));

  return {
    version: state.version,
    tricks: pick("tricks", state.tricks),
    musicGenres: pick("musicGenres", state.musicGenres),
    musicParts: pick("musicParts", state.musicParts),
    artists: pick("artists", state.artists),
    sources: pick("sources", state.sources),
    trickMetadatas: pick("trickMetadatas", state.trickMetadatas),
    author: state.author,
  };
}

/**
 * Libellé d'une ligne dans la fenêtre d'export.
 *
 * Volontairement court : le panneau affiche une ligne par élément, tronquée à
 * une seule ligne, avec les informations qui permettent de la reconnaître.
 */
export function describeExportItem(
  collection: CollectionId,
  item: Row,
  state: BpnoteState,
  index: number,
): string {
  switch (collection) {
    case "tricks":
      return `#${item.id ?? index + 1} · ${text(item.description) || "(sans description)"}`;

    case "musicGenres":
    case "musicParts":
    case "artists":
      return `#${item.id ?? index + 1} · ${text(item.name) || "(sans nom)"}`;

    case "sources": {
      const type = SRC_LABELS[Number(item.type)] ?? "?";
      const label = text(item.title) || text(item.data);

      return `#${item.id ?? index + 1} · ${type}${label ? ` · ${label}` : ""}`;
    }

    case "trickMetadatas": {
      const parts = [
        resolveName(state.tricks, Number(item.trickId), "description"),
        resolveName(state.artists, Number(item.artistId), "name"),
        formatTimestamp(Number(item.timestamp) || 0),
      ].filter(Boolean);

      return parts.join(" · ") || `Métadonnée #${index + 1}`;
    }
  }
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}
