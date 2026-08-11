import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Brush, Heart, Thermometer, Moon, Users } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { Button, ScreenShell, Txt } from "../../components/ui";
import { C, G } from "../../theme/colors";
import { s, shadow } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

const CATEGORIES = [
  { key: "catSleep", Icon: Moon },
  { key: "catClean", Icon: Brush },
  { key: "catGuests", Icon: Users },
  { key: "catTemp", Icon: Thermometer },
] as const;

/** Outlined pill listing one of the four categories the questionnaire covers. */
function CategoryPill({
  label,
  Icon,
}: {
  label: string;
  Icon: (typeof CATEGORIES)[number]["Icon"];
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.line,
        backgroundColor: C.card,
      }}
    >
      <Icon size={17} color={C.muted} strokeWidth={1.8} />
      <Txt role="body" style={{ fontSize: 14 }}>
        {label}
      </Txt>
    </View>
  );
}

/** Explains what the questionnaire is for before the first question. */
export function Intro({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();

  return (
    <ScreenShell extraBottom={30}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
        <LinearGradient
          colors={[...G.logo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              width: 84,
              height: 84,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            },
            shadow(2),
          ]}
        >
          <Heart size={40} color="#F6E0B8" strokeWidth={1.8} />
        </LinearGradient>

        <Txt role="h1" style={{ textAlign: "center" }}>
          {t("introTitle")}
        </Txt>
        <Txt role="subtitle" style={{ textAlign: "center" }}>
          {t("introSub")}
        </Txt>

        <View
          style={[
            s.wrap,
            { justifyContent: "center", marginTop: 12, rowGap: 12 },
          ]}
        >
          {CATEGORIES.map(({ key, Icon }) => (
            <CategoryPill key={key} label={t(key)} Icon={Icon} />
          ))}
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <Button onPress={() => go("q1")}>{t("continue")}</Button>
        <Txt role="small" style={{ textAlign: "center" }}>
          {t("retakeAnytime")}
        </Txt>
      </View>
    </ScreenShell>
  );
}
