import { StatusBar } from "expo-status-bar";
import {
  NotoSansThai_400Regular,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
  NotoSansThai_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/noto-sans-thai";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "./src/i18n";
import { Auth, Basics } from "./src/screens/auth";
import { Config, Dashboard, Users } from "./src/screens/admin";
import { Feed, Filters, Match, Matches, Requests } from "./src/screens/discovery";
import { Legal } from "./src/screens/legal";
import { Chat, Messages, Settings } from "./src/screens/messaging";
import { AuthChoice, Welcome } from "./src/screens/onboarding";
import { MyProfile, Notifications, Profile, Report } from "./src/screens/profile";
import { Intro, Question, Summary } from "./src/screens/questionnaire";
import { SplashScreen } from "./src/screens/splash";
import { Verify } from "./src/screens/verification";
import { api, appState, getAccessToken, saveToken } from "./src/services/api";
import { getPushNotificationToken } from "./src/services/notifications";
import { C } from "./src/theme/colors";
import { s } from "./src/theme/styles";
import type { AuthenticatedUser } from "./src/types/models";
import type { Screen } from "./src/types/navigation";

const appFont = {
  fontFamily: "NotoSansThai_400Regular",
};

(Text as any).defaultProps = {
  ...((Text as any).defaultProps ?? {}),
  style: [appFont, (Text as any).defaultProps?.style],
};

(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  style: [appFont, (TextInput as any).defaultProps?.style],
};

function AppContent() {
  const [screen, setScreen] = useState<Screen>("splash");
  const transition = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
    });
  }, []);

  useEffect(() => {
    if (screen === "splash" || reduceMotion.current) {
      transition.setValue(1);
      return;
    }

    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 440,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [screen, transition]);

  const continueFromSplash = async () => {
    if (getAccessToken()) {
      try {
        const me = await api<AuthenticatedUser>("/api/me");
        appState.currentUserId = me.id;

        getPushNotificationToken().then((token) => {
          if (token) {
            api("/api/push/register", {
              method: "POST",
              body: JSON.stringify({ token, device: Platform.OS }),
            }).catch(() => undefined);
          }
        });

        setScreen(
          me.role === "ADMIN"
            ? "dashboard"
            : me.profile?.completed
              ? "feed"
              : "verify",
        );
      } catch {
        saveToken(null);
        setScreen("welcome1");
      }
    } else {
      setScreen("welcome1");
    }
  };
  const go = (x: Screen) => setScreen(x);
  const onAuth = (token: string, user: AuthenticatedUser) => {
    saveToken(token);
    appState.currentUserId = user.id;
    setScreen(user.role === "ADMIN" ? "dashboard" : "verify");
  };
  if (screen === "splash") {
    return <SplashScreen onComplete={continueFromSplash} />;
  }

  let content: React.ReactNode;
  if (screen.startsWith("welcome")) content = <Welcome screen={screen} go={go} />;
  else if (screen === "authChoice") content = <AuthChoice go={go} />;
  else if (screen === "login" || screen === "signup" || screen === "forgot")
    content = <Auth mode={screen} go={go} onAuth={onAuth} />;
  else if (screen === "terms" || screen === "privacy")
    content = <Legal screen={screen} go={go} />;
  else if (screen === "verify") content = <Verify go={go} />;
  else if (screen === "basics" || screen === "housing")
    content = <Basics screen={screen} go={go} />;
  else if (screen === "intro") content = <Intro go={go} />;
  else if (/^q[1-6]$/.test(screen))
    content = <Question screen={screen} go={go} />;
  else if (screen === "summary") content = <Summary go={go} />;
  else if (screen === "feed") content = <Feed go={go} />;
  else if (screen === "filters") content = <Filters go={go} />;
  else if (screen === "matches") content = <Matches go={go} />;
  else if (screen === "match") content = <Match go={go} />;
  else if (screen === "requests") content = <Requests go={go} />;
  else if (screen === "profile") content = <Profile go={go} />;
  else if (screen === "notifications") content = <Notifications go={go} />;
  else if (screen === "report") content = <Report go={go} />;
  else if (screen === "myprofile") content = <MyProfile go={go} />;
  else if (screen === "messages") content = <Messages go={go} />;
  else if (screen === "chat") content = <Chat go={go} />;
  else if (screen === "settings")
    content = (
      <Settings
        go={(x) => {
          if (x === "login") saveToken(null);
          go(x);
        }}
      />
    );
  else if (screen === "adminLogin")
    content = <Auth mode="login" go={go} onAuth={onAuth} />;
  else if (screen === "dashboard") content = <Dashboard go={go} />;
  else if (screen === "users") content = <Users go={go} />;
  else content = <Config go={go} />;

  return (
    <Animated.View
      style={[
        localStyles.screen,
        {
          opacity: transition,
          transform: [
            {
              translateY: transition.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {content}
    </Animated.View>
  );
}
export default function App() {
  const [loaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
    NotoSansThai_800ExtraBold,
  });
  if (!loaded)
    return (
      <View style={s.loading}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <StatusBar style="dark" />
        <AppContent />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const localStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

