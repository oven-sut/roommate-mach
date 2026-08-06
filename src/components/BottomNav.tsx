import { Heart, MessageCircle, Search, User } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "../i18n";
import type { Screen } from "../types/navigation";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

/** Tabs, in display order. `id` doubles as the screen to navigate to. */
const NAV_ITEMS = [
  { id: "feed", Icon: Search, label: { th: "ค้นหา", en: "Discover" } },
  { id: "matches", Icon: Heart, label: { th: "คู่แมตช์", en: "Matches" } },
  {
    id: "messages",
    Icon: MessageCircle,
    label: { th: "ข้อความ", en: "Messages" },
  },
  { id: "myprofile", Icon: User, label: { th: "โปรไฟล์", en: "Profile" } },
] as const;

/** Icons that read better filled when their tab is active. */
const FILLED_WHEN_ACTIVE: string[] = ["matches", "myprofile"];

/**
 * The persistent tab bar. Shared by discovery, matches, messages and profile,
 * which is why it lives here rather than inside any one feature.
 */
export function BottomNav({
  screen,
  go,
}: {
  screen: Screen;
  go: (x: Screen) => void;
}) {
  const { language } = useI18n();
  const locale = language === "th" ? "th" : "en";

  return (
    <View style={styles.navContainer}>
      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const isActive = screen === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={label[locale]}
            style={styles.navItem}
            onPress={() => go(id as Screen)}
          >
            <Icon
              size={22}
              color={isActive ? "#C64338" : "#8D7C75"}
              fill={
                isActive && FILLED_WHEN_ACTIVE.includes(id) ? "#C64338" : "none"
              }
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {label[locale]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: "row",
    height: 64,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EADCD3",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  navText: {
    fontFamily: serifFont,
    fontSize: 11,
    color: "#8D7C75",
    fontWeight: "500",
    marginTop: 3,
  },
  navTextActive: {
    color: "#C64338",
    fontWeight: "bold",
  },
});
