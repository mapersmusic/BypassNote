import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { COLLECTIONS, type CollectionId } from "@/constants/collections";
import { colors, fontFamily, FontSize, radii, Spacing } from "@/styles/global";

type SidebarProps = {
  /** Collection courante. */
  activeId?: CollectionId;
  /** Nombre d'éléments par collection — la pastille `.cnt` n'est rendue que si une valeur existe. */
  counts?: Partial<Record<CollectionId, number>>;
  onSelect: (id: CollectionId) => void;
  /**
   * `rail` : colonne verticale de 168 px (`nav.sidebar` sur grand écran).
   * `grid` : grille de 2 colonnes sous l'en-tête (media query 960px).
   */
  layout?: "rail" | "grid";
};

/** Barre latérale de navigation — équivalent de `nav.sidebar`. */
export function Sidebar({
  activeId,
  counts,
  onSelect,
  layout = "rail",
}: SidebarProps) {
  const isRail = layout === "rail";

  return (
    <View style={[styles.sidebar, isRail ? styles.rail : styles.grid]}>
      <Text style={styles.label}>Collections</Text>

      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {COLLECTIONS.map((collection) => {
          const isActive = collection.id === activeId;
          const count = counts?.[collection.id];

          return (
            <Pressable
              key={collection.id}
              onPress={() => onSelect(collection.id)}
              accessibilityRole="button"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              style={({ pressed }) => [
                styles.item,
                isRail ? styles.itemRail : styles.itemGrid,
                isActive && styles.itemActive,
                pressed && !isActive && styles.itemPressed,
              ]}
            >
              <View style={styles.itemMain}>
                <collection.icon
                  size={16}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.itemLabel, isActive && styles.itemLabelActive]}
                >
                  {collection.label}
                </Text>
              </View>

              {count !== undefined ? (
                <Text style={[styles.cnt, isActive && styles.cntActive]}>{count}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Destination d'une collection — utile aux appelants. */
export { collectionHref as sidebarHref } from "@/constants/collections";

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: colors.header,
    padding: Spacing.two,
  },
  rail: {
    width: 168,
    flexShrink: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  grid: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  scroller: {
    flexGrow: 0,
    flexShrink: 0,
  },
  scrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },

  /** `.nav-label` */
  label: {
    width: "100%",
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
    textTransform: "uppercase",
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.sm,
    marginBottom: Spacing.half,
  },
  itemRail: {
    width: "100%",
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  itemGrid: {
    flex: 1,
    flexBasis: "45%",
    justifyContent: "center",
    marginBottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  itemActive: {
    backgroundColor: colors.primarySoft,
  },
  itemPressed: {
    backgroundColor: colors.surfaceAlt,
  },

  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  itemLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemLabelActive: {
    color: colors.primary,
    fontFamily: fontFamily.sansMedium,
  },

  /** `.cnt` */
  cnt: {
    fontFamily: fontFamily.sans,
    fontSize: FontSize.micro,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
    color: colors.textMuted,
  },
  cntActive: {
    backgroundColor: "rgba(108, 99, 255, 0.25)",
    color: colors.primary,
  },
});