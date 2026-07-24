import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
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

const onboarding = [
  {
    screen: "welcome1" as Screen,
    title: "Build your lifestyle profile",
    sub: "Answer a fun 4-part questionnaire — sleep, cleanliness, guests, and study habits.",
    art: "Ploy, 19\nFood Technology\nNight Owl   Spotless",
  },
  {
    screen: "welcome2" as Screen,
    title: "Get high-compatibility matches",
    sub: "Our score compares 20+ lifestyle signals so you only meet people who fit how you live.",
    art: "88%",
  },
  {
    screen: "welcome3" as Screen,
    title: "Connect & chat safely",
    sub: "Every account is verified with an SUT student ID before anyone can chat.",
    art: "Hi! Saw we’re 92% 👋\n\nDorm 17? Let’s talk!",
  },
];

export function Welcome({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const { height } = useWindowDimensions();
  const artHeight = Math.max(260, Math.min(410, height * 0.46));
  const d = onboarding.find((x) => x.screen === screen)!;
  return (
    <ScreenShell bottom={false}>
      <View style={[s.welcomeArt, { height: artHeight }]}>
        <Text style={screen === "welcome2" ? s.scoreArt : s.artText}>
          {d.art}
        </Text>
      </View>
      <Text style={s.bigTitle}>{d.title}</Text>
      <Text style={s.centerMuted}>{d.sub}</Text>
      <View style={s.dots}>
        <View style={[s.dot, screen === "welcome1" && s.dotOn]} />
        <View style={[s.dot, screen === "welcome2" && s.dotOn]} />
        <View style={[s.dot, screen === "welcome3" && s.dotOn]} />
      </View>
      <View style={s.rowBetween}>
        <Pressable onPress={() => go("authChoice")}>
          <Text style={s.muted}>Skip</Text>
        </Pressable>
        <View style={{ width: 110 }}>
          <Button onPress={() => go(next[screen]!)}>
            {screen === "welcome3" ? "Get Started" : "Next"}
          </Button>
        </View>
      </View>
    </ScreenShell>
  );
}

export function AuthChoice({ go }: { go: (x: Screen) => void }) {
  const { width, height } = useWindowDimensions();
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
              <Text style={choice.buttonText}>Login</Text>
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
              <Text style={choice.buttonText}>Register</Text>
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
  page: {
    flex: 1,
  },
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
    backgroundColor: "rgba(223, 166, 155, 0.76)",
  },
  buttonCompact: { height: 54 },
  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: "#FFF9E8",
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
});

