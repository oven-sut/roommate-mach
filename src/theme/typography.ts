import type { TextStyle } from "react-native";
import { C } from "./colors";

/**
 * The design sets every string in a serif. Noto Serif Thai carries both the
 * Thai and Latin glyphs, so one family keeps the two languages visually
 * identical instead of switching typefaces mid-sentence.
 */
export const F = {
  regular: "NotoSerifThai_400Regular",
  medium: "NotoSerifThai_500Medium",
  semibold: "NotoSerifThai_600SemiBold",
  bold: "NotoSerifThai_700Bold",
  black: "NotoSerifThai_800ExtraBold",
} as const;

/** Every font used at startup — kept in one place for `useFonts`. */
export const FONT_WEIGHTS = [
  F.regular,
  F.medium,
  F.semibold,
  F.bold,
  F.black,
] as const;

type Scale = Record<string, TextStyle>;

/**
 * Named text roles. Screens compose these rather than re-deriving sizes, which
 * is what keeps headings the same weight across twenty-plus screens.
 */
export const T: Scale = {
  /** Splash / auth-choice brand lockup. */
  brand: {
    fontFamily: F.bold,
    fontSize: 30,
    lineHeight: 42,
    textAlign: "center",
    color: C.white,
  },
  /** Screen titles: "About you", "Cleanliness", "Discover". */
  h1: { fontFamily: F.bold, fontSize: 26, lineHeight: 34, color: C.ink },
  /** Onboarding slide headlines — navy, centred. */
  slide: {
    fontFamily: F.bold,
    fontSize: 24,
    lineHeight: 33,
    textAlign: "center",
    color: C.inkNavy,
  },
  /** Card titles and section headings. */
  h2: { fontFamily: F.bold, fontSize: 19, lineHeight: 26, color: C.ink },
  h3: { fontFamily: F.bold, fontSize: 16, lineHeight: 23, color: C.ink },

  /** Body copy. */
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 23, color: C.ink },
  bodyMuted: {
    fontFamily: F.regular,
    fontSize: 15,
    lineHeight: 23,
    color: C.muted,
  },
  /** The sentence under a screen title. */
  subtitle: {
    fontFamily: F.regular,
    fontSize: 15,
    lineHeight: 22,
    color: C.muted,
  },
  small: { fontFamily: F.regular, fontSize: 13, lineHeight: 20, color: C.muted },
  tiny: { fontFamily: F.regular, fontSize: 11, lineHeight: 16, color: C.faint },

  /** Form labels sit above their input in semibold muted brown. */
  label: { fontFamily: F.semibold, fontSize: 14, color: C.muted },
  /** All-caps section labels ("SHOW ME", "ACCOUNT"). */
  eyebrow: {
    fontFamily: F.semibold,
    fontSize: 12,
    letterSpacing: 1.1,
    color: C.muted,
    textTransform: "uppercase",
  },

  button: { fontFamily: F.bold, fontSize: 16, color: C.white },
  link: { fontFamily: F.bold, fontSize: 14, color: C.primary },
  /** Numbers that need to read as data (scores, counters). */
  value: { fontFamily: F.bold, fontSize: 15, color: C.ink },
};
