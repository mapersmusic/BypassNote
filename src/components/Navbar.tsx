import { useEffect, useState, type ComponentType } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";

import {
  COLLECTIONS,
  collectionHref,
  type CollectionId,
} from "@/constants/collections";
import { useIsWide } from "@/hooks/use-breakpoint";
import {
  IconDownload,
  IconMenu2,
  IconMusicBolt,
  IconShape,
  IconTerminal2,
  IconUpload,
  IconX,
  type IconProps,
} from "@/components/icons";
import { colors, FontSize, fontFamily, radii, Spacing } from "@/styles/global";

const APP_VERSION = "0.1";

/** En dessous de cette largeur les actions basculent dans le menu (@media 960px de l'ancienne version web). */
const COMPACT_BREAKPOINT = 960;

/** Composant d'icône — voir `./icons`. */
type IconComponent = ComponentType<IconProps>;

export type NavbarAction = {
  /** Identifiant stable de l'action (ex : « export »). */
  key: string;
  label: string;
  icon: IconComponent;
  variant?: "default" | "primary";
  /** Tant qu'aucun handler n'est fourni, le bouton est inactif. */
  onPress?: () => void;
};

/** Actions de l'en-tête, dans l'ordre de l'ancienne version web. */
export const DEFAULT_ACTIONS: NavbarAction[] = [
  { key: "hex", label: "Hex", icon: IconTerminal2 },
  { key: "import", label: "Importer .bpnote", icon: IconUpload },
  { key: "modules", label: "Modules", icon: IconShape },
  { key: "export", label: "Exporter .bpnote", icon: IconDownload, variant: "primary" },
];

type NavbarProps = {
  actions?: NavbarAction[];
  /** Collection courante — sert à mettre en évidence l'entrée active du burger. */
  activeCollectionId?: CollectionId;
  /** Navigation vers une collection depuis le burger (écran étroit). */
  onSelectCollection?: (id: CollectionId) => void;
};

/**
 * Barre de navigation — équivalent du `<header>` de l'ancienne version web :
 * logo, titre, pastille de version, actions alignées à droite, et bascule en
 * menu déroulant sur petit écran.
 *
 * Montée dans `_layout.tsx` (hors de la pile), elle n'est donc pas re-rendue à
 * chaque navigation. Les actions reçoivent leur comportement via `onPress` :
 * tant qu'il est absent, le bouton est rendu inactif.
 */
export function Navbar({
  actions = DEFAULT_ACTIONS,
  activeCollectionId,
  onSelectCollection,
}: NavbarProps) {
  const isWide = useIsWide();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Referme le panneau dès que la route change : le menu ne peut pas rester
  // ouvert par-dessus un nouvel écran.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isPrimary = (action: NavbarAction) => action.variant === "primary";
  const isDisabled = (action: NavbarAction) => !action.onPress;

  const selectCollection = (id: CollectionId) => {
    if (onSelectCollection) {
      onSelectCollection(id);
    } else {
      router.push(collectionHref(id));
    }
  };

  const renderAction = (action: NavbarAction, compact: boolean) => (
    <Pressable
      key={action.key}
      onPress={action.onPress}
      disabled={isDisabled(action)}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled(action) }}
      style={({ pressed }) => [
        styles.btn,
        isPrimary(action) && styles.btnPrimary,
        compact && styles.btnCompact,
        pressed && styles.btnPressed,
        isDisabled(action) && styles.btnDisabled,
      ]}
    >
      <action.icon size={16} color={isPrimary(action) ? colors.text : colors.text} />
      <Text style={[styles.btnText, isPrimary(action) && styles.btnTextPrimary]}>
        {action.label}
      </Text>
    </Pressable>
  );

  return (
    <>
      <View style={styles.header}>
        <IconMusicBolt size={20} color={colors.primary} />
        <Text style={styles.title}>BypassNote</Text>

        <View style={styles.verpill}>
          <Text style={styles.verpillLabel}>app</Text>
          <Text style={styles.verpillValue}>{APP_VERSION}</Text>
        </View>

        <View style={styles.spacer} />

        {isWide ? (
          <View style={styles.actions}>{actions.map((a) => renderAction(a, false))}</View>
        ) : (
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={styles.btn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le menu"
          >
            <IconMenu2 size={18} color={colors.text} />
          </Pressable>
        )}
      </View>

      <Modal
        visible={menuOpen}
        transparent
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>Menu</Text>
              <Pressable
                onPress={() => setMenuOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fermer le menu"
              >
                <IconX size={20} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.menuLabel}>Actions</Text>
            {actions.map((a) => renderAction(a, true))}

            <Text style={styles.menuLabel}>Collections</Text>
            {COLLECTIONS.map((collection) => {
              const isActive = collection.id === activeCollectionId;

              return (
                <Pressable
                  key={collection.id}
                  onPress={() => {
                    setMenuOpen(false);
                    selectCollection(collection.id);
                  }}
                  accessibilityRole="button"
                  aria-selected={isActive}
                  aria-current={isActive ? "page" : undefined}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.menuButton,
                    isActive && styles.menuButtonActive,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <collection.icon
                    size={16}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}
                  >
                    {collection.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.header,
  },
  title: {
    fontFamily: fontFamily.sansSemiBold,
    color: colors.text,
    fontSize: FontSize.title,
    letterSpacing: -0.3,
  },
  verpill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  verpillLabel: {
    color: colors.textMuted,
    fontSize: FontSize.small,
  },
  verpillValue: {
    fontFamily: fontFamily.sansMedium,
    color: colors.text,
    fontSize: FontSize.small,
  },
  spacer: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  btnCompact: {
    width: "100%",
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontFamily: fontFamily.sansMedium,
    color: colors.text,
    fontSize: FontSize.small,
  },
  btnTextPrimary: {
    fontFamily: fontFamily.sansSemiBold,
    color: "#ffffff",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.three,
  },
  panel: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.header,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  panelTitle: {
    fontFamily: fontFamily.sansSemiBold,
    color: colors.text,
    fontSize: FontSize.heading,
  },
  menuLabel: {
    color: colors.textMuted,
    fontSize: FontSize.micro,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuButton: {
    width: "100%",
  },
  menuButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  menuItemLabel: {
    fontFamily: fontFamily.sans,
    color: colors.text,
    fontSize: 13,
  },
  menuItemLabelActive: {
    color: colors.primary,
    fontFamily: fontFamily.sansMedium,
  },
});