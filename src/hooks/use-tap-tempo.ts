import { useCallback, useRef } from "react";

/**
 * Tap tempo — transposition de `TapTempoController`
 * (`www/tap-tempo-helper.js` de l'ancienne version web).
 *
 * Retourne la fonction à appeler à chaque tap. `onBpm` reçoit le BPM moyen
 * dès le deuxième tap.
 */

/** Au-delà de ce délai sans tap, la série repart de zéro. */
const MAX_GAP_MS = 3000;

/** Nombre de taps conservés pour la moyenne. */
const HISTORY = 6;

/** Bornes du BPM calculé. */
const clampBpm = (bpm: number) => Math.max(1, Math.min(400, Math.round(bpm)));

export function useTapTempo(onBpm: (bpm: number) => void): () => void {
  const taps = useRef<number[]>([]);

  return useCallback(() => {
    const now = Date.now();

    if (!taps.current.length || now - taps.current[taps.current.length - 1] > MAX_GAP_MS) {
      taps.current = [];
    }

    taps.current.push(now);
    if (taps.current.length > HISTORY) {
      taps.current.shift();
    }

    if (taps.current.length < 2) {
      return;
    }

    let total = 0;
    for (let index = 1; index < taps.current.length; index += 1) {
      total += taps.current[index] - taps.current[index - 1];
    }

    const average = total / (taps.current.length - 1);

    if (average > 0) {
      onBpm(clampBpm(60000 / average));
    }
  }, [onBpm]);
}
