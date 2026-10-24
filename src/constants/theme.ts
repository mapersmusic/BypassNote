/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 *
 * La définition du thème vit désormais dans `@/styles/global` (fusion de
 * l'ancien `global.css`, des tokens CSS de la version web et de ce fichier).
 * Ce module n'est conservé que pour la compatibilité des imports existants
 * (`@/constants/theme`).
 */

export {
  BottomTabInset,
  Colors,
  FontSize,
  Fonts,
  MaxContentWidth,
  Spacing,
  colors,
  fontFamily,
  fontStacks,
  globalStyles,
  radii,
} from '@/styles/global';

export type { ThemeColor } from '@/styles/global';