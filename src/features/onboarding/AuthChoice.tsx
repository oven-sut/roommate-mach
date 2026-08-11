import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useI18n } from "../../i18n";
import { HouseMark, MotionPressable, Txt } from "../../components/ui";
import { G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";

/** Frosted button used for both actions on the gradient backdrop. */
function GlassButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      onPress={onPress}
      style={{
        height: 60,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,.22)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,.28)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt style={{ color: "#FFF6EE", fontFamily: F.bold, fontSize: 17 }}>
        {label}
      </Txt>
    </MotionPressable>
  );
}

/** Login / Register fork shown once the welcome deck is done. */
export function AuthChoice({ go }: { go: (screen: Screen) => void }) {
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={[...G.splash]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
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
        }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={[
              {
                width: 96,
                height: 96,
                borderRadius: 30,
                backgroundColor: "rgba(255,255,255,.14)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,.24)",
                alignItems: "center",
                justifyContent: "center",
              },
              shadow(2),
            ]}
          >
            <HouseMark size={50} />
          </View>
          <Txt role="brand" style={{ marginTop: 30 }}>
            {t("appName")}
          </Txt>
        </View>

        <View style={{ gap: 18 }}>
          <GlassButton label={t("login")} onPress={() => go("login")} />
          <GlassButton label={t("register")} onPress={() => go("signup")} />
        </View>

        <Txt
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,.62)",
            fontFamily: F.semibold,
            fontSize: 10,
            letterSpacing: 1.6,
            marginTop: 40,
            marginBottom: 26,
          }}
        >
          {t("university").toUpperCase()}
        </Txt>
      </SafeAreaView>
    </LinearGradient>
  );
}
