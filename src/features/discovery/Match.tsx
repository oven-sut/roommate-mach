import { MessageCircle, Sparkles } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import type { Screen } from "../../types/navigation";
import { feedStyles, matchStyles } from "./discovery.styles";

/**
 * The "it's a match" celebration shown after a mutual like.
 *
 * The score and initials are still placeholder copy — the screen does not read
 * the match it is celebrating.
 */
export function Match({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();

  return (
    <SafeAreaView style={matchStyles.page}>
      <View style={matchStyles.container}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Sparkles size={20} color="#C64338" />
          <Text style={matchStyles.eyebrow}>
            {language === "th" ? "ถูกใจกันทั้งคู่!" : "It's a Match!"}
          </Text>
        </View>
        <Text style={matchStyles.title}>
          {language === "th" ? "จับคู่สำเร็จ!" : "Match Successful!"}
        </Text>

        <View style={matchStyles.avatarsRow}>
          <View style={matchStyles.avatarCircle}>
            <Text style={matchStyles.avatarText}>YOU</Text>
          </View>
          <View style={matchStyles.scoreChip}>
            <Text style={matchStyles.scoreChipText}>92% Match</Text>
          </View>
          <View
            style={[
              matchStyles.avatarCircle,
              { backgroundColor: "#FFF0BB", borderColor: "#FFD477" },
            ]}
          >
            <Text style={[matchStyles.avatarText, { color: "#7F232D" }]}>
              SUT
            </Text>
          </View>
        </View>

        <Text style={matchStyles.copyText}>
          {language === "th"
            ? "คุณและคู่แมตช์มีความเข้ากันได้สูงถึง 92% ทั้งเรื่องเวลานอน ความสะอาด และระดับความสงบ!"
            : "You both liked each other — 92% compatible on sleep, cleanliness & quiet hours!"}
        </Text>

        <Pressable style={feedStyles.refreshBtn} onPress={() => go("messages")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MessageCircle size={18} color="#FFFFFF" />
            <Text style={feedStyles.refreshBtnText}>
              {language === "th" ? "เริ่มแชทเลย" : "Start Chatting"}
            </Text>
          </View>
        </Pressable>

        <Pressable style={matchStyles.secondaryBtn} onPress={() => go("feed")}>
          <Text style={matchStyles.secondaryBtnText}>
            {language === "th" ? "ค้นหาต่อ ➔" : "Keep Swiping ➔"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
