import {
  AlertTriangle,
  ArrowLeft,
  Flame,
  MessageCircle,
  ShieldCheck,
} from "lucide-react-native";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { appState, formatImageUri } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { profileStyle, serifFont } from "./profile.styles";

/** Someone else's profile, opened from a card in the discovery feed. */
export function Profile({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const p = appState.activeProfile;
  const photo = formatImageUri(p?.profile?.photos?.[0]);
  const verified = p?.verification?.status === "VERIFIED";

  return (
    <SafeAreaView style={profileStyle.safe}>
      <ScrollView
        contentContainerStyle={profileStyle.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={profileStyle.header}>
          <Pressable
            style={profileStyle.settingsButton}
            onPress={() => go("matches")}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={profileStyle.pageTitle}>
            {language === "th" ? "โปรไฟล์รูมเมท" : "Roommate Profile"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={profileStyle.identityCard}>
          <View style={profileStyle.avatarWrap}>
            <View style={profileStyle.profileAvatar}>
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={profileStyle.avatarImage}
                />
              ) : (
                <Text style={profileStyle.avatarInitial}>
                  {p?.displayName?.[0]?.toUpperCase() ?? "R"}
                </Text>
              )}
            </View>
          </View>

          <View style={profileStyle.identityCopy}>
            <Text style={profileStyle.name}>
              {p?.displayName ?? "Roomie"}, {p?.profile?.age ?? "–"}
            </Text>
            <Text style={profileStyle.meta}>
              {p?.profile?.major ?? "SUT Student"} ·{" "}
              {language === "th"
                ? `ปี ${p?.profile?.year ?? "–"}`
                : `Year ${p?.profile?.year ?? "–"}`}
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
                <ShieldCheck size={12} color={verified ? "#137333" : "#B06000"} />
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
                      ? "นักศึกษา SUT"
                      : "SUT Student"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={profileStyle.sectionCard}>
          <View style={profileStyle.rowBetween}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Flame size={16} color="#C64338" fill="#C64338" />
              <Text style={profileStyle.cardTitle}>
                {language === "th"
                  ? "คะแนนความเข้ากันได้ (% Match)"
                  : "% Compatibility Score"}
              </Text>
            </View>
            <Text style={profileStyle.strengthPercent}>{p?.score ?? 92}%</Text>
          </View>
          <View style={profileStyle.strengthTrack}>
            <View
              style={[
                profileStyle.strengthFill,
                { width: `${p?.score ?? 92}%` },
              ]}
            />
          </View>
          <Text style={profileStyle.description}>
            “
            {p?.profile?.bio ||
              (language === "th"
                ? "กำลังตามหารูมเมทที่เข้ากันได้"
                : "Looking for a compatible roommate.")}
            ”
          </Text>
        </View>

        <View style={profileStyle.sectionCard}>
          <Text style={profileStyle.cardTitle}>
            {language === "th"
              ? "โซนหอพัก & ประเภทห้อง"
              : "Housing Preferences"}
          </Text>
          <Text style={[profileStyle.description, { marginTop: 4 }]}>
            {language === "th" ? "โซน:" : "Zone:"}{" "}
            {p?.profile?.zone ?? (language === "th" ? "ทุกโซน" : "Any zone")} ·{" "}
            {language === "th" ? "ห้อง:" : "Room:"}{" "}
            {p?.profile?.roomType ?? "Any"}
          </Text>
        </View>

        <Pressable
          style={[
            profileStyle.retryButton,
            { marginTop: 12, alignItems: "center" },
          ]}
          onPress={() => go("messages")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MessageCircle size={18} color="#FFFFFF" />
            <Text style={profileStyle.retryText}>
              {language === "th" ? "เริ่มแชท" : "Start Chat"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={{ marginTop: 16, alignItems: "center" }}
          onPress={() => go("report")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} color="#C64338" />
            <Text
              style={{
                fontFamily: serifFont,
                fontSize: 13,
                color: "#C64338",
                fontWeight: "bold",
              }}
            >
              {language === "th"
                ? "รายงานหรือบล็อกผู้ใช้นี้"
                : "Report or Block User"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
