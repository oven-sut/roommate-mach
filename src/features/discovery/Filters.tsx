import { ArrowRight, Flame, MapPin, Users, X } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import type { Screen } from "../../types/navigation";
import { feedStyles, filterStyles } from "./discovery.styles";

/**
 * Placeholder filters — the selections below are hard-coded and "Apply" just
 * returns to the feed. `/api/discover` does not accept filter parameters yet.
 */
const GENDER_OPTIONS = [
  { label: { th: "ผู้หญิง", en: "Female" }, active: false },
  { label: { th: "ผู้ชาย", en: "Male" }, active: true },
  { label: { th: "ทุกคน", en: "Everyone" }, active: false },
];

const ZONE_OPTIONS = [
  { label: { th: "ประตู 1", en: "Gate 1" }, active: true },
  { label: { th: "ประตู 4", en: "Gate 4" }, active: false },
  { label: { th: "ในมหาวิทยาลัย", en: "On Campus" }, active: false },
  { label: { th: "ทุกโซน", en: "Any Zone" }, active: false },
];

export function Filters({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const locale = language === "th" ? "th" : "en";

  const renderPills = (
    options: { label: { th: string; en: string }; active: boolean }[],
  ) => (
    <View style={filterStyles.pillsRow}>
      {options.map((item, idx) => (
        <Pressable
          key={idx}
          style={[filterStyles.pill, item.active && filterStyles.pillActive]}
        >
          <Text
            style={[
              filterStyles.pillText,
              item.active && filterStyles.pillTextActive,
            ]}
          >
            {item.label[locale]}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "ตัวกรองค้นหา" : "Search Filters"}
          </Text>
          <Pressable onPress={() => go("feed")}>
            <X size={24} color="#7F232D" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={filterStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Users size={18} color="#463826" />
              <Text style={filterStyles.sectionTitle}>
                {language === "th" ? "เพศของรูมเมท" : "Roommate Gender"}
              </Text>
            </View>
            {renderPills(GENDER_OPTIONS)}
          </View>

          <View style={filterStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <MapPin size={18} color="#463826" />
              <Text style={filterStyles.sectionTitle}>
                {language === "th" ? "โซนหอพักที่ต้องการ" : "Preferred Zone"}
              </Text>
            </View>
            {renderPills(ZONE_OPTIONS)}
          </View>

          <View style={filterStyles.sectionCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Flame size={18} color="#C64338" />
              <Text style={filterStyles.sectionTitle}>
                {language === "th"
                  ? "คะแนนความเข้ากันได้ขั้นต่ำ"
                  : "Minimum Match Score"}
              </Text>
            </View>
            <View style={filterStyles.scoreRow}>
              <Text style={filterStyles.scoreValueText}>70%+ Match</Text>
            </View>
          </View>

          <Pressable style={feedStyles.refreshBtn} onPress={() => go("feed")}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={feedStyles.refreshBtnText}>
                {language === "th" ? "บันทึกตัวกรอง" : "Apply Filters"}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
