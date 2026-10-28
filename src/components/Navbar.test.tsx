import { fireEvent, render, screen } from "@testing-library/react-native";

import { IconDownload } from "./icons";
import { Navbar } from "./Navbar";
import packageJson from "../../package.json";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  usePathname: () => "/",
}));

jest.mock("@/hooks/use-breakpoint", () => ({
  useIsWide: () => false,
}));

describe("Navbar", () => {
  it("affiche la version déclarée dans package.json", () => {
    render(<Navbar actions={[]} />);

    expect(screen.getByText(packageJson.version)).toBeTruthy();
  });

  it("referme le menu après avoir lancé une action", () => {
    const onPress = jest.fn();

    render(
      <Navbar
        actions={[
          { key: "export", label: "Exporter .bpnote", icon: IconDownload, onPress },
        ]}
      />,
    );

    fireEvent.press(screen.getByLabelText("Ouvrir le menu"));
    fireEvent.press(screen.getByText("Exporter .bpnote"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Menu")).toBeNull();
  });

  it("affiche l'heure de la dernière sauvegarde automatique", () => {
    const savedAt = new Date(2026, 0, 2, 14, 32).getTime();

    render(<Navbar actions={[]} autosave={{ status: "saved", savedAt }} />);

    expect(screen.getByLabelText("Sauvegardé automatiquement à 14:32")).toBeTruthy();
  });

  it("affiche le nombre d'éléments de chaque collection dans le menu mobile", () => {
    render(
      <Navbar
        actions={[]}
        counts={{
          tricks: 1,
          musicGenres: 2,
          musicParts: 3,
          artists: 4,
          sources: 5,
          trickMetadatas: 6,
        }}
      />,
    );

    fireEvent.press(screen.getByLabelText("Ouvrir le menu"));

    for (const count of [1, 2, 3, 4, 5, 6]) {
      expect(screen.getByText(String(count))).toBeTruthy();
    }
  });
});
