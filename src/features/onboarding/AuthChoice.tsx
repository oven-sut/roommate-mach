import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo } from "../../components/ui";
import { useI18n } from "../../i18n";
import type { Screen } from "../../types/navigation";
import { choice } from "./onboarding.styles";

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
        <Text numberOfLines={1} adjustsFontSizeToFit style={choice.university}>
          SURANAREE UNIVERSITY OF TECHNOLOGY
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}
