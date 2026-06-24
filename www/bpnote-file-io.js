/* BPNoteFileIO: helper for importing and exporting BPNote files.
   This class isolates the conversion logic from the UI in BypassNote.html.
*/

class BPNoteFileIO {
  constructor(codec) {
    this.codec = codec;
    this.uidCtr = 1;
  }

  normalizeDecoded(decoded, sourceName = 'Local') {
    const wrap = (arr) => (arr || []).map(item => ({
      ...item,
      _uid: String(this.uidCtr++),
      _sourceFile: sourceName,
    }));

    return {
      version: decoded.version || { major: 1, minor: 0 },
      tricks: wrap(decoded.tricks),
      musicGenres: wrap(decoded.musicGenres),
      musicParts: wrap(decoded.musicParts),
      artists: wrap(decoded.artists),
      sources: wrap(decoded.sources),
      trickMetadatas: wrap(decoded.trickMetadatas),
    };
  }

  decode(bytes) {
    return this.codec.decode(bytes);
  }

  encode(payload) {
    return this.codec.encode(payload);
  }

  import(bytes, sourceName = 'Local') {
    const decoded = this.decode(bytes);
    return this.normalizeDecoded(decoded, sourceName);
  }

  export(payload) {
    return this.encode(payload);
  }

  async download(payload, filename = 'export.bpnote') {
    const bytes = this.export(payload);
    const isNative = window.capacitorExports
      && window.capacitorExports.Capacitor
      && window.capacitorExports.Capacitor.isNativePlatform();

    if(isNative) {
      const { Filesystem, Directory } = window.capacitorFilesystemPluginCapacitor;
      const { Share } = window.capacitorShare;

      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({ title: filename, url: result.uri });
    } else {
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
}
