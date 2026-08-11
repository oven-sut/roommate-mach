import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, House, MessageCircle, User } from "lucide-react-native";
import { C } from "../theme/colors";
import { MAX_WIDTH, NAV_HEIGHT, s } from "../theme/styles";
import { F } from "../theme/typography";
import type { Screen } from "../types/navigation";
import { MotionPressable } from "./ui";

export type Tab = "feed" | "matches" | "messages" | "myprofile";

const TABS: { key: Tab; label: string; Icon: typeof House }[] = [
  { key: "feed", label: "Home", Icon: House },
  { key: "matches", label: "Match", Icon: Heart },
  { key: "messages", label: "Message", Icon: MessageCircle },
  { key: "myprofile", label: "Profile", Icon: User },
];

/**
 * The four-tab bar pinned to the bottom of the main app screens.
 * Rendered as a sibling of the screen body, so it floats over content.
 */
export function BottomNav({
  active,
  go,
}: {
  active: Tab;
  go: (screen: Screen) => void;
}) {
  return (
    <SafeAreaView edges={["bottom"]} style={s.nav}>
      {/* `flex: 1` so the row fills the bar; capped and centred so the tabs
          line up with the content column on tablet and web widths. */}
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: MAX_WIDTH,
          alignSelf: "center",
          flexDirection: "row",
          height: NAV_HEIGHT,
          paddingTop: 10,
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <MotionPressable
              key={key}
              onPress={() => go(key)}
              pressedScale={0.9}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              style={{ flex: 1, alignItems: "center", gap: 5 }}
            >
              <Icon
                size={25}
                color={on ? C.primary : C.muted}
                strokeWidth={on ? 2.3 : 1.8}
              />
              <Text
                style={{
                  fontFamily: on ? F.bold : F.regular,
                  fontSize: 12,
                  color: on ? C.primary : C.muted,
                }}
              >
                {label}
              </Text>
            </MotionPressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
