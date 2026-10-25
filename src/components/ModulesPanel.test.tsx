import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import { ModulesPanel } from "./ModulesPanel";

const mockCloseModules = jest.fn();

jest.mock("expo-router", () => ({
  usePathname: () => "/",
}));

jest.mock("@/lib/store", () => ({
  useBpnote: () => ({
    state: {
      version: { major: 0, minor: 1 },
      tricks: [],
      musicGenres: [],
      musicParts: [],
      artists: [],
      sources: [],
      trickMetadatas: [],
      author: "",
    },
    modulesOpen: true,
    closeModules: mockCloseModules,
  }),
}));

jest.mock("@/lib/modules", () => ({
  buildCollectionCsv: jest.fn(),
  buildModuleDocument: jest.fn(() => "<html></html>"),
  loadInstalledModules: jest.fn(() =>
    Promise.resolve([
      {
        id: "test-module",
        name: "Module test",
        description: "",
        version: "1.0.0",
        source: "",
        manifest: null,
        installedAt: "",
      },
    ]),
  ),
  openModuleInWindow: jest.fn(),
  pickAndReadModule: jest.fn(),
  saveInstalledModules: jest.fn(),
}));

jest.mock("@/lib/file-io", () => ({
  shareCsv: jest.fn(),
}));

jest.mock("@/components/ModuleView", () => ({
  ModuleView: () => null,
}));

describe("ModulesPanel", () => {
  beforeAll(() => {
    jest.replaceProperty(Platform, "OS", "web");
  });

  beforeEach(() => {
    mockCloseModules.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("ferme le panneau après avoir ouvert le module dans un onglet", async () => {
    const { openModuleInWindow } = jest.requireMock("@/lib/modules");
    openModuleInWindow.mockReturnValue(true);

    render(<ModulesPanel />);

    fireEvent.press(await screen.findByLabelText("Exécuter Module test"));

    expect(openModuleInWindow).toHaveBeenCalledWith("<html></html>");
    expect(mockCloseModules).toHaveBeenCalledTimes(1);
  });

  it("laisse le panneau ouvert si le navigateur bloque l'ouverture du module", async () => {
    const { openModuleInWindow } = jest.requireMock("@/lib/modules");
    openModuleInWindow.mockReturnValue(false);

    render(<ModulesPanel />);

    fireEvent.press(await screen.findByLabelText("Exécuter Module test"));

    await waitFor(() => {
      expect(screen.getByText("La fenêtre du module a été bloquée par le navigateur.")).toBeTruthy();
    });
    expect(mockCloseModules).not.toHaveBeenCalled();
  });
});
