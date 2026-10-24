import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import {
  encodedSize,
  STANDARD_VERSION,
  type BpnoteState,
} from "@/lib/codec";
import { pickBpnoteFiles, shareBpnote } from "@/lib/file-io";

/**
 * État partagé de l'application.
 *
 * L'ancienne version web gardait tout dans une variable globale `state` et
 * redessinait la page à la main. Ici les écrans sont des routes expo-router
 * distinctes, il faut donc un store commun entre la barre d'en-tête, la barre
 * latérale et les écrans de collection.
 */

/** `nextId()` côté web : 1 si la collection est vide. */
function nextId(items: { id?: number }[]): number {
  return items.length ? Math.max(...items.map((item) => item.id ?? 0)) + 1 : 1;
}

const EMPTY: BpnoteState = {  version: STANDARD_VERSION,
  tricks: [],
  musicGenres: [],
  musicParts: [],
  artists: [],
  sources: [],
  trickMetadatas: [],
  author: "",
};

type Status = { kind: "idle" } | { kind: "info"; message: string } | { kind: "error"; message: string };

type Store = {
  state: BpnoteState;
  /** Nombre d'éléments par collection — alimente la pastille `.cnt`. */
  counts: Record<CollectionId, number>;
  /** Taille du fichier qui serait exporté, en octets. */
  size: number;
  /** Noms des fichiers importés. */
  files: string[];

  hexOpen: boolean;
  modulesOpen: boolean;
  status: Status;

  toggleHex: () => void;
  openModules: () => void;
  closeModules: () => void;
  dismissStatus: () => void;
  importBpnote: () => Promise<void>;
  exportBpnote: () => Promise<void>;

  /** Ajoute une ligne et retourne son identifiant. */
  addItem: (collection: CollectionId, item: Record<string, unknown>) => number;
  /** Remplace une ligne existante. */
  updateItem: (collection: CollectionId, id: number, item: Record<string, unknown>) => void;
  deleteItem: (collection: CollectionId, id: number) => void;
};

const BpnoteContext = createContext<Store | null>(null);

export function BpnoteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BpnoteState>(EMPTY);
  const [files, setFiles] = useState<string[]>([]);
  const [hexOpen, setHexOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const counts = useMemo(() => {
    const entries = COLLECTIONS.map(({ id }) => [id, (state[id] ?? []).length] as const);
    return Object.fromEntries(entries) as Record<CollectionId, number>;
  }, [state]);

  const size = useMemo(() => encodedSize(state), [state]);

  const toggleHex = useCallback(() => setHexOpen((open) => !open), []);
  const openModules = useCallback(() => setModulesOpen(true), []);
  const closeModules = useCallback(() => setModulesOpen(false), []);
  const dismissStatus = useCallback(() => setStatus({ kind: "idle" }), []);

  const importBpnote = useCallback(async () => {
    try {
      const { files, merged } = await pickBpnoteFiles(state);

      if (files.length === 0) {
        return;
      }

      setState((previous) => ({
        ...previous,
        tricks: [...previous.tricks, ...merged.tricks],
        musicGenres: [...previous.musicGenres, ...merged.musicGenres],
        musicParts: [...previous.musicParts, ...merged.musicParts],
        artists: [...previous.artists, ...merged.artists],
        sources: [...previous.sources, ...merged.sources],
        trickMetadatas: [...previous.trickMetadatas, ...merged.trickMetadatas],
      }));
      setFiles((previous) => [...previous, ...files]);
      setStatus({ kind: "info", message: `Importé : ${files.join(", ")}` });
    } catch (error) {
      setStatus({ kind: "error", message: `Erreur d'import : ${(error as Error).message}` });
    }
  }, [state]);

  const exportBpnote = useCallback(async () => {
    try {
      await shareBpnote(state);
      setStatus({ kind: "info", message: `Exporté (${size} octets).` });
    } catch (error) {
      setStatus({ kind: "error", message: `Erreur d'export : ${(error as Error).message}` });
    }
  }, [state, size]);

  const addItem = useCallback((collection: CollectionId, item: Record<string, unknown>) => {
    const next = nextId(state[collection] as { id?: number }[]);
    setState((previous) => ({
      ...previous,
      [collection]: [...((previous[collection] ?? []) as object[]), { ...item, id: next }],
    }));
    return next;
  }, [state]);

  const updateItem = useCallback(
    (collection: CollectionId, id: number, item: Record<string, unknown>) => {
      setState((previous) => ({
        ...previous,
        [collection]: ((previous[collection] ?? []) as { id?: number }[]).map((row) =>
          row.id === id ? { ...row, ...item, id } : row,
        ),
      }));
    },
    [],
  );

  const deleteItem = useCallback((collection: CollectionId, id: number) => {
    setState((previous) => ({
      ...previous,
      [collection]: ((previous[collection] ?? []) as { id?: number }[]).filter((row) => row.id !== id),
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      state,
      counts,
      size,
      files,
      hexOpen,
      modulesOpen,
      status,
      toggleHex,
      openModules,
      closeModules,
      dismissStatus,
      importBpnote,
      exportBpnote,
      addItem,
      updateItem,
      deleteItem,
    }),
    [
      state,
      counts,
      size,
      files,
      hexOpen,
      modulesOpen,
      status,
      toggleHex,
      openModules,
      closeModules,
      dismissStatus,
      importBpnote,
      exportBpnote,
      addItem,
      updateItem,
      deleteItem,
    ],
  );

  return <BpnoteContext.Provider value={value}>{children}</BpnoteContext.Provider>;
}

export function useBpnote(): Store {
  const store = useContext(BpnoteContext);

  if (!store) {
    throw new Error("useBpnote doit être utilisé dans <BpnoteProvider>.");
  }

  return store;
}