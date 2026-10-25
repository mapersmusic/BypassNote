import { fireEvent, render, screen } from "@testing-library/react-native";

import { EntityForm } from "./EntityForm";

jest.mock("@/lib/store", () => ({
  useBpnote: () => ({ state: { sources: [] } }),
}));

jest.mock("@/hooks/use-tap-tempo", () => ({
  useTapTempo: () => jest.fn(),
}));

describe("EntityForm", () => {
  it.each([
    ["YouTube", 2, "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["YouTube Music", 3, "https://music.youtube.com/watch?v=dQw4w9WgXcQ"],
  ])("enregistre l'identifiant vidéo pour %s", (label, type, url) => {
    const onSubmit = jest.fn();

    render(
      <EntityForm
        visible
        collection="sources"
        title="Ajouter — Sources"
        item={null}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(screen.getByText(label));
    fireEvent.changeText(screen.getByPlaceholderText("URL / Données"), url);
    fireEvent.press(screen.getByText("Sauvegarder"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type, data: "dQw4w9WgXcQ" }),
    );
  });
});
