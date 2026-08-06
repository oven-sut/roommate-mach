import { Heart, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "../../components/BottomNav";
import { PersonRow } from "../../components/PersonRow";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { feedStyles } from "./discovery.styles";

/** People who liked you and are waiting on a decision. */
export function Requests({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
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
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "คนที่ถูกใจคุณ" : "People Who Liked You"}
          </Text>
          <Pressable onPress={() => go("feed")}>
            <X size={24} color="#7F232D" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {likes.map((x) => (
            <PersonRow
              key={x.id}
              p={[
                x.from.displayName,
                language === "th" ? "ถูกใจโปรไฟล์คุณ" : "Liked your profile",
                x.from.profile?.major ?? "SUT Student",
              ]}
              action={language === "th" ? "ถูกใจกลับ ❤️" : "Like Back ❤️"}
              onPress={() => likeBack(x.fromId)}
            />
          ))}

          {!likes.length && (
            <View style={feedStyles.emptyBox}>
              <View style={{ marginBottom: 12 }}>
                <Heart size={44} color="#C64338" fill="#FEEAE6" />
              </View>
              <Text style={feedStyles.emptyTitle}>
                {language === "th"
                  ? "ยังไม่มีคนที่ถูกใจคุณในขณะนี้"
                  : "No likes yet"}
              </Text>
              <Text style={feedStyles.emptySub}>
                {language === "th"
                  ? "เมื่อมีเพื่อนนักศึกษาถูกใจโปรไฟล์ของคุณ จะปรากฏขึ้นที่นี่เพื่อกดถูกใจกลับ"
                  : "When students like your profile, they will appear here!"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomNav screen="matches" go={go} />
    </SafeAreaView>
  );
}
