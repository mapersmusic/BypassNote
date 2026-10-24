import type { Field } from "@/constants/schema";

import { readField, readKey, toDraft } from "./entity-draft";

const source = {
  id: 3,
  type: 2,
  title: "Ride",
  data: "abc123",
  key: { tonic: 5, mode: 2 },
  bpm: 128,
};

const keyField = { name: "key", label: "Key", kind: "key" } as Field;
const bpmField = { name: "bpm", label: "BPM", kind: "number" } as Field;
const titleField = { name: "title", label: "Titre", kind: "text" } as Field;

describe("toDraft", () => {
  it("déplie la tonalité pour préremplir les selects", () => {
    expect(toDraft(source)).toMatchObject({ tonic: "5", mode: "2" });
  });

  it("conserve la tonique C (0) et le mode Majeur (0)", () => {
    const draft = toDraft({ ...source, key: { tonic: 0, mode: 0 } });

    expect(draft.tonic).toBe("0");
    expect(draft.mode).toBe("0");
  });

  it("laisse les selects vides quand la source n'a pas de tonalité", () => {
    const draft = toDraft({ ...source, key: undefined });

    expect(draft.tonic).toBe("");
    expect(draft.mode).toBe("");
  });

  it("convertit les autres champs en texte", () => {
    expect(toDraft(source)).toMatchObject({ type: "2", title: "Ride", bpm: "128" });
    expect(toDraft(null)).toEqual({});
  });
});

describe("readKey", () => {
  it("relit la tonalité affichée dans le formulaire", () => {
    expect(readKey(toDraft(source))).toEqual({ tonic: 5, mode: 2 });
  });

  it("relit le mode Majeur (0) sans le perdre", () => {
    expect(readKey(toDraft({ ...source, key: { tonic: 0, mode: 0 } }))).toEqual({
      tonic: 0,
      mode: 0,
    });
  });

  it("n'enregistre rien si la tonique ou le mode manque", () => {
    expect(readKey({ tonic: "5", mode: "" })).toBeUndefined();
    expect(readKey({ tonic: "", mode: "2" })).toBeUndefined();
    expect(readKey({})).toBeUndefined();
  });
});

describe("readField", () => {
  it("relit la tonalité et les autres champs du brouillon", () => {
    const draft = toDraft(source);

    expect(readField(keyField, draft)).toEqual({ tonic: 5, mode: 2 });
    expect(readField(bpmField, draft)).toBe(128);
    expect(readField(titleField, draft)).toBe("Ride");
  });
});
