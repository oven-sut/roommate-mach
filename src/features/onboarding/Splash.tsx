import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useI18n } from "../../i18n";
import { SlideAction } from "../../components/SlideAction";
import { HouseMark, Txt } from "../../components/ui";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";

/**
 * First-run screen: full-bleed wine-to-ember gradient with the brand lockup and
 * a swipe control at the bottom. The swipe (rather than a button) is the design's
 * way of making entering the app feel like opening a door.
 */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useI18n();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  const lift = {
    opacity: rise,
    transform: [
      {
        translateY: rise.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

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
          <Animated.View style={[{ alignItems: "center" }, lift]}>
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
            <Txt
              role="body"
              style={{
                color: "rgba(255,255,255,.82)",
                marginTop: 14,
                textAlign: "center",
              }}
            >
              {t("tagline")}
            </Txt>
          </Animated.View>
        </View>

        <Animated.View style={[{ gap: 26, paddingBottom: 26 }, lift]}>
          <SlideAction
            tone="onDark"
            label={t("swipeToEnter")}
            onComplete={onComplete}
          />
          <Txt
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,.62)",
              fontFamily: F.semibold,
              fontSize: 10,
              letterSpacing: 1.6,
            }}
          >
            {t("university").toUpperCase()}
          </Txt>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/** Re-exported for the auth-choice screen, which shares the same backdrop. */
export const SPLASH_BG = C.wineDeep;
