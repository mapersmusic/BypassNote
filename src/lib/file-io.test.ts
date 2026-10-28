import { Platform } from "react-native";
import { getDocumentAsync } from "expo-document-picker";

import { encode, STANDARD_VERSION, type BpnoteState } from "./codec";
import { pickBpnoteFiles } from "./file-io";

const mockFileBytes = new Map<string, Uint8Array>();

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => {
  class File {
    uri: string;

    constructor(uri: string) {
      this.uri = uri;
    }

    bytes() {
      const bytes = mockFileBytes.get(this.uri);

      if (!bytes) {
        return Promise.reject(new Error(`Fichier introuvable : ${this.uri}`));
      }

      return Promise.resolve(new Uint8Array(bytes));
    }
  }

  return { File, Paths: { cache: "cache" } };
});

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => false),
  shareAsync: jest.fn(),
}));

const getDocumentMock = getDocumentAsync as jest.Mock;

const EMPTY: BpnoteState = {
  version: { major: 0, minor: 1 },
  tricks: [],
  musicGenres: [],
  musicParts: [],
  artists: [],
  sources: [],
  trickMetadatas: [],
  author: "",
};

const FIRST: BpnoteState = {
  ...EMPTY,
  tricks: [{ id: 1, description: "Trick A" }],
  sources: [{ id: 1, type: 2, data: "abc123", title: "Source A", bpm: 120 }],
};

const SECOND: BpnoteState = {
  ...EMPTY,
  tricks: [{ id: 2, description: "Trick B" }],
  musicGenres: [{ id: 1, name: "Genre B" }],
  artists: [{ id: 1, name: "Artiste B" }],
};

describe("pickBpnoteFiles", () => {
  beforeEach(() => {
    getDocumentMock.mockReset();
    mockFileBytes.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fusionne plusieurs fichiers .bpnote et ignore les autres extensions", async () => {
    mockFileBytes.set("file:///a.bpnote", encode(FIRST));
    mockFileBytes.set("file:///b.bpnote", encode(SECOND));
    getDocumentMock.mockResolvedValue({
      canceled: false,
      assets: [
        { name: "a.bpnote", uri: "file:///a.bpnote" },
        { name: "notes.txt", uri: "file:///notes.txt" },
        { name: "b.bpnote", uri: "file:///b.bpnote" },
      ],
    });

    const { files, merged } = await pickBpnoteFiles(EMPTY);

    expect(files).toEqual(["a.bpnote", "b.bpnote"]);
    expect(merged.version).toEqual(STANDARD_VERSION);
    expect(merged.tricks).toEqual([
      { id: 1, description: "Trick A" },
      { id: 2, description: "Trick B" },
    ]);
    expect(merged.sources).toHaveLength(1);
    expect(merged.sources[0]).toMatchObject(FIRST.sources[0]);
    expect(merged.musicGenres).toEqual(SECOND.musicGenres);
    expect(merged.artists).toEqual(SECOND.artists);
    expect(mockFileBytes.get("file:///notes.txt")).toBeUndefined();
  });

  it("retourne l'état courant quand la sélection est annulée", async () => {
    const current: BpnoteState = {
      ...EMPTY,
      tricks: [{ id: 1, description: "Déjà présent" }],
    };
    getDocumentMock.mockResolvedValue({ canceled: true, assets: null });

    const result = await pickBpnoteFiles(current);

    expect(result.files).toEqual([]);
    expect(result.merged).toBe(current);
  });

  it("signale une sélection sans fichier .bpnote", async () => {
    getDocumentMock.mockResolvedValue({
      canceled: false,
      assets: [{ name: "notes.txt", uri: "file:///notes.txt" }],
    });

    await expect(pickBpnoteFiles(EMPTY)).rejects.toThrow(
      "Aucun fichier .bpnote dans la sélection.",
    );
  });

  it("lit les fichiers via fetch sur le web", async () => {
    const bytes = encode(FIRST);
    const fetchMock = jest.fn(async () => ({
      arrayBuffer: async () => Uint8Array.from(bytes).buffer,
    }));
    const originalFetch = globalThis.fetch;
    const platform = jest.replaceProperty(Platform, "OS", "web");

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      getDocumentMock.mockResolvedValue({
        canceled: false,
        assets: [{ name: "web.bpnote", uri: "blob:web" }],
      });

      const { files, merged } = await pickBpnoteFiles(EMPTY);

      expect(fetchMock).toHaveBeenCalledWith("blob:web");
      expect(files).toEqual(["web.bpnote"]);
      expect(merged.tricks).toEqual(FIRST.tricks);
    } finally {
      platform.restore();
      globalThis.fetch = originalFetch;
    }
  });
});
