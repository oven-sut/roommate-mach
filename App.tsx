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
import { Config, Dashboard, Users } from "./src/features/admin";
import { Feed, Filters, Match, Matches, Requests } from "./src/features/discovery";
import { Legal } from "./src/features/legal";
import { Basics, MyProfile, Notifications, Profile, Report } from "./src/features/profile";
import { Chat, Messages } from "./src/features/messaging";
import { AuthChoice, SplashScreen, Welcome } from "./src/features/onboarding";
import { BlockedUsers, SearchUsers, Settings } from "./src/features/settings";
import { Verify } from "./src/features/verification";
import { Auth } from "./src/features/auth";

import { Intro, Question, Summary } from "./src/features/questionnaire";
import {
  api,
  appState,
  getAccessToken,
  hasSeenOnboarding,
  initAuthToken,
  populateProfileDraft,
  saveToken,
  setHasSeenOnboarding,
} from "./src/services/api";
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
  const [initializing, setInitializing] = useState(true);
  const transition = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
    });

    async function bootstrap() {
      const token = await initAuthToken();
      const seenOnboarding = await hasSeenOnboarding();

      if (token) {
        try {
          const me = await api<AuthenticatedUser>("/api/me");
          appState.currentUserId = me.id;
          populateProfileDraft(me);

          getPushNotificationToken().then((pushToken) => {
            if (pushToken) {
              api("/api/push/register", {
                method: "POST",
                body: JSON.stringify({ token: pushToken, device: Platform.OS }),
              }).catch(() => undefined);
            }
          });

          setScreen(
            me.role === "ADMIN"
              ? "dashboard"
              : me.profile?.completed
                ? "feed"
                : "basics",
          );
        } catch {
          saveToken(null);
          setScreen(seenOnboarding ? "authChoice" : "splash");
        }
      } else {
        if (seenOnboarding) {
          setScreen("authChoice");
        } else {
          setScreen("splash");
        }
      }
      setInitializing(false);
    }

    bootstrap();
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
    await setHasSeenOnboarding(true);
    if (getAccessToken()) {
      try {
        const me = await api<AuthenticatedUser>("/api/me");
        appState.currentUserId = me.id;
        populateProfileDraft(me);

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
              : "basics",
        );
      } catch {
        saveToken(null);
        setScreen("authChoice");
      }
    } else {
      setScreen("welcome1");
    }
  };

  const go = (x: Screen) => {
    if (x.startsWith("welcome") || x === "authChoice") {
      setHasSeenOnboarding(true);
    }
    setScreen(x);
  };

  const onAuth = (token: string, user: AuthenticatedUser) => {
    saveToken(token);
    setHasSeenOnboarding(true);
    appState.currentUserId = user.id;
    populateProfileDraft(user);
    api("/api/me")
      .then((me) => populateProfileDraft(me))
      .catch(() => undefined);
    setScreen(user.role === "ADMIN" ? "dashboard" : "basics");
  };

  if (initializing) {
    return (
      <View style={[s.loading, { backgroundColor: "#FEFCFA" }]}>
        <ActivityIndicator size="large" color="#C64338" />
      </View>
    );
  }
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
  else if (screen === "blocked") content = <BlockedUsers go={go} />;
  else if (screen === "search") content = <SearchUsers go={go} />;
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

