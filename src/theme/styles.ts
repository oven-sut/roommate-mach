import { Platform, StyleSheet } from "react-native";
import { C } from "./colors";
import { F } from "./typography";

/** Horizontal gutter used by every screen body. */
export const GUTTER = 22;
/** Phone-width cap so the layout stays readable on tablets and web. */
export const MAX_WIDTH = 440;
/** Height reserved for the bottom tab bar. */
export const NAV_HEIGHT = 76;

/**
 * A soft, warm drop shadow. Elevation and shadow props diverge between
 * platforms, so this returns whichever the current one honours.
 */
export function shadow(level: 1 | 2 | 3 = 1) {
  const config = {
    1: { radius: 8, opacity: 0.05, offset: 2, elevation: 1 },
    2: { radius: 16, opacity: 0.08, offset: 6, elevation: 4 },
    3: { radius: 28, opacity: 0.14, offset: 12, elevation: 10 },
  }[level];

  return Platform.select({
    android: { elevation: config.elevation },
    default: {
      shadowColor: "#4A2A1C",
      shadowOpacity: config.opacity,
      shadowRadius: config.radius,
      shadowOffset: { width: 0, height: config.offset },
    },
  });
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  /** Scroll container for a standard screen body. */
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    gap: 16,
  },

  /* ---- layout helpers ---- */
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /** `alignItems` matters here: without it wrapped pills stretch to row height. */
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  center: { alignItems: "center", justifyContent: "center" },
  grow: { flex: 1 },
  /** Pushes whatever follows to the bottom of a flex column. */
  spacer: { flex: 1, minHeight: 12 },

  /* ---- surfaces ---- */
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    padding: 18,
    gap: 12,
    ...shadow(1),
  },
  /** Card used for hints and weighting notes — warm, borderless. */
  noteCard: {
    backgroundColor: C.cardWarm,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  /** Pink variant of the note card, used for lifestyle-tag callouts. */
  noteCardPink: {
    backgroundColor: C.pink,
    borderWidth: 1,
    borderColor: C.pinkBorder,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  divider: { height: 1, backgroundColor: C.line },

  /* ---- header ---- */
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /** Square 44pt button used for back arrows and header icons. */
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Rounded app-icon tile that sits beside in-app screen titles. */
  logoTile: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },

  /* ---- forms ---- */
  field: { gap: 8 },
  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.lineStrong,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.ink,
  },
  inputFocused: { borderColor: C.primary },
  inputMultiline: {
    height: 104,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  /* ---- progress ---- */
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E7E1DA",
    overflow: "hidden",
  },

  /**
   * Absolute-positioned bottom tab bar. Stays a column so the tab row inside
   * can centre itself horizontally on wide viewports.
   */
  nav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
});
