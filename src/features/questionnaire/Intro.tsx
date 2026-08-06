import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flame,
  Moon,
  Sparkles,
  Target,
  Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import type { Screen } from "../../types/navigation";
import type { AnswerData, QuestionData } from "./questionnaire.content";
import { introStyles, serifFont } from "./questionnaire.styles";

export function Intro({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [me, qsData] = await Promise.all([
        api<{ answers?: AnswerData[] }>("/api/me"),
        api<QuestionData[]>("/api/questionnaire"),
      ]);
      if (!Array.isArray(qsData) || qsData.length === 0) {
        throw new Error("No questionnaire is available yet");
      }
      appState.questions = Object.fromEntries(
        qsData.map((question) => [question.key, question]),
      );
      const saved: Record<string, string[][]> = {};
      me.answers?.forEach((answer) => {
        const question = qsData.find((item) => item.id === answer.questionId);
        if (question) saved[question.key] = answer.selections;
      });
      appState.questionnaireDraft = Object.fromEntries(
        qsData.map((question) => {
          const savedGroups = saved[question.key];
          const mappedActive = question.groups.map((group, groupIndex) => {
            const savedItems = savedGroups?.[groupIndex];
            if (!savedItems?.length) return [...group.active];
            return savedItems
              .map((item) => group.items.indexOf(item))
              .filter((index) => index !== -1);
          });
          return [question.key, mappedActive];
        }),
      );
    } catch (reason) {
      appState.questions = null;
      appState.questionnaireDraft = null;
      setLoadError(
        reason instanceof Error
          ? reason.message
          : "Unable to load questionnaire",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionnaire();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={introStyles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#C64338" />
          <Text style={{ marginTop: 14, fontFamily: serifFont, fontSize: 14, color: "#8D7C75" }}>
            {language === "th" ? "กำลังโหลดแบบสอบถาม…" : "Loading questionnaire…"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={introStyles.safeArea}>
        <View style={[introStyles.container, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={introStyles.heroTitle}>
            {language === "th" ? "โหลดแบบสอบถามไม่ได้" : "Unable to load questionnaire"}
          </Text>
          <Text style={[introStyles.heroSubText, { marginBottom: 20 }]}>{loadError}</Text>
          <Pressable style={introStyles.startButton} onPress={loadQuestionnaire}>
            <Text style={introStyles.startButtonText}>
              {language === "th" ? "ลองอีกครั้ง" : "Try again"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const categories = language === "th" ? [
    { Icon: Moon, title: "1. เวลาตื่นและเวลานอน", sub: "จังหวะชีวิตประจำวันและการเข้านอน" },
    { Icon: Sparkles, title: "2. ความสะอาดและระเบียบ", sub: "เกณฑ์ความสะอาดและการเก็บของในห้อง" },
    { Icon: Users, title: "3. การรับแขกและสังสรรค์", sub: "การพาเพื่อนมาห้องและระดับความเงียบสงบ" },
    { Icon: Flame, title: "4. อ่านหนังสือและอุณหภูมิห้อง", sub: "บรรยากาศการเรียนและระดับแอร์ที่ชอบ" },
  ] : [
    { Icon: Moon, title: "1. Sleep & Wake Schedule", sub: "Daily rhythm and sleeping habits" },
    { Icon: Sparkles, title: "2. Cleanliness & Routines", sub: "Cleanliness standard and room tidy habits" },
    { Icon: Users, title: "3. Guests & Socializing", sub: "Bringing guests over and quiet hours preference" },
    { Icon: Flame, title: "4. Study & Room Temperature", sub: "Study environment and preferred AC temperature" },
  ];

  return (
    <SafeAreaView style={introStyles.safeArea}>
      <ScrollView
        contentContainerStyle={introStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={introStyles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back to housing screen"
            style={introStyles.backButton}
            onPress={() => go("housing")}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <View style={introStyles.stepBadge}>
            <Text style={introStyles.stepBadgeText}>
              {language === "th" ? "ขั้นตอนที่ 3 จาก 3" : "Step 3 of 3"}
            </Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={introStyles.heroBox}>
          <View style={introStyles.heroIconCircle}>
            <Target size={28} color="#C64338" />
          </View>
          <Text style={introStyles.heroTitle}>
            {language === "th" ? "มาดูสไตล์การอยู่อาศัยของคุณกัน" : "Discover your living style"}
          </Text>
          <Text style={introStyles.heroSubText}>
            {language === "th"
              ? "ตอบแบบสอบถามสั้น ๆ เพื่อให้ระบบคำนวณคะแนนความเข้ากันได้ (% Match) กับเพื่อนร่วมห้อง"
              : "Answer a short questionnaire to help calculate your compatibility score (% Match) with roommates"}
          </Text>
        </View>

        {/* Categories Preview Grid */}
        <Text style={introStyles.sectionTitle}>
          {language === "th" ? "หัวข้อที่จะสอบถาม (4 ด้านหลัก)" : "Questionnaire Pillars (4 main topics)"}
        </Text>

        <View style={introStyles.categoriesGrid}>
          {categories.map((cat, idx) => {
            const Icon = cat.Icon;
            return (
              <View key={idx} style={introStyles.catCard}>
                <View style={introStyles.catIconBox}>
                  <Icon size={18} color="#C64338" />
                </View>
                <View style={introStyles.catInfo}>
                  <Text style={introStyles.catTitle}>{cat.title}</Text>
                  <Text style={introStyles.catSub}>{cat.sub}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Banner */}
        <View style={introStyles.infoBanner}>
          <Clock size={16} color="#7F232D" />
          <Text style={introStyles.infoText}>
            {language === "th"
              ? "ใช้เวลาเพียง 2 นาที · แก้ไขย้อนหลังได้ตลอดเวลา"
              : "Takes only 2 minutes · Editable anytime in profile"}
          </Text>
        </View>

        {/* Start Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start questionnaire"
          style={introStyles.startButton}
          onPress={() => go("q1")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={introStyles.startButtonText}>
              {language === "th" ? "เริ่มทำแบบสอบถาม" : "Start Questionnaire"}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

