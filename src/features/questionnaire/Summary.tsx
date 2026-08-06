import { ArrowRight, Check, CheckCircle2, PartyPopper } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { appState } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { summaryStyles } from "./questionnaire.styles";

export function Summary({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();

  return (
    <SafeAreaView style={summaryStyles.safeArea}>
      <ScrollView
        contentContainerStyle={summaryStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={summaryStyles.heroBox}>
          <View style={summaryStyles.badgeIconCircle}>
            <PartyPopper size={36} color="#C64338" />
          </View>
          <Text style={summaryStyles.title}>
            {language === "th" ? "โปรไฟล์ของคุณพร้อมใช้งานแล้ว!" : "Your profile is ready!"}
          </Text>
          <Text style={summaryStyles.subText}>
            {language === "th"
              ? "ระบบบันทึกแบบสอบถามเรียบร้อยแล้ว พร้อมที่จะแมตช์คุณกับรูมเมทที่มีไลฟ์สไตล์ตรงกันมากที่สุด"
              : "Lifestyle answers saved. You are ready to match with roommates with similar preferences."}
          </Text>
        </View>

        {/* Profile Card Preview */}
        <Text style={summaryStyles.sectionTitle}>
          {language === "th" ? "ตัวอย่างโปรไฟล์รูมเมทที่จะแสดงให้เพื่อนเห็น" : "Your Roommate Card Preview"}
        </Text>

        <View style={summaryStyles.cardPreview}>
          <View style={summaryStyles.cardAvatarWrap}>
            <View style={summaryStyles.cardAvatar}>
              <Text style={summaryStyles.cardAvatarText}>YOU</Text>
            </View>
          </View>

          <View style={summaryStyles.cardInfo}>
            <View style={summaryStyles.nameRow}>
              <Text style={summaryStyles.cardName}>
                {appState.profileDraft?.displayName || "คุณ (You)"}
              </Text>
              <View style={summaryStyles.verifiedPill}>
                <CheckCircle2 size={12} color="#137333" />
                <Text style={summaryStyles.verifiedPillText}>
                  {language === "th" ? "ยืนยันแล้ว" : "Verified"}
                </Text>
              </View>
            </View>

            <Text style={summaryStyles.cardMeta}>
              {appState.profileDraft?.major || "SUT Student"}
              {appState.profileDraft?.year ? ` · ${language === "th" ? `ปี ${appState.profileDraft.year}` : `Year ${appState.profileDraft.year}`}` : ""}
            </Text>

            <View style={summaryStyles.signalsRow}>
              <View style={summaryStyles.signalChip}>
                <Check size={12} color="#7F232D" />
                <Text style={summaryStyles.signalChipText}>
                  {language === "th" ? "บันทึกคำตอบแล้ว 6 ข้อ" : "6 Questions Answered"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Saved Signals Summary */}
        <View style={summaryStyles.summaryCard}>
          <Text style={summaryStyles.summaryTitle}>
            {language === "th" ? "สรุปสัญญาณความเข้ากันได้ (% Match)" : "Saved Preference Signals"}
          </Text>

          {[
            { label: { th: "ตารางเวลานอน & การตื่น", en: "Sleep & Wake Schedule" }, val: { th: "บันทึกเรียบร้อย", en: "Saved" } },
            { label: { th: "ระดับความสะอาดในห้อง", en: "Cleanliness Standard" }, val: { th: "บันทึกเรียบร้อย", en: "Saved" } },
            { label: { th: "การรับแขก & ช่วงเวลาเงียบสงบ", en: "Guests & Quiet Hours" }, val: { th: "บันทึกเรียบร้อย", en: "Saved" } },
            { label: { th: "อุณหภูมิแอร์ & การอ่านหนังสือ", en: "AC Temp & Study Environment" }, val: { th: "บันทึกเรียบร้อย", en: "Saved" } },
          ].map((item, idx) => (
            <View key={idx} style={summaryStyles.summaryRow}>
              <Text style={summaryStyles.summaryLabel}>{item.label[language === "th" ? "th" : "en"]}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Check size={14} color="#137333" strokeWidth={2.5} />
                <Text style={summaryStyles.summaryValue}>{item.val[language === "th" ? "th" : "en"]}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Continue Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start discovering roommates"
          style={summaryStyles.completeButton}
          onPress={() => go("feed")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={summaryStyles.completeButtonText}>
              {language === "th" ? "เริ่มค้นหาเพื่อนร่วมห้องเลย" : "Start Discovering Roommates"}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

