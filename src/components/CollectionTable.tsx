import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Collection } from "@/constants/collections";
import {
  COLUMNS,
  matchesQuery,
  SRC_BADGE,
  SRC_LABELS,
  type Row,
} from "@/constants/schema";
import { IconExternalLink, IconPencil, IconPlus, IconTrash } from "@/components/icons";
import { useBpnote } from "@/lib/store";
import { colors, fontFamily, FontSize, globalStyles, radii, Spacing } from "@/styles/global";

type Props = {
  collection: Collection;
  onAdd: () => void;
  onEdit: (item: Row) => void;
  onDelete: (item: Row) => void;
};

/** Largeur minimale d'une colonne avant de faire défiler horizontalement. */
const MIN_COLUMN_WIDTH = 150;
/** Colonne d'actions (crayon / poubelle), largeur fixe. */
const ACTIONS_WIDTH = 88;

/**
 * Identité React d'une ligne.
 *
 * Les `trickMetadatas` n'ont pas d'`id` dans le format .bpnote et un import
 * multi-fichiers peut amener deux lignes portant le même `id` : on attache donc
 * une clé stable à l'objet lui-même au lieu de la déduire de son contenu.
 */
const rowKeys = new WeakMap<Row, string>();
let rowKeySeed = 0;

function rowKey(item: Row): string {
  let key = rowKeys.get(item);

  if (!key) {
    rowKeySeed += 1;
    key = `row-${rowKeySeed}`;
    rowKeys.set(item, key);
  }

  return key;
}

/** `window.open(..., '_blank')` de l'ancienne version, via Linking. */
function openExternal(url: string) {
  Linking.openURL(url).catch(() => {
    // URL invalide ou schéma non géré : rien à faire de plus.
  });
}

/** Tableau d'édition — transposition de `renderMain()` : tri, recherche, actions. */
export function CollectionTable({ collection, onAdd, onEdit, onDelete }: Props) {
  const { state } = useBpnote();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const columns = COLUMNS[collection.id];

  const items = useMemo(() => {
    const all = (state[collection.id] ?? []) as Row[];

    return all
      .filter((item) => matchesQuery(collection.id, item, state, query))
      .sort((a, b) => {
        const column = columns.find((c) => c.key === sortKey) ?? columns[0];
        const va = column.sortValue(a, state);
        const vb = column.sortValue(b, state);

        if (typeof va === "number" && typeof vb === "number") {
          return sortDir * (va - vb);
        }
        return sortDir * String(va ?? "").localeCompare(String(vb ?? ""));
      });
  }, [state, collection.id, columns, query, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  return (
    <View style={globalStyles.card}>
      {/* `table { width: 100% }` : chaque colonne est en `flex: 1` avec un
          plancher `minWidth`, donc le tableau remplit la carte et défile dès
          que les planchers dépassent l'écran. Aucune mesure JS nécessaire. */}
      <View style={styles.inner}>
        <View style={globalStyles.cardHeader}>
        <View style={styles.title}>
          <collection.icon size={16} color={colors.text} />
          <Text style={globalStyles.cardTitle}>{collection.label}</Text>
        </View>

        <Pressable onPress={onAdd} style={styles.add} accessibilityRole="button">
          <IconPlus size={16} color={colors.text} />
          <Text style={styles.addText}>Ajouter</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher..."
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          accessibilityLabel="Rechercher"
        />
        <Pressable
          onPress={() => {
            setQuery("");
            setSortKey("id");
            setSortDir(1);
          }}
          style={styles.clear}
          accessibilityRole="button"
        >
          <Text style={styles.clearText}>Effacer</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableContent}
      >
        <View style={styles.table}>
          <View style={[styles.row, styles.headRow]}>
            {columns.map((column) => {
              const active = sortKey === column.key;
              return (
                <Pressable
                  key={column.key}
                  onPress={() => toggleSort(column.key)}
                  disabled={column.sortable === false}
                  style={[styles.cell, styles.headCell, column.link !== undefined && styles.linkCell]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: column.sortable === false }}
                >
                  <Text style={styles.headText}>
                    {column.label}
                    <Text style={styles.arrow}>
                      {active ? (sortDir === 1 ? " ↑" : " ↓") : ""}
                    </Text>
                  </Text>
                </Pressable>
              );
            })}
            <View style={[styles.cell, styles.headCell, styles.actionsCell]}>
              <Text style={styles.headText}>#</Text>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={globalStyles.empty}>Aucun élément</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={rowKey(item)} style={styles.row}>
                {columns.map((column) => {
                  const href = column.link?.(item, state) ?? null;

                  return (
                    <View
                      key={column.key}
                      style={[styles.cell, column.link !== undefined && styles.linkCell]}
                    >
                      {column.link !== undefined ? (
                        href ? (
                          <Pressable
                            onPress={() => openExternal(href)}
                            style={styles.iconBtn}
                            hitSlop={6}
                            accessibilityRole="link"
                            accessibilityLabel="Ouvrir la source"
                          >
                            <IconExternalLink size={16} color={colors.text} />
                          </Pressable>
                        ) : null
                      ) : column.badge && Number(item.type) ? (
                        <View style={[styles.badge, badgeStyle(Number(item.type)).badge]}>
                          <Text style={[styles.badgeText, badgeStyle(Number(item.type)).text]}>
                            {SRC_LABELS[Number(item.type)] ?? "?"}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[styles.cellText, column.mono && styles.cellMono]}
                          numberOfLines={1}
                        >
                          {column.cell(item, state)}
                        </Text>
                      )}
                    </View>
                  );
                })}

                <View style={[styles.cell, styles.actionsCell]}>
                  <Pressable
                    onPress={() => onEdit(item)}
                    style={styles.iconBtn}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Éditer ${item.id}`}
                  >
                    <IconPencil size={16} color={colors.text} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(item)}
                    style={styles.iconBtn}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Supprimer ${item.id}`}
                  >
                    <IconTrash size={16} color={colors.alert} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

function badgeStyle(type: number) {
  switch (SRC_BADGE[type]) {
    case "yt":
      return { badge: styles.badgeYt, text: styles.badgeTextYt };
    case "ytm":
      return { badge: styles.badgeYtm, text: styles.badgeTextYtm };
    default:
      return { badge: styles.badgeUrl, text: styles.badgeTextUrl };
  }
}

const styles = StyleSheet.create({
  /** Zone mesurée : elle porte le padding de la carte, pas l'inverse. */
  inner: {
    width: "100%",
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  add: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  addText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.text,
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  search: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.text,
  },
  clear: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  clearText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.small,
    color: colors.alert,
  },

  /**
   * Le contentContainer d'un ScrollView horizontal est un flex item en
   * `width: auto` : il se dimensionne sur son contenu et les colonnes `flex: 1`
   * n'ont donc rien à remplir. `minWidth: 100%` le force à occuper la carte,
   * et le débordement déclenche alors le défilement.
   */
  tableContent: {
    minWidth: "100%",
  },
  table: {
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headRow: {
    borderBottomColor: colors.borderStrong,
  },
  /** Chaque colonne partage la largeur restante, avec un plancher. */
  cell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: MIN_COLUMN_WIDTH,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
  },
  headCell: {
    justifyContent: "center",
  },
  headText: {
    fontFamily: fontFamily.sans,
    fontSize: FontSize.micro,
    fontWeight: "500",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  arrow: {
    color: colors.textMuted,
  },
  cellText: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.text,
  },
  cellMono: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.small,
    color: colors.textMuted,
  },
  actionsCell: {
    width: ACTIONS_WIDTH,
    minWidth: ACTIONS_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "flex-end",
  },
  /** Colonne « Lien » : réduite à la largeur de son icône. */
  linkCell: {
    width: 56,
    minWidth: 56,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    padding: 4,
    borderRadius: radii.sm,
  },
  emptyRow: {
    paddingVertical: Spacing.four,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: FontSize.micro,
  },
  badgeUrl: { backgroundColor: colors.primarySoft },
  badgeTextUrl: { color: colors.primary },
  badgeYt: { backgroundColor: "rgba(220, 38, 38, 0.15)" },
  badgeTextYt: { color: colors.youtube },
  badgeYtm: { backgroundColor: "rgba(217, 119, 6, 0.15)" },
  badgeTextYtm: { color: colors.youtubeMusic },
});
