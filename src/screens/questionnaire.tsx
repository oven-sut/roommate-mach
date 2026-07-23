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

const qs: Record<
  string,
  {
    step: number;
    title: string;
    sub: string;
    groups: { label: string; items: string[]; active: number[] }[];
    note?: string;
  }
> = {
  q1: {
    step: 1,
    title: "Sleep & wake",
    sub: "Drag the handles to your usual range",
    groups: [
      { label: "☾  I usually sleep at", items: ["23:00 – 00:30"], active: [0] },
      { label: "☀  I usually wake at", items: ["07:00 – 08:00"], active: [0] },
    ],
    note: "Based on your answers you’ll get the Night Owl tag on your card.",
  },
  q2: {
    step: 2,
    title: "Cleanliness",
    sub: "Pick every habit that sounds like you",
    groups: [
      {
        label: "",
        items: [
          "Spotless",
          "Tidy-ish",
          "Organized chaos",
          "Dishes same day",
          "Weekly deep clean",
          "Laundry piles up",
          "Shoes off inside",
          "Shared chore chart",
        ],
        active: [0, 3, 6],
      },
      {
        label: "How much does a clean room matter?",
        items: ["4/5"],
        active: [0],
      },
    ],
    note: "Cleanliness is weighted 25% of your match score.",
  },
  q3: {
    step: 3,
    title: "Guests & social life",
    sub: "Set your comfort zone for visitors",
    groups: [
      {
        label: "ALLOW OVERNIGHT GUESTS?",
        items: ["Yes", "Sometimes", "No"],
        active: [1],
      },
      {
        label: "GUESTS I’M OKAY WITH",
        items: ["Close friends", "Study group", "Partner", "Family", "Anyone"],
        active: [0, 1, 3],
      },
      {
        label: "MY SOCIAL BATTERY",
        items: ["Homebody", "Balanced", "Social hub"],
        active: [1],
      },
    ],
  },
  q4: {
    step: 4,
    title: "Temperature & study",
    sub: "Last one — the room environment",
    groups: [
      {
        label: "AC TEMPERATURE AT NIGHT",
        items: ["22–24°", "25–26°", "27°+"],
        active: [1],
      },
      { label: "Quiet hours matter to me", items: ["5/5"], active: [0] },
      {
        label: "I MOSTLY STUDY",
        items: ["In room", "Library", "Cafe / out"],
        active: [0],
      },
    ],
  },
  q5: {
    step: 5,
    title: "Habits & Pets",
    sub: "Be honest about your lifestyle",
    groups: [
      { label: "SMOKING", items: ["Yes", "No", "Outside only"], active: [1] },
      {
        label: "ALCOHOL / DRINKING",
        items: ["Often", "Socially", "Never"],
        active: [1],
      },
      {
        label: "PETS IN THE ROOM",
        items: ["Love them", "Have a pet", "Allergic/No"],
        active: [0],
      },
    ],
  },
  q6: {
    step: 6,
    title: "Chores & Noise",
    sub: "Living together smoothly",
    groups: [
      {
        label: "CLEANING DUTIES",
        items: ["Split equally", "Take turns", "Do my own"],
        active: [0],
      },
      { label: "Noise tolerance", items: ["Moderate"], active: [0] },
    ],
  },
};
export function Intro({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <Progress step={0} total={4} />
      <View style={s.introCenter}>
        <View style={s.heart}>♡</View>
        <Text style={s.bigTitle}>Let's find how you live</Text>
        <Text style={s.centerMuted}>
          4 quick categories power your match score. Be honest — it’s how we
          find your fit.
        </Text>
        <View style={[s.wrap, { justifyContent: "center" }]}>
          <Chip>☾ Sleep & wake</Chip>
          <Chip>✦ Cleanliness</Chip>
          <Chip>♙ Guests</Chip>
          <Chip>☀ Temp & study</Chip>
        </View>
      </View>
      <Button onPress={() => go("q1")}>Start Questionnaire</Button>
    </ScreenShell>
  );
}
export function Question({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const d = qs[screen];
  const [, rerender] = useState(0);
  const toggle = (group: number, item: number) => {
    const active = d.groups[group].active;
    d.groups[group].active = active.includes(item)
      ? active.filter((x) => x !== item)
      : [...active, item];
    rerender((x) => x + 1);
  };
  const proceed = async () => {
    if (screen === "q6") {
      try {
        const answers = Object.fromEntries(
          Object.entries(qs).map(([key, value]) => [
            key,
            value.groups.map((g) =>
              g.items.filter((_, i) => g.active.includes(i)),
            ),
          ]),
        );
        await api("/api/questionnaire", {
          method: "PUT",
          body: JSON.stringify({ answers, completed: true }),
        });
      } catch (e) {
        Alert.alert(
          "Unable to save",
          e instanceof Error ? e.message : "Please try again",
        );
        return;
      }
    }
    go(next[screen]!);
  };
  return (
    <ScreenShell>
      <Header
        title=""
        back={() =>
          go(screen === "q1" ? "intro" : (`q${d.step - 1}` as Screen))
        }
      />
      <Progress step={d.step} />
      <Text style={s.bigTitleLeft}>{d.title}</Text>
      <Text style={s.muted}>{d.sub}</Text>
      {d.groups.map((g, gi) => (
        <View key={g.label + gi} style={{ marginTop: 22 }}>
          <Text style={s.label}>{g.label}</Text>
          <Card>
            <View style={s.wrap}>
              {g.items.map((x, i) => (
                <Chip
                  key={x}
                  active={g.active.includes(i)}
                  onPress={() => toggle(gi, i)}
                >
                  {x}
                </Chip>
              ))}
            </View>
            {g.items.length === 1 && (
              <View style={s.slider}>
                <View style={[s.sliderOn, { width: "72%" }]} />
              </View>
            )}
          </Card>
        </View>
      ))}
      {d.note && (
        <Card tint={screen === "q1" ? C.pink : "#FFF7DF"}>
          <Text style={s.note}>{d.note}</Text>
        </Card>
      )}
      <Button
        tone={screen === "q4" || screen === "q6" ? "wine" : "orange"}
        onPress={proceed}
      >
        {screen === "q6"
          ? "Finish Questionnaire"
          : screen === "q4"
            ? "Finish — See My Summary"
            : "Continue"}
      </Button>
    </ScreenShell>
  );
}

export function Summary({ go }: { go: (x: Screen) => void }) {
  const complete = async () => {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
          completed: true,
        }),
      });
      go("feed");
    } catch (e) {
      Alert.alert(
        "Unable to complete profile",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <Progress step={6} />
      <Text style={s.bigTitle}>
        Looking good, {appState.profileDraft.displayName || "Roomie"} ✓
      </Text>
      <Text style={s.centerMuted}>
        Here’s the profile your matches will see
      </Text>
      <Card>
        <View style={s.cover} />
        <View style={s.avatarFloat}>
          <Text style={s.avatarLetter}>N</Text>
        </View>
        <Text style={s.title}>
          {appState.profileDraft.displayName || "Roomie"}, {appState.profileDraft.age || "–"} ·{" "}
          {appState.profileDraft.major || "SUT Student"}
        </Text>
        <Text style={s.muted}>
          {appState.profileDraft.bio || "Looking for a compatible roommate."}
        </Text>
      </Card>
      <Card>
        <Text style={s.title}>Your lifestyle signature</Text>
        <View style={s.wrap}>
          <Chip active>Night Owl 23:00–00:30</Chip>
          <Chip active>Spotless 4/5</Chip>
          <Chip active>Guests: sometimes</Chip>
          <Chip active>AC 25–26°</Chip>
          <Chip active>Quiet hours 5/5</Chip>
        </View>
        <Text style={s.note}>
          These 5 signals + 15+ answers are compared with every profile to
          compute your match %.
        </Text>
      </Card>
      <Button onPress={complete}>Complete Profile</Button>
    </ScreenShell>
  );
}

