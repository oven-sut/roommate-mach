import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { Dots } from "../../components/SlideAction";
import { ScoreRing } from "../../components/ScoreRing";
import { Button, MotionPressable, Tag, Txt } from "../../components/ui";
import { C } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { next, onboardingSlides, type SlideArt } from "./onboarding.content";

/** Miniature match card that floats over slide 1's illustration. */
function ProfileCardArt() {
  return (
    <View
      style={[
        {
          backgroundColor: C.card,
          borderRadius: 14,
          padding: 14,
          gap: 10,
          width: "82%",
          transform: [{ rotate: "-4deg" }],
        },
        shadow(2),
      ]}
    >
      <View style={[s.row, { gap: 12 }]}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: C.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt style={{ color: C.white, fontFamily: F.bold, fontSize: 17 }}>P</Txt>
        </View>
        <View>
          <Txt role="h3">Pim, 21</Txt>
          <Txt role="small">Food Technology</Txt>
        </View>
      </View>
      <View style={[s.row, { gap: 8 }]}>
        <Tag tone="pink">Night Owl</Tag>
        <Tag tone="outline">Spotless</Tag>
      </View>
    </View>
  );
}

/** Two chat bubbles for slide 3. */
function ChatArt() {
  return (
    <View style={{ width: "84%", gap: 14 }}>
      <View
        style={[
          {
            alignSelf: "flex-start",
            backgroundColor: C.card,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            transform: [{ rotate: "-4deg" }],
          },
          shadow(2),
        ]}
      >
        <Txt role="body">Hi! Saw we're 92% 😎</Txt>
      </View>
      <View
        style={[
          {
            alignSelf: "flex-end",
            backgroundColor: C.amber,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            transform: [{ rotate: "3deg" }],
          },
          shadow(2),
        ]}
      >
        <Txt role="body" style={{ color: C.white }}>
          Dorm 11? Let's talk!
        </Txt>
      </View>
    </View>
  );
}

function Art({ kind }: { kind: SlideArt }) {
  if (kind === "profileCard") return <ProfileCardArt />;
  if (kind === "chat") return <ChatArt />;
  return <ScoreRing score={80} size={112} thickness={12} textColor={C.ink} />;
}

/**
 * The three-slide value proposition carousel. Each slide is its own screen in
 * the router, so the back gesture walks the deck rather than exiting it.
 */
export function Welcome({
  screen,
  go,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
}) {
  const { t } = useI18n();
  const index = Math.max(
    0,
    onboardingSlides.findIndex((slide) => slide.screen === screen),
  );
  const slide = onboardingSlides[index];
  const isLast = index === onboardingSlides.length - 1;

  return (
    <SafeAreaView style={s.safe}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: MAX_WIDTH,
          alignSelf: "center",
          paddingHorizontal: GUTTER,
          paddingTop: 10,
          paddingBottom: 20,
        }}
      >
        <LinearGradient
          colors={[...slide.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Art kind={slide.art} />
        </LinearGradient>

        <View style={{ paddingTop: 28, gap: 14 }}>
          <Txt role="slide">{t(slide.titleKey)}</Txt>
          <Txt role="subtitle" style={{ textAlign: "center" }}>
            {t(slide.subKey)}
          </Txt>
          <Dots index={index} total={onboardingSlides.length} />
        </View>

        {isLast ? (
          <Button
            style={{ marginTop: 28 }}
            onPress={() => go(next[slide.screen] ?? "authChoice")}
          >
            {t("getStart")}
          </Button>
        ) : (
          <View style={[s.rowBetween, { marginTop: 28 }]}>
            <MotionPressable onPress={() => go("authChoice")} hitSlop={12}>
              <Txt role="body" style={{ color: C.muted }}>
                {t("skip")}
              </Txt>
            </MotionPressable>
            <Button
              style={{ width: 118, height: 50 }}
              onPress={() => go(next[slide.screen] ?? "authChoice")}
            >
              {t("next")}
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
