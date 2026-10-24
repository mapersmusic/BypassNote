import { Platform, StyleSheet } from "react-native";

/**
 * Styles globaux de BypassNote.
 *
 * Reprend à l'identique le jeu de tokens de l'ancienne version web
 * (`www/BypassNote.html`) :
 *
 *   --bg0/--bg1/--bg2/--bg3  fonds
 *   --br/--br2               bordures
 *   --t0/--t1/--t2           textes
 *   --acc/--acc2/--acc-t     accent
 *   --ok/--warn/--err        états
 *   --r/--r2                 rayons
 *   --mono                   police monospace
 *
 * Les noms de clés de `colors` restent sémantiques (`background`, `header`,
 * `surface`, `primary`…) pour que les écrans existants n'aient pas à changer :
 * seule la valeur reprend l'ancien thème.
 */

/* -------------------------------------------------------------------------- */
/* Palette (équivalent des variables CSS)                                       */
/* -------------------------------------------------------------------------- */

export const colors = {
  /** `--bg0` — fond de page */
  background: "#0f0f11",
  /** `--bg1` — fond des barres et des cartes */
  header: "#18181b",
  /** `--bg2` — fond des contrôles (boutons, champs) */
  surface: "#1e1e23",
  /** `--bg3` — survol / fond actif */
  surfaceAlt: "#27272d",
  /** `--br` */
  border: "#2e2e36",
  /** `--br2` */
  borderStrong: "#3a3a44",

  /** `--t0` */
  text: "#e4e4f0",
  /** `--t1` */
  textSecondary: "#a1a1b5",
  /** `--t2` */
  textMuted: "#6b6b7e",

  /** `--acc` */
  primary: "#6c63ff",
  /** `--acc2` */
  primaryDark: "#4f46e5",
  /** `--acc-t` */
  primarySoft: "rgba(108, 99, 255, 0.15)",

  /** `--ok` */
  success: "#22c55e",
  /** `--warn` */
  warning: "#f59e0b",
  /** `--err` */
  alert: "#ef4444",
  /** `--yt` */
  youtube: "#dc2626",
  /** `--ytm` */
  youtubeMusic: "#d97706",
} as const;

/** `--r` / `--r2` */
export const radii = {
  sm: 6,
  md: 10,
  pill: 999,
} as const;

/* -------------------------------------------------------------------------- */
/* Typographie                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Noms des familles chargées par `useFonts` dans `app/_layout.tsx`.
 * Ce sont lesequivalent RN des déclarations Google Fonts de l'ancienne version :
 * `?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500`
 */
export const fontFamily = {
  sans: "IBMPlexSans_400Regular",
  sansMedium: "IBMPlexSans_500Medium",
  sansSemiBold: "IBMPlexSans_600SemiBold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

/** Piles de polices de repli, utilisées avant le chargement (ou en cas d'échec). */
export const fontStacks = {
  display: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: fontFamily.sans,
    serif: fontFamily.sans,
    rounded: fontFamily.sans,
    mono: fontFamily.mono,
  },
  default: {
    sans: fontFamily.sans,
    serif: fontFamily.sans,
    rounded: fontFamily.sans,
    mono: fontFamily.mono,
  },
  web: {
    sans: fontStacks.display,
    serif: fontStacks.display,
    rounded: fontStacks.display,
    mono: fontStacks.mono,
  },
});

/* -------------------------------------------------------------------------- */
/* Espacements et mesures                                                      */
/* -------------------------------------------------------------------------- */

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** `body { font-size: 14px }` */
export const FontSize = {
  body: 14,
  small: 12,
  micro: 11,
  title: 15,
  heading: 14,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/* -------------------------------------------------------------------------- */
/* Thème clair / sombre (ex src/constants/theme.ts)                            */
/* -------------------------------------------------------------------------- */

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: colors.text,
    background: colors.background,
    backgroundElement: colors.surface,
    backgroundSelected: colors.surfaceAlt,
    textSecondary: colors.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/* -------------------------------------------------------------------------- */
/* Styles de base — transposition des sélecteurs CSS de l'ancienne version     */
/* -------------------------------------------------------------------------- */

export const globalStyles = StyleSheet.create({
  /** `main.content { flex:1; padding:14px; background:var(--bg0) }` */
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 14,
    fontSize: FontSize.body,
    color: colors.text,
  },

  /** `header h1` */
  title: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: FontSize.title,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: colors.text,
  },

  /** `.card-title` */
  cardTitle: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: FontSize.heading,
    fontWeight: "600",
    color: colors.text,
  },

  /** `.card-header` */
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  /** `.card` */
  card: {
    backgroundColor: colors.header,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
  },

  /** `.btn` */
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

  /** `.btn.primary` */
  btnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  /** `th` */
  tableHeader: {
    fontFamily: fontFamily.sans,
    fontSize: FontSize.micro,
    fontWeight: "500",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  /** `.nav-label` */
  sectionTitle: {
    fontFamily: fontFamily.sans,
    fontSize: FontSize.micro,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: colors.textMuted,
    textTransform: "uppercase",
    paddingTop: 8,
    paddingBottom: 4,
  },

  /** `.empty-state` */
  empty: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 50,
  },

  /** `header { align-items: center; justify-content: space-between }` */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  /** `code` / `.hexrow` */
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: FontSize.micro,
    color: colors.textSecondary,
  },
});