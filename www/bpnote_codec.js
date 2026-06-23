/* BPNoteCodec : wrapper de lecture/écriture .bpnote
   Utilise le module protobuf compilé chargé depuis bpnote_pb.js.
*/
class BPNoteCodec {
  constructor(root) {
    this._root = root;
    this._BPNoteFile = root.BPNoteFile || (root.lookupType && root.lookupType('BPNoteFile'));
  }

  static fromCompiled() {
    const root = window.BPNoteCompiled
      || (typeof protobuf !== 'undefined' && protobuf.roots && (protobuf.roots['default'] || protobuf.roots.default));
    if (!root || !root.BPNoteFile) throw new Error('Codec compilé BPNote indisponible.');
    // Runtime compatibility: some protobufjs versions expose Reader.stringVerify,
    // while others only expose Reader.string. The generated code uses stringVerify,
    // so we map it to string when stringVerify is missing.
    if (typeof protobuf !== 'undefined' && protobuf.Reader && protobuf.Reader.prototype && !protobuf.Reader.prototype.stringVerify && protobuf.Reader.prototype.string) {
      protobuf.Reader.prototype.stringVerify = protobuf.Reader.prototype.string;
    }
    return new BPNoteCodec(root);
  }

  encode(data) {
    const T = this._BPNoteFile;
    const err = T.verify(data);
    if (err) throw new Error('Validation protobuf : ' + err);
    return T.encode(T.create(data)).finish();
  }

  decode(bytes) {
    const msg = this._BPNoteFile.decode(bytes);
    return this._BPNoteFile.toObject(msg, {
      longs: Number, enums: Number, defaults: true, arrays: true,
    });
  }

  get typeNames() { return Object.keys(this._root.nested || {}); }

  getFields(typeName) {
    const T = this._root.lookupType(typeName);
    return Object.values(T.fields).map(f => ({
      name: f.name, type: f.type, id: f.id, rule: f.rule || 'optional',
    }));
  }
}
