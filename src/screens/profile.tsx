import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

import { BottomNav } from "./discovery";
export function Profile({ go }: { go: (x: Screen) => void }) {
  const p = appState.activeProfile;
  return (
    <ScreenShell>
      <Header title="" back={() => go("matches")} />
      <View style={[s.cover, { height: 210, backgroundColor: C.red }]} />
      <View style={[s.score, { top: 190, right: 22 }]}>
        <Text style={s.scoreText}>{p?.score ?? 92}%</Text>
      </View>
      <Text style={s.title}>
        {p?.displayName ?? "Roomie"}, {p?.profile?.age ?? "–"}{" "}
        <Text style={{ color: C.green }}>
          {p?.verification?.status === "VERIFIED"
            ? "✓ Verified"
            : "SUT Student"}
        </Text>
      </Text>
      <Text style={s.muted}>
        {p?.profile?.major ?? "SUT Student"} · Year {p?.profile?.year ?? "–"} ·{" "}
        {p?.profile?.roomType ?? "Any"} room · ฿{p?.profile?.budgetMin ?? 0}–
        {p?.profile?.budgetMax ?? 0}
      </Text>
      <Text style={s.note}>
        “{p?.profile?.bio ?? "Looking for a compatible roommate."}”
      </Text>
      <Card>
        <Text style={s.title}>Why {p?.score ?? 92}%?</Text>
        {[
          ["Sleep & Wake", "96%"],
          ["Cleanliness", "94%"],
          ["Guests & social", "88%"],
          ["Temp & study", "90%"],
        ].map((x) => (
          <View key={x[0]} style={{ marginTop: 10 }}>
            <View style={s.rowBetween}>
              <Text>{x[0]}</Text>
              <Text style={s.tinyOrange}>{x[1]}</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: x[1] as `${number}%` }]} />
            </View>
          </View>
        ))}
      </Card>
      <View style={s.wrap}>
        <Chip active>Sleeps 23:30</Chip>
        <Chip active>Spotless 5/5</Chip>
        <Chip active>Guests: sometimes</Chip>
        <Chip active>AC 25°</Chip>
      </View>
      <Button onPress={() => go("messages")}>♧ Open Messages</Button>
      <Pressable onPress={() => go("report")}>
        <Text style={s.bottomLink}>Report or block</Text>
      </Pressable>
    </ScreenShell>
  );
}

export function Notifications({ go }: { go: (x: Screen) => void }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api("/api/notifications")
      .then(setItems)
      .catch((e) => Alert.alert("Notifications", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header
        title="Notifications"
        right={`${items.filter((x) => !x.readAt).length} new`}
      />
      {items.length ? (
        items.map((x, i) => (
          <Pressable
            key={x.id}
            onPress={async () => {
              await api(`/api/notifications/${x.id}/read`, { method: "PATCH" });
              setItems((a) =>
                a.map((n) =>
                  n.id === x.id
                    ? { ...n, readAt: new Date().toISOString() }
                    : n,
                ),
              );
            }}
          >
            <Card>
              <View style={s.personRow}>
                <View
                  style={[
                    s.notifyIcon,
                    {
                      backgroundColor:
                        x.type === "match"
                          ? C.green
                          : x.type === "like"
                            ? C.orange
                            : "#EFE5E1",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        x.type === "match" || x.type === "like"
                          ? "#fff"
                          : C.ink,
                    }}
                  >
                    {x.type === "match" ? "✓" : x.type === "like" ? "♥" : "♧"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{x.title}</Text>
                  <Text style={s.muted}>{x.body}</Text>
                </View>
                {!x.readAt ? <Text style={s.tinyOrange}>New</Text> : null}
              </View>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <Text style={s.centerMuted}>No notifications yet</Text>
        </Card>
      )}
    </ScreenShell>
  );
}
export function Report({ go }: { go: (x: Screen) => void }) {
  const act = async (kind: "unmatch" | "block" | "report") => {
    if (!appState.activeProfile?.id) return go("matches");
    try {
      if (kind === "unmatch")
        await api(`/api/matches/user/${appState.activeProfile.id}`, {
          method: "DELETE",
        });
      if (kind === "block")
        await api(`/api/blocks/${appState.activeProfile.id}`, { method: "POST" });
      if (kind === "report")
        await api(`/api/reports/${appState.activeProfile.id}`, {
          method: "POST",
          body: JSON.stringify({
            reason: "Inappropriate behavior",
            details: "Submitted from profile",
          }),
        });
      Alert.alert(
        "Done",
        kind === "report"
          ? "Report sent to the admin team."
          : "Your preference has been updated.",
      );
      go("matches");
    } catch (e) {
      Alert.alert(
        "Unable to continue",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <View style={[s.cover, { height: 180, backgroundColor: "#4A252B" }]} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={[s.bigTitle, { marginTop: 5 }]}>Report or Block</Text>
        <Text style={s.centerMuted}>We won't tell them you did this.</Text>
        {[
          ["Unmatch", "Remove them from your matches"],
          ["Block User", "They won't be able to see or contact you"],
          ["Report User", "Inappropriate behavior, spam, or fake profile"],
        ].map((x, i) => (
          <Pressable
            key={x[0]}
            onPress={() =>
              act(i === 0 ? "unmatch" : i === 1 ? "block" : "report")
            }
          >
            <Card tint={i === 0 ? "#FFF7DF" : C.pink}>
              <Text style={[s.title, { color: C.wine }]}>{x[0]}</Text>
              <Text style={s.muted}>{x[1]}</Text>
            </Card>
          </Pressable>
        ))}
        <Button outline tone="wine" onPress={() => go("profile")}>
          Cancel
        </Button>
      </View>
    </ScreenShell>
  );
}

export function MyProfile({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <Header title="My Profile" right="☷" onRight={() => go("settings")} />
      <Card>
        <View style={s.personRow}>
          <View style={[s.avatar, { width: 66, height: 66, borderRadius: 33 }]}>
            <Text style={s.avatarLetter}>N</Text>
          </View>
          <View>
            <Text style={s.title}>Napat Srisawat, 19</Text>
            <Text style={s.muted}>Computer Engineering · Year 2</Text>
            <Text style={{ color: C.green }}>✓ SUT Verified</Text>
          </View>
        </View>
      </Card>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.title}>Profile strength</Text>
          <Text style={s.tinyOrange}>85%</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: "85%" }]} />
        </View>
        <Text style={s.muted}>
          Add a 3rd photo to reach 100% and get seen more.
        </Text>
      </Card>
      {[
        ["Photos", "2 of 3 uploaded"],
        ["Basics & bio", "Name, major, room type, preference"],
        [
          "Lifestyle questionnaire",
          "Last taken 12 Jun · affects all match scores",
        ],
        ["Account status", "Active · visible in Discover"],
      ].map((x, i) => (
        <Pressable key={x[0]} onPress={() => i === 2 && go("intro")}>
          <Card tint={i === 2 ? "#FFF7F3" : undefined}>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.title}>{x[0]}</Text>
                <Text style={s.muted}>{x[1]}</Text>
              </View>
              <Text style={s.link}>{i === 2 ? "Retake" : "›"}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
      <BottomNav screen="myprofile" go={go} />
    </ScreenShell>
  );
}
