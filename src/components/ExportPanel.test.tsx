import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";

import type { BpnoteState } from "@/lib/codec";
import { createExportSelection, selectAllItems, toggleExportItem } from "@/lib/export-selection";

import { ExportPanel } from "./ExportPanel";

const state: BpnoteState = {
  version: { major: 0, minor: 1 },
  tricks: [
    { id: 1, description: "Trick A" },
    { id: 2, description: "Trick B" },
  ],
  musicGenres: [],
  musicParts: [],
  artists: [],
  sources: [{ id: 1, type: 2, data: "abc123", title: "Ma source", bpm: 120 }],
  trickMetadatas: [],
  author: "moi",
};

function renderPanel(overrides: Partial<ComponentProps<typeof ExportPanel>> = {}) {
  const props: ComponentProps<typeof ExportPanel> = {
    visible: true,
    state,
    selection: createExportSelection(state),
    onToggleItem: jest.fn(),
    onToggleCollection: jest.fn(),
    onSelectAll: jest.fn(),
    onSelectNone: jest.fn(),
    onClose: jest.fn(),
    onExport: jest.fn(),
    ...overrides,
  };

  render(<ExportPanel {...props} />);

  return props;
}

describe("ExportPanel", () => {
  it("liste chaque ligne avec le compteur de sa collection", () => {
    renderPanel();

    expect(screen.getByText("Tricks")).toBeTruthy();
    expect(screen.getByText("2/2")).toBeTruthy();
    expect(screen.getByText("#1 · Trick A")).toBeTruthy();
    expect(screen.getByText("#2 · Trick B")).toBeTruthy();
    expect(screen.getByText("#1 · YouTube · Ma source")).toBeTruthy();
  });

  it("transmet la collection et l'index de la ligne cliquée", () => {
    const onToggleItem = jest.fn();

    renderPanel({ onToggleItem });

    fireEvent.press(screen.getByText("#2 · Trick B"));

    expect(onToggleItem).toHaveBeenCalledWith("tricks", 1);
  });

  it("transmet la collection dont l'en-tête est cliqué", () => {
    const onToggleCollection = jest.fn();

    renderPanel({ onToggleCollection });

    fireEvent.press(screen.getByLabelText("Inclure toute la collection Tricks"));

    expect(onToggleCollection).toHaveBeenCalledWith("tricks");
  });

  it("désactive l'export quand aucune ligne n'est cochée", () => {
    const onExport = jest.fn();

    renderPanel({ selection: selectAllItems(state, false), onExport });

    const button = screen.getByLabelText("Exporter la sélection");

    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onExport).not.toHaveBeenCalled();
  });

  it("exporte quand au moins une ligne est cochée", () => {
    const onExport = jest.fn();
    const selection = toggleExportItem(
      toggleExportItem(selectAllItems(state, false), "tricks", 1, 2),
      "sources",
      0,
      1,
    );

    renderPanel({ selection, onExport });

    fireEvent.press(screen.getByLabelText("Exporter la sélection"));

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("affiche le nombre de lignes cochées et la taille filtrée", () => {
    const selection = toggleExportItem(createExportSelection(state), "tricks", 0, 2);

    renderPanel({ selection });

    expect(screen.getByText(/^2\/3 · /)).toBeTruthy();
  });

  it("remonte les actions Tout et Rien", () => {
    const onSelectAll = jest.fn();
    const onSelectNone = jest.fn();

    renderPanel({ onSelectAll, onSelectNone });

    fireEvent.press(screen.getByText("Tout"));
    fireEvent.press(screen.getByText("Rien"));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onSelectNone).toHaveBeenCalledTimes(1);
  });

  it("indique quand il n'y a rien à exporter", () => {
    renderPanel({
      state: { ...state, tricks: [], sources: [] },
      selection: selectAllItems(state, true),
    });

    expect(screen.getByText("Aucune donnée à exporter.")).toBeTruthy();
    expect(screen.getByLabelText("Exporter la sélection")).toBeDisabled();
  });
});
