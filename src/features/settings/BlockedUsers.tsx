import { ArrowLeft, Ban } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { settingStyles } from "./settings.styles";

export function BlockedUsers({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/blocks")
      .then(setBlocked)
      .catch((e) => Alert.alert("Blocked users", e.message))
      .finally(() => setLoading(false));
  }, []);

  const unblock = async (userId: string) => {
    try {
      await api(`/api/blocks/${userId}`, { method: "DELETE" });
      setBlocked((items) => items.filter((u) => u.id !== userId));
    } catch (e) {
      Alert.alert(
        "Unblock",
        e instanceof Error ? e.message : "Unable to unblock",
      );
    }
  };

  return (
    <SafeAreaView style={settingStyles.safeArea}>
      <ScrollView
        contentContainerStyle={settingStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={settingStyles.headerRow}>
          <Pressable
            style={settingStyles.backButton}
            onPress={() => go("settings")}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={settingStyles.headerTitle}>
            {language === "th" ? "ผู้ใช้ที่บล็อก" : "Blocked Users"}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={settingStyles.sectionCard}>
          {blocked.map((u) => (
            <View key={u.id} style={settingStyles.rowBetween}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                  paddingRight: 8,
                }}
              >
                <Ban size={15} color="#8D7C75" />
                <View style={{ flex: 1 }}>
                  <Text style={settingStyles.rowTitle}>{u.displayName}</Text>
                  <Text style={settingStyles.rowSub}>{u.profile?.major}</Text>
                </View>
              </View>
              <Pressable onPress={() => unblock(u.id)} hitSlop={8}>
                <Text style={settingStyles.unblockAction}>
                  {language === "th" ? "ปลดบล็อก" : "Unblock"}
                </Text>
              </Pressable>
            </View>
          ))}
          {!loading && !blocked.length ? (
            <Text
              style={[
                settingStyles.rowSub,
                { textAlign: "center", paddingVertical: 12 },
              ]}
            >
              {language === "th"
                ? "ยังไม่มีผู้ใช้ที่ถูกบล็อก"
                : "No blocked users yet"}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
