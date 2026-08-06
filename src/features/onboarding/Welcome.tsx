import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { MotionPressable, ScreenShell } from "../../components/ui";
import { useI18n } from "../../i18n";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";
import { next, onboardingSlides } from "./onboarding.content";
import { choice } from "./onboarding.styles";

export function Welcome({
  screen,
  go,
}: {
  screen: Screen;
  go: (x: Screen) => void;
}) {
  const { height } = useWindowDimensions();
  const { language, t } = useI18n();
  const artHeight = Math.max(260, Math.min(410, height * 0.46));
  const d = onboardingSlides.find((x) => x.screen === screen)!;

  return (
    <ScreenShell bottom={false}>
      <View style={[s.welcomeArt, { height: artHeight }]}>
        <Text style={screen === "welcome2" ? s.scoreArt : s.artText}>
          {d.art}
        </Text>
      </View>
      <Text style={s.bigTitle}>{d.title[language]}</Text>
      <Text style={s.centerMuted}>{d.sub[language]}</Text>
      <View style={s.dots}>
        <View style={[s.dot, screen === "welcome1" && s.dotOn]} />
        <View style={[s.dot, screen === "welcome2" && s.dotOn]} />
        <View style={[s.dot, screen === "welcome3" && s.dotOn]} />
      </View>
      <View style={choice.welcomeActions}>
        <View style={choice.actionSide}>
          <Pressable onPress={() => go("authChoice")} style={choice.skipButton}>
            <Text style={s.muted}>{t("skip")}</Text>
          </Pressable>
        </View>
        <View style={choice.actionCenter}>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => go(next[screen]!)}
            pressedScale={0.96}
            style={choice.welcomeNextButton}
          >
            <Text style={choice.welcomeNextText}>
              {screen === "welcome3" ? t("getStarted") : t("next")}
            </Text>
          </MotionPressable>
        </View>
        <View style={choice.actionSide} />
      </View>
    </ScreenShell>
  );
}
