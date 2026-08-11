import { useState } from "react";
import { Alert, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Brush,
  Moon,
  Pencil,
  Sun,
  Thermometer,
  Users,
  Volume2,
} from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { CenterModal } from "../../components/Sheet";
import { RangeSlider, Slider } from "../../components/Slider";
import { Segmented } from "../../components/Segmented";
import { RangeStepper } from "../../components/StepperPicker";
import {
  Button,
  Chevron,
  Chip,
  MotionPressable,
  NoteCard,
  ScreenShell,
  Txt,
} from "../../components/ui";
import { C, G } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { next } from "../onboarding/onboarding.content";
import {
  AC_MAX,
  AC_MIN,
  AC_TIMING_KEYS,
  CATEGORY_STEPS,
  CLEAN_HABITS,
  CLEAN_MAX,
  FREQUENCY_KEYS,
  GUEST_TIMES_MAX,
  GUEST_TYPES,
  OVERNIGHT_OPTIONS,
  QUIET_MAX,
  SLEEP_TICKS,
  SLEEP_TIMES,
  STUDY_PLACES,
  TOTAL_STEPS,
  WAKE_TICKS,
  WAKE_TIMES,
  chronotype,
  currentAnswers,
  sleepRangeLabel,
  toApiAnswers,
  wakeRangeLabel,
  type Answers,
} from "./questionnaire.content";

type Step = "q1" | "q2" | "q3" | "q4";

const PREVIOUS: Record<Step, Screen> = {
  q1: "intro",
  q2: "q1",
  q3: "q2",
  q4: "q3",
};

/** Back button plus the amber progress bar shared by all four steps. */
function StepHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <View style={{ gap: 18, marginTop: 8 }}>
      <View style={s.rowBetween}>
        <MotionPressable onPress={onBack} pressedScale={0.9} style={s.iconBtn}>
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="body" style={{ color: C.muted }}>
          {step} of {TOTAL_STEPS}
        </Txt>
      </View>
      <View style={s.track}>
        <LinearGradient
          colors={[...G.amber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: "100%" }}
        />
      </View>
    </View>
  );
}

/** White card wrapping a labelled control, with an optional trailing value. */
function ControlCard({
  icon,
  title,
  value,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        s.card,
        { paddingVertical: 16, paddingHorizontal: 18, gap: 2, borderColor: C.line },
      ]}
    >
      <View style={s.rowBetween}>
        <View style={[s.row, { gap: 12, flex: 1 }]}>
          {icon}
          <Txt role="h3" style={{ fontSize: 15, flexShrink: 1 }}>
            {title}
          </Txt>
        </View>
        {value ? (
          <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>
            {value}
          </Txt>
        ) : null}
        {onEdit ? (
          <MotionPressable
            onPress={onEdit}
            pressedScale={0.85}
            hitSlop={10}
            accessibilityLabel="Edit range"
          >
            <Pencil size={19} color={C.muted} strokeWidth={1.8} />
          </MotionPressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/**
 * One page of the lifestyle questionnaire. All four steps share this shell —
 * the header, progress and footer are identical and only the body swaps, which
 * keeps the transition between steps from re-laying-out the chrome.
 */
export function Question({
  screen,
  go,
}: {
  screen: Step;
  go: (x: Screen) => void;
}) {
  const { t } = useI18n();
  const [, rerender] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<"sleep" | "wake" | null>(null);

  // The working answers live in app state so stepping back and forth (and the
  // Retake entry point from the profile hub) does not lose anything.
  const answers = currentAnswers(appState.questionnaireDraft);
  appState.questionnaireDraft = answers;

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    answers[key] = value;
    rerender((x) => x + 1);
  };

  const toggleIn = (key: "cleanHabits" | "guestTypes", value: string) => {
    const list = answers[key];
    set(
      key,
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  };

  const meta = CATEGORY_STEPS[screen];

  const proceed = async () => {
    if (screen !== "q4") {
      go(next[screen]!);
      return;
    }
    try {
      setSaving(true);
      await api("/api/questionnaire", {
        method: "PUT",
        body: JSON.stringify({
          answers: toApiAnswers(answers),
          completed: true,
        }),
      });
      go("summary");
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScreenShell extraBottom={30}>
        <StepHeader step={meta.step} onBack={() => go(PREVIOUS[screen])} />

        <View style={{ gap: 4, marginTop: 6 }}>
          <Txt role="h1" style={{ fontSize: 24 }}>
            {t(meta.titleKey)}
          </Txt>
          <Txt role="subtitle">{t(meta.subKey)}</Txt>
        </View>

        {screen === "q1" ? (
          <View style={{ gap: 14 }}>
            <ControlCard
              icon={<Moon size={19} color={C.muted} strokeWidth={1.8} />}
              title={t("sleepAt")}
              onEdit={() => setEditing("sleep")}
            >
              <RangeSlider
                min={0}
                max={SLEEP_TIMES.length - 1}
                low={answers.sleepFrom}
                high={answers.sleepTo}
                onChange={(low, high) => {
                  answers.sleepFrom = low;
                  answers.sleepTo = high;
                  rerender((x) => x + 1);
                }}
                labels={SLEEP_TICKS}
              />
            </ControlCard>

            <ControlCard
              icon={<Sun size={19} color={C.muted} strokeWidth={1.8} />}
              title={t("wakeAt")}
              onEdit={() => setEditing("wake")}
            >
              <RangeSlider
                min={0}
                max={WAKE_TIMES.length - 1}
                low={answers.wakeFrom}
                high={answers.wakeTo}
                onChange={(low, high) => {
                  answers.wakeFrom = low;
                  answers.wakeTo = high;
                  rerender((x) => x + 1);
                }}
                labels={WAKE_TICKS}
              />
            </ControlCard>

            <NoteCard
              tone="pink"
              icon={<Moon size={20} color={C.primary} strokeWidth={1.8} />}
            >
              <Txt role="small" style={{ color: C.ink }}>
                {t("nightOwlNotePrefix")}{" "}
                <Txt style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>
                  {chronotype(answers)}
                </Txt>{" "}
                {t("nightOwlNoteSuffix")}
              </Txt>
            </NoteCard>
          </View>
        ) : null}

        {screen === "q2" ? (
          <View style={{ gap: 16 }}>
            <View style={[s.wrap, { rowGap: 12 }]}>
              {CLEAN_HABITS.map((habit) => (
                <Chip
                  key={habit.value}
                  active={answers.cleanHabits.includes(habit.value)}
                  onPress={() => toggleIn("cleanHabits", habit.value)}
                >
                  {t(habit.key)}
                </Chip>
              ))}
            </View>

            <ControlCard
              icon={<Brush size={19} color={C.muted} strokeWidth={1.8} />}
              title={t("cleanMatter")}
              value={`${answers.cleanScore}/${CLEAN_MAX}`}
            >
              <Slider
                min={0}
                max={CLEAN_MAX}
                value={answers.cleanScore}
                onChange={(v) => set("cleanScore", v)}
                labels={[t("relaxed"), t("nonNegotiable")]}
              />
            </ControlCard>

            <NoteCard
              icon={<Brush size={20} color={C.muted} strokeWidth={1.8} />}
            >
              <Txt role="small" style={{ color: C.ink }}>
                {t("q2Weight")}
              </Txt>
            </NoteCard>
          </View>
        ) : null}

        {screen === "q3" ? (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 12 }}>
              <Txt role="label">{t("allowOvernight")}</Txt>
              <Segmented
                options={OVERNIGHT_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t(o.key),
                }))}
                value={answers.overnight}
                onChange={(v) => set("overnight", v)}
              />
            </View>

            <ControlCard
              icon={<Users size={19} color={C.muted} strokeWidth={1.8} />}
              title={t("preferredFrequency")}
              value={t(FREQUENCY_KEYS[answers.guestFrequency])}
            >
              <Slider
                min={0}
                max={FREQUENCY_KEYS.length - 1}
                value={answers.guestFrequency}
                onChange={(v) => set("guestFrequency", v)}
                labels={FREQUENCY_KEYS.map((key) => t(key))}
              />
              <Slider
                min={0}
                max={GUEST_TIMES_MAX}
                value={answers.guestTimes}
                onChange={(v) => set("guestTimes", v)}
                labels={["0", `${GUEST_TIMES_MAX}`]}
              />
            </ControlCard>

            <View style={{ gap: 12 }}>
              <Txt role="label">{t("guestsOkayWith")}</Txt>
              <View style={[s.wrap, { rowGap: 12 }]}>
                {GUEST_TYPES.map((type) => (
                  <Chip
                    key={type.value}
                    active={answers.guestTypes.includes(type.value)}
                    onPress={() => toggleIn("guestTypes", type.value)}
                  >
                    {t(type.key)}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {screen === "q4" ? (
          <View style={{ gap: 16 }}>
            <Txt role="label">{t("acTemperature")}</Txt>
            <ControlCard
              icon={<Thermometer size={19} color={C.muted} strokeWidth={1.8} />}
              title={t("acTemperature")}
              value={`${answers.acTemp}° / ${t(
                AC_TIMING_KEYS[answers.acTiming],
              ).toLowerCase()}`}
            >
              <Slider
                min={0}
                max={AC_TIMING_KEYS.length - 1}
                value={answers.acTiming}
                onChange={(v) => set("acTiming", v)}
                labels={AC_TIMING_KEYS.map((key) => t(key))}
              />
              <Slider
                min={AC_MIN}
                max={AC_MAX}
                value={answers.acTemp}
                onChange={(v) => set("acTemp", v)}
                labels={[`${AC_MIN}°`, `${AC_MAX}°`]}
              />
            </ControlCard>

            <ControlCard
              icon={<Volume2 size={19} color={C.muted} strokeWidth={1.8} />}
              title={t("noiseTolerance")}
              value={`${answers.quiet}/${QUIET_MAX}`}
            >
              <Slider
                min={0}
                max={QUIET_MAX}
                value={answers.quiet}
                onChange={(v) => set("quiet", v)}
                labels={[t("noiseFine"), t("noiseSilence")]}
              />
            </ControlCard>

            <View style={{ gap: 12 }}>
              <Txt role="label">{t("mostlyStudy")}</Txt>
              <Segmented
                options={STUDY_PLACES.map((p) => ({
                  value: p.value,
                  label: t(p.key),
                }))}
                value={answers.studyPlace}
                onChange={(v) => set("studyPlace", v)}
              />
            </View>
          </View>
        ) : null}

        <View style={{ flex: 1, minHeight: 24 }} />

        <Button
          onPress={proceed}
          loading={saving}
          tone={screen === "q4" ? "wine" : "primary"}
        >
          {screen === "q4" ? t("finish") : t("continue")}
        </Button>
      </ScreenShell>

      <CenterModal visible={editing !== null} onClose={() => setEditing(null)}>
        <View style={[s.row, { gap: 12 }]}>
          {editing === "wake" ? (
            <Sun size={19} color={C.muted} strokeWidth={1.8} />
          ) : (
            <Moon size={19} color={C.muted} strokeWidth={1.8} />
          )}
          <Txt role="h3">{editing === "wake" ? t("wakeAt") : t("sleepAt")}</Txt>
        </View>

        {editing === "sleep" ? (
          <RangeStepper
            options={SLEEP_TIMES}
            from={answers.sleepFrom}
            to={answers.sleepTo}
            onChange={(from, to) => {
              answers.sleepFrom = from;
              answers.sleepTo = to;
              rerender((x) => x + 1);
            }}
          />
        ) : null}
        {editing === "wake" ? (
          <RangeStepper
            options={WAKE_TIMES}
            from={answers.wakeFrom}
            to={answers.wakeTo}
            onChange={(from, to) => {
              answers.wakeFrom = from;
              answers.wakeTo = to;
              rerender((x) => x + 1);
            }}
          />
        ) : null}

        <Txt role="small" style={{ textAlign: "center" }}>
          {editing === "wake" ? wakeRangeLabel(answers) : sleepRangeLabel(answers)}
        </Txt>
        <Button onPress={() => setEditing(null)}>{t("done")}</Button>
      </CenterModal>
    </>
  );
}
