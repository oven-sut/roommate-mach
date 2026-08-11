/**
 * The redesigned questionnaire: four categories of sliders, chips and
 * segmented controls instead of six pages of checkbox groups.
 *
 * Answers are held as one structured object and only flattened into the
 * `{ answers: { q1: string[][] } }` shape the API already accepts at submit
 * time, so the backend contract is untouched.
 */

/** Half-hour marks the sleep slider snaps to, 20:00 through 02:30. */
export const SLEEP_TIMES = [
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
  "23:00", "23:30", "00:00", "00:30", "01:00", "01:30", "02:00", "02:30+",
] as const;

/** Half-hour marks for waking, 05:00 through 11:30. */
export const WAKE_TIMES = [
  "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30+",
] as const;

export const SLEEP_TICKS = ["20:00", "22:00", "00:00", "02:00+"] as const;
export const WAKE_TICKS = ["05:00", "07:00", "09:00", "11:00+"] as const;

/** Cleanliness habits — value is what ships to the API, key is the i18n id. */
export const CLEAN_HABITS = [
  { value: "Spotless", key: "chipSpotless" },
  { value: "Dishes same day", key: "chipDishes" },
  { value: "Shared chore chart", key: "chipChoreChart" },
  { value: "Organized chaos", key: "chipOrganizedChaos" },
  { value: "Weekly deep clean", key: "chipDeepClean" },
  { value: "Laundry piles up", key: "chipLaundryPiles" },
  { value: "Shoes off inside", key: "chipShoesOff" },
  { value: "Tidy-ish", key: "chipTidyish" },
] as const;

export const GUEST_TYPES = [
  { value: "Close friends", key: "chipCloseFriends" },
  { value: "Study group", key: "chipStudyGroup" },
  { value: "Partner", key: "chipPartner" },
  { value: "Family", key: "chipFamily" },
  { value: "Anyone", key: "chipAnyone" },
  { value: "No one", key: "chipNoOne" },
] as const;

export const OVERNIGHT_OPTIONS = [
  { value: "no", key: "optNo" },
  { value: "sometime", key: "optSometime" },
  { value: "yes", key: "optYes" },
] as const;

export const FREQUENCY_LABELS = ["Never", "Monthly", "Weekly", "Anytime"] as const;
export const FREQUENCY_KEYS = [
  "freqNever",
  "freqMonthly",
  "freqWeekly",
  "freqAnytime",
] as const;

export const AC_TIMING_LABELS = [
  "Just day",
  "Just night",
  "Anytime",
  "All time",
] as const;
export const AC_TIMING_KEYS = [
  "acJustDay",
  "acJustNight",
  "acAnytime",
  "acAllTime",
] as const;

export const STUDY_PLACES = [
  { value: "In room", key: "studyInRoom" },
  { value: "Library", key: "studyLibrary" },
  { value: "Cafe / out", key: "studyCafe" },
] as const;

/** Coolest and warmest AC settings the slider allows, in °C. */
export const AC_MIN = 20;
export const AC_MAX = 30;
/** Upper bound of the quiet-tolerance scale. */
export const QUIET_MAX = 8;
/** Upper bound of the cleanliness importance scale. */
export const CLEAN_MAX = 5;
/** Upper bound of the guests-per-month scale. */
export const GUEST_TIMES_MAX = 10;

export type Answers = {
  /** Indices into `SLEEP_TIMES`. */
  sleepFrom: number;
  sleepTo: number;
  /** Indices into `WAKE_TIMES`. */
  wakeFrom: number;
  wakeTo: number;

  cleanHabits: string[];
  cleanScore: number;

  overnight: string | null;
  guestFrequency: number;
  guestTimes: number;
  guestTypes: string[];

  acTiming: number;
  acTemp: number;
  quiet: number;
  studyPlace: string | null;
};

export const DEFAULT_ANSWERS: Answers = {
  sleepFrom: 4, // 22:00
  sleepTo: 6, // 23:00
  wakeFrom: 4, // 07:00
  wakeTo: 8, // 09:00
  cleanHabits: [],
  cleanScore: 0,
  overnight: null,
  guestFrequency: 0,
  guestTimes: 0,
  guestTypes: [],
  acTiming: 0,
  acTemp: 25,
  quiet: 0,
  studyPlace: null,
};

/** Which step each category lives on, used for the progress bar. */
export const CATEGORY_STEPS = {
  q1: { step: 1, titleKey: "q1Title", subKey: "q1Sub" },
  q2: { step: 2, titleKey: "q2Title", subKey: "q2Sub" },
  q3: { step: 3, titleKey: "q3Title", subKey: "q3Sub" },
  q4: { step: 4, titleKey: "q4Title", subKey: "q4Sub" },
} as const;

export const TOTAL_STEPS = 4;

export function sleepRangeLabel(a: Answers) {
  return `${SLEEP_TIMES[a.sleepFrom]}–${SLEEP_TIMES[a.sleepTo]}`;
}

export function wakeRangeLabel(a: Answers) {
  return `${WAKE_TIMES[a.wakeFrom]}–${WAKE_TIMES[a.wakeTo]}`;
}

/**
 * "Night Owl" once the usual bedtime starts at 23:00 or later, otherwise
 * "Early Bird". Drives the preview tag on Q1 and the card badges.
 */
export function chronotype(a: Answers): "Night Owl" | "Early Bird" {
  return a.sleepFrom >= 6 ? "Night Owl" : "Early Bird";
}

/**
 * The five signals shown as the lifestyle signature on the summary and on
 * every match card.
 */
export function lifestyleTags(a: Answers): string[] {
  const tags = [`${chronotype(a)} ${sleepRangeLabel(a)}`];
  tags.push(`Spotless ${a.cleanScore}/${CLEAN_MAX}`);
  tags.push(`Guests: ${a.overnight ?? "—"}`);
  tags.push(`Quiet hours ${a.quiet}/${QUIET_MAX}`);
  tags.push(`AC ${a.acTemp}°`);
  return tags;
}

/**
 * Flattens the structured answers into the per-question selection arrays the
 * API stores. Group order matters — the backend compares positionally.
 */
export function toApiAnswers(a: Answers): Record<string, string[][]> {
  return {
    q1: [[sleepRangeLabel(a)], [wakeRangeLabel(a)]],
    q2: [a.cleanHabits, [`${a.cleanScore}/${CLEAN_MAX}`]],
    q3: [
      a.overnight ? [a.overnight] : [],
      [FREQUENCY_LABELS[a.guestFrequency] ?? FREQUENCY_LABELS[0]],
      [`${a.guestTimes}/month`],
      a.guestTypes,
    ],
    q4: [
      [AC_TIMING_LABELS[a.acTiming] ?? AC_TIMING_LABELS[0]],
      [`${a.acTemp}°`],
      [`${a.quiet}/${QUIET_MAX}`],
      a.studyPlace ? [a.studyPlace] : [],
    ],
  };
}

function indexOfTime(times: readonly string[], label: string, fallback: number) {
  const found = times.indexOf(label);
  return found >= 0 ? found : fallback;
}

/**
 * Rebuilds the structured answers from a stored API payload so "Retake" opens
 * on the user's previous choices rather than the defaults.
 */
export function fromApiAnswers(
  stored: Record<string, string[][]> | null | undefined,
): Answers {
  if (!stored) return { ...DEFAULT_ANSWERS };
  const a: Answers = { ...DEFAULT_ANSWERS };

  const [sleep, wake] = stored.q1 ?? [];
  if (sleep?.[0]) {
    const [from, to] = sleep[0].split("–");
    a.sleepFrom = indexOfTime(SLEEP_TIMES, from, a.sleepFrom);
    a.sleepTo = indexOfTime(SLEEP_TIMES, to, a.sleepTo);
  }
  if (wake?.[0]) {
    const [from, to] = wake[0].split("–");
    a.wakeFrom = indexOfTime(WAKE_TIMES, from, a.wakeFrom);
    a.wakeTo = indexOfTime(WAKE_TIMES, to, a.wakeTo);
  }

  const [habits, cleanScore] = stored.q2 ?? [];
  if (habits) a.cleanHabits = habits;
  if (cleanScore?.[0]) a.cleanScore = Number(cleanScore[0].split("/")[0]) || 0;

  const [overnight, frequency, times, types] = stored.q3 ?? [];
  if (overnight?.[0]) a.overnight = overnight[0];
  if (frequency?.[0]) {
    const i = FREQUENCY_LABELS.indexOf(
      frequency[0] as (typeof FREQUENCY_LABELS)[number],
    );
    if (i >= 0) a.guestFrequency = i;
  }
  if (times?.[0]) a.guestTimes = Number(times[0].split("/")[0]) || 0;
  if (types) a.guestTypes = types;

  const [timing, temp, quiet, study] = stored.q4 ?? [];
  if (timing?.[0]) {
    const i = AC_TIMING_LABELS.indexOf(
      timing[0] as (typeof AC_TIMING_LABELS)[number],
    );
    if (i >= 0) a.acTiming = i;
  }
  if (temp?.[0]) a.acTemp = Number(temp[0].replace("°", "")) || a.acTemp;
  if (quiet?.[0]) a.quiet = Number(quiet[0].split("/")[0]) || 0;
  if (study?.[0]) a.studyPlace = study[0];

  return a;
}

/** Reads the working answers out of app state, seeding them on first use. */
export function currentAnswers(
  draft: Record<string, unknown> | null,
): Answers {
  if (draft && typeof draft === "object" && "sleepFrom" in draft) {
    return draft as Answers;
  }
  return { ...DEFAULT_ANSWERS };
}
