import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Chip, Header, ScreenShell } from "../components/ui";
import { api, appState } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

import { BottomNav } from "./discovery";

interface MyProfileData {
  displayName: string;
  discoverable: boolean;
  profile?: {
    age?: number | null;
    major?: string | null;
    year?: number | null;
    bio?: string | null;
    roomType?: string | null;
    roommateGender?: string | null;
    photos?: string[];
    completed?: boolean;
  } | null;
  verification?: {
    status?: "PENDING" | "VERIFIED" | "REJECTED";
  } | null;
  answers?: unknown[];
}
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
        back={() => go("feed")}
        right={`${items.filter((x) => !x.readAt).length} new`}
      />
      {items.length ? (
        items.map((x) => (
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
  const [profile, setProfile] = useState<MyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;

  const loadProfile = async () => {
    try {
      setLoading(true);
      setProfile(await api<MyProfileData>("/api/me"));
    } catch (reason) {
      Alert.alert(
        "Profile",
        reason instanceof Error ? reason.message : "Unable to load profile",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    Animated.spring(entrance, {
      toValue: 1,
      speed: 12,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const toggleDiscoverable = async (discoverable: boolean) => {
    if (!profile || savingVisibility) return;
    const previous = profile.discoverable;
    setProfile({ ...profile, discoverable });
    try {
      setSavingVisibility(true);
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ discoverable }),
      });
    } catch (reason) {
      setProfile({ ...profile, discoverable: previous });
      Alert.alert(
        "Account status",
        reason instanceof Error ? reason.message : "Unable to update status",
      );
    } finally {
      setSavingVisibility(false);
    }
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={profileStyle.safe}>
        <View style={profileStyle.loading}>
          <ActivityIndicator size="large" color={C.orange} />
          <Text style={profileStyle.loadingText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={profileStyle.safe}>
        <View style={profileStyle.loading}>
          <Text style={profileStyle.cardTitle}>Couldn’t load your profile</Text>
          <Pressable onPress={loadProfile} style={profileStyle.retryButton}>
            <Text style={profileStyle.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const details = profile.profile;
  const photos = details?.photos ?? [];
  const strengthItems = [
    profile.displayName,
    details?.age,
    details?.major,
    details?.year,
    details?.bio,
    details?.roomType,
    details?.roommateGender,
    photos[0],
    photos[1],
    profile.answers?.length,
  ];
  const profileStrength = Math.max(
    10,
    Math.round(
      (strengthItems.filter((value) => Boolean(value)).length /
        strengthItems.length) *
        100,
    ),
  );
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "R";
  const verified = profile.verification?.status === "VERIFIED";

  return (
    <SafeAreaView style={profileStyle.safe}>
      <Animated.View
        style={[
          profileStyle.flex,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={profileStyle.page}
          showsVerticalScrollIndicator={false}
        >
          <View style={profileStyle.header}>
            <Text style={profileStyle.pageTitle}>My Profile</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
              onPress={() => go("settings")}
              style={({ pressed }) => [
                profileStyle.settingsButton,
                pressed && profileStyle.pressed,
              ]}
            >
              <Text style={profileStyle.settingsIcon}>☰</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => go("basics")}
            style={({ pressed }) => [
              profileStyle.card,
              profileStyle.identityCard,
              pressed && profileStyle.pressed,
            ]}
          >
            <View style={profileStyle.avatarWrap}>
              <View style={profileStyle.profileAvatar}>
                {photos[0] ? (
                  <Image
                    source={{ uri: photos[0] }}
                    style={profileStyle.avatarImage}
                  />
                ) : (
                  <Text style={profileStyle.avatarInitial}>{initial}</Text>
                )}
              </View>
              <View style={profileStyle.editBadge}>
                <Text style={profileStyle.editBadgeText}>⌁</Text>
              </View>
            </View>
            <View style={profileStyle.identityCopy}>
              <Text numberOfLines={1} style={profileStyle.name}>
                {profile.displayName}
                {details?.age ? `, ${details.age}` : ""}
              </Text>
              <Text numberOfLines={1} style={profileStyle.meta}>
                {details?.major || "Add your major"}
                {details?.year ? ` · Year ${details.year}` : ""}
              </Text>
              <View
                style={[
                  profileStyle.verificationPill,
                  !verified && profileStyle.pendingPill,
                ]}
              >
                <Text
                  style={[
                    profileStyle.verificationText,
                    !verified && profileStyle.pendingText,
                  ]}
                >
                  {verified ? "✓ SUT Verified" : "◷ Verification pending"}
                </Text>
              </View>
            </View>
          </Pressable>

          <View style={profileStyle.card}>
            <View style={profileStyle.rowBetween}>
              <Text style={profileStyle.cardTitle}>Profile strength</Text>
              <Text style={profileStyle.strengthPercent}>
                {profileStrength}%
              </Text>
            </View>
            <View style={profileStyle.strengthTrack}>
              <View
                style={[
                  profileStyle.strengthFill,
                  { width: `${profileStrength}%` },
                ]}
              />
            </View>
            <Text style={profileStyle.description}>
              {photos.length < 3
                ? `Add ${photos.length === 2 ? "a 3rd" : "more"} photo to reach 100% and get seen more.`
                : "Your profile is ready to be discovered."}
            </Text>
          </View>

          {[
            {
              title: "Photos",
              description: `${photos.length} of 3 uploaded`,
              screen: "basics" as Screen,
            },
            {
              title: "Basics & bio",
              description: "Name, major, room type, preference",
              screen: "basics" as Screen,
            },
          ].map((item) => (
            <Pressable
              key={item.title}
              onPress={() => go(item.screen)}
              style={({ pressed }) => [
                profileStyle.card,
                profileStyle.linkCard,
                pressed && profileStyle.pressed,
              ]}
            >
              <View>
                <Text style={profileStyle.cardTitle}>{item.title}</Text>
                <Text style={profileStyle.description}>{item.description}</Text>
              </View>
              <Text style={profileStyle.chevron}>›</Text>
            </Pressable>
          ))}

          <View style={[profileStyle.card, profileStyle.questionnaireCard]}>
            <View style={profileStyle.questionnaireCopy}>
              <Text style={profileStyle.questionnaireTitle}>
                Lifestyle questionnaire
              </Text>
              <Text style={profileStyle.description}>
                {profile.answers?.length
                  ? "Completed · affects all match scores"
                  : "Not completed · improve your matches"}
              </Text>
            </View>
            <Pressable
              onPress={() => go("intro")}
              style={({ pressed }) => [
                profileStyle.retakeButton,
                pressed && profileStyle.pressed,
              ]}
            >
              <Text style={profileStyle.retakeText}>
                {profile.answers?.length ? "Retake" : "Start"}
              </Text>
            </Pressable>
          </View>

          <View style={[profileStyle.card, profileStyle.statusCard]}>
            <View style={profileStyle.statusCopy}>
              <Text style={profileStyle.cardTitle}>Account status</Text>
              <Text style={profileStyle.description}>
                {profile.discoverable
                  ? "Active · visible in Discover"
                  : "Hidden · not visible in Discover"}
              </Text>
            </View>
            <Switch
              value={profile.discoverable}
              disabled={savingVisibility}
              onValueChange={toggleDiscoverable}
              trackColor={{ false: "#D8CEC9", true: "#FF4B24" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D8CEC9"
            />
          </View>
        </ScrollView>
        <BottomNav screen="myprofile" go={go} />
      </Animated.View>
    </SafeAreaView>
  );
}

const profileStyle = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#FCF9F7" },
  page: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 14,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 30,
  },
  loadingText: {
    color: C.muted,
    fontFamily: "NotoSansThai_400Regular",
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: C.orange,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: "NotoSansThai_700Bold",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    color: C.ink,
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 22,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { color: C.wine, fontSize: 20, transform: [{ rotate: "90deg" }] },
  card: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 19,
    shadowColor: "#4B272C",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  identityCard: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  avatarWrap: { position: "relative" },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F27D20",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: {
    color: "#FFFFFF",
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 32,
  },
  editBadge: {
    position: "absolute",
    right: -3,
    bottom: -1,
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  editBadgeText: { color: "#FFFFFF", fontSize: 16 },
  identityCopy: { flex: 1, alignItems: "flex-start" },
  name: {
    color: C.ink,
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 19,
  },
  meta: {
    color: C.muted,
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  verificationPill: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#A9DDC2",
    borderRadius: 18,
    backgroundColor: "#EBFAF2",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pendingPill: { borderColor: "#F0D4A1", backgroundColor: "#FFF7E6" },
  verificationText: {
    color: "#16834E",
    fontFamily: "NotoSansThai_600SemiBold",
    fontSize: 12,
  },
  pendingText: { color: "#A66C0E" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: C.ink,
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 17,
  },
  strengthPercent: {
    color: "#C88700",
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 17,
  },
  strengthTrack: {
    height: 9,
    borderRadius: 6,
    backgroundColor: "#EAE0DC",
    marginTop: 14,
    marginBottom: 11,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: C.orange,
  },
  description: {
    color: C.muted,
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
  },
  linkCard: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chevron: { color: "#C7B4B5", fontSize: 28 },
  questionnaireCard: {
    minHeight: 126,
    borderColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  questionnaireCopy: { flex: 1 },
  questionnaireTitle: {
    color: "#EA431C",
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 16,
  },
  retakeButton: {
    borderRadius: 16,
    backgroundColor: "#FFF0E9",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  retakeText: {
    color: "#EF481E",
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 14,
  },
  statusCard: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusCopy: { flex: 1, paddingRight: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
