import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import type { BpnoteState } from "@/lib/codec";

/**
 * Collections incluses dans un export `.bpnote`.
 *
 * La sauvegarde automatique conservera toujours l'état complet : cette
 * sélection ne sert qu'à choisir ce qui part dans le fichier exporté.
 */
export type ExportSelection = Record<CollectionId, boolean>;

/** Sélection uniforme : tout coché (`true`) ou tout décoché (`false`). */
export function selectAllCollections(selected = true): ExportSelection {
  return Object.fromEntries(
    COLLECTIONS.map(({ id }) => [id, selected]),
  ) as ExportSelection;
}

/** Sélection par défaut : toutes les informations sont exportées. */
export const DEFAULT_EXPORT_SELECTION: ExportSelection = selectAllCollections();

/** Inverse l'état d'une collection sans muter la sélection courante. */
export function toggleExportSelection(
  selection: ExportSelection,
  id: CollectionId,
): ExportSelection {
  return { ...selection, [id]: !selection[id] };
}

/** Nombre de collections cochées. */
export function countSelectedCollections(selection: ExportSelection): number {
  return COLLECTIONS.reduce((total, { id }) => total + (selection[id] ? 1 : 0), 0);
}

/**
 * Copie l'état en vidant les collections non cochées.
 *
 * La version et l'auteur sont toujours conservés : seules les données des
 * collections décochées sont retirées du fichier produit.
 */
export function filterStateForExport(
  state: BpnoteState,
  selection: ExportSelection,
): BpnoteState {
  const pick = <T,>(id: CollectionId, items: T[] | undefined): T[] =>
    selection[id] ? items ?? [] : [];

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
