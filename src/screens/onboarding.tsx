import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

const next: Partial<Record<Screen, Screen>> = {
  splash: "welcome1",
  welcome1: "welcome2",
  welcome2: "welcome3",
  welcome3: "login",
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
  const d = onboarding.find((x) => x.screen === screen)!;
  return (
    <ScreenShell bottom={false}>
      <View style={s.welcomeArt}>
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
        <Pressable onPress={() => go("login")}>
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

