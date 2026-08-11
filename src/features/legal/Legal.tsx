import { View } from "react-native";
import { Chevron, MotionPressable, ScreenShell, Txt } from "../../components/ui";
import { useI18n } from "../../i18n";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";
import { legalCopy, type LegalScreen } from "./legal.content";

/** Terms of service and privacy policy, reached from the sign-up checkbox. */
export function Legal({
  screen,
  go,
}: {
  screen: LegalScreen;
  go: (screen: Screen) => void;
}) {
  const { language, t } = useI18n();
  const copy = legalCopy[screen];

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("signup")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1" style={{ fontSize: 22, flex: 1 }}>
          {t(copy.title)}
        </Txt>
      </View>

      <Txt role="small">{t(copy.updated)}</Txt>
      <Txt role="bodyMuted">{t("legalIntro")}</Txt>

      {copy.sections.map((section) => (
        <View key={section.heading.en} style={s.card}>
          <Txt role="h3">{section.heading[language]}</Txt>
          <Txt role="small" style={{ lineHeight: 21 }}>
            {section.body[language]}
          </Txt>
        </View>
      ))}
    </ScreenShell>
  );
}
