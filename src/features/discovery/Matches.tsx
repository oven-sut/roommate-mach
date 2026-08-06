import { ArrowRight, Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "../../components/BottomNav";
import { PersonRow } from "../../components/PersonRow";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { feedStyles } from "./discovery.styles";

export function Matches({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    api("/api/matches")
      .then(setMatches)
      .catch((e) => Alert.alert("Matches", e.message));
  }, []);

  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "คู่แมตช์ของคุณ" : "Your Matches"}
          </Text>
          <Pressable onPress={() => go("requests")}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Heart size={16} color="#C64338" fill="#C64338" />
              <Text style={feedStyles.filterBtnText}>
                {matches.length} {language === "th" ? "แมตช์" : "Matches"}
              </Text>
            </View>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {matches.map((m) => (
            <PersonRow
              key={m.id}
              p={[
                m.other?.displayName ?? "รูมเมท",
                `${m.score ?? 90}% Match`,
                m.other?.profile?.major ?? "นักศึกษา SUT",
              ]}
              action={language === "th" ? "แชท 💬" : "Chat 💬"}
              onPress={() => go("messages")}
            />
          ))}

          {!matches.length && (
            <View style={feedStyles.emptyBox}>
              <View style={{ marginBottom: 12 }}>
                <Heart size={44} color="#C64338" fill="#FEEAE6" />
              </View>
              <Text style={feedStyles.emptyTitle}>
                {language === "th"
                  ? "ยังไม่มีคู่แมตช์ในขณะนี้"
                  : "No matches yet"}
              </Text>
              <Text style={feedStyles.emptySub}>
                {language === "th"
                  ? "กดถูกใจโปรไฟล์ที่สนใจ เมื่ออีกฝ่ายถูกใจตอบ ระบบจะจับคู่ทันที!"
                  : "Like profiles in the discover feed. When they like you back, matches will appear here!"}
              </Text>
              <Pressable
                style={feedStyles.refreshBtn}
                onPress={() => go("feed")}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={feedStyles.refreshBtnText}>
                    {language === "th" ? "ไปค้นหารูมเมท" : "Go to Discover"}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomNav screen="matches" go={go} />
    </SafeAreaView>
  );
}
