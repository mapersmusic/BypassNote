import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { BpnoteState } from "@/lib/codec";
import { pickBpnoteFiles } from "@/lib/file-io";

import RootLayout from "../app/_layout";

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

jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
}));

jest.mock("expo-router", () => ({
  Stack: () => null,
  router: { push: jest.fn() },
  usePathname: () => "/",
}));

jest.mock("@/hooks/use-breakpoint", () => ({
  useIsWide: () => false,
  useIsCompact: () => true,
}));

jest.mock("@/lib/autosave", () => ({
  AUTOSAVE_DELAY_MS: 800,
  clearAutosave: jest.fn(),
  loadAutosave: jest.fn(async () => null),
  saveAutosave: jest.fn(),
}));

jest.mock("@/lib/file-io", () => ({
  pickBpnoteFiles: jest.fn(),
  shareBpnote: jest.fn(),
}));

jest.mock("../components/HexPanel", () => ({ HexPanel: () => null }));
jest.mock("../components/ModulesPanel", () => ({ ModulesPanel: () => null }));
jest.mock("../components/ExportPanel", () => ({ ExportPanel: () => null }));

const pickMock = pickBpnoteFiles as jest.Mock;

describe("RootLayout — import", () => {
  beforeEach(() => {
    pickMock.mockReset();
    pickMock.mockResolvedValue({ files: [], merged: EMPTY_STATE });
  });

  it("déclenche l'import depuis le bouton de la barre d'actions", async () => {
    pickMock.mockResolvedValue({
      files: ["import.bpnote"],
      merged: {
        ...EMPTY_STATE,
        tricks: [{ id: 1, description: "Trick importé" }],
      },
    });

    render(<RootLayout />);

    // En dessous de 960 px, les actions sont repliées dans le menu burger.
    fireEvent.press(screen.getByLabelText("Ouvrir le menu"));
    fireEvent.press(screen.getByText("Importer .bpnote"));

    await waitFor(() => expect(pickMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText("Importé : import.bpnote")).toBeTruthy(),
    );
  });
});
