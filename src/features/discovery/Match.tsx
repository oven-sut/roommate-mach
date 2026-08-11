import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Heart } from "lucide-react-native";
import { Avatar } from "../../components/Avatar";
import { ScoreRing } from "../../components/ScoreRing";
import { Button, Txt } from "../../components/ui";
import { useI18n } from "../../i18n";
import { appState } from "../../services/api";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { openChatWith } from "./open-chat";

/**
 * Mutual-like celebration. Shown once, straight after the swipe that created
 * the match, and reads the pair off `appState.activeProfile` so the names and
 * score are the real ones rather than placeholders.
 */
export function Match({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const other = appState.activeProfile;
  const me = appState.profileDraft;

  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      stiffness: 160,
      damping: 14,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  const entrance = {
    opacity: pop,
    transform: [
      { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
    ],
  };

  const fade = {
    opacity: pop,
    transform: [
      {
        translateY: pop.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={[...G.hero]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView
        style={{
          flex: 1,
          paddingHorizontal: GUTTER,
          width: "100%",
          maxWidth: MAX_WIDTH,
          alignSelf: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <Animated.View style={[{ alignItems: "center", gap: 10 }, fade]}>
          <Heart size={38} color={C.amberLight} fill={C.amberLight} />
          <Txt
            style={{
              fontFamily: F.semibold,
              fontSize: 13,
              letterSpacing: 3,
              color: C.amberLight,
            }}
          >
            IT'S A MATCH
          </Txt>
        </Animated.View>

        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            },
            entrance,
          ]}
        >
          <Avatar
            name={me.displayName || "You"}
            uri={me.photos?.[0]}
            size={96}
            ring="rgba(255,255,255,.45)"
          />
          <ScoreRing
            score={other?.score}
            size={64}
            thickness={6}
            style={{ marginHorizontal: -16, zIndex: 2 }}
          />
          <Avatar
            name={other?.displayName}
            uri={other?.profile?.photos?.[0]}
            size={96}
            ring="rgba(255,255,255,.45)"
          />
        </Animated.View>

        <Animated.View style={[{ gap: 12 }, fade]}>
          <Txt
            style={{
              fontFamily: F.bold,
              fontSize: 34,
              lineHeight: 44,
              textAlign: "center",
              color: C.white,
            }}
          >
            {me.displayName?.split(" ")[0] || "You"} ×{" "}
            {other?.displayName?.split(" ")[0] || "—"}
          </Txt>
          <Txt
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,.82)",
              fontFamily: F.regular,
              fontSize: 15,
              lineHeight: 23,
            }}
          >
            {t("likeBackNote")}
          </Txt>
        </Animated.View>

        <Animated.View style={[{ gap: 12, marginTop: 12 }, fade]}>
          <Button
            onPress={() =>
              openChatWith(
                {
                  userId: other?.id,
                  name: other?.displayName,
                  conversationId: other?.conversationId,
                },
                go,
              )
            }
          >
            {`${t("messagePrefix")} ${other?.displayName?.split(" ")[0] ?? ""}`.trim()}
          </Button>
          <Button tone="outline" onPress={() => go("feed")}>
            {t("discover")}
          </Button>
        </Animated.View>

        <View style={s.spacer} />
      </SafeAreaView>
    </LinearGradient>
  );
}
