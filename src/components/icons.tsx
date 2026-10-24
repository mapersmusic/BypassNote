import Svg, { Path, type SvgProps } from "react-native-svg";

/**
 * Icônes de l'interface, rendues localement via `react-native-svg`.
 *
 * On n'utilise volontairement pas `@tabler/icons-react-native` : son point
 * d'entrée réexporte les ~6 200 icônes du paquet, ce qui fait échouer le build
 * dès qu'un seul fichier est absent de `node_modules`. Les tracés ci-dessous
 * proviennent des icônes Tabler (MIT) et rendent à l'identique.
 *
 * Icônes utilisées : music-bolt, menu-2, x, terminal-2, upload, shape, download,
 * bolt, music, wave-sine, microphone, link, tags.
 */

type IconNode = { d: string };

const STROKE_WIDTH = 2;

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function makeIcon(paths: IconNode[], displayName: string) {
  function Icon({
    size = 24,
    color = "currentColor",
    strokeWidth = STROKE_WIDTH,
    ...rest
  }: IconProps & Omit<SvgProps, "color">) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {paths.map(({ d }) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
    );
  }

  Icon.displayName = displayName;
  return Icon;
}

/** `ti ti-music-bolt` — logo de l'application. */
export const IconMusicBolt = makeIcon(
  [
    { d: "M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" },
    { d: "M9 17v-13h10v8" },
    { d: "M9 8h10" },
    { d: "M19 16l-2 3h4l-2 3" },
  ],
  "IconMusicBolt",
);

/** `ti ti-menu-2` — bascule du menu (petits écrans). */
export const IconMenu2 = makeIcon(
  [{ d: "M4 6l16 0" }, { d: "M4 12l16 0" }, { d: "M4 18l16 0" }],
  "IconMenu2",
);

/** `ti ti-x` — fermeture du menu. */
export const IconX = makeIcon([{ d: "M18 6l-12 12" }, { d: "M6 6l12 12" }], "IconX");

/** `ti ti-terminal-2` — action « Hex ». */
export const IconTerminal2 = makeIcon(
  [
    { d: "M8 9l3 3l-3 3" },
    { d: "M13 15l3 0" },
    { d: "M3 6a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -12" },
  ],
  "IconTerminal2",
);

/** `ti ti-upload` — action « Importer .bpnote ». */
export const IconUpload = makeIcon(
  [
    { d: "M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" },
    { d: "M7 9l5 -5l5 5" },
    { d: "M12 4l0 12" },
  ],
  "IconUpload",
);

/** `ti ti-shape` — action « Modules ». */
export const IconShape = makeIcon(
  [
    { d: "M3 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    { d: "M17 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    { d: "M3 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    { d: "M17 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    { d: "M5 7l0 10" },
    { d: "M7 5l10 0" },
    { d: "M7 19l10 0" },
    { d: "M19 7l0 10" },
  ],
  "IconShape",
);

/** `ti ti-download` — action « Exporter .bpnote ». */
export const IconDownload = makeIcon(
  [
    { d: "M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" },
    { d: "M7 11l5 5l5 -5" },
    { d: "M12 4l0 12" },
  ],
  "IconDownload",
);

/** Icône de remplacement, à utiliser dans un set d'actions personnalisées. */
export const IconCircle = makeIcon(
  [{ d: "M19 12a7 7 0 1 0 -14 0a7 7 0 0 0 14 0" }],
  "IconCircle",
);

/* -------------------------------------------------------------------------- */
/* Icônes de l'éditeur                                                          */
/* -------------------------------------------------------------------------- */

/** `ti ti-plus` */
export const IconPlus = makeIcon(
  [{ d: "M12 5l0 14" }, { d: "M5 12l14 0" }],
  "IconPlus",
);

/** `ti ti-pencil` */
export const IconPencil = makeIcon(
  [
    { d: "M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" },
    { d: "M13.5 6.5l4 4" },
  ],
  "IconPencil",
);

/** `ti ti-trash` */
export const IconTrash = makeIcon(
  [
    { d: "M4 7l16 0" },
    { d: "M10 11l0 6" },
    { d: "M14 11l0 6" },
    { d: "M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" },
    { d: "M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" },
  ],
  "IconTrash",
);

/** `ti ti-search` */
export const IconSearch = makeIcon(
  [{ d: "M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" }, { d: "M21 21l-6 -6" }],
  "IconSearch",
);

/** `ti ti-device-floppy` */
export const IconFloppy = makeIcon(
  [
    { d: "M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" },
    { d: "M10 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    { d: "M14 4l0 4l-6 0l0 -4" },
  ],
  "IconFloppy",
);

/** `ti ti-external-link` */
export const IconExternalLink = makeIcon(
  [
    { d: "M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" },
    { d: "M11 13l9 -9" },
    { d: "M15 4h5v5" },
  ],
  "IconExternalLink",
);

/** `ti ti-bolt` — Tricks */
export const IconBolt = makeIcon(
  [{ d: "M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" }],
  "IconBolt",
);

/** `ti ti-music` — Genres */
export const IconMusic = makeIcon(
  [
    { d: "M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" },
    { d: "M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" },
    { d: "M9 17v-13h10v13" },
    { d: "M9 8h10" },
  ],
  "IconMusic",
);

/** `ti ti-wave-sine` — Parties */
export const IconWaveSine = makeIcon(
  [
    {
      d: "M21 12h-2c-.894 0 -1.662 -.857 -1.761 -2c-.296 -3.45 -.749 -6 -2.749 -6s-2.5 3.582 -2.5 8s-.5 8 -2.5 8s-2.452 -2.547 -2.749 -6c-.1 -1.147 -.867 -2 -1.763 -2h-2",
    },
  ],
  "IconWaveSine",
);

/** `ti ti-microphone` — Artistes */
export const IconMicrophone = makeIcon(
  [
    { d: "M9 5a3 3 0 0 1 3 -3a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3a3 3 0 0 1 -3 -3l0 -5" },
    { d: "M5 10a7 7 0 0 0 14 0" },
    { d: "M8 21l8 0" },
    { d: "M12 17l0 4" },
  ],
  "IconMicrophone",
);

/** `ti ti-link` — Sources */
export const IconLink = makeIcon(
  [
    { d: "M9 15l6 -6" },
    { d: "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" },
    { d: "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" },
  ],
  "IconLink",
);

/** `ti ti-tags` — Métadonnées */
export const IconTags = makeIcon(
  [
    {
      d: "M3 8v4.172a2 2 0 0 0 .586 1.414l5.71 5.71a2.41 2.41 0 0 0 3.408 0l3.592 -3.592a2.41 2.41 0 0 0 0 -3.408l-5.71 -5.71a2.41 2.41 0 0 0 -1.414 -.586h-4.172a2 2 0 0 0 -2 2",
    },
    { d: "M18 19l1.592 -1.592a4.82 4.82 0 0 0 0 -6.816l-4.592 -4.592" },
    { d: "M7 10h-.01" },
  ],
  "IconTags",
);