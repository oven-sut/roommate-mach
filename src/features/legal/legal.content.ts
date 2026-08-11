import type { Language } from "../../i18n";

export type LegalScreen = "terms" | "privacy";

type LegalSection = {
  heading: Record<Language, string>;
  body: Record<Language, string>;
};

export type LegalCopy = {
  /** i18n key for the screen title. */
  title: string;
  /** i18n key for the "last updated" line. */
  updated: string;
  sections: LegalSection[];
};

export const legalCopy: Record<LegalScreen, LegalCopy> = {
  terms: {
    title: "termsTitle",
    updated: "legalUpdated",
    sections: [
      {
        heading: { en: "Student-only access", th: "สำหรับนักศึกษาเท่านั้น" },
        body: {
          en: "Roommate Match is intended for current SUT students. You agree to provide accurate student information and not use another person's identity or student ID.",
          th: "Roommate Match มีไว้สำหรับนักศึกษา SUT ปัจจุบัน คุณต้องให้ข้อมูลจริงและไม่ใช้ตัวตนหรือบัตรนักศึกษาของผู้อื่น",
        },
      },
      {
        heading: { en: "Account responsibility", th: "ความรับผิดชอบของบัญชี" },
        body: {
          en: "You are responsible for keeping your login information secure and for activity on your account. Do not share your account or impersonate another person.",
          th: "คุณต้องรักษาข้อมูลเข้าสู่ระบบและรับผิดชอบกิจกรรมในบัญชีของคุณ ห้ามแชร์บัญชีหรือแอบอ้างเป็นผู้อื่น",
        },
      },
      {
        heading: {
          en: "Respectful matching and chat",
          th: "การจับคู่และแชทอย่างเคารพกัน",
        },
        body: {
          en: "Harassment, threats, spam, hate speech, sexual exploitation, or attempts to pressure another user are not allowed.",
          th: "ห้ามคุกคาม ข่มขู่ สแปม ใช้คำพูดเกลียดชัง แสวงหาประโยชน์ทางเพศ หรือกดดันผู้ใช้อื่น",
        },
      },
      {
        heading: { en: "Verification", th: "การยืนยันตัวตน" },
        body: {
          en: "We may require student ID verification before matching or messaging. Accounts that submit false documents or violate these terms may be restricted or removed.",
          th: "อาจต้องยืนยันบัตรนักศึกษาก่อนจับคู่หรือส่งข้อความ บัญชีที่ส่งเอกสารปลอมหรือฝ่าฝืนอาจถูกจำกัดหรือลบ",
        },
      },
    ],
  },
  privacy: {
    title: "privacyTitle",
    updated: "legalUpdated",
    sections: [
      {
        heading: { en: "Information we collect", th: "ข้อมูลที่เราเก็บ" },
        body: {
          en: "We collect account details, SUT student ID information, profile answers, uploaded verification documents, matches, chat messages, and device push tokens when notifications are enabled.",
          th: "เราเก็บข้อมูลบัญชี รหัสนักศึกษา คำตอบโปรไฟล์ เอกสารยืนยัน การจับคู่ ข้อความแชท และ token แจ้งเตือนเมื่อเปิดใช้งาน",
        },
      },
      {
        heading: { en: "How we use information", th: "เราใช้ข้อมูลอย่างไร" },
        body: {
          en: "We use your information to verify student status, create roommate matches, show profiles, enable messaging, improve safety, and maintain the app.",
          th: "เราใช้ข้อมูลเพื่อยืนยันสถานะนักศึกษา จับคู่รูมเมท แสดงโปรไฟล์ เปิดแชท เพิ่มความปลอดภัย และดูแลระบบ",
        },
      },
      {
        heading: { en: "Student ID documents", th: "เอกสารบัตรนักศึกษา" },
        body: {
          en: "Uploaded ID documents are used only for verification. After review, they should not be used for matching or shown to other users.",
          th: "เอกสารที่อัปโหลดใช้เพื่อยืนยันเท่านั้น หลังตรวจสอบแล้วไม่ควรใช้ในการจับคู่หรือแสดงให้ผู้ใช้อื่นเห็น",
        },
      },
      {
        heading: { en: "Sharing", th: "การเปิดเผยข้อมูล" },
        body: {
          en: "Your public profile and compatibility information may be shown to other users in the app. We do not sell personal information.",
          th: "โปรไฟล์สาธารณะและข้อมูลความเข้ากันได้อาจแสดงให้ผู้ใช้ในแอพเห็น เราไม่ขายข้อมูลส่วนบุคคล",
        },
      },
    ],
  },
};
