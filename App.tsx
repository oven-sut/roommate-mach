import { StatusBar } from "expo-status-bar";
import {
  NotoSerifThai_400Regular,
  NotoSerifThai_500Medium,
  NotoSerifThai_600SemiBold,
  NotoSerifThai_700Bold,
  NotoSerifThai_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/noto-serif-thai";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "./src/i18n";
import { Config, Dashboard, Users } from "./src/features/admin";
import { Feed, Match, Matches } from "./src/features/discovery";
import { Legal } from "./src/features/legal";
import {
  Basics,
  MyProfile,
  Notifications,
  Profile,
  Report,
} from "./src/features/profile";
import { Chat, Messages } from "./src/features/messaging";
import { AuthChoice, SplashScreen, Welcome } from "./src/features/onboarding";
import { BlockedUsers, SearchUsers, Settings } from "./src/features/settings";
import { Verify } from "./src/features/verification";
import { Auth, ResetPassword } from "./src/features/auth";
import { Intro, Question, Summary } from "./src/features/questionnaire";
import {
  api,
  appState,
  getAccessToken,
  hasSeenOnboarding,
  initAuthToken,
  populateProfileDraft,
  resetAppState,
  saveToken,
  setHasSeenOnboarding,
} from "./src/services/api";
import { getPushNotificationToken } from "./src/services/notifications";
import { C } from "./src/theme/colors";
import { s } from "./src/theme/styles";
import type { AuthenticatedUser } from "./src/types/models";
import type { Screen } from "./src/types/navigation";

/** Screens that fade in without the upward slide (they own the full viewport). */
const FULL_BLEED: Screen[] = ["splash", "authChoice", "match", "profile"];

function AppContent() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [initializing, setInitializing] = useState(true);
  const transition = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  /** Where a signed-in user belongs, given their role and setup progress. */
  const landingFor = (me: AuthenticatedUser): Screen =>
    me.role === "ADMIN" ? "dashboard" : me.profile?.completed ? "feed" : "basics";

  const adoptSession = async (me: AuthenticatedUser) => {
    appState.currentUserId = me.id;
    populateProfileDraft(me);

    getPushNotificationToken().then((token) => {
      if (!token) return;
      api("/api/push/register", {
        method: "POST",
        body: JSON.stringify({ token, device: Platform.OS }),
      }).catch(() => undefined);
    });

    return landingFor(me);
  };

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
          setScreen(await adoptSession(me));
        } catch {
          saveToken(null);
          resetAppState();
          setScreen(seenOnboarding ? "authChoice" : "splash");
        }
      } else {
        setScreen(seenOnboarding ? "authChoice" : "splash");
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
      duration: 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [screen, transition]);

  const continueFromSplash = async () => {
    await setHasSeenOnboarding(true);
    if (!getAccessToken()) {
      setScreen("welcome1");
      return;
    }
    try {
      const me = await api<AuthenticatedUser>("/api/me");
      setScreen(await adoptSession(me));
    } catch {
      saveToken(null);
      resetAppState();
      setScreen("authChoice");
    }
  };

  const go = (next: Screen) => {
    if (next.startsWith("welcome") || next === "authChoice") {
      setHasSeenOnboarding(true);
    }
    // Leaving the app entirely means the previous user's data must go too.
    if (next === "login" || next === "signup") {
      saveToken(null);
      resetAppState();
    }
    setScreen(next);
  };

  const onAuth = (token: string, user: AuthenticatedUser) => {
    saveToken(token);
    setHasSeenOnboarding(true);
    appState.currentUserId = user.id;
    populateProfileDraft(user);
    api<AuthenticatedUser>("/api/me")
      .then((me) => populateProfileDraft(me))
      .catch(() => undefined);
    setScreen(landingFor(user));
  };

  if (initializing) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (screen === "splash") {
    return <SplashScreen onComplete={continueFromSplash} />;
  }

  const content = renderScreen(screen, go, onAuth);
  const slide = FULL_BLEED.includes(screen) ? 0 : 8;

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
                outputRange: [slide, 0],
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

/** Maps the current screen id to its component. */
function renderScreen(
  screen: Screen,
  go: (next: Screen) => void,
  onAuth: (token: string, user: AuthenticatedUser) => void,
): React.ReactNode {
  switch (screen) {
    case "welcome1":
    case "welcome2":
    case "welcome3":
      return <Welcome screen={screen} go={go} />;
    case "authChoice":
      return <AuthChoice go={go} />;

    case "login":
    case "signup":
      return <Auth mode={screen} go={go} onAuth={onAuth} />;
    case "forgot":
      return <ResetPassword go={go} />;
    case "terms":
    case "privacy":
      return <Legal screen={screen} go={go} />;
    case "verify":
      return <Verify go={go} />;

    case "basics":
      return <Basics go={go} />;
    case "intro":
      return <Intro go={go} />;
    case "q1":
    case "q2":
    case "q3":
    case "q4":
      return <Question screen={screen} go={go} />;
    case "summary":
      return <Summary go={go} />;

    case "feed":
      return <Feed go={go} />;
    case "matches":
      return <Matches go={go} />;
    case "match":
      return <Match go={go} />;
    case "profile":
      return <Profile go={go} />;
    case "messages":
      return <Messages go={go} />;
    case "chat":
      return <Chat go={go} />;
    case "photos":
    case "myprofile":
      return <MyProfile go={go} />;
    case "notifications":
      return <Notifications go={go} />;
    case "report":
      return <Report go={go} />;

    case "settings":
      return <Settings go={go} />;
    case "blocked":
      return <BlockedUsers go={go} />;
    case "search":
      return <SearchUsers go={go} />;

    case "dashboard":
      return <Dashboard go={go} />;
    case "users":
      return <Users go={go} />;
    case "config":
      return <Config go={go} />;

    // `splash` is handled before this function is reached.
    case "splash":
      return null;
  }
}

export default function App() {
  const [loaded] = useFonts({
    NotoSerifThai_400Regular,
    NotoSerifThai_500Medium,
    NotoSerifThai_600SemiBold,
    NotoSerifThai_700Bold,
    NotoSerifThai_800ExtraBold,
  });

  if (!loaded) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

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
  screen: { flex: 1 },
});
