import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";

/**
 * Points de rupture repris des media queries de l'ancienne version web :
 *
 *   @media (max-width: 960px) → la barre d'actions cède la place au burger,
 *                               la barre latérale passe en grille de 2 colonnes ;
 *   @media (max-width: 640px) → la barre latérale est masquée, le burger prend
 *                               le relais.
 */
export const WIDE_BREAKPOINT = 960;
export const COMPACT_BREAKPOINT = 640;

/**
 * `useWindowDimensions` vaut 0 pendant le rendu statique web : on garde la mise
 * en page large au premier rendu pour éviter tout mismatch d'hydratation, puis
 * on bascule au montage.
 */
function useMountedWidth() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted ? width : Number.POSITIVE_INFINITY;
}

/** `true` au-delà de 960 px : barre latérale verticale + actions dans l'en-tête. */
export function useIsWide() {
  return useMountedWidth() > WIDE_BREAKPOINT;
}

/** `true` en dessous de 640 px : la barre latérale est masquée. */
export function useIsCompact() {
  return useMountedWidth() <= COMPACT_BREAKPOINT;
}