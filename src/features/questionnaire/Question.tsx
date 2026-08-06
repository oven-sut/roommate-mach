import { ArrowLeft, ArrowRight, Check, Lightbulb } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { next } from "../onboarding/onboarding.content";
import { localizeQuestion, type QuestionData } from "./questionnaire.content";
import { qStyles } from "./questionnaire.styles";

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

