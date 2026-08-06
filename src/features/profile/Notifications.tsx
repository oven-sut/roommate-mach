import { ArrowLeft, Bell, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { profileStyle } from "./profile.styles";

export function Notifications({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api("/api/notifications")
      .then(setItems)
      .catch((e) => Alert.alert("Notifications", e.message));
  }, []);

  const markRead = async (id: string) => {
    await api(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((a) =>
      a.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
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
            onPress={() => go("feed")}
          >
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
              onPress={() => markRead(x.id)}
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
                <View
                  style={{
                    backgroundColor: "#C64338",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#FFFFFF",
                      fontWeight: "bold",
                    }}
                  >
                    {language === "th" ? "ใหม่" : "New"}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))
        ) : (
          <View style={profileStyle.sectionCard}>
            <Text style={[profileStyle.description, { textAlign: "center" }]}>
              {language === "th"
                ? "ยังไม่มีการแจ้งเตือนในขณะนี้"
                : "No notifications yet"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
