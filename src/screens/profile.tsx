import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bell,
  ChevronRight,
  Eye,
  FileText,
  Flame,
  Image as ImageIcon,
  MessageCircle,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserX,
} from "lucide-react-native";
import { useI18n } from "../i18n";
import { api, appState } from "../services/api";
import type { Screen } from "../types/navigation";

import { BottomNav } from "./discovery";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

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
    zone?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    photos?: string[];
    completed?: boolean;
  } | null;
  verification?: {
    status?: "PENDING" | "VERIFIED" | "REJECTED";
  } | null;
  answers?: unknown[];
}

export function Profile({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const p = appState.activeProfile;

  return (
    <SafeAreaView style={profileStyle.safe}>
      <ScrollView contentContainerStyle={profileStyle.page} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={profileStyle.header}>
          <Pressable style={profileStyle.settingsButton} onPress={() => go("matches")}>
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={profileStyle.pageTitle}>
            {language === "th" ? "โปรไฟล์รูมเมท" : "Roommate Profile"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Public Profile Hero Card */}
        <View style={profileStyle.identityCard}>
          <View style={profileStyle.avatarWrap}>
            <View style={profileStyle.profileAvatar}>
              {p?.profile?.photos?.[0] ? (
                <Image source={{ uri: p.profile.photos[0] }} style={profileStyle.avatarImage} />
              ) : (
                <Text style={profileStyle.avatarInitial}>{p?.displayName?.[0]?.toUpperCase() ?? "R"}</Text>
              )}
            </View>
          </View>

          <View style={profileStyle.identityCopy}>
            <Text style={profileStyle.name}>
              {p?.displayName ?? "Roomie"}, {p?.profile?.age ?? "–"}
            </Text>
            <Text style={profileStyle.meta}>
              {p?.profile?.major ?? "SUT Student"} · {language === "th" ? `ปี ${p?.profile?.year ?? "–"}` : `Year ${p?.profile?.year ?? "–"}`}
            </Text>
            <View
              style={[
                profileStyle.verificationPill,
                p?.verification?.status !== "VERIFIED" && profileStyle.pendingPill,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={12} color={p?.verification?.status === "VERIFIED" ? "#137333" : "#B06000"} />
                <Text
                  style={[
                    profileStyle.verificationText,
                    p?.verification?.status !== "VERIFIED" && profileStyle.pendingText,
                  ]}
                >
                  {p?.verification?.status === "VERIFIED"
                    ? language === "th" ? "ยืนยันตัวตนแล้ว" : "SUT Verified"
                    : language === "th" ? "นักศึกษา SUT" : "SUT Student"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Match Score & Compatibility */}
        <View style={profileStyle.sectionCard}>
          <View style={profileStyle.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Flame size={16} color="#C64338" fill="#C64338" />
              <Text style={profileStyle.cardTitle}>
                {language === "th" ? "คะแนนความเข้ากันได้ (% Match)" : "% Compatibility Score"}
              </Text>
            </View>
            <Text style={profileStyle.strengthPercent}>{p?.score ?? 92}%</Text>
          </View>
          <View style={profileStyle.strengthTrack}>
            <View style={[profileStyle.strengthFill, { width: `${p?.score ?? 92}%` }]} />
          </View>
          <Text style={profileStyle.description}>
            “{p?.profile?.bio || (language === "th" ? "กำลังตามหารูมเมทที่เข้ากันได้" : "Looking for a compatible roommate.")}”
          </Text>
        </View>

        {/* Preferences Summary */}
        <View style={profileStyle.sectionCard}>
          <Text style={profileStyle.cardTitle}>
            {language === "th" ? "โซนหอพัก & ประเภทห้อง" : "Housing Preferences"}
          </Text>
          <Text style={[profileStyle.description, { marginTop: 4 }]}>
            {language === "th" ? "โซน:" : "Zone:"} {p?.profile?.zone ?? (language === "th" ? "ทุกโซน" : "Any zone")} · {language === "th" ? "ห้อง:" : "Room:"} {p?.profile?.roomType ?? "Any"}
          </Text>
        </View>

        {/* Action Buttons */}
        <Pressable
          style={[profileStyle.retryButton, { marginTop: 12, alignItems: "center" }]}
          onPress={() => go("messages")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MessageCircle size={18} color="#FFFFFF" />
            <Text style={profileStyle.retryText}>
              {language === "th" ? "เริ่มแชท" : "Start Chat"}
            </Text>
          </View>
        </Pressable>

        <Pressable style={{ marginTop: 16, alignItems: "center" }} onPress={() => go("report")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} color="#C64338" />
            <Text style={{ fontFamily: serifFont, fontSize: 13, color: "#C64338", fontWeight: "bold" }}>
              {language === "th" ? "รายงานหรือบล็อกผู้ใช้นี้" : "Report or Block User"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export function MyProfile({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
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
          <ActivityIndicator size="large" color="#C64338" />
          <Text style={profileStyle.loadingText}>
            {language === "th" ? "กำลังโหลดโปรไฟล์ของคุณ…" : "Loading your profile…"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={profileStyle.safe}>
        <View style={profileStyle.loading}>
          <Text style={profileStyle.cardTitle}>
            {language === "th" ? "ไม่สามารถโหลดโปรไฟล์ได้" : "Couldn't load your profile"}
          </Text>
          <Pressable onPress={loadProfile} style={profileStyle.retryButton}>
            <Text style={profileStyle.retryText}>
              {language === "th" ? "ลองอีกครั้ง" : "Try Again"}
            </Text>
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
  const initial = profile.displayName?.trim()?.charAt(0)?.toUpperCase() || "R";
  const verified = profile.verification?.status === "VERIFIED";

  return (
    <SafeAreaView style={profileStyle.safe}>
      <Animated.View
        style={[
          { flex: 1 },
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
          {/* Header Bar */}
          <View style={profileStyle.header}>
            <Text style={profileStyle.pageTitle}>
              {language === "th" ? "โปรไฟล์ของฉัน" : "My Profile"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => go("settings")}
              style={profileStyle.settingsButton}
            >
              <Settings size={18} color="#463826" />
            </Pressable>
          </View>

          {/* Identity Hero Card */}
          <Pressable
            onPress={() => go("basics")}
            style={profileStyle.identityCard}
          >
            <View style={profileStyle.avatarWrap}>
              <View style={profileStyle.profileAvatar}>
                {photos[0] ? (
                  <Image source={{ uri: photos[0] }} style={profileStyle.avatarImage} />
                ) : (
                  <Text style={profileStyle.avatarInitial}>{initial}</Text>
                )}
              </View>
              <View style={profileStyle.editBadge}>
                <Pencil size={11} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            <View style={profileStyle.identityCopy}>
              <Text numberOfLines={1} style={profileStyle.name}>
                {profile.displayName}
                {details?.age ? `, ${details.age}` : ""}
              </Text>
              <Text numberOfLines={1} style={profileStyle.meta}>
                {details?.major || (language === "th" ? "เพิ่มสาขาวิชาของคุณ" : "Add your major")}
                {details?.year ? ` · ${language === "th" ? `ปี ${details.year}` : `Year ${details.year}`}` : ""}
              </Text>
              <View
                style={[
                  profileStyle.verificationPill,
                  !verified && profileStyle.pendingPill,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={12} color={verified ? "#137333" : "#B06000"} />
                  <Text
                    style={[
                      profileStyle.verificationText,
                      !verified && profileStyle.pendingText,
                    ]}
                  >
                    {verified
                      ? language === "th" ? "ยืนยันตัวตนแล้ว" : "SUT Verified"
                      : language === "th" ? "อยู่ระหว่างยืนยันตัวตน" : "Verification pending"}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Profile Strength Card */}
          <View style={profileStyle.sectionCard}>
            <View style={profileStyle.rowBetween}>
              <Text style={profileStyle.cardTitle}>
                {language === "th" ? "ความสมบูรณ์ของโปรไฟล์" : "Profile Completion"}
              </Text>
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
                ? language === "th"
                  ? "เพิ่มรูปภาพและข้อมูลให้ครบ 100% เพื่อให้รูมเมทค้นพบคุณได้ง่ายขึ้น"
                  : "Add more photos and details to reach 100% and get discovered faster."
                : language === "th"
                  ? "โปรไฟล์ของคุณสมบูรณ์พร้อมสำหรับการจับคู่แล้ว!"
                  : "Your profile is fully ready to be discovered."}
            </Text>
          </View>

          {/* Shortcut Cards */}
          {[
            {
              Icon: ImageIcon,
              title: { th: "จัดการรูปภาพโปรไฟล์", en: "Manage Profile Photos" },
              sub: { th: `อัปโหลดแล้ว ${photos.length} จาก 3 รูป`, en: `${photos.length} of 3 photos uploaded` },
              screen: "basics" as Screen,
            },
            {
              Icon: FileText,
              title: { th: "แก้ไขข้อมูลส่วนตัว & หอพัก", en: "Edit Personal & Housing Info" },
              sub: { th: "ชื่อ สาขา ประเภทห้อง และงบประมาณ", en: "Name, major, room type & budget" },
              screen: "basics" as Screen,
            },
            {
              Icon: Target,
              title: { th: "ทำแบบสอบถามไลฟ์สไตล์", en: "Lifestyle Questionnaire" },
              sub: {
                th: profile.answers?.length ? "ตอบแล้ว · มีผลต่อคะแนน % Match" : "ยังไม่ได้ทำ · เพิ่มความแม่นยำในการจับคู่",
                en: profile.answers?.length ? "Completed · affects all match scores" : "Not completed · improve your matches",
              },
              screen: "intro" as Screen,
            },
          ].map((item, idx) => {
            const Icon = item.Icon;
            return (
              <Pressable
                key={idx}
                onPress={() => go(item.screen)}
                style={profileStyle.shortcutRow}
              >
                <View style={profileStyle.shortcutIconBox}>
                  <Icon size={20} color="#C64338" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={profileStyle.shortcutTitle}>
                    {item.title[language === "th" ? "th" : "en"]}
                  </Text>
                  <Text style={profileStyle.shortcutSub}>
                    {item.sub[language === "th" ? "th" : "en"]}
                  </Text>
                </View>
                <ChevronRight size={18} color="#8D7C75" />
              </Pressable>
            );
          })}

          {/* Visibility Switch Card */}
          <View style={profileStyle.sectionCard}>
            <View style={profileStyle.rowBetween}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Eye size={16} color="#463826" />
                  <Text style={profileStyle.cardTitle}>
                    {language === "th" ? "เปิดเผยโปรไฟล์ในการจับคู่" : "Profile Discoverability"}
                  </Text>
                </View>
                <Text style={[profileStyle.description, { marginTop: 2 }]}>
                  {profile.discoverable
                    ? language === "th" ? "โปรไฟล์แสดงในการค้นหา" : "Shown in discovery feed"
                    : language === "th" ? "ซ่อนโปรไฟล์ชั่วคราว" : "Hidden from discovery feed"}
                </Text>
              </View>
              <Switch
                value={profile.discoverable}
                trackColor={{ true: "#C64338", false: "#EADCD3" }}
                onValueChange={toggleDiscoverable}
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
      <BottomNav screen="myprofile" go={go} />
    </SafeAreaView>
  );
}

export function Notifications({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api("/api/notifications")
      .then(setItems)
      .catch((e) => Alert.alert("Notifications", e.message));
  }, []);

  return (
    <SafeAreaView style={profileStyle.safe}>
      <ScrollView contentContainerStyle={profileStyle.page} showsVerticalScrollIndicator={false}>
        <View style={profileStyle.header}>
          <Pressable style={profileStyle.settingsButton} onPress={() => go("feed")}>
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={profileStyle.pageTitle}>
            {language === "th" ? "การแจ้งเตือน" : "Notifications"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {items.length ? (
          items.map((x) => (
            <Pressable
              key={x.id}
              style={profileStyle.shortcutRow}
              onPress={async () => {
                await api(`/api/notifications/${x.id}/read`, { method: "PATCH" });
                setItems((a) =>
                  a.map((n) =>
                    n.id === x.id ? { ...n, readAt: new Date().toISOString() } : n,
                  ),
                );
              }}
            >
              <View style={profileStyle.shortcutIconBox}>
                {x.type === "match" ? (
                  <Sparkles size={20} color="#C64338" />
                ) : x.type === "like" ? (
                  <Sparkles size={20} color="#C64338" fill="#C64338" />
                ) : (
                  <Bell size={20} color="#C64338" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={profileStyle.shortcutTitle}>{x.title}</Text>
                <Text style={profileStyle.shortcutSub}>{x.body}</Text>
              </View>
              {!x.readAt ? (
                <View style={{ backgroundColor: "#C64338", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, color: "#FFFFFF", fontWeight: "bold" }}>
                    {language === "th" ? "ใหม่" : "New"}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))
        ) : (
          <View style={profileStyle.sectionCard}>
            <Text style={[profileStyle.description, { textAlign: "center" }]}>
              {language === "th" ? "ยังไม่มีการแจ้งเตือนในขณะนี้" : "No notifications yet"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Report({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();

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
    <SafeAreaView style={profileStyle.safe}>
      <ScrollView contentContainerStyle={profileStyle.page} showsVerticalScrollIndicator={false}>
        <View style={profileStyle.header}>
          <Pressable style={profileStyle.settingsButton} onPress={() => go("profile")}>
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={profileStyle.pageTitle}>
            {language === "th" ? "รายงานผู้ใช้" : "Report User"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {[
          {
            Icon: UserX,
            title: { th: "ยกเลิกการจับคู่ (Unmatch)", en: "Unmatch User" },
            sub: { th: "ลบผู้อยู่อาศัยนี้ออกจากรายการแมตช์ของคุณ", en: "Remove from your matches list" },
            kind: "unmatch" as const,
          },
          {
            Icon: Ban,
            title: { th: "บล็อกผู้ใช้ (Block User)", en: "Block User" },
            sub: { th: "ซ่อนและไม่อนุญาตให้เห็นโปรไฟล์อีก", en: "Prevent future interactions" },
            kind: "block" as const,
          },
          {
            Icon: AlertTriangle,
            title: { th: "รายงานพฤติกรรมไม่เหมาะสม (Report)", en: "Report Inappropriate Behavior" },
            sub: { th: "ส่งรายงานให้ทีมงานผู้ดูแลระบบตรวจสอบ", en: "Send report to admin team" },
            kind: "report" as const,
          },
        ].map((item, idx) => {
          const Icon = item.Icon;
          return (
            <Pressable
              key={idx}
              style={profileStyle.shortcutRow}
              onPress={() => act(item.kind)}
            >
              <View style={profileStyle.shortcutIconBox}>
                <Icon size={18} color="#C64338" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[profileStyle.shortcutTitle, { color: "#C64338" }]}>
                  {item.title[language === "th" ? "th" : "en"]}
                </Text>
                <Text style={profileStyle.shortcutSub}>
                  {item.sub[language === "th" ? "th" : "en"]}
                </Text>
              </View>
              <ChevronRight size={18} color="#8D7C75" />
            </Pressable>
          );
        })}

        <Pressable
          style={[profileStyle.retryButton, { backgroundColor: "#FAF6F0", borderWidth: 1, borderColor: "#EADCD3", alignItems: "center" }]}
          onPress={() => go("profile")}
        >
          <Text style={[profileStyle.retryText, { color: "#463826" }]}>
            {language === "th" ? "ยกเลิก" : "Cancel"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const profileStyle = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  page: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: serifFont,
    fontSize: 24,
    fontWeight: "bold",
    color: "#463826",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  settingsIcon: {
    fontSize: 18,
  },
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrap: {
    position: "relative",
    marginRight: 16,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: serifFont,
    fontSize: 28,
    fontWeight: "bold",
    color: "#7F232D",
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  editBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  identityCopy: {
    flex: 1,
  },
  name: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 2,
  },
  meta: {
    fontFamily: serifFont,
    fontSize: 13,
    color: "#8D7C75",
    marginBottom: 8,
  },
  verificationPill: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CEEAD6",
  },
  pendingPill: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFE082",
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#137333",
  },
  pendingText: {
    color: "#B06000",
  },
  sectionCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
  },
  strengthPercent: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#C64338",
  },
  strengthTrack: {
    height: 8,
    backgroundColor: "#EADCD3",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  strengthFill: {
    height: "100%",
    backgroundColor: "#C64338",
    borderRadius: 4,
  },
  description: {
    fontFamily: serifFont,
    fontSize: 13,
    color: "#74675E",
    lineHeight: 18,
  },
  shortcutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  shortcutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shortcutTitle: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 2,
  },
  shortcutSub: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
  },
  chevron: {
    fontSize: 18,
    color: "#8D7C75",
    fontWeight: "bold",
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: serifFont,
    color: "#8D7C75",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#C64338",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
