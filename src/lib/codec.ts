import protobuf from "protobufjs";

import descriptor from "./bpnote_pb.json";

/**
 * Codec .bpnote pour React Native.
 *
 * La version web (`www/bpnote_codec.js`) tirait sa racine protobuf du global
 * `window.BPNoteCompiled`, injecté par une balise `<script>`. Il n'existe ni
 * `window` ni runtime protobuf dans l'app native : on reconstruit donc la
 * racine à partir du descripteur JSON généré depuis `bpnote_0_1.proto`
 * (`npm run proto:json`).
 *
 * On utilise le build complet de `protobufjs` : `protobufjs/minimal` n'expose
 * pas `Root` en v8. Le paquet déclare `"browser": { "fs": false }`, donc Metro
 * remplace `fs` par un module vide et le bundle reste utilisable sous Hermes.
 */

const root = protobuf.Root.fromJSON(descriptor as unknown as protobuf.INamespace);

const BPNoteFile = root.lookupType("BPNoteFile");

/** Version écrite par défaut à l'export. */
export const STANDARD_VERSION = { major: 0, minor: 1 };

export type Version = { major: number; minor: number };
export type Key = { tonic: number; mode: number } | null | undefined;

export type Trick = { id: number; description: string };
export type MusicGenre = { id: number; name: string };
export type MusicPart = { id: number; name: string };
export type Artist = { id: number; name: string };
export type Source = {
  id: number;
  type: number;
  data: string;
  title: string;
  key?: Key;
  bpm: number;
};
export type TrickMetadata = {
  trickId: number;
  musicGenreId: number;
  musicPartId: number;
  artistId: number;
  sourceId: number;
  timestamp: number;
};

/** Charge utile telle que stockée dans l'app (les compteurs `_uid` sont gérés en UI). */
export type BpnoteState = {
  version: Version;
  tricks: Trick[];
  musicGenres: MusicGenre[];
  musicParts: MusicPart[];
  artists: Artist[];
  sources: Source[];
  trickMetadatas: TrickMetadata[];
  author: string;
};

/** Retire les champs d'UI et normalise ce que protobuf est censé recevoir. */
export function toCodecPayload(state: BpnoteState) {
  return {
    version: state.version ?? STANDARD_VERSION,
    tricks: (state.tricks ?? []).map(({ id, description }) => ({ id, description: description ?? "" })),
    musicGenres: (state.musicGenres ?? []).map(({ id, name }) => ({ id, name: name ?? "" })),
    musicParts: (state.musicParts ?? []).map(({ id, name }) => ({ id, name: name ?? "" })),
    artists: (state.artists ?? []).map(({ id, name }) => ({ id, name: name ?? "" })),
    sources: (state.sources ?? []).map(({ id, type, data, title, key, bpm }) => ({
      id,
      type: type || 1,
      data: data ?? "",
      title: title ?? "",
      key: key ?? undefined,
      bpm: bpm ?? 0,
    })),
    trickMetadatas: (state.trickMetadatas ?? []).map((meta) => ({
      trickId: meta.trickId || 0,
      musicGenreId: meta.musicGenreId || 0,
      musicPartId: meta.musicPartId || 0,
      artistId: meta.artistId || 0,
      sourceId: meta.sourceId || 0,
      timestamp: Number(meta.timestamp) || 0,
    })),
    author: state.author ?? "",
  };
}

export function encode(state: BpnoteState): Uint8Array {
  const payload = toCodecPayload(state);
  const invalid = BPNoteFile.verify(payload);

  if (invalid) {
    throw new Error(`Validation protobuf : ${invalid}`);
  }

  return BPNoteFile.encode(BPNoteFile.create(payload)).finish();
}

export function decode(bytes: Uint8Array): BpnoteState {
  const message = BPNoteFile.decode(bytes);

  return BPNoteFile.toObject(message, {
    longs: Number,
    enums: Number,
    defaults: true,
    arrays: true,
  }) as BpnoteState;
}

/** Nombre d'octets qu'occupera l'état s'il était exporté. 0 si l'encodage échoue. */
export function encodedSize(state: BpnoteState): number {
  try {
    return encode(state).length;
  } catch {
    return 0;
  }
}

/** 1234 → « 1,2 KB ». */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

export type HexRow = { address: string; hex: string; ascii: string };

/** Vue hexadécimale d'un buffer, 16 octets par ligne. */
export function toHexRows(bytes: Uint8Array): HexRow[] {
  const rows: HexRow[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.subarray(i, i + 16);

    rows.push({
      address: i.toString(16).padStart(4, "0"),
      hex: Array.from(chunk, (b) => b.toString(16).padStart(2, "0")).join(" "),
      ascii: Array.from(chunk, (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join(""),
    });
  }

  return rows;
}

export function typeNames(): string[] {
  return Object.keys((root as unknown as { nested?: Record<string, unknown> }).nested ?? {});
}