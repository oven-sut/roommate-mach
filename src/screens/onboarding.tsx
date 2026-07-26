import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo, MotionPressable, ScreenShell } from "../components/ui";
import { useI18n } from "../i18n";
import { s } from "../theme/styles";
import type { Language } from "../i18n";
import type { Screen } from "../types/navigation";

const next: Partial<Record<Screen, Screen>> = {
  splash: "welcome1",
  welcome1: "welcome2",
  welcome2: "welcome3",
  welcome3: "authChoice",
  signup: "verify",
  verify: "basics",
  basics: "housing",
  housing: "intro",
  intro: "q1",
  q1: "q2",
  q2: "q3",
  q3: "q4",
  q4: "q5",
  q5: "q6",
  q6: "summary",
  summary: "feed",
};

const onboarding: {
  screen: Screen;
  title: Record<Language, string>;
  sub: Record<Language, string>;
  art: string;
}[] = [
  {
    screen: "welcome1",
    title: {
      en: "Build your lifestyle profile",
      th: "สร้างโปรไฟล์ไลฟ์สไตล์",
    },
    sub: {
      en: "Answer a fun questionnaire about sleep, cleanliness, guests, and study habits.",
      th: "ตอบแบบสอบถามเรื่องการนอน ความสะอาด แขก และนิสัยการเรียน",
    },
    art: "Ploy, 19\nFood Technology\nNight Owl   Spotless",
  },
  {
    screen: "welcome2",
    title: {
      en: "Get high-compatibility matches",
      th: "จับคู่กับคนที่เข้ากันได้",
    },
    sub: {
      en: "Our score compares 20+ lifestyle signals so you meet people who fit how you live.",
      th: "ระบบเทียบพฤติกรรมกว่า 20 จุด เพื่อแนะนำรูมเมทที่เหมาะกับคุณ",
    },
    art: "88%",
  },
  {
    screen: "welcome3",
    title: {
      en: "Connect & chat safely",
      th: "คุยกันได้อย่างปลอดภัย",
    },
    sub: {
      en: "Every account is verified with an SUT student ID before anyone can chat.",
      th: "ทุกบัญชีต้องยืนยันด้วยบัตรนักศึกษา SUT ก่อนเริ่มแชท",
    },
    art: "Hi! Saw we're 92%\n\nDorm 17? Let's talk!",
  },
];

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
  const d = onboarding.find((x) => x.screen === screen)!;

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
          <Pressable
            onPress={() => go("authChoice")}
            style={choice.skipButton}
          >
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

export function AuthChoice({ go }: { go: (x: Screen) => void }) {
  const { width, height } = useWindowDimensions();
  const { t } = useI18n();
  const compact = width < 370 || height < 720;

  return (
    <LinearGradient
      colors={["#70152E", "#8D1E32", "#B82F2D", "#D74825"]}
      locations={[0, 0.38, 0.7, 1]}
      start={{ x: 0.16, y: 0 }}
      end={{ x: 0.84, y: 1 }}
      style={choice.page}
    >
      <SafeAreaView style={choice.safe}>
        <View style={[choice.content, compact && choice.contentCompact]}>
          <Logo />
          <View style={[choice.actions, compact && choice.actionsCompact]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => go("login")}
              style={({ pressed }) => [
                choice.button,
                compact && choice.buttonCompact,
                pressed && choice.buttonPressed,
              ]}
            >
              <Text style={choice.buttonText}>{t("login")}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => go("signup")}
              style={({ pressed }) => [
                choice.button,
                compact && choice.buttonCompact,
                pressed && choice.buttonPressed,
              ]}
            >
              <Text style={choice.buttonText}>{t("register")}</Text>
            </Pressable>
          </View>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={choice.university}
        >
          SURANAREE UNIVERSITY OF TECHNOLOGY
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const choice = StyleSheet.create({
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
