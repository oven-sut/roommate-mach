import { AlertTriangle, ArrowLeft, Ban, ChevronRight, UserX } from "lucide-react-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { profileStyle } from "./profile.styles";

type ModerationAction = "unmatch" | "block" | "report";

const ACTIONS = [
  {
    Icon: UserX,
    title: { th: "ยกเลิกการจับคู่ (Unmatch)", en: "Unmatch User" },
    sub: {
      th: "ลบผู้อยู่อาศัยนี้ออกจากรายการแมตช์ของคุณ",
      en: "Remove from your matches list",
    },
    kind: "unmatch" as const,
  },
  {
    Icon: Ban,
    title: { th: "บล็อกผู้ใช้ (Block User)", en: "Block User" },
    sub: {
      th: "ซ่อนและไม่อนุญาตให้เห็นโปรไฟล์อีก",
      en: "Prevent future interactions",
    },
    kind: "block" as const,
  },
  {
    Icon: AlertTriangle,
    title: {
      th: "รายงานพฤติกรรมไม่เหมาะสม (Report)",
      en: "Report Inappropriate Behavior",
    },
    sub: {
      th: "ส่งรายงานให้ทีมงานผู้ดูแลระบบตรวจสอบ",
      en: "Send report to admin team",
    },
    kind: "report" as const,
  },
];

export function Report({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();

  const act = async (kind: ModerationAction) => {
    const targetId = appState.activeProfile?.id;
    if (!targetId) return go("matches");

    try {
      if (kind === "unmatch") {
        await api(`/api/matches/user/${targetId}`, { method: "DELETE" });
      }
      if (kind === "block") {
        await api(`/api/blocks/${targetId}`, { method: "POST" });
      }
      if (kind === "report") {
        await api(`/api/reports/${targetId}`, {
          method: "POST",
          body: JSON.stringify({
            reason: "Inappropriate behavior",
            details: "Submitted from profile",
          }),
        });
      }
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
      <ScrollView
        contentContainerStyle={profileStyle.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={profileStyle.header}>
          <Pressable
            style={profileStyle.settingsButton}
            onPress={() => go("profile")}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={profileStyle.pageTitle}>
            {language === "th" ? "รายงานผู้ใช้" : "Report User"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {ACTIONS.map((item, idx) => {
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
                <Text
                  style={[profileStyle.shortcutTitle, { color: "#C64338" }]}
                >
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
          style={[
            profileStyle.retryButton,
            {
              backgroundColor: "#FAF6F0",
              borderWidth: 1,
              borderColor: "#EADCD3",
              alignItems: "center",
            },
          ]}
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
