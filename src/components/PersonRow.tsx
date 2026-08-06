import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

/**
 * A person in a list with one call-to-action, used by the matches and likes
 * screens.
 *
 * `p` is positional: `[name, secondary line, tertiary line]`.
 */
export function PersonRow({
  p,
  action,
  onPress,
}: {
  p: string[];
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.avatarBox}>
        <Text style={styles.avatarLetter}>
          {p[0]?.[0]?.toUpperCase() ?? "R"}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nameText}>
          {p[0]} · {p[1]}
        </Text>
        <Text style={styles.subText}>{p[2]}</Text>
      </View>
      <Pressable style={styles.actionBtn} onPress={onPress}>
        <Text style={styles.actionBtnText}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF6F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarLetter: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: "bold",
    color: "#7F232D",
  },
  nameText: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
  },
  subText: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
  },
  actionBtn: {
    backgroundColor: "#C64338",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
