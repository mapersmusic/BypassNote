import type { BpnoteState } from "@/lib/codec";
import { decode, encode } from "@/lib/codec";

import {
  countCollectionItems,
  countItems,
  countSelectedCollectionItems,
  countSelectedItems,
  createExportSelection,
  describeExportItem,
  filterStateForExport,
  isItemSelected,
  selectAllItems,
  setCollectionSelected,
  toggleExportItem,
  type ExportSelection,
} from "./export-selection";

const state: BpnoteState = {
  version: { major: 0, minor: 1 },
  tricks: [
    { id: 1, description: "Trick A" },
    { id: 2, description: "Trick B" },
  ],
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

describe("createExportSelection / selectAllItems", () => {
  it("coche toutes les lignes par défaut", () => {
    const selection = createExportSelection(state);

    expect(selection.tricks).toEqual([true, true]);
    expect(selection.sources).toEqual([true]);
    expect(countItems(state)).toBe(7);
    expect(countSelectedItems(state, selection)).toBe(7);
  });

  it("décoche toutes les lignes", () => {
    const selection = selectAllItems(state, false);

    expect(selection.tricks).toEqual([false, false]);
    expect(countSelectedItems(state, selection)).toBe(0);
  });
});

describe("isItemSelected", () => {
  it("exporte par défaut une ligne absente de la sélection", () => {
    const selection = selectAllItems(state, true);

    expect(isItemSelected(selection, "tricks", 5)).toBe(true);
    expect(isItemSelected({ ...selection, tricks: [false] }, "tricks", 1)).toBe(true);
  });

  it("respecte une ligne explicitement décochée", () => {
    expect(isItemSelected({ ...selectAllItems(state, true), tricks: [false, true] }, "tricks", 0)).toBe(
      false,
    );
  });
});

describe("toggleExportItem", () => {
  it("inverse une seule ligne sans muter la sélection", () => {
    const selection = createExportSelection(state);
    const next = toggleExportItem(selection, "tricks", 0, 2);

    expect(next.tricks).toEqual([false, true]);
    expect(selection.tricks).toEqual([true, true]);
    expect(countSelectedItems(state, next)).toBe(6);
  });

  it("complète une sélection absente avant d'inverser", () => {
    const next = toggleExportItem({} as ExportSelection, "tricks", 1, 2);

    expect(next.tricks).toEqual([true, false]);
  });
});

describe("setCollectionSelected", () => {
  it("coche ou décoche toute une collection", () => {
    const none = setCollectionSelected(createExportSelection(state), "tricks", 2, false);

    expect(none.tricks).toEqual([false, false]);
    expect(countSelectedCollectionItems(state, none, "tricks")).toBe(0);
    expect(countSelectedCollectionItems(state, none, "sources")).toBe(1);

    const all = setCollectionSelected(none, "tricks", 2, true);

    expect(all.tricks).toEqual([true, true]);
    expect(countCollectionItems(state, "tricks")).toBe(2);
  });
});

describe("filterStateForExport", () => {
  it("retire uniquement les lignes décochées", () => {
    const selection = setCollectionSelected(createExportSelection(state), "sources", 1, false);
    const filtered = filterStateForExport(state, toggleExportItem(selection, "tricks", 0, 2));

    expect(filtered.tricks).toEqual([{ id: 2, description: "Trick B" }]);
    expect(filtered.sources).toEqual([]);
    expect(filtered.musicGenres).toEqual(state.musicGenres);
  });

  it("conserve la version et l'auteur", () => {
    const filtered = filterStateForExport(state, selectAllItems(state, false));

    expect(filtered.version).toEqual(state.version);
    expect(filtered.author).toBe("moi");
  });

  it("ne modifie pas l'état source", () => {
    filterStateForExport(state, selectAllItems(state, false));

    expect(state.tricks).toHaveLength(2);
    expect(state.sources).toHaveLength(1);
  });

  it("produit un .bpnote qui ne contient que les lignes cochées", () => {
    const selection = toggleExportItem(
      selectAllItems(state, false),
      "tricks",
      1,
      2,
    );
    const decoded = decode(encode(filterStateForExport(state, selection)));

    expect(decoded.tricks).toHaveLength(1);
    expect(decoded.tricks[0].id).toBe(2);
    expect(decoded.sources).toHaveLength(0);
    expect(decoded.trickMetadatas).toHaveLength(0);
  });
});

describe("describeExportItem", () => {
  it("décrit les lignes de chaque collection", () => {
    expect(describeExportItem("tricks", state.tricks[0], state, 0)).toBe("#1 · Trick A");
    expect(describeExportItem("musicGenres", state.musicGenres[0], state, 0)).toBe("#1 · Genre");
    expect(describeExportItem("sources", state.sources[0], state, 0)).toBe(
      "#1 · YouTube · Source",
    );
    expect(describeExportItem("trickMetadatas", state.trickMetadatas[0], state, 0)).toBe(
      "Trick A · Artiste · 0:30",
    );
  });

  it("affiche un libellé de repli pour une ligne vide", () => {
    expect(describeExportItem("tricks", { id: 3, description: "" }, state, 2)).toBe(
      "#3 · (sans description)",
    );
  });
});
