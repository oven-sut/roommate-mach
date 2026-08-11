import { StyleSheet } from "react-native";

/** Shared by the welcome carousel and the login/register choice screen. */
export const choice = StyleSheet.create({
  page: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  contentCompact: { paddingVertical: 12 },
  actions: {
    width: "100%",
    gap: 34,
    marginTop: 58,
  },
  actionsCompact: { gap: 20, marginTop: 28 },
  button: {
    height: 64,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 244, 232, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.42)",
  },
  buttonCompact: { height: 54 },
  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: "#70152E",
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 16,
  },
  university: {
    width: "100%",
    maxWidth: 430,
    marginBottom: 20,
    textAlign: "center",
    color: "#FFF1D6",
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  welcomeActions: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionSide: {
    flex: 1,
    alignItems: "flex-start",
  },
  actionCenter: {
    width: 154,
    alignItems: "center",
  },
  skipButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingRight: 12,
  },
  welcomeNextButton: {
    width: 154,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F65A2E",
    shadowColor: "#4A252B",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  welcomeNextText: {
    color: "#3A2522",
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 14,
  },
});
