import { StatusBar } from "expo-status-bar";
import {
  NotoSansThai_400Regular,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
  NotoSansThai_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/noto-sans-thai";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Auth, Basics, Verify } from "./src/screens/auth";
import { Config, Dashboard, Users } from "./src/screens/admin";
import { Feed, Filters, Match, Matches, Requests } from "./src/screens/discovery";
import { Chat, Messages, Settings } from "./src/screens/messaging";
import { Welcome } from "./src/screens/onboarding";
import { MyProfile, Notifications, Profile, Report } from "./src/screens/profile";
import { Intro, Question, Summary } from "./src/screens/questionnaire";
import { SplashScreen } from "./src/screens/splash";
import { api, appState, getAccessToken, saveToken } from "./src/services/api";
import { C } from "./src/theme/colors";
import { s } from "./src/theme/styles";
import type { Screen } from "./src/types/navigation";

function AppContent() {
  const [screen, setScreen] = useState<Screen>("splash");
  useEffect(() => {
    if (screen !== "splash") return;
    const t = setTimeout(async () => {
      if (getAccessToken()) {
        try {
          const me = await api("/api/me");
          appState.currentUserId = me.id;
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
      } else setScreen("welcome1");
    }, 800);
    return () => clearTimeout(t);
  }, [screen]);
  const go = (x: Screen) => setScreen(x);
  const onAuth = (token: string, user: any) => {
    saveToken(token);
    appState.currentUserId = user.id;
    setScreen(user.role === "ADMIN" ? "dashboard" : "verify");
  };
  if (screen === "splash") return <SplashScreen />;
  if (screen.startsWith("welcome")) return <Welcome screen={screen} go={go} />;
  if (screen === "login" || screen === "signup" || screen === "forgot")
    return <Auth mode={screen} go={go} onAuth={onAuth} />;
  if (screen === "verify") return <Verify go={go} />;
  if (screen === "basics" || screen === "housing")
    return <Basics screen={screen} go={go} />;
  if (screen === "intro") return <Intro go={go} />;
  if (/^q[1-6]$/.test(screen)) return <Question screen={screen} go={go} />;
  if (screen === "summary") return <Summary go={go} />;
  if (screen === "feed") return <Feed go={go} />;
  if (screen === "filters") return <Filters go={go} />;
  if (screen === "matches") return <Matches go={go} />;
  if (screen === "match") return <Match go={go} />;
  if (screen === "requests") return <Requests go={go} />;
  if (screen === "profile") return <Profile go={go} />;
  if (screen === "notifications") return <Notifications go={go} />;
  if (screen === "report") return <Report go={go} />;
  if (screen === "myprofile") return <MyProfile go={go} />;
  if (screen === "messages") return <Messages go={go} />;
  if (screen === "chat") return <Chat go={go} />;
  if (screen === "settings")
    return (
      <Settings
        go={(x) => {
          if (x === "login") saveToken(null);
          go(x);
        }}
      />
    );
  if (screen === "adminLogin")
    return <Auth mode="login" go={go} onAuth={onAuth} />;
  if (screen === "dashboard") return <Dashboard go={go} />;
  if (screen === "users") return <Users go={go} />;
  return <Config go={go} />;
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
    <>
      <StatusBar style="dark" />
      <AppContent />
    </>
  );
}

