import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { clearAutosave, loadAutosave, saveAutosave } from "@/lib/autosave";

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

function wrapper({ children }: { children: ReactNode }) {
  return <BpnoteProvider>{children}</BpnoteProvider>;
}

describe("BpnoteProvider — réinitialisation", () => {
  beforeEach(() => {
    clearMock.mockReset();
    clearMock.mockResolvedValue(undefined);
    loadMock.mockReset();
    loadMock.mockResolvedValue(null);
    saveMock.mockReset();
    saveMock.mockResolvedValue(undefined);
  });

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
