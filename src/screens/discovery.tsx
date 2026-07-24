import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

export function BottomNav({
  screen,
  go,
}: {
  screen: Screen;
  go: (x: Screen) => void;
}) {
  return (
    <View style={s.nav}>
      {[
        ["⌂", "Home", "feed"],
        ["♡", "Matches", "matches"],
        ["▱", "Messages", "messages"],
        ["♙", "Profile", "myprofile"],
      ].map(([ic, l, x]) => (
        <Pressable key={l} onPress={() => go(x as Screen)} style={s.navItem}>
          <Text style={[s.navIcon, screen === x && { color: C.orange }]}>
            {ic}
          </Text>
          <Text style={[s.navText, screen === x && { color: C.orange }]}>
            {l}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Feed({ go }: { go: (x: Screen) => void }) {
  const [people, setPeople] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  useEffect(() => {
    loadPage(true);
  }, []);

  const loadPage = async (isInitial = false) => {
    if (!hasMore && !isInitial) return;
    if (isInitial) setLoading(true);
    else setFetchingMore(true);

    try {
      const data = await api(`/api/discover`);
      
      setPeople(prev => {
        const newItems = data.filter((d: any) => !prev.some(p => p.id === d.id));
        if (!isInitial && newItems.length === 0) setHasMore(false);
        if (isInitial && data.length === 0) setHasMore(false);
        return isInitial ? data : [...prev, ...newItems];
      });
      if (isInitial) setIndex(0);
    } catch (e: any) {
      Alert.alert("Discover", e.message);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const person = people[index];
  const swipe = async (decision: "LIKE" | "PASS") => {
    if (!person) return;
    try {
      const result = await api(`/api/swipes/${person.id}`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      const nextIndex = index + 1;
      setIndex(nextIndex);
      if (result.matched) go("match");

      if (hasMore && !fetchingMore && nextIndex >= people.length - 5) {
        loadPage(false);
      }
    } catch (e) {
      Alert.alert(
        "Unable to save",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <Header title="⌂  Discover" right="☷" onRight={() => go("filters")} />
      <View style={s.quickLinks}>
        <Pressable onPress={() => go("requests")}>
          <Text style={s.link}>♥ Likes you</Text>
        </Pressable>
        <Pressable onPress={() => go("notifications")}>
          <Text style={s.link}>♧ Notifications</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      ) : person ? (
        <>
          <Pressable
            onPress={() => {
              appState.activeProfile = person;
              go("profile");
            }}
          >
            <View style={s.profileCard}>
              <View style={s.verified}>
                <Text style={{ color: "#fff" }}>
                  ♧{" "}
                  {person.verification?.status === "VERIFIED"
                    ? "Verified"
                    : "Student"}
                </Text>
              </View>
              <View style={s.score}>
                <Text style={s.scoreText}>{person.score}%</Text>
              </View>
              <Text style={s.ghost}>{person.displayName?.[0] ?? "R"}</Text>
              <View style={s.profileCopy}>
                <Text style={s.profileName}>
                  {person.displayName}, {person.profile?.age ?? "–"}
                </Text>
                <Text style={{ color: "#fff" }}>
                  {person.profile?.major ?? "SUT Student"} · Year{" "}
                  {person.profile?.year ?? "–"} · wants{" "}
                  {person.profile?.roomType ?? "Any"} room
                </Text>
                <View style={s.wrap}>
                  <Chip>Compatible</Chip>
                  <Chip>{person.profile?.zone ?? "Any zone"}</Chip>
                </View>
              </View>
            </View>
          </Pressable>
          <Text style={s.tap}>tap card to expand ↑</Text>
          <View style={s.actions}>
            <Pressable onPress={() => swipe("PASS")} style={s.reject}>
              <Text style={{ fontSize: 30, color: C.muted }}>×</Text>
            </Pressable>
            <Pressable onPress={() => swipe("LIKE")} style={s.like}>
              <Text style={{ fontSize: 28, color: "#fff" }}>♥</Text>
            </Pressable>
          </View>
        </>
      ) : fetchingMore ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={C.orange} size="large" />
          <Text style={[s.muted, { marginTop: 16 }]}>Finding more matches...</Text>
        </View>
      ) : (
        <Card>
          <Text style={s.bigTitle}>You’re all caught up</Text>
          <Text style={s.centerMuted}>
            New compatible profiles will appear here.
          </Text>
        </Card>
      )}
      <BottomNav screen="feed" go={go} />
    </ScreenShell>
  );
}
export function Filters({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <View style={s.filterBackdrop} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.rowBetween}>
          <Text style={s.title}>Filters</Text>
          <Text style={s.link}>Reset all</Text>
        </View>
        <Text style={s.label}>SHOW ME</Text>
        <View style={s.segment}>
          <Chip>Women</Chip>
          <Chip active>Men</Chip>
          <Chip>Everyone</Chip>
        </View>
        <Field label="MAJOR" placeholder="Any faculty" />
        <Text style={s.label}>BUDGET (฿ / MONTH)</Text>
        <Card>
          <Text style={[s.link, { textAlign: "right" }]}>2,500 – 4,500</Text>
          <View style={s.slider}>
            <View style={s.sliderOn} />
          </View>
        </Card>
        <Text style={s.label}>MUST MATCH ON</Text>
        <View style={s.wrap}>
          <Chip active>Sleep schedule</Chip>
          <Chip active>Cleanliness</Chip>
          <Chip>Guests</Chip>
          <Chip>AC temp</Chip>
        </View>
        <Text style={s.label}>MINIMUM MATCH SCORE</Text>
        <Card>
          <View style={s.slider}>
            <View style={[s.sliderOn, { width: "70%" }]} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.muted}>50%</Text>
            <Text style={s.tinyOrange}>70%+</Text>
            <Text style={s.muted}>95%</Text>
          </View>
        </Card>
        <Button onPress={() => go("feed")}>Apply Filters · 23 people</Button>
      </View>
    </ScreenShell>
  );
}

const people = [
  ["Ploy", "92%", "Food Tech · matched 2h ago"],
  ["Mind", "88%", "Mechatronics · matched today"],
  ["Tan", "81%", "Civil Eng. · chatting"],
  ["Baitoey", "78%", "IT · chatting"],
];
export function PersonRow({
  p,
  action,
  onPress,
}: {
  p: string[];
  action: string;
  onPress?: () => void;
}) {
  return (
    <Card>
      <View style={s.personRow}>
        <View style={s.avatar}>
          <Text style={s.avatarLetter}>{p[0][0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            {p[0]} · {p[1]}
          </Text>
          <Text style={s.muted}>{p[2]}</Text>
        </View>
        <Pressable
          onPress={onPress}
          style={[
            s.smallAction,
            action === "Chat" && { backgroundColor: C.orange },
          ]}
        >
          <Text
            style={{
              color: action === "Chat" ? "#fff" : C.wine,
              fontFamily: "NotoSansThai_700Bold",
            }}
          >
            {action}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
export function Matches({ go }: { go: (x: Screen) => void }) {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    api("/api/matches")
      .then(setMatches)
      .catch((e) => Alert.alert("Matches", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header
        title="Your Matches"
        right={`${matches.length} total`}
        onRight={() => go("requests")}
      />
      <Text style={s.label}>NEW THIS WEEK</Text>
      {matches.map((m) => {
        const other = m.other;
        return (
          <PersonRow
            key={m.id}
            p={[
              other?.displayName ?? "Roomie",
              `${m.score}%`,
              other?.profile?.major ?? "SUT student",
            ]}
            action="Chat"
            onPress={() => go("messages")}
          />
        );
      })}
      {!matches.length && (
        <Card>
          <Text style={s.centerMuted}>No matches yet. Keep discovering!</Text>
        </Card>
      )}
      <BottomNav screen="matches" go={go} />
    </ScreenShell>
  );
}
export function Match({ go }: { go: (x: Screen) => void }) {
  return (
    <SafeAreaView style={s.matchPage}>
      <Text style={s.matchEyebrow}>RECIPROCAL LIKE</Text>
      <Text style={s.matchTitle}>It's a{`\n`}Match!</Text>
      <View style={s.matchAvatars}>
        <View style={s.matchAvatar}>
          <Text style={s.avatarLetter}>N</Text>
        </View>
        <View style={s.matchScore}>
          <Text>88%</Text>
        </View>
        <View style={[s.matchAvatar, { backgroundColor: C.orange }]}>
          <Text style={s.avatarLetter}>ม</Text>
        </View>
      </View>
      <Text style={s.matchCopy}>
        You and Mind liked each other — 88% compatible on sleep, cleanliness &
        quiet hours.
      </Text>
      <Button tone="amber" onPress={() => go("chat")}>
        Start Chat
      </Button>
      <Button outline tone="amber" onPress={() => go("feed")}>
        Keep Discovering
      </Button>
    </SafeAreaView>
  );
}
export function Requests({ go }: { go: (x: Screen) => void }) {
  const [likes, setLikes] = useState<any[]>([]);
  useEffect(() => {
    api("/api/likes")
      .then(setLikes)
      .catch((e) => Alert.alert("Likes", e.message));
  }, []);
  const likeBack = async (id: string) => {
    const result = await api(`/api/swipes/${id}`, {
      method: "POST",
      body: JSON.stringify({ decision: "LIKE" }),
    });
    setLikes((items) => items.filter((item) => item.fromId !== id));
    if (result.matched) go("match");
  };
  return (
    <ScreenShell>
      <Header title="Likes You" right={`${likes.length} new`} />
      <Text style={s.muted}>
        These students already liked you. Like back to match instantly.
      </Text>
      {likes.map((x) => (
        <PersonRow
          key={x.id}
          p={[
            x.from.displayName,
            "Liked you",
            x.from.profile?.major ?? "SUT student",
          ]}
          action="Like"
          onPress={() => likeBack(x.fromId)}
        />
      ))}
      <Card tint="#FFF7DF">
        <Text style={s.note}>
          Liking back creates a match and opens chat immediately — no waiting.
        </Text>
      </Card>
      <BottomNav screen="matches" go={go} />
    </ScreenShell>
  );
}
