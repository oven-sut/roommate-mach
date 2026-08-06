import { Platform, StyleSheet } from "react-native";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

/** Shared by the settings screen and the two list screens it links to. */
export const settingStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  backChevron: {
    fontSize: 18,
    color: "#463826",
    fontWeight: "bold",
  },
  headerTitle: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: "bold",
    color: "#463826",
  },
  sectionCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8E1",
  },
  rowTitle: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "600",
    color: "#463826",
  },
  rowSub: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
    marginTop: 2,
  },
  logoutBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutBtnText: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  blockAction: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#C64338",
  },
  unblockAction: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#2F9142",
  },
});
