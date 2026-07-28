import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  signup: "verify",
  verify: "basics",
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
  if (lang === "en") return d;

  const translations: Record<string, {
    title: string;
    sub: string;
    note?: string;
    groups: { label: string; items: Record<string, string> }[];
  }> = {
    q1: {
      title: "เวลานอนและจังหวะชีวิต",
      sub: "ระบุเวลาที่คุณมักจะเข้านอนและเริ่มต้นวันใหม่",
      note: "พฤติกรรมเหล่านี้ช่วยให้ระบบจับคู่เพื่อนที่มีจังหวะชีวิตตรงกัน",
      groups: [
        { label: "เวลานอนปกติ", items: {} },
        { label: "เวลาตื่นนอนปกติ", items: {} },
      ],
    },
    q2: {
      title: "ความสะอาดและระเบียบในห้อง",
      sub: "เลือกนิสัยที่สำคัญที่สุดสำหรับการอยู่ร่วมห้องกัน",
      groups: [
        {
          label: "กฎเหล็กเรื่องความสะอาด",
          items: {
            "Spotless": "ต้องสะอาดกริ๊บ",
            "Dishes same day": "ล้างจานภายในวันนั้น",
            "Shoes off inside": "ถอดรองเท้าก่อนเข้าห้อง",
            "Make the bed": "เก็บที่นอนทุกเช้า",
            "Shared cleaning schedule": "เวียนกันทำความสะอาดห้อง",
          },
        },
        { label: "ระดับความมีระเบียบของคุณ", items: {} },
      ],
    },
    q3: {
      title: "การรับแขกและสไตล์การใช้ชีวิต",
      sub: "กำหนดข้อตกลงเรื่องผู้มาเยือนและเวลาส่วนตัว",
      groups: [
        {
          label: "ความถี่ในการพาเพื่อนมาห้อง",
          items: {
            "Rarely": "นาน ๆ ที / ไม่ค่อยมี",
            "Sometimes": "เป็นบางครั้ง",
            "Often": "บ่อย ๆ",
          },
        },
        {
          label: "ใครที่อาจจะมาเยี่ยมห้องบ้าง?",
          items: {
            "Close friends": "เพื่อนสนิท",
            "Study group": "กลุ่มติวหนังสือ",
            "Family": "ครอบครัว",
            "Partner": "แฟน / คนคุย",
          },
        },
        {
          label: "ระดับพลังงานทางสังคม",
          items: {
            "Quiet": "รักความเงียบสงบ",
            "Balanced": "สายกลาง / ยืดหยุ่น",
            "Very social": "เฮฮา / เข้าสังคมเก่ง",
          },
        },
      ],
    },
    q4: {
      title: "อุณหภูมิห้องและบรรยากาศอ่านหนังสือ",
      sub: "ช่วยให้เราเข้าใจสภาพแวดล้อมที่คุณทำงาน/อ่านหนังสือได้ดีที่สุด",
      groups: [
        { label: "อุณหภูมิแอร์ที่ชอบ (องศา)", items: {} },
        { label: "ระดับความเงียบที่ต้องการตอนอ่านหนังสือ", items: {} },
        {
          label: "สถานที่อ่านหนังสือประจำ",
          items: {
            "In room": "ในห้องพัก",
            "Library": "หอสมุดมหาลัย",
            "Cafe / outside room": "คาเฟ่ / ร้านกาแฟ",
          },
        },
      ],
    },
    q5: {
      title: "การใช้ชีวิตและข้อจำกัดส่วนตัว",
      sub: "ข้อตกลงและขอบเขตในการอยู่ร่วมกัน",
      groups: [
        {
          label: "การสูบบุหรี่ / บุหรี่ไฟฟ้า",
          items: {
            "No": "ไม่สูบเด็ดขาด",
            "Okay outdoors only": "นอกห้องเท่านั้น",
            "Okay indoors": "ในห้องได้",
          },
        },
        {
          label: "เครื่องดื่มแอลกอฮอล์",
          items: {
            "Never": "ไม่ดื่ม",
            "Socially": "ดื่มตามโอกาส / สังสรรค์",
            "Often": "ดื่มบ่อย",
          },
        },
        {
          label: "สัตว์เลี้ยง",
          items: {
            "No pets": "ไม่เลี้ยง / แพ้ขนสัตว์",
            "Okay with some": "เลี้ยงได้บางประเภท",
            "Love them": "ชอบสัตว์เลี้ยงมาก",
          },
        },
      ],
    },
    q6: {
      title: "การจัดการค่าใช้จ่ายและการปรับตัว",
      sub: "ข้อตกลงเรื่องค่าน้ำค่าไฟและการยืดหยุ่นปรับตัว",
      groups: [
        {
          label: "การหารค่าใช้จ่ายส่วนกลาง (ค่าน้ำ/ค่าไฟ)",
          items: {
            "Split equally": "หารเท่ากันทุกเดือน",
            "Pay by usage": "หารตามการใช้งานจริง",
            "Flexible / discuss": "ยืดหยุ่น / ตกลงกันได้",
          },
        },
        {
          label: "ระดับความยืดหยุ่นปรับตัวกับเพื่อน",
          items: {
            "Low": "ชอบทำตามกฎเป๊ะ ๆ",
            "Moderate": "ปานกลาง / พร้อมปรับตัว",
            "High": "ยืดหยุ่นสูงมาก",
          },
        },
      ],
    },
  };

  const tr = translations[d.key];
  if (!tr) return d;

  return {
    ...d,
    title: tr.title || d.title,
    sub: tr.sub || d.sub,
    note: tr.note ?? d.note,
    groups: d.groups.map((g, gi) => {
      const trGroup = tr.groups[gi];
      if (!trGroup) return g;
      return {
        ...g,
        label: trGroup.label || g.label,
        items: g.items.map((item) => trGroup.items[item] || item),
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
    { icon: "🌙", title: "1. เวลาตื่นและเวลานอน", sub: "จังหวะชีวิตประจำวันและการเข้านอน" },
    { icon: "🧹", title: "2. ความสะอาดและระเบียบ", sub: "เกณฑ์ความสะอาดและการเก็บของในห้อง" },
    { icon: "👥", title: "3. การรับแขกและสังสรรค์", sub: "การพาเพื่อนมาห้องและระดับความเงียบสงบ" },
    { icon: "💡", title: "4. อ่านหนังสือและอุณหภูมิห้อง", sub: "บรรยากาศการเรียนและระดับแอร์ที่ชอบ" },
  ] : [
    { icon: "🌙", title: "1. Sleep & Wake Schedule", sub: "Daily rhythm and sleeping habits" },
    { icon: "🧹", title: "2. Cleanliness & Routines", sub: "Cleanliness standard and room tidy habits" },
    { icon: "👥", title: "3. Guests & Socializing", sub: "Bringing guests over and quiet hours preference" },
    { icon: "💡", title: "4. Study & Room Temperature", sub: "Study environment and preferred AC temperature" },
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
            <Text style={introStyles.backChevron}>←</Text>
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
            <Text style={introStyles.heroIconText}>🎯</Text>
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
          {categories.map((cat, idx) => (
            <View key={idx} style={introStyles.catCard}>
              <View style={introStyles.catIconBox}>
                <Text style={introStyles.catIcon}>{cat.icon}</Text>
              </View>
              <View style={introStyles.catInfo}>
                <Text style={introStyles.catTitle}>{cat.title}</Text>
                <Text style={introStyles.catSub}>{cat.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info Banner */}
        <View style={introStyles.infoBanner}>
          <Text style={introStyles.infoText}>
            {language === "th"
              ? "⚡ ใช้เวลาเพียง 2 นาที · แก้ไขย้อนหลังได้ตลอดเวลา"
              : "⚡ Takes only 2 minutes · Editable anytime in profile"}
          </Text>
        </View>

        {/* Start Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start questionnaire"
          style={introStyles.startButton}
          onPress={() => go("q1")}
        >
          <Text style={introStyles.startButtonText}>
            {language === "th" ? "เริ่มทำแบบสอบถาม ➔" : "Start Questionnaire ➔"}
          </Text>
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
            onPress={() => go(screen === "q1" ? "intro" : (`q${d.step - 1}` as Screen))}
          >
            <Text style={qStyles.backChevron}>←</Text>
          </Pressable>

          <View style={qStyles.progressWrap}>
            <View style={qStyles.trackBg}>
              <View style={[qStyles.trackFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          <View style={qStyles.stepBadge}>
            <Text style={qStyles.stepBadgeText}>{d.step}/6</Text>
          </View>
        </View>

        {/* Question Heading Card */}
        <View style={qStyles.headingCard}>
          <View style={qStyles.stepPill}>
            <Text style={qStyles.stepPillText}>
              {language === "th" ? `คำถามที่ ${d.step} จาก 6` : `Question ${d.step} of 6`}
            </Text>
          </View>
          <Text style={qStyles.title}>{d.title}</Text>
          {d.sub ? <Text style={qStyles.subText}>{d.sub}</Text> : null}
        </View>

        {/* Question Groups */}
        {d.groups.map((g, gi: number) => (
          <View key={g.label + gi} style={qStyles.groupCard}>
            <Text style={qStyles.groupLabel}>{g.label}</Text>
            <View style={qStyles.optionsWrap}>
              {g.items.map((x, i: number) => {
                const isSelected = appState.questionnaireDraft?.[screen]?.[gi]?.includes(i) ?? false;
                return (
                  <Pressable
                    key={x}
                    style={[
                      qStyles.optionChip,
                      isSelected && qStyles.optionChipSelected,
                    ]}
                    onPress={() => toggle(gi, i)}
                  >
                    <Text
                      style={[
                        qStyles.optionText,
                        isSelected && qStyles.optionTextSelected,
                      ]}
                    >
                      {x}
                    </Text>
                    {isSelected ? <Text style={qStyles.checkIcon}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Optional Note */}
        {d.note ? (
          <View style={qStyles.noteBox}>
            <Text style={qStyles.noteText}>💡 {d.note}</Text>
          </View>
        ) : null}

        {/* Next / Submit Button */}
        <Pressable style={qStyles.nextButton} onPress={proceed}>
          <Text style={qStyles.nextButtonText}>
            {screen === "q6"
              ? language === "th" ? "บันทึกและดูสรุปผล ➔" : "Save & See Summary ➔"
              : language === "th" ? "ถัดไป ➔" : "Next ➔"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Summary({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const complete = async () => {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
          completed: true,
        }),
      });
      go("feed");
    } catch (e) {
      Alert.alert(
        "Unable to complete profile",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };

  const initial = appState.profileDraft.displayName?.trim()?.charAt(0)?.toUpperCase() || "R";
  const photoUri = appState.profileDraft.photos?.[0];

  const signals = language === "th" ? [
    "🌙 จังหวะการนอนประจำ",
    "🧹 ระดับความสะอาดที่เลือก",
    "👥 ข้อตกลงการรับแขก",
    "💡 อุณหภูมิห้อง & อ่านหนังสือ",
  ] : [
    "🌙 Sleep Schedule",
    "🧹 Cleanliness Standard",
    "👥 Guest Agreements",
    "💡 Room Temp & Study Habit",
  ];

  return (
    <SafeAreaView style={qStyles.safeArea}>
      <ScrollView
        contentContainerStyle={qStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header Card */}
        <View style={summaryStyles.heroBox}>
          <View style={summaryStyles.iconCircle}>
            <Text style={summaryStyles.iconText}>🎉</Text>
          </View>
          <Text style={summaryStyles.heroTitle}>
            {language === "th"
              ? `โปรไฟล์พร้อมใช้งานแล้ว, ${appState.profileDraft.displayName || "Roomie"}!`
              : `Your profile is ready, ${appState.profileDraft.displayName || "Roomie"}!`}
          </Text>
          <Text style={summaryStyles.heroSub}>
            {language === "th"
              ? "นี่คือการ์ดโปรไฟล์ที่จะแสดงให้เพื่อนร่วมห้องคนอื่น ๆ เห็นในการจับคู่"
              : "Here's the profile card that other roommates will see when matching"}
          </Text>
        </View>

        {/* Match Card Preview */}
        <View style={summaryStyles.profileCard}>
          <View style={summaryStyles.avatarBox}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={summaryStyles.avatarImg} />
            ) : (
              <Text style={summaryStyles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <Text style={summaryStyles.nameText}>
            {appState.profileDraft.displayName || "Roomie"}
            {appState.profileDraft.age ? `, ${appState.profileDraft.age}` : ""}
          </Text>
          <Text style={summaryStyles.metaText}>
            {appState.profileDraft.major || "SUT Student"}
            {appState.profileDraft.year
              ? language === "th" ? ` · ปี ${appState.profileDraft.year}` : ` · Year ${appState.profileDraft.year}`
              : ""}
          </Text>
          {appState.profileDraft.bio ? (
            <Text style={summaryStyles.bioText}>“{appState.profileDraft.bio}”</Text>
          ) : (
            <Text style={summaryStyles.bioText}>
              “{language === "th" ? "กำลังตามหารูมเมทที่เข้ากันได้" : "Looking for a compatible roommate."}”
            </Text>
          )}
        </View>

        {/* Lifestyle Signals Card */}
        <View style={summaryStyles.signalsCard}>
          <Text style={qStyles.groupLabel}>
            {language === "th" ? "✨ สัญญาณสไตล์การอยู่อาศัยที่บันทึกแล้ว" : "✨ Recorded Lifestyle Signals"}
          </Text>
          <View style={qStyles.optionsWrap}>
            {signals.map((sig, idx) => (
              <View key={idx} style={[qStyles.optionChip, qStyles.optionChipSelected]}>
                <Text style={qStyles.optionTextSelected}>{sig}</Text>
                <Text style={qStyles.checkIcon}>✓</Text>
              </View>
            ))}
          </View>
          <Text style={summaryStyles.noteText}>
            {language === "th"
              ? "ระบบจะนำคำตอบทั้งหมดไปเปรียบเทียบกับสมาชิกทุกคนเพื่อคำนวณคะแนน % Match"
              : "All answers are compared with other members to calculate your % Match score"}
          </Text>
        </View>

        {/* Complete & Go to Feed Button */}
        <Pressable style={qStyles.nextButton} onPress={complete}>
          <Text style={qStyles.nextButtonText}>
            {language === "th" ? "เริ่มค้นหาเพื่อนร่วมห้องเลย ➔" : "Start Finding Roommates ➔"}
          </Text>
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
    paddingTop: 20,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
  stepBadge: {
    backgroundColor: "#FEEAE6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0CDBF",
  },
  stepBadgeText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "700",
    color: "#C64338",
  },
  heroBox: {
    backgroundColor: "#FAF6F0",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
    alignItems: "center",
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF0BB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFD477",
  },
  heroIconText: {
    fontSize: 26,
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
    marginBottom: 12,
  },
  categoriesGrid: {
    gap: 10,
    marginBottom: 20,
  },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  catIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    justifyContent: "center",
    backgroundColor: "#FFFDF9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EADCD3",
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
    fontWeight: "500",
  },
  startButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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
    paddingTop: 20,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
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
  progressWrap: {
    flex: 1,
  },
  trackBg: {
    height: 8,
    backgroundColor: "#EADCD3",
    borderRadius: 4,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    backgroundColor: "#C64338",
    borderRadius: 4,
  },
  stepBadge: {
    backgroundColor: "#FEEAE6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0CDBF",
  },
  stepBadgeText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#C64338",
  },
  headingCard: {
    marginBottom: 20,
  },
  stepPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF0BB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFD477",
  },
  stepPillText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#7F232D",
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
  },
  groupCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 16,
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
  optionsWrap: {
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
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
    fontWeight: "500",
    color: "#463826",
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: "bold",
    color: "#7F232D",
  },
  checkIcon: {
    fontSize: 15,
    color: "#C64338",
    fontWeight: "bold",
    marginLeft: 8,
  },
  noteBox: {
    backgroundColor: "#FFFDF9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  noteText: {
    fontFamily: serifFont,
    fontSize: 13,
    color: "#8D7C75",
    lineHeight: 18,
  },
  nextButton: {
    height: 52,
    borderRadius: 12,
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
  heroBox: {
    backgroundColor: "#FAF6F0",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF0BB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFD477",
  },
  iconText: {
    fontSize: 26,
  },
  heroTitle: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: "bold",
    color: "#463826",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#74675E",
    textAlign: "center",
    lineHeight: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
    alignItems: "center",
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: serifFont,
    fontSize: 28,
    fontWeight: "bold",
    color: "#7F232D",
  },
  nameText: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 4,
  },
  metaText: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#8D7C75",
    marginBottom: 8,
  },
  bioText: {
    fontFamily: serifFont,
    fontSize: 13,
    fontStyle: "italic",
    color: "#74675E",
    textAlign: "center",
  },
  signalsCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  noteText: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
    marginTop: 12,
    textAlign: "center",
  },
});
