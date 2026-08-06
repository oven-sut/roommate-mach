import {
  ChevronRight,
  Eye,
  FileText,
  Image as ImageIcon,
  Pencil,
  Settings,
  ShieldCheck,
  Target,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "../../components/BottomNav";
import { useI18n } from "../../i18n";
import { api, formatImageUri } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { profileStyle } from "./profile.styles";
import type { MyProfileData } from "./types";

/** Never show 0% — an account always has at least an email behind it. */
const MIN_STRENGTH = 10;
/** Photos considered a "complete" gallery. */
const TARGET_PHOTOS = 3;

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

  /** Optimistic: flip the switch immediately, roll back if the save fails. */
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
            {language === "th"
              ? "กำลังโหลดโปรไฟล์ของคุณ…"
              : "Loading your profile…"}
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
            {language === "th"
              ? "ไม่สามารถโหลดโปรไฟล์ได้"
              : "Couldn't load your profile"}
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

  // Completion is the share of these fields that carry a value.
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
    MIN_STRENGTH,
    Math.round(
      (strengthItems.filter((value) => Boolean(value)).length /
        strengthItems.length) *
        100,
    ),
  );

  const initial = profile.displayName?.trim()?.charAt(0)?.toUpperCase() || "R";
  const verified = profile.verification?.status === "VERIFIED";
  const avatar = formatImageUri(photos[0]);

  const shortcuts = [
    {
      Icon: ImageIcon,
      title: { th: "จัดการรูปภาพโปรไฟล์", en: "Manage Profile Photos" },
      sub: {
        th: `อัปโหลดแล้ว ${photos.length} จาก ${TARGET_PHOTOS} รูป`,
        en: `${photos.length} of ${TARGET_PHOTOS} photos uploaded`,
      },
      screen: "basics" as Screen,
    },
    {
      Icon: FileText,
      title: {
        th: "แก้ไขข้อมูลส่วนตัว & หอพัก",
        en: "Edit Personal & Housing Info",
      },
      sub: {
        th: "ชื่อ สาขา ประเภทห้อง และงบประมาณ",
        en: "Name, major, room type & budget",
      },
      screen: "basics" as Screen,
    },
    {
      Icon: Target,
      title: { th: "ทำแบบสอบถามไลฟ์สไตล์", en: "Lifestyle Questionnaire" },
      sub: {
        th: profile.answers?.length
          ? "ตอบแล้ว · มีผลต่อคะแนน % Match"
          : "ยังไม่ได้ทำ · เพิ่มความแม่นยำในการจับคู่",
        en: profile.answers?.length
          ? "Completed · affects all match scores"
          : "Not completed · improve your matches",
      },
      screen: "intro" as Screen,
    },
  ];

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

          <Pressable
            onPress={() => go("basics")}
            style={profileStyle.identityCard}
          >
            <View style={profileStyle.avatarWrap}>
              <View style={profileStyle.profileAvatar}>
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={profileStyle.avatarImage}
                  />
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
                {details?.major ||
                  (language === "th" ? "เพิ่มสาขาวิชาของคุณ" : "Add your major")}
                {details?.year
                  ? ` · ${
                      language === "th"
                        ? `ปี ${details.year}`
                        : `Year ${details.year}`
                    }`
                  : ""}
              </Text>
              <View
                style={[
                  profileStyle.verificationPill,
                  !verified && profileStyle.pendingPill,
                ]}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <ShieldCheck
                    size={12}
                    color={verified ? "#137333" : "#B06000"}
                  />
                  <Text
                    style={[
                      profileStyle.verificationText,
                      !verified && profileStyle.pendingText,
                    ]}
                  >
                    {verified
                      ? language === "th"
                        ? "ยืนยันตัวตนแล้ว"
                        : "SUT Verified"
                      : language === "th"
                        ? "อยู่ระหว่างยืนยันตัวตน"
                        : "Verification pending"}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          <View style={profileStyle.sectionCard}>
            <View style={profileStyle.rowBetween}>
              <Text style={profileStyle.cardTitle}>
                {language === "th"
                  ? "ความสมบูรณ์ของโปรไฟล์"
                  : "Profile Completion"}
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
              {photos.length < TARGET_PHOTOS
                ? language === "th"
                  ? "เพิ่มรูปภาพและข้อมูลให้ครบ 100% เพื่อให้รูมเมทค้นพบคุณได้ง่ายขึ้น"
                  : "Add more photos and details to reach 100% and get discovered faster."
                : language === "th"
                  ? "โปรไฟล์ของคุณสมบูรณ์พร้อมสำหรับการจับคู่แล้ว!"
                  : "Your profile is fully ready to be discovered."}
            </Text>
          </View>

          {shortcuts.map((item, idx) => {
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

          <View style={profileStyle.sectionCard}>
            <View style={profileStyle.rowBetween}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <Eye size={16} color="#463826" />
                  <Text style={profileStyle.cardTitle}>
                    {language === "th"
                      ? "เปิดเผยโปรไฟล์ในการจับคู่"
                      : "Profile Discoverability"}
                  </Text>
                </View>
                <Text style={[profileStyle.description, { marginTop: 2 }]}>
                  {profile.discoverable
                    ? language === "th"
                      ? "โปรไฟล์แสดงในการค้นหา"
                      : "Shown in discovery feed"
                    : language === "th"
                      ? "ซ่อนโปรไฟล์ชั่วคราว"
                      : "Hidden from discovery feed"}
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
