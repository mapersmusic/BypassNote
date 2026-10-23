import { ScrollView, StyleSheet, Text, View } from "react-native";

import { encode, formatBytes, toHexRows } from "@/lib/codec";
import { useBpnote } from "@/lib/store";
import { colors, fontFamily, FontSize, globalStyles, Spacing } from "@/styles/global";

/**
 * Panneau hexadécimal — équivalent du `#hexPanel` de l'ancienne version web :
 * les octets du fichier .bpnote que produirait l'état courant.
 */
export function HexPanel() {
  const { state, size } = useBpnote();

  let rows: ReturnType<typeof toHexRows> = [];
  let failed = false;

  try {
    rows = toHexRows(encode(state));
  } catch {
    failed = true;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={styles.headText}>Hex</Text>
        <Text style={styles.size}>{formatBytes(size)}</Text>
      </View>

      <ScrollView style={styles.scroll} horizontal showsHorizontalScrollIndicator={false}>
        {failed ? (
          <Text style={styles.empty}>Encodage impossible pour cet état.</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>— vide —</Text>
        ) : (
          rows.map((row) => (
            <View key={row.address} style={styles.row}>
              <Text style={styles.address}>{row.address}</Text>
              <Text style={styles.hex}>{row.hex}</Text>
              <Text style={styles.ascii}>{row.ascii}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.header,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    maxHeight: 160,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  headText: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: FontSize.small,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  size: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: 1,
  },
  address: {
    width: 40,
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
  },
  hex: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.success,
  },
  ascii: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    paddingLeft: Spacing.two,
    minWidth: 160,
  },
  empty: {
    ...globalStyles.mono,
    paddingVertical: Spacing.two,
  },
});