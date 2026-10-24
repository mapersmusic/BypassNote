import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { decode, encode, type BpnoteState } from "./codec";

/**
 * Sauvegarde automatique dans un `.bpnote` de travail.
 *
 * Ce fichier n'est jamais partagé : il sert de brouillon local pour retrouver
 * l'état complet au prochain lancement. L'export explicite reste indépendant et
 * peut, lui, ne contenir qu'une sélection de lignes.
 *
 * Sur natif, le fichier vit dans le dossier documents de l'application. Sur le
 * web — y compris la coquille Capacitor Android — les mêmes octets sont stockés
 * dans IndexedDB sous le nom `AUTOSAVE_FILE` : `expo-file-system` n'a pas
 * d'implémentation web utilisable et localStorage est trop petit pour un
 * `.bpnote` volumineux.
 */

export const AUTOSAVE_FILE = "bypassnote-autosave.bpnote";
export const AUTOSAVE_DELAY_MS = 800;

/** Stockage minimal, injectable pour les tests. */
export type AutosaveStorage = {
  write: (bytes: Uint8Array) => Promise<void>;
  read: () => Promise<Uint8Array | null>;
  remove: () => Promise<void>;
};

/* -------------------------------------------------------------------------- */
/* Stockage natif                                                             */
/* -------------------------------------------------------------------------- */

function nativeStorage(): AutosaveStorage {
  return {
    async write(bytes) {
      const directory = Paths.document;
      const target = new File(directory, AUTOSAVE_FILE);
      const temporary = new File(directory, `${AUTOSAVE_FILE}.tmp`);

      // Écriture dans un fichier temporaire puis renommage : une coupure
      // pendant l'écriture ne laisse pas un brouillon tronqué à la place du
      // précédent.
      if (temporary.exists) {
        temporary.delete();
      }

      temporary.create({ overwrite: true });
      temporary.write(bytes);

      if (target.exists) {
        target.delete();
      }

      temporary.move(target);
    },

    async read() {
      const file = new File(Paths.document, AUTOSAVE_FILE);
      return file.exists ? file.bytes() : null;
    },

    async remove() {
      const target = new File(Paths.document, AUTOSAVE_FILE);
      const temporary = new File(Paths.document, `${AUTOSAVE_FILE}.tmp`);

      if (target.exists) {
        target.delete();
      }

      if (temporary.exists) {
        temporary.delete();
      }
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Stockage web (IndexedDB)                                                   */
/* -------------------------------------------------------------------------- */

const DB_NAME = "bypassnote";
const DB_VERSION = 1;
const STORE_NAME = "autosave";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB n'est pas disponible dans ce navigateur."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Ouverture d'IndexedDB impossible."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Opération IndexedDB impossible."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, mode);

    // Les gestionnaires sont posés avant d'attendre la requête : la
    // transaction peut se terminer juste après le succès de celle-ci.
    const completed = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Transaction IndexedDB impossible."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Transaction IndexedDB annulée."));
    });

    const value = await requestResult(action(transaction.objectStore(STORE_NAME)));

    await completed;

    return value;
  } finally {
    db.close();
  }
}

function webStorage(): AutosaveStorage {
  return {
    async write(bytes) {
      // Copie détachée : IndexedDB conserve les octets après le retour de
      // `put()`, mais le tableau d'origine peut encore être réutilisé.
      await withStore("readwrite", (store) => store.put(new Uint8Array(bytes), AUTOSAVE_FILE));
    },

    async read() {
      const value = await withStore<unknown>("readonly", (store) => store.get(AUTOSAVE_FILE));

      if (value instanceof Uint8Array) {
        return value;
      }

      if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
      }

      return null;
    },

    async remove() {
      await withStore("readwrite", (store) => store.delete(AUTOSAVE_FILE));
    },
  };
}

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

let defaultStorage: AutosaveStorage | null = null;

/** Stockage adapté à la plateforme courante (mémoïsé). */
export function getAutosaveStorage(): AutosaveStorage {
  if (!defaultStorage) {
    defaultStorage = Platform.OS === "web" ? webStorage() : nativeStorage();
  }

  return defaultStorage;
}

/** Encode l'état complet dans le format `.bpnote`. */
export function serializeAutosave(state: BpnoteState): Uint8Array {
  return encode(state);
}

/** Relit un `.bpnote` de travail ; lève une erreur si les octets sont invalides. */
export function deserializeAutosave(bytes: Uint8Array): BpnoteState {
  return decode(bytes);
}

/** Écrit l'état complet dans le fichier de travail. */
export async function saveAutosave(
  state: BpnoteState,
  storage: AutosaveStorage = getAutosaveStorage(),
): Promise<void> {
  await storage.write(serializeAutosave(state));
}

/** Relit le brouillon, ou `null` s'il n'existe pas encore. */
export async function loadAutosave(
  storage: AutosaveStorage = getAutosaveStorage(),
): Promise<BpnoteState | null> {
  const bytes = await storage.read();

  if (!bytes || bytes.length === 0) {
    return null;
  }

  return deserializeAutosave(bytes);
}

/** Supprime le brouillon (et son éventuel fichier temporaire). */
export async function clearAutosave(
  storage: AutosaveStorage = getAutosaveStorage(),
): Promise<void> {
  await storage.remove();
}
