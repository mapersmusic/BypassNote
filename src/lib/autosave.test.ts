import type { BpnoteState } from "./codec";
import {
  clearAutosave,
  deserializeAutosave,
  loadAutosave,
  saveAutosave,
  serializeAutosave,
  type AutosaveStorage,
} from "./autosave";

const state: BpnoteState = {
  version: { major: 0, minor: 1 },
  tricks: [{ id: 1, description: "Trick A" }],
  musicGenres: [{ id: 1, name: "Genre" }],
  musicParts: [{ id: 1, name: "Partie" }],
  artists: [{ id: 1, name: "Artiste" }],
  sources: [
    {
      id: 1,
      type: 2,
      data: "abc123",
      title: "Ma source",
      key: { tonic: 0, mode: 1 },
      bpm: 128,
    },
  ],
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

function memoryStorage(initial: Uint8Array | null = null) {
  let data = initial;

  return {
    write: jest.fn(async (bytes: Uint8Array) => {
      data = new Uint8Array(bytes);
    }),
    read: jest.fn(async () => data),
    remove: jest.fn(async () => {
      data = null;
    }),
    bytes: () => data,
  } satisfies AutosaveStorage & { bytes: () => Uint8Array | null };
}

describe("serializeAutosave / deserializeAutosave", () => {
  it("conserve tout l'état, y compris la tonalité des sources", () => {
    const restored = deserializeAutosave(serializeAutosave(state));

    expect(restored).toEqual(state);
  });
});

describe("saveAutosave / loadAutosave", () => {
  it("écrit puis relit l'état complet", async () => {
    const storage = memoryStorage();

    await saveAutosave(state, storage);

    expect(storage.write).toHaveBeenCalledTimes(1);
    expect(await loadAutosave(storage)).toEqual(state);
  });

  it("retourne null quand aucun brouillon n'existe", async () => {
    expect(await loadAutosave(memoryStorage())).toBeNull();
  });

  it("remonte une erreur si le brouillon est illisible", async () => {
    const storage = memoryStorage(new Uint8Array([0x0a, 0xff]));

    await expect(loadAutosave(storage)).rejects.toThrow();
  });

  it("supprime le brouillon", async () => {
    const storage = memoryStorage();

    await saveAutosave(state, storage);
    await clearAutosave(storage);

    expect(storage.remove).toHaveBeenCalledTimes(1);
    expect(await loadAutosave(storage)).toBeNull();
  });
});
