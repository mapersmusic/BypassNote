import type { ComponentType } from "react";

import {
  IconBolt,
  IconLink,
  IconMicrophone,
  IconMusic,
  IconTags,
  IconWaveSine,
  type IconProps,
} from "@/components/icons";

/**
 * Collections de l'application — reprise à l'identique du tableau `TABS` de
 * l'ancienne version web.
 */
export type CollectionId =
  | "tricks"
  | "musicGenres"
  | "musicParts"
  | "artists"
  | "sources"
  | "trickMetadatas";

export type Collection = {
  id: CollectionId;
  label: string;
  icon: ComponentType<IconProps>;
};

export const COLLECTIONS: Collection[] = [
  { id: "tricks", label: "Tricks", icon: IconBolt },
  { id: "musicGenres", label: "Genres", icon: IconMusic },
  { id: "musicParts", label: "Parties", icon: IconWaveSine },
  { id: "artists", label: "Artistes", icon: IconMicrophone },
  { id: "sources", label: "Sources", icon: IconLink },
  { id: "trickMetadatas", label: "Métadonnées", icon: IconTags },
];

export function findCollection(id: unknown): Collection | undefined {
  return COLLECTIONS.find((collection) => collection.id === id);
}

/** Route d'une collection (`app/collection/[id].tsx`). */
export function collectionHref(id: CollectionId) {
  return `/collection/${id}` as const;
}