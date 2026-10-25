import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import {
  AUTOSAVE_DELAY_MS,
  clearAutosave,
  loadAutosave,
  saveAutosave,
} from "@/lib/autosave";
import type { BpnoteState } from "@/lib/codec";

/**
 * Sauvegarde automatique de l'état complet.
 *
 * - Au montage, relit le `.bpnote` de travail et le restaure via `onRestore`.
 * - Ensuite, écrit l'état courant après un court délai (les frappes successives
 *   ne déclenchent qu'une écriture).
 * - Force une dernière écriture quand l'application passe en arrière-plan
 *   (mobile) ou quand l'onglet est masqué (web).
 *
 * L'état vide initial n'est pas écrit : sans brouillon existant, il n'y a rien
 * à conserver. Une fois que l'utilisateur a modifié quelque chose — y compris
 * pour tout effacer — chaque changement est sauvegardé.
 */

export type AutosaveStatus = "loading" | "idle" | "saving" | "saved" | "error";

export type AutosaveState = {
  status: AutosaveStatus;
  /** Horodatage de la dernière écriture réussie. */
  savedAt: number | null;
};

export type AutosaveController = AutosaveState & {
  /**
   * Supprime le brouillon et repart de `baseline` sans le réécrire.
   *
   * À appeler avec le nouvel état vide : il devient la référence, donc le
   * prochain changement réel déclenchera de nouveau une sauvegarde.
   */
  reset: (baseline: BpnoteState) => Promise<void>;
};

type Options = {
  /** Délai d'inactivité avant écriture. */
  delayMs?: number;
  /** Appelé une fois si un brouillon a été relu au démarrage. */
  onRestore?: (state: BpnoteState) => void;
  /** Appelé à chaque échec de lecture ou d'écriture. */
  onError?: (error: Error) => void;
};

export function useAutosave(
  state: BpnoteState,
  options: Options = {},
): AutosaveController {
  const { delayMs = AUTOSAVE_DELAY_MS } = options;

  // Les callbacks ne doivent pas relancer la restauration à chaque rendu.
  const callbacks = useRef(options);
  callbacks.current = options;

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<AutosaveStatus>("loading");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  // L'état initial (vide) ne doit pas écraser un éventuel brouillon, et n'a pas
  // besoin d'être écrit. On ne sauvegarde qu'après une vraie modification.
  const initialState = useRef(state);
  const changed = useRef(false);
  const discarded = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const writeId = useRef(0);

  useEffect(() => {
    if (state !== initialState.current) {
      changed.current = true;
    }
  }, [state]);

  const persist = useCallback((value: BpnoteState) => {
    const id = ++writeId.current;
    setStatus("saving");

    // Les écritures sont sérialisées : la dernière valeur envoyée est bien
    // celle qui reste dans le fichier.
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          await saveAutosave(value);

          if (mounted.current && id === writeId.current) {
            setStatus("saved");
            setSavedAt(Date.now());
          }
        } catch (error) {
          if (mounted.current && id === writeId.current) {
            setStatus("error");
            callbacks.current.onError?.(error as Error);
          }
        }
      });
  }, []);

  /** Supprime le brouillon et empêche sa réécriture immédiate. */
  const reset = useCallback(async (baseline: BpnoteState) => {
    discarded.current = true;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    initialState.current = baseline;
    stateRef.current = baseline;
    changed.current = false;
    writeId.current += 1;

    setStatus("idle");
    setSavedAt(null);

    // La suppression passe après les écritures déjà engagées : un ancien
    // `persist()` ne doit pas recréer le fichier après le reset.
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          await clearAutosave();
        } catch (error) {
          // Si la suppression échoue, on écrase au moins le brouillon par
          // l'état vide pour ne pas restaurer les anciennes données.
          await saveAutosave(baseline);
          throw error;
        }
      });

    try {
      await queue.current;
    } catch (error) {
      if (mounted.current) {
        setStatus("error");
        callbacks.current.onError?.(error as Error);
      }
    }
  }, []);

  // Restauration initiale.
  useEffect(() => {
    let cancelled = false;
    mounted.current = true;

    loadAutosave()
      .then((draft) => {
        if (cancelled) {
          return;
        }

        // Un reset peut avoir eu lieu pendant la lecture : le brouillon est
        // alors déjà obsolète.
        if (draft && !discarded.current) {
          callbacks.current.onRestore?.(draft);
        }

        setStatus("idle");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setStatus("error");
        callbacks.current.onError?.(error as Error);
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  // Écriture différée après chaque modification.
  useEffect(() => {
    if (!ready || !changed.current) {
      return;
    }

    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      timer.current = null;
      persist(stateRef.current);
    }, delayMs);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [state, ready, delayMs, persist]);

  // Dernière chance de sauver avant que l'application ne soit mise en pause.
  useEffect(() => {
    if (!ready) {
      return;
    }

    const flush = () => {
      if (!changed.current) {
        return;
      }

      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      persist(stateRef.current);
    };

    if (Platform.OS === "web") {
      if (typeof document === "undefined") {
        return;
      }

      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          flush();
        }
      };

      // `pagehide` couvre la fermeture de l'onglet et la mise en arrière-plan
      // de la WebView Capacitor, où `visibilitychange` n'est pas toujours émis.
      window.addEventListener("pagehide", flush);
      document.addEventListener("visibilitychange", onVisibilityChange);

      return () => {
        window.removeEventListener("pagehide", flush);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }

    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        flush();
      }
    });

    return () => subscription.remove();
  }, [ready, persist]);

  return { status, savedAt, reset };
}
