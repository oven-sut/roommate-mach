import type { Language } from "../../i18n";
import type { Screen } from "../../types/navigation";

/**
 * The linear path a new user walks: splash → welcome → sign-up → profile →
 * questionnaire → feed. `Welcome` uses it to find its own next step.
 */
export const next: Partial<Record<Screen, Screen>> = {
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

export type OnboardingSlide = {
  screen: Screen;
  title: Record<Language, string>;
  sub: Record<Language, string>;
  art: string;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    screen: "welcome1",
    title: {
      en: "Build your lifestyle profile",
      th: "สร้างโปรไฟล์ไลฟ์สไตล์",
    },
    sub: {
      en: "Answer a fun questionnaire about sleep, cleanliness, guests, and study habits.",
      th: "ตอบแบบสอบถามเรื่องการนอน ความสะอาด แขก และนิสัยการเรียน",
    },
    art: "Ploy, 19\nFood Technology\nNight Owl   Spotless",
  },
  {
    screen: "welcome2",
    title: {
      en: "Get high-compatibility matches",
      th: "จับคู่กับคนที่เข้ากันได้",
    },
    sub: {
      en: "Our score compares 20+ lifestyle signals so you meet people who fit how you live.",
      th: "ระบบเทียบพฤติกรรมกว่า 20 จุด เพื่อแนะนำรูมเมทที่เหมาะกับคุณ",
    },
    art: "88%",
  },
  {
    screen: "welcome3",
    title: {
      en: "Connect & chat safely",
      th: "คุยกันได้อย่างปลอดภัย",
    },
    sub: {
      en: "Every account is verified with an SUT student ID before anyone can chat.",
      th: "ทุกบัญชีต้องยืนยันด้วยบัตรนักศึกษา SUT ก่อนเริ่มแชท",
    },
    art: "Hi! Saw we're 92%\n\nDorm 17? Let's talk!",
  },
];
