import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import type { BpnoteState } from "@/lib/codec";

import { useAutosave } from "./use-autosave";

jest.mock("@/lib/autosave", () => ({
  AUTOSAVE_DELAY_MS: 800,
  loadAutosave: jest.fn(),
  saveAutosave: jest.fn(),
}));

import { loadAutosave, saveAutosave } from "@/lib/autosave";

const loadMock = loadAutosave as jest.Mock;
const saveMock = saveAutosave as jest.Mock;

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

const FILLED: BpnoteState = {
  ...EMPTY,
  tricks: [{ id: 1, description: "Trick A" }],
};

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useAutosave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    loadMock.mockReset();
    saveMock.mockReset();
    saveMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("restaure le brouillon au démarrage", async () => {
    loadMock.mockResolvedValue(FILLED);
    const onRestore = jest.fn();

    const { result } = renderHook(() => useAutosave(EMPTY, { onRestore }));

    expect(result.current.status).toBe("loading");

    await flush();

    expect(onRestore).toHaveBeenCalledWith(FILLED);
    expect(result.current.status).toBe("idle");
  });

  it("ne sauvegarde pas l'état vide initial", async () => {
    loadMock.mockResolvedValue(null);

    const { rerender } = renderHook(
      ({ state }: { state: BpnoteState }) => useAutosave(state, { delayMs: 100 }),
      { initialProps: { state: EMPTY } },
    );

    await flush();
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(saveMock).not.toHaveBeenCalled();

    rerender({ state: FILLED });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await flush();

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith(FILLED);
  });

  it("regroupe les modifications rapprochées en une seule écriture", async () => {
    loadMock.mockResolvedValue(null);

    const first: BpnoteState = { ...EMPTY, tricks: [{ id: 1, description: "A" }] };
    const second: BpnoteState = { ...EMPTY, tricks: [{ id: 1, description: "AB" }] };

    const { rerender } = renderHook(
      ({ state }: { state: BpnoteState }) => useAutosave(state, { delayMs: 100 }),
      { initialProps: { state: EMPTY } },
    );

    await flush();

    rerender({ state: first });
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    rerender({ state: second });
    await act(async () => {
      jest.advanceTimersByTime(99);
    });

    expect(saveMock).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await flush();

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith(second);
  });

  it("signale une erreur d'écriture", async () => {
    loadMock.mockResolvedValue(null);
    saveMock.mockRejectedValue(new Error("disque plein"));
    const onError = jest.fn();

    const { rerender, result } = renderHook(
      ({ state }: { state: BpnoteState }) => useAutosave(state, { delayMs: 100, onError }),
      { initialProps: { state: EMPTY } },
    );

    await flush();
    rerender({ state: FILLED });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe("disque plein");
    expect(result.current.status).toBe("error");
  });

  it("écrit immédiatement quand l'application passe en arrière-plan", async () => {
    loadMock.mockResolvedValue(null);

    let listener: ((state: string) => void) | undefined;
    const remove = jest.fn();

    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, handler) => {
      listener = handler as (state: string) => void;
      return { remove } as ReturnType<typeof AppState.addEventListener>;
    });

    const { rerender } = renderHook(
      ({ state }: { state: BpnoteState }) => useAutosave(state, { delayMs: 5000 }),
      { initialProps: { state: EMPTY } },
    );

    await flush();
    rerender({ state: FILLED });

    act(() => {
      listener?.("background");
    });
    await flush();

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith(FILLED);
  });
});
