import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { clearAutosave, loadAutosave, saveAutosave } from "@/lib/autosave";
import type { BpnoteState } from "@/lib/codec";
import { pickBpnoteFiles, shareBpnote } from "@/lib/file-io";

import { BpnoteProvider, useBpnote } from "./store";

jest.mock("@/lib/autosave", () => ({
  AUTOSAVE_DELAY_MS: 800,
  clearAutosave: jest.fn(),
  loadAutosave: jest.fn(),
  saveAutosave: jest.fn(),
}));

jest.mock("@/lib/file-io", () => ({
  pickBpnoteFiles: jest.fn(),
  shareBpnote: jest.fn(),
}));

const clearMock = clearAutosave as jest.Mock;
const loadMock = loadAutosave as jest.Mock;
const saveMock = saveAutosave as jest.Mock;
const pickMock = pickBpnoteFiles as jest.Mock;
const shareMock = shareBpnote as jest.Mock;

const EMPTY_STATE: BpnoteState = {
  version: { major: 0, minor: 1 },
  tricks: [],
  musicGenres: [],
  musicParts: [],
  artists: [],
  sources: [],
  trickMetadatas: [],
  author: "",
};

function wrapper({ children }: { children: ReactNode }) {
  return <BpnoteProvider>{children}</BpnoteProvider>;
}

beforeEach(() => {
  clearMock.mockReset();
  clearMock.mockResolvedValue(undefined);
  loadMock.mockReset();
  loadMock.mockResolvedValue(null);
  saveMock.mockReset();
  saveMock.mockResolvedValue(undefined);
  pickMock.mockReset();
  pickMock.mockResolvedValue({ files: [], merged: EMPTY_STATE });
  shareMock.mockReset();
  shareMock.mockResolvedValue("file:///cache/mon-export.bpnote");
});

describe("BpnoteProvider — réinitialisation", () => {
  it("vide l'état et supprime le brouillon de travail", async () => {
    const { result } = renderHook(() => useBpnote(), { wrapper });

    await waitFor(() => expect(result.current.autosave.status).not.toBe("loading"));

    act(() => {
      result.current.addItem("tricks", { description: "Trick A" });
    });

    expect(result.current.state.tricks).toHaveLength(1);
    expect(result.current.counts.tricks).toBe(1);

    await act(async () => {
      await result.current.resetWorkspace();
    });

    expect(result.current.state.tricks).toHaveLength(0);
    expect(result.current.counts.tricks).toBe(0);
    expect(result.current.files).toEqual([]);
    expect(result.current.status).toEqual({
      kind: "info",
      message: "Espace de travail réinitialisé.",
    });
    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(saveMock).not.toHaveBeenCalled();
  });
});

describe("BpnoteProvider — import", () => {
  it("fusionne les lignes importées et affiche le nom des fichiers", async () => {
    const { result } = renderHook(() => useBpnote(), { wrapper });

    await waitFor(() => expect(result.current.autosave.status).not.toBe("loading"));

    act(() => {
      result.current.addItem("tricks", { description: "Trick local" });
    });

    const before = result.current.state;
    pickMock.mockResolvedValue({
      files: ["a.bpnote", "b.bpnote"],
      merged: {
        ...EMPTY_STATE,
        tricks: [{ id: 10, description: "Trick importé" }],
        sources: [
          { id: 5, type: 2, data: "abc123", title: "Source importée", bpm: 120 },
        ],
        author: "import",
      },
    });

    await act(async () => {
      await result.current.importBpnote();
    });

    expect(pickMock).toHaveBeenCalledWith(before);
    expect(result.current.state.tricks).toEqual([
      { id: 1, description: "Trick local" },
      { id: 10, description: "Trick importé" },
    ]);
    expect(result.current.state.sources).toHaveLength(1);
    // L'auteur de l'espace de travail courant n'est pas remplacé par l'import.
    expect(result.current.state.author).toBe("");
    expect(result.current.files).toEqual(["a.bpnote", "b.bpnote"]);
    expect(result.current.status).toEqual({
      kind: "info",
      message: "Importé : a.bpnote, b.bpnote",
    });
  });

  it("ne modifie rien quand la sélection est annulée", async () => {
    const { result } = renderHook(() => useBpnote(), { wrapper });

    await waitFor(() => expect(result.current.autosave.status).not.toBe("loading"));

    act(() => {
      result.current.addItem("tricks", { description: "Trick local" });
    });

    const before = result.current.state;
    pickMock.mockResolvedValue({ files: [], merged: before });

    await act(async () => {
      await result.current.importBpnote();
    });

    expect(result.current.state).toBe(before);
    expect(result.current.files).toEqual([]);
    expect(result.current.status).toEqual({ kind: "idle" });
  });

  it("affiche une erreur quand un fichier est illisible", async () => {
    const { result } = renderHook(() => useBpnote(), { wrapper });

    await waitFor(() => expect(result.current.autosave.status).not.toBe("loading"));

    pickMock.mockRejectedValue(new Error("protobuf invalide"));

    await act(async () => {
      await result.current.importBpnote();
    });

    expect(result.current.state.tricks).toHaveLength(0);
    expect(result.current.files).toEqual([]);
    expect(result.current.status).toEqual({
      kind: "error",
      message: "Erreur d'import : protobuf invalide",
    });
  });

  describe("BpnoteProvider — export", () => {
    it("transmet le nom personnalisé au partage du fichier", async () => {
      const { result } = renderHook(() => useBpnote(), { wrapper });

      await waitFor(() => expect(result.current.autosave.status).not.toBe("loading"));

      await act(async () => {
        await result.current.exportBpnote(undefined, "mon-export");
      });

      expect(shareMock).toHaveBeenCalledWith(EMPTY_STATE, "mon-export");
    });
  });
});
