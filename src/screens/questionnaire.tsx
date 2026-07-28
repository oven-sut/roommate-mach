import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Moon,
  PartyPopper,
  Sparkles,
  Target,
  Users,
} from "lucide-react-native";
import { useI18n } from "../i18n";
import { api, appState } from "../services/api";
import type { Screen } from "../types/navigation";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

const next: Partial<Record<Screen, Screen>> = {
  splash: "welcome1",
  welcome1: "welcome2",
  welcome2: "welcome3",
  welcome3: "authChoice",
  signup: "basics",
  basics: "housing",
  housing: "intro",
  intro: "q1",
  q1: "q2",
  q2: "q3",
  q3: "q4",
  q4: "q5",
  q5: "q6",
  q6: "summary",
  summary: "feed",
};

type QuestionData = { id: string; key: string; step: number; title: string; sub: string; groups: { label: string; items: string[]; active: number[] }[]; note?: string };
type AnswerData = { questionId: string; selections: string[][] };

function localizeQuestion(d: QuestionData, lang: "th" | "en"): QuestionData {
  const translations: Record<string, {
    title: { th: string; en: string };
    sub: { th: string; en: string };
    note?: { th: string; en: string };
    groups: {
      label: { th: string; en: string };
      items: Record<string, { th: string; en: string }>;
    }[];
  }> = {
    q1: {
      title: { th: "เวลานอนและจังหวะชีวิต", en: "Sleep & Wake Rhythm" },
      sub: { th: "ระบุเวลาที่คุณมักจะเข้านอนและเริ่มต้นวันใหม่", en: "Tell us when you usually sleep and start your day." },
      note: { th: "พฤติกรรมเหล่านี้ช่วยให้ระบบจับคู่เพื่อนที่มีจังหวะชีวิตตรงกัน", en: "These habits help us match students with similar daily rhythms." },
      groups: [
        {
          label: { th: "เวลาเข้านอนปกติ", en: "Usual Bedtime" },
          items: {
            "21:00 – 22:30": { th: "21:00 – 22:30 น.", en: "9:00 PM – 10:30 PM" },
            "23:00 – 00:30": { th: "23:00 – 00:30 น.", en: "11:00 PM – 12:30 AM" },
            "01:00+": { th: "01:00 น. ขึ้นไป", en: "1:00 AM or later" },
          },
        },
        {
          label: { th: "เวลาตื่นนอนปกติ", en: "Usual Wake-up Time" },
          items: {
            "06:00 – 07:00": { th: "06:00 – 07:00 น.", en: "6:00 AM – 7:00 AM" },
            "07:00 – 08:00": { th: "07:00 – 08:00 น.", en: "7:00 AM – 8:00 AM" },
            "09:00+": { th: "09:00 น. ขึ้นไป", en: "9:00 AM or later" },
          },
        },
      ],
    },
    q2: {
      title: { th: "ความสะอาดและระดับความเรียบร้อย", en: "Cleanliness & Routines" },
      sub: { th: "เลือกระดับความสะอาดยอมรับได้ในห้องนอนและพื้นที่ส่วนรวม", en: "Choose the habits that matter most in a shared room." },
      note: { th: "เรื่องความสะอาดเป็นหนึ่งในปัจจัยหลักของการอยู่ร่วมกันอย่างมีความสุข", en: "Cleanliness is a key factor for comfortable room sharing." },
      groups: [
        {
          label: { th: "เกณฑ์ความสะอาดที่สำคัญ", en: "Key Cleanliness Rules" },
          items: {
            "Spotless": { th: "สะอาดเป็นระเบียบเสมอ", en: "Spotless & tidy always" },
            "Dishes same day": { th: "ล้างจานภายในวันที่กินเสร็จ", en: "Wash dishes on the same day" },
            "Shoes off inside": { th: "ถอดรองเท้าไว้หน้าห้อง", en: "Shoes off inside room" },
            "Make the bed": { th: "เก็บที่นอนทุกเช้า", en: "Make the bed every morning" },
            "Shared cleaning schedule": { th: "มีตารางแบ่งกันทำความสะอาด", en: "Shared cleaning schedule" },
          },
        },
        {
          label: { th: "ระดับความเจ้าระเบียบ (1-5)", en: "Tidiness Rating (1-5)" },
          items: {
            "1/5": { th: "1/5 (สบาย ๆ ไม่ซีเรียส)", en: "1/5 (Very relaxed)" },
            "2/5": { th: "2/5 (พอประมาณ)", en: "2/5 (Moderate)" },
            "3/5": { th: "3/5 (ปานกลางทั่วไป)", en: "3/5 (Balanced)" },
            "4/5": { th: "4/5 (ค่อนข้างเจ้าระเบียบ)", en: "4/5 (Quite tidy)" },
            "5/5": { th: "5/5 (เป๊ะเนี๊ยบทุกจุด)", en: "5/5 (Extremely neat)" },
          },
        },
      ],
    },
    q3: {
      title: { th: "การรับแขกและความเงียบสงบ", en: "Guests & Social Energy" },
      sub: { th: "กำหนดข้อตกลงเกี่ยวกับการพาเพื่อนมาห้องและระดับเสียง", en: "Set expectations for visitors and shared social time." },
      note: { th: "ช่วยป้องกันข้อขัดแย้งเรื่องความเป็นส่วนตัวและเวลาพักผ่อน", en: "Prevents conflicts regarding privacy and quiet rest hours." },
      groups: [
        {
          label: { th: "การพาเพื่อนหรือแขกมาที่ห้อง", en: "Guests in the Room" },
          items: {
            "Rarely": { th: "นาน ๆ ครั้ง / แทบไม่มี", en: "Rarely / Almost never" },
            "Sometimes": { th: "ปานกลาง (แจ้งล่วงหน้า)", en: "Sometimes (Notify in advance)" },
            "Often": { th: "บ่อยครั้ง / เป็นประจำ", en: "Often / Frequently" },
          },
        },
        {
          label: { th: "บุคคลที่มักจะพามาห้อง", en: "Who Might Visit?" },
          items: {
            "Close friends": { th: "เพื่อนสนิท", en: "Close friends" },
            "Study group": { th: "เพื่อนกลุ่มติวหนังสือ", en: "Study group" },
            "Family": { th: "ครอบครัว / ญาติ", en: "Family" },
            "Partner": { th: "แฟน / คนคุย", en: "Partner" },
          },
        },
        {
          label: { th: "ระดับพลังงานในการสังสรรค์", en: "Social Energy" },
          items: {
            "Quiet": { th: "ชอบความสงบเป็นส่วนตัว", en: "Quiet & introverted" },
            "Balanced": { th: "ปานกลาง ปรับตามโอกาส", en: "Balanced & adaptable" },
            "Very social": { th: "ชอบพูดคุยสังสรรค์เฮฮา", en: "Very social & extroverted" },
          },
        },
      ],
    },
    q4: {
      title: { th: "บรรยากาศการเรียนและอุณหภูมิห้อง", en: "Temperature & Study Setup" },
      sub: { th: "ตั้งค่าสภาพแวดล้อมที่ชอบสำหรับอ่านหนังสือและการปรับแอร์", en: "Help us understand how you work best in your room." },
      note: { th: "ปรับตั้งค่าให้เหมาะกับไลฟ์สไตล์การอ่านหนังสือและการนอนของคุณ", en: "Helps match study atmosphere and air conditioning preferences." },
      groups: [
        {
          label: { th: "อุณหภูมิเครื่องปรับอากาศที่ชอบ", en: "Preferred AC Temperature" },
          items: {
            "22–24°": { th: "22–24 °C (ชอบเย็นฉ่ำ)", en: "22–24 °C (Cool)" },
            "25–26°": { th: "25–26 °C (กำลังดีสบายตัว)", en: "25–26 °C (Standard)" },
            "27°+": { th: "27 °C ขึ้นไป / พัดลม", en: "27 °C+ / Fan" },
          },
        },
        {
          label: { th: "ความต้องการความเงียบตอนอ่านหนังสือ", en: "Need for Quiet While Studying" },
          items: {
            "1/5": { th: "1/5 (เปิดเพลงฟังได้สบาย)", en: "1/5 (Music/Background noise ok)" },
            "2/5": { th: "2/5 (เสียงดังพอประมาณ)", en: "2/5 (Mild noise ok)" },
            "3/5": { th: "3/5 (ปานกลาง)", en: "3/5 (Moderate)" },
            "4/5": { th: "4/5 (ค่อนข้างต้องการความสงบ)", en: "4/5 (Quite quiet)" },
            "5/5": { th: "5/5 (เงียบกริบ 100%)", en: "5/5 (Absolute silence)" },
          },
        },
        {
          label: { th: "สถานที่อ่านหนังสือหลัก", en: "Best Study Location" },
          items: {
            "In room": { th: "อ่านหนังสือในห้องนอน", en: "In the bedroom" },
            "Library": { th: "หอสมุดมหาวิทยาลัย", en: "University library" },
            "Cafe / outside room": { th: "ร้านกาแฟ / พื้นที่ส่วนกลาง", en: "Cafe or outdoor study space" },
          },
        },
      ],
    },
    q5: {
      title: { th: "ความสนใจและพฤติกรรมส่วนตัว", en: "Lifestyle Boundaries" },
      sub: { th: "เลือกพฤติกรรมและเงื่อนไขการใช้ชีวิตในห้องพัก", en: "A few practical preferences for daily living." },
      groups: [
        {
          label: { th: "การสูบบุหรี่ / บุหรี่ไฟฟ้า (พอด)", en: "Smoking / Vaping Policy" },
          items: {
            "No": { th: "ไม่สูบเด็ดขาด", en: "Non-smoker strictly" },
            "Okay outdoors only": { th: "สูบนอกห้อง / ระเบียงได้", en: "Outdoors / balcony only" },
            "Okay indoors": { th: "สูบในห้องได้", en: "Okay indoors" },
          },
        },
        {
          label: { th: "การดื่มแอลกอฮอล์", en: "Alcohol Consumption" },
          items: {
            "Never": { th: "ไม่ดื่มเลย", en: "Never drink" },
            "Socially": { th: "ดื่มตามโอกาส / สังสรรค์", en: "Socially on occasions" },
            "Often": { th: "ดื่มบ่อยครั้ง", en: "Drink regularly" },
          },
        },
        {
          label: { th: "สัตว์เลี้ยงในห้อง", en: "Pet Preferences" },
          items: {
            "No pets": { th: "ไม่เลี้ยง / แพ้ขนสัตว์", en: "No pets allowed / allergic" },
            "Okay with some": { th: "เลี้ยงได้บางชนิด", en: "Okay with certain pets" },
            "Love them": { th: "รักสัตว์ เลี้ยงได้สบาย", en: "Pet friendly / love pets" },
          },
        },
      ],
    },
    q6: {
      title: { th: "ข้อตกลงเรื่องค่าใช้จ่ายและการปรับตัว", en: "Money & Shared Expectations" },
      sub: { th: "ตั้งเป้าหมายข้อตกลงร่วมกันกับเพื่อนร่วมห้อง", en: "Align on shared costs and willingness to compromise." },
      groups: [
        {
          label: { th: "การหารค่าใช้จ่ายส่วนกลาง (ค่าน้ำ/ค่าไฟ/ของใช้)", en: "Shared Expense Agreement" },
          items: {
            "Split equally": { th: "หารเท่ากันทุกอย่าง 50/50", en: "Split equally 50/50" },
            "Pay by usage": { th: "จ่ายตามการใช้งานจริง", en: "Pay by actual usage" },
            "Flexible / discuss": { th: "ยืดหยุ่น พูดคุยกันได้", en: "Flexible / discuss together" },
          },
        },
        {
          label: { th: "ระดับความยืดหยุ่นในการปรับตัวเข้าหากัน", en: "Flexibility & Compromise Level" },
          items: {
            "Low": { th: "มีระเบียบชัดเจน ค่อนข้างตายตัว", en: "Low (Strict rules)" },
            "Moderate": { th: "ยืดหยุ่นปานกลาง พออลุ่มอล่วยได้", en: "Moderate (Reasonable)" },
            "High": { th: "ยืดหยุ่นสูง ปรับตัวง่ายเข้ากับทุกคน", en: "High (Very adaptable)" },
          },
        },
      ],
    },
  };

  const tr = translations[d.key];
  if (!tr) return d;

  const currentLang = lang === "th" ? "th" : "en";

  return {
    ...d,
    title: tr.title[currentLang] || d.title,
    sub: tr.sub[currentLang] || d.sub,
    note: tr.note?.[currentLang] || d.note,
    groups: d.groups.map((group, gIdx) => {
      const trGroup = tr.groups[gIdx];
      return {
        ...group,
        label: trGroup?.label[currentLang] || group.label,
        items: group.items.map((item) => {
          const itemTranslation = trGroup?.items?.[item];
          return itemTranslation ? itemTranslation[currentLang] : item;
        }),
      };
    }),
  };
}

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

export function Question({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const { language } = useI18n();
  const rawD = appState.questions?.[screen] as QuestionData;
  const d = rawD ? localizeQuestion(rawD, language) : null;

  if (!appState.questionnaireDraft && rawD) {
    appState.questionnaireDraft = Object.fromEntries(Object.values(appState.questions || {}).map((v) => {
      const q = v as QuestionData;
      return [q.key, q.groups.map((g) => [...g.active])];
    }));
  }
  const [, rerender] = useState(0);

  if (!d) {
    return (
      <SafeAreaView style={qStyles.safeArea}>
        <View style={[qStyles.container, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={qStyles.title}>{language === "th" ? "ไม่พบคำถาม" : "Question not found"}</Text>
          <Text style={qStyles.subText}>The questionnaire data is incomplete or could not be loaded.</Text>
          <Pressable style={qStyles.nextButton} onPress={() => go("intro")}>
            <Text style={qStyles.nextButtonText}>
              {language === "th" ? "กลับไปหน้าแบบสอบถาม" : "Back to intro"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const toggle = (group: number, item: number) => {
    const active = appState.questionnaireDraft?.[screen]?.[group] as number[];
    if (appState.questionnaireDraft && appState.questionnaireDraft[screen]) {
      appState.questionnaireDraft[screen][group] = active.includes(item)
        ? active.filter((x: number) => x !== item)
        : [...active, item];
    }
    rerender((x) => x + 1);
  };

  const proceed = async () => {
    if (screen === "q6") {
      try {
        const answers = Object.fromEntries(
          Object.values(appState.questions || {}).map((value) => {
            const q = value as QuestionData;
            return [
              q.key,
              q.groups.map((g, gi: number) =>
                g.items.filter((_, i: number) => appState.questionnaireDraft?.[q.key]?.[gi]?.includes(i)),
              ),
            ];
          }),
        );
        await api("/api/questionnaire", {
          method: "PUT",
          body: JSON.stringify({ answers, completed: true }),
        });
      } catch (e) {
        Alert.alert(
          "Unable to save",
          e instanceof Error ? e.message : "Please try again",
        );
        return;
      }
    }
    go(next[screen]!);
  };

  const progressPercent = Math.round((d.step / 6) * 100);

  return (
    <SafeAreaView style={qStyles.safeArea}>
      <ScrollView
        contentContainerStyle={qStyles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Progress */}
        <View style={qStyles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to previous step"
            style={qStyles.backButton}
            onPress={() => {
              const prevMap: Record<string, Screen> = {
                q1: "intro",
                q2: "q1",
                q3: "q2",
                q4: "q3",
                q5: "q4",
                q6: "q5",
              };
              go(prevMap[screen] || "intro");
            }}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>

          <View style={qStyles.stepCountBadge}>
            <Text style={qStyles.stepCountText}>
              {language === "th" ? `ข้อ ${d.step} จาก 6` : `Question ${d.step} of 6`}
            </Text>
          </View>
        </View>

        {/* Dynamic Progress Bar */}
        <View style={qStyles.progressTrack}>
          <View style={[qStyles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Question Title & Description */}
        <Text style={qStyles.title}>{d.title}</Text>
        <Text style={qStyles.subText}>{d.sub}</Text>

        {/* Choice Groups */}
        {d.groups.map((group, groupIdx) => {
          const activeIndices =
            (appState.questionnaireDraft?.[screen]?.[groupIdx] as number[]) || [];

          return (
            <View key={groupIdx} style={qStyles.groupCard}>
              <Text style={qStyles.groupLabel}>{group.label}</Text>

              <View style={qStyles.optionsContainer}>
                {group.items.map((itemText, itemIdx) => {
                  const isSelected = activeIndices.includes(itemIdx);

                  return (
                    <Pressable
                      key={itemIdx}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      style={[
                        qStyles.optionChip,
                        isSelected && qStyles.optionChipSelected,
                      ]}
                      onPress={() => toggle(groupIdx, itemIdx)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                        <Text
                          style={[
                            qStyles.optionText,
                            isSelected && qStyles.optionTextSelected,
                          ]}
                        >
                          {itemText}
                        </Text>
                        {isSelected ? (
                          <Check size={16} color="#7F232D" strokeWidth={2.5} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Note Box */}
        {d.note ? (
          <View style={qStyles.noteCard}>
            <Lightbulb size={18} color="#C64338" />
            <Text style={qStyles.noteText}>{d.note}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={d.step === 6 ? "Finish questionnaire" : "Go to next question"}
          style={qStyles.nextButton}
          onPress={proceed}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={qStyles.nextButtonText}>
              {d.step === 6
                ? language === "th" ? "สรุปผลแบบสอบถาม" : "Complete & View Summary"
                : language === "th" ? "ข้อถัดไป" : "Next Question"}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

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

const introStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  backChevron: {
    fontSize: 18,
    color: "#463826",
    fontWeight: "bold",
  },
  stepBadge: {
    backgroundColor: "#FAF6F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  stepBadgeText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#C64338",
  },
  heroBox: {
    backgroundColor: "#FAF6F0",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF0BB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroIconText: {
    fontSize: 28,
  },
  heroTitle: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: "bold",
    color: "#463826",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubText: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#74675E",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 14,
  },
  categoriesGrid: {
    gap: 12,
    marginBottom: 20,
  },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  catIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  catIcon: {
    fontSize: 20,
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 2,
  },
  catSub: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0BB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFD477",
  },
  infoText: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#7F232D",
    flex: 1,
  },
  startButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

const qStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  backChevron: {
    fontSize: 18,
    color: "#463826",
    fontWeight: "bold",
  },
  stepCountBadge: {
    backgroundColor: "#FAF6F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  stepCountText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#C64338",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#EADCD3",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#C64338",
    borderRadius: 3,
  },
  title: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 6,
  },
  subText: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#74675E",
    lineHeight: 20,
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  groupLabel: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#EADCD3",
  },
  optionChipSelected: {
    backgroundColor: "#FFF0BB",
    borderColor: "#FFD477",
  },
  optionText: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#463826",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#7F232D",
    fontWeight: "bold",
  },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF0BB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFD477",
  },
  noteText: {
    fontFamily: serifFont,
    fontSize: 13,
    color: "#7F232D",
    lineHeight: 18,
    flex: 1,
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  nextButtonText: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

const summaryStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  badgeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF0BB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#FFD477",
  },
  heroIconText: {
    fontSize: 34,
  },
  title: {
    fontFamily: serifFont,
    fontSize: 24,
    fontWeight: "bold",
    color: "#463826",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#74675E",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 12,
  },
  cardPreview: {
    backgroundColor: "#FAF6F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
    flexDirection: "row",
    alignItems: "center",
  },
  cardAvatarWrap: {
    marginRight: 14,
  },
  cardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#7F232D",
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardName: {
    fontFamily: serifFont,
    fontSize: 17,
    fontWeight: "bold",
    color: "#463826",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#137333",
  },
  cardMeta: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
    marginBottom: 8,
  },
  signalsRow: {
    flexDirection: "row",
  },
  signalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF0BB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  signalChipText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#7F232D",
  },
  summaryCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  summaryTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8E1",
  },
  summaryLabel: {
    fontFamily: serifFont,
    fontSize: 13,
    color: "#463826",
  },
  summaryValue: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "bold",
    color: "#137333",
  },
  completeButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
