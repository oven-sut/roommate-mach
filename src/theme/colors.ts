/**
 * Palette sampled from the product design board (`image.png`).
 *
 * The app reads as warm paper with a crimson/amber accent: cream surfaces,
 * dark-brown text, and gradients that run from wine through ember to amber.
 */
export const C = {
  /** Page background — warm off-white, never pure #FFF. */
  bg: "#FFFCF9",
  /** Raised surfaces (cards, inputs, sheets). */
  card: "#FFFFFF",
  /** Slightly warmer card used for informational notes. */
  cardWarm: "#FBF5E9",

  /** Primary text: dark warm brown. */
  ink: "#3E2E22",
  /** Headings on the welcome slides only — the design uses navy there. */
  inkNavy: "#282B4A",
  /** Secondary text. */
  muted: "#8C7B6B",
  /** Tertiary text, placeholders, inactive labels. */
  faint: "#B6A695",
  /** Hairline borders and dividers. */
  line: "#EDE3D8",
  /** Slightly stronger border for inputs at rest. */
  lineStrong: "#E4D6C6",

  /** Primary action colour (buttons, active links). */
  primary: "#B53C3C",
  primaryDark: "#8E2B2E",
  primaryPressed: "#9E3232",

  /** Deep wine used for the splash top and match hero. */
  wine: "#7A1B32",
  wineDeep: "#6B1A2E",
  /** Ember red that the splash gradient resolves into. */
  ember: "#C3422A",

  /** Amber accent: progress fills, score rings, the like button. */
  amber: "#F5A623",
  amberLight: "#FFD16E",
  amberDeep: "#E8862F",
  orange: "#E8712F",

  /** Tinted pink used by selected chips and the lifestyle signature. */
  pink: "#FBE3E1",
  pinkBorder: "#E9A9A2",
  pinkDeep: "#F7D3D0",

  /** Segmented-control track — a cool grey that offsets the warm page. */
  segment: "#E8EBEF",

  green: "#2E9E5B",
  greenSoft: "#E8F6EC",
  /** Utility blue for the OTP send/submit buttons. */
  blue: "#4A6FA5",

  white: "#FFFFFF",
} as const;

/** Multi-stop gradients, kept here so screens stay declarative. */
export const G = {
  /** Splash / auth-choice full-bleed background. */
  splash: ["#6B1A2E", "#8E2331", "#C3422A"] as const,
  /** Discover card and the summary profile card. */
  card: ["#DF7C6D", "#C4503F", "#B53C3C"] as const,
  /** Match-profile hero banner. */
  hero: ["#AC3750", "#8E2340"] as const,
  /** Progress bars, the like FAB, score rings. */
  amber: ["#E8712F", "#FFC93C"] as const,
  /** Circular avatars without a photo. */
  avatar: ["#F5A623", "#E8862F"] as const,
  /** Primary buttons keep a subtle vertical sheen. */
  primary: ["#C0473F", "#AE3739"] as const,
  /** App icon tile. */
  logo: ["#9E2430", "#B93C2E"] as const,
} as const;
