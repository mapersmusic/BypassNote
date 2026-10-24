import type { Key } from "@/lib/codec";
import type { Field, Row } from "@/constants/schema";

/**
 * Brouillon d'un formulaire de collection : une entrée texte par champ.
 *
 * La tonalité (`key`) est un objet `{ tonic, mode }` : elle est dépliée en
 * deux entrées `tonic` et `mode` pour alimenter les selects du formulaire.
 */
export type Draft = Record<string, string>;

/**
 * Convertit une ligne en brouillon de formulaire — équivalent de `buildForm()`
 * de l'ancienne version web.
 */
export function toDraft(item: Row | null): Draft {
  if (!item) {
    return {};
  }

  const draft: Draft = {};

  for (const [name, value] of Object.entries(item)) {
    if (name === "key") {
      const key = value as Key;
      draft.tonic = key?.tonic !== undefined ? String(key.tonic) : "";
      draft.mode = key?.mode !== undefined ? String(key.mode) : "";
      continue;
    }

    draft[name] = value === null || value === undefined ? "" : String(value);
  }

  return draft;
}

/**
 * Relit la tonalité du brouillon.
 *
 * Une tonalité n'existe que si la tonique **et** le mode sont choisis. Les
 * valeurs `0` sont valides (C, Majeur) : on teste la présence du texte, pas
 * sa véracité.
 */
export function readKey(draft: Draft): Key {
  const tonic = draft.tonic ?? "";
  const mode = draft.mode ?? "";

  return tonic !== "" && mode !== ""
    ? { tonic: Number(tonic), mode: Number(mode) }
    : undefined;
}

/** Relit un champ du brouillon — équivalent de `readForm()`. */
export function readField(field: Field, draft: Draft): unknown {
  if (field.kind === "key") {
    return readKey(draft);
  }

  if (field.kind === "number" || field.kind === "timestamp" || field.kind === "select") {
    return Number(draft[field.name] ?? 0) || 0;
  }

  return draft[field.name] ?? "";
}
