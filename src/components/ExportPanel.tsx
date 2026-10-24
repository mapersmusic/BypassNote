import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import { encodedSize, formatBytes, type BpnoteState } from "@/lib/codec";
import {
  countSelectedCollections,
  filterStateForExport,
  type ExportSelection,
} from "@/lib/export-selection";
import { colors, fontFamily, FontSize, globalStyles, radii, Spacing } from "@/styles/global";

type Props = {
  visible: boolean;
  state: BpnoteState;
  selection: ExportSelection;
  onToggle: (id: CollectionId) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onClose: () => void;
  onExport: () => void;
};

/**
 * Fenêtre « Exporter .bpnote ».
 *
 * L'utilisateur coche les collections à inclure dans le fichier ; la taille
 * affichée est celle du `.bpnote` filtré, pas celle de l'état complet.
 */
export function ExportPanel({
  visible,
  state,
  selection,
  onToggle,
  onSelectAll,
  onSelectNone,
  onClose,
  onExport,
}: Props) {
  const selectedCount = countSelectedCollections(selection);
  const exportedSize = encodedSize(filterStateForExport(state, selection));
  const canExport = selectedCount > 0;

  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <View style={styles.head}>
            <Text style={globalStyles.cardTitle}>Exporter .bpnote</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.info}>
            Choisissez les informations à inclure dans le fichier exporté. La sauvegarde
            automatique conservera, elle, toutes les données.
          </Text>

          <View style={styles.toolbar}>
            <Pressable onPress={onSelectAll} style={styles.toolBtn} accessibilityRole="button">
              <Text style={styles.toolBtnText}>Tout</Text>
            </Pressable>
            <Pressable onPress={onSelectNone} style={styles.toolBtn} accessibilityRole="button">
              <Text style={styles.toolBtnText}>Rien</Text>
            </Pressable>
            <View style={styles.spacer} />
            <Text style={styles.summary}>
              {selectedCount}/{COLLECTIONS.length} · {formatBytes(exportedSize)}
            </Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
            {COLLECTIONS.map((collection) => {
              const checked = selection[collection.id];
              const count = (state[collection.id] ?? []).length;

              return (
                <Pressable
                  key={collection.id}
                  onPress={() => onToggle(collection.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={`Inclure ${collection.label} dans l'export`}
                  style={({ pressed }) => [
                    styles.row,
                    checked && styles.rowActive,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                  <collection.icon size={16} color={checked ? colors.primary : colors.textMuted} />
                  <Text
                    numberOfLines={1}
                    style={[styles.rowLabel, checked && styles.rowLabelActive]}
                  >
                    {collection.label}
                  </Text>
                  <Text style={styles.rowCount}>{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.foot}>
            <Pressable
              onPress={onClose}
              style={[styles.btn, styles.btnGhost]}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={onExport}
              disabled={!canExport}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canExport }}
              accessibilityLabel="Exporter la sélection"
              style={[styles.btn, styles.btnPrimary, !canExport && styles.btnDisabled]}
            >
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Exporter</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.three,
  },
  panel: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: colors.header,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    padding: Spacing.three,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  close: {
    fontFamily: fontFamily.sans,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  info: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: Spacing.two,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  toolBtn: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  toolBtnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.micro,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
  },
  summary: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
  },
  scroll: {
    flexGrow: 0,
  },
  list: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowPressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  check: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: "#ffffff",
  },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.text,
  },
  rowLabelActive: {
    color: colors.primary,
    fontFamily: fontFamily.sansMedium,
  },
  rowCount: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
  },
  foot: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  btn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.text,
  },
  btnTextPrimary: {
    color: "#ffffff",
  },
});
