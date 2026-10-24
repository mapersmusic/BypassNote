import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import { encodedSize, formatBytes, type BpnoteState } from "@/lib/codec";
import {
  countCollectionItems,
  countItems,
  countSelectedCollectionItems,
  countSelectedItems,
  describeExportItem,
  filterStateForExport,
  isItemSelected,
  type ExportSelection,
} from "@/lib/export-selection";
import type { Row } from "@/constants/schema";
import { colors, fontFamily, FontSize, globalStyles, radii, Spacing } from "@/styles/global";

type Props = {
  visible: boolean;
  state: BpnoteState;
  selection: ExportSelection;
  onToggleItem: (id: CollectionId, index: number) => void;
  onToggleCollection: (id: CollectionId) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onClose: () => void;
  onExport: () => void;
};

/**
 * Fenêtre « Exporter .bpnote ».
 *
 * L'utilisateur coche les lignes à inclure, collection par collection ; la
 * taille affichée est celle du `.bpnote` filtré, pas celle de l'état complet.
 */
export function ExportPanel({
  visible,
  state,
  selection,
  onToggleItem,
  onToggleCollection,
  onSelectAll,
  onSelectNone,
  onClose,
  onExport,
}: Props) {
  const totalItems = countItems(state);
  const selectedItems = countSelectedItems(state, selection);
  const exportedSize = encodedSize(filterStateForExport(state, selection));
  const canExport = selectedItems > 0;

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
            Choisissez les éléments à inclure dans le fichier exporté. La sauvegarde
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
              {selectedItems}/{totalItems} · {formatBytes(exportedSize)}
            </Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
            {totalItems === 0 ? (
              <Text style={styles.empty}>Aucune donnée à exporter.</Text>
            ) : (
              COLLECTIONS.map((collection) => {
                const items = (state[collection.id] ?? []) as Row[];
                const total = countCollectionItems(state, collection.id);

                if (total === 0) {
                  return null;
                }

                const selected = countSelectedCollectionItems(state, selection, collection.id);
                const allSelected = selected === total;
                const noneSelected = selected === 0;
                const mixed = !allSelected && !noneSelected;

                return (
                  <View key={collection.id} style={styles.group}>
                    <Pressable
                      onPress={() => onToggleCollection(collection.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: noneSelected ? false : allSelected ? true : "mixed" }}
                      aria-checked={noneSelected ? false : allSelected ? true : "mixed"}
                      accessibilityLabel={`Inclure toute la collection ${collection.label}`}
                      style={({ pressed }) => [styles.groupHead, pressed && styles.pressed]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          (allSelected || mixed) && styles.checkboxActive,
                        ]}
                      >
                        {allSelected ? (
                          <Text style={styles.check}>✓</Text>
                        ) : mixed ? (
                          <Text style={styles.check}>–</Text>
                        ) : null}
                      </View>
                      <collection.icon
                        size={14}
                        color={allSelected ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.groupLabel, allSelected && styles.groupLabelActive]}>
                        {collection.label}
                      </Text>
                      <Text style={styles.groupCount}>
                        {selected}/{total}
                      </Text>
                    </Pressable>

                    {items.map((item, index) => {
                      const checked = isItemSelected(selection, collection.id, index);

                      return (
                        <Pressable
                          key={index}
                          onPress={() => onToggleItem(collection.id, index)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked }}
                          aria-checked={checked}
                          accessibilityLabel={describeExportItem(collection.id, item, state, index)}
                          style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
                        >
                          <View style={[styles.itemCheckbox, checked && styles.checkboxActive]}>
                            {checked ? <Text style={styles.itemCheck}>✓</Text> : null}
                          </View>
                          <Text
                            numberOfLines={1}
                            style={[styles.itemLabel, !checked && styles.itemLabelOff]}
                          >
                            {describeExportItem(collection.id, item, state, index)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })
            )}
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
    maxWidth: 460,
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
    gap: Spacing.two,
  },
  empty: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: Spacing.three,
    textAlign: "center",
  },
  group: {
    gap: 1,
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  groupLabel: {
    flex: 1,
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupLabelActive: {
    color: colors.primary,
  },
  groupCount: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textMuted,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: 5,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.two,
    borderRadius: radii.sm,
  },
  itemLabel: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: FontSize.small,
    color: colors.text,
  },
  itemLabelOff: {
    color: colors.textMuted,
  },
  pressed: {
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
  itemCheckbox: {
    width: 14,
    height: 14,
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
  itemCheck: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 9,
    lineHeight: 12,
    color: "#ffffff",
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
