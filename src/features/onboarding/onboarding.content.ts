import type { Screen } from "../../types/navigation";

/**
 * The linear path a new user walks: splash → welcome → sign-up → profile →
 * questionnaire → feed. Screens use it to find their own next step instead of
 * hardcoding a destination each time the flow is reordered.
 */
export const next: Partial<Record<Screen, Screen>> = {
  splash: "welcome1",
  welcome1: "welcome2",
  welcome2: "welcome3",
  welcome3: "authChoice",
  signup: "basics",
  basics: "intro",
  intro: "q1",
  q1: "q2",
  q2: "q3",
  q3: "q4",
  q4: "summary",
  summary: "feed",
};

/** Which illustration a welcome slide shows — see `Welcome.tsx`. */
export type SlideArt = "profileCard" | "scoreRing" | "chat";

export type OnboardingSlide = {
  screen: Extract<Screen, "welcome1" | "welcome2" | "welcome3">;
  /** i18n keys, resolved at render so the slides follow the language toggle. */
  titleKey: string;
  subKey: string;
  art: SlideArt;
  /** Gradient behind the illustration. */
  gradient: readonly [string, string];
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    screen: "welcome1",
    titleKey: "w1Title",
    subKey: "w1Sub",
    art: "profileCard",
    gradient: ["#FFDF9E", "#F6C664"],
  },
  {
    screen: "welcome2",
    titleKey: "w2Title",
    subKey: "w2Sub",
    art: "scoreRing",
    gradient: ["#F3BB7E", "#EFA85C"],
  },
  {
    screen: "welcome3",
    titleKey: "w3Title",
    subKey: "w3Sub",
    art: "chat",
    gradient: ["#D98277", "#C4544A"],
  },
];
