import type { BpnoteState } from "@/lib/codec";
import { decode, encode } from "@/lib/codec";

import {
  countSelectedCollections,
  DEFAULT_EXPORT_SELECTION,
  filterStateForExport,
  selectAllCollections,
  toggleExportSelection,
} from "./export-selection";

const state: BpnoteState = {
  version: { major: 0, minor: 1 },
  tricks: [{ id: 1, description: "Trick" }],
  musicGenres: [{ id: 1, name: "Genre" }],
  musicParts: [{ id: 1, name: "Partie" }],
  artists: [{ id: 1, name: "Artiste" }],
  sources: [{ id: 1, type: 2, data: "abc123", title: "Source", bpm: 120 }],
  trickMetadatas: [
    {
      trickId: 1,
      musicGenreId: 1,
      musicPartId: 1,
      artistId: 1,
      sourceId: 1,
      timestamp: 30,
    },
  ],
  author: "moi",
};

describe("selectAllCollections", () => {
  it("coche toutes les collections par défaut", () => {
    const selection = selectAllCollections();

    expect(countSelectedCollections(selection)).toBe(6);
    expect(Object.values(selection).every(Boolean)).toBe(true);
  });

  it("décoche toutes les collections", () => {
    expect(countSelectedCollections(selectAllCollections(false))).toBe(0);
  });

  it("exporte tout par défaut", () => {
    expect(countSelectedCollections(DEFAULT_EXPORT_SELECTION)).toBe(6);
  });
});

describe("toggleExportSelection", () => {
  it("inverse une collection sans muter la sélection courante", () => {
    const selection = selectAllCollections();
    const next = toggleExportSelection(selection, "sources");

    expect(next.sources).toBe(false);
    expect(selection.sources).toBe(true);
    expect(countSelectedCollections(next)).toBe(5);
  });
});

describe("filterStateForExport", () => {
  it("vide les collections décochées et garde les autres", () => {
    const selection = { ...selectAllCollections(false), sources: true };
    const filtered = filterStateForExport(state, selection);

    expect(filtered.sources).toEqual(state.sources);
    expect(filtered.tricks).toEqual([]);
    expect(filtered.musicGenres).toEqual([]);
    expect(filtered.musicParts).toEqual([]);
    expect(filtered.artists).toEqual([]);
    expect(filtered.trickMetadatas).toEqual([]);
  });

  it("conserve la version et l'auteur", () => {
    const filtered = filterStateForExport(state, selectAllCollections(false));

    expect(filtered.version).toEqual(state.version);
    expect(filtered.author).toBe("moi");
  });

  it("ne modifie pas l'état source", () => {
    filterStateForExport(state, selectAllCollections(false));

    expect(state.sources).toHaveLength(1);
    expect(state.trickMetadatas).toHaveLength(1);
  });

  it("produit un .bpnote qui ne contient que la sélection", () => {
    const selection = { ...selectAllCollections(false), tricks: true };
    const decoded = decode(encode(filterStateForExport(state, selection)));

    expect(decoded.tricks).toHaveLength(1);
    expect(decoded.sources).toHaveLength(0);
    expect(decoded.musicGenres).toHaveLength(0);
    expect(decoded.trickMetadatas).toHaveLength(0);
  });
});
