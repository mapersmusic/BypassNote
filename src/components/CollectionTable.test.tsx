import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { COLLECTIONS } from "@/constants/collections";

import { CollectionTable } from "./CollectionTable";

jest.mock("@/lib/store", () => ({
  useBpnote: () => ({
    state: {
      version: { major: 0, minor: 1 },
      tricks: [{ id: 1, description: "Trick test" }],
      musicGenres: [],
      musicParts: [],
      artists: [],
      sources: [],
      trickMetadatas: [],
      author: "",
    },
  }),
}));

describe("CollectionTable", () => {
  it("réserve moins de largeur pour l'ID et laisse le nom prendre l'espace disponible", () => {
    render(
      <CollectionTable
        collection={COLLECTIONS.find((item) => item.id === "tricks")!}
        onAdd={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const idCell = StyleSheet.flatten(screen.getByText("#1").parent?.parent?.props.style);
    const nameCell = StyleSheet.flatten(screen.getByText("Trick test").parent?.parent?.props.style);

    expect(idCell.width).toBe(56);
    expect(idCell.flexGrow).toBe(0);
    expect(nameCell.minWidth).toBe(92);
    expect(nameCell.flexGrow).toBe(1);
    expect(nameCell.flexBasis).toBe(0);
  });
});
