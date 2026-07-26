import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../components/ui";
import { useI18n } from "../i18n";
import { C } from "../theme/colors";
import type { Language } from "../i18n";
import type { Screen } from "../types/navigation";

type LegalScreen = "terms" | "privacy";

const legalCopy: Record<
  LegalScreen,
  {
    title: string;
    updated: string;
    sections: { heading: Record<Language, string>; body: Record<Language, string> }[];
  }
> = {
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
        heading: { en: "Respectful matching and chat", th: "การจับคู่และแชทอย่างเคารพกัน" },
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

export function Legal({
  screen,
  go,
}: {
  screen: LegalScreen;
  go: (screen: Screen) => void;
}) {
  const { language, t } = useI18n();
  const copy = legalCopy[screen];

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={t(copy.title)} back={() => go("signup")} />
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.updated}>{t(copy.updated)}</Text>
        </View>
        <Text style={styles.intro}>
          {t("legalIntro")}
        </Text>
        {copy.sections.map((section) => (
          <View key={section.heading.en} style={styles.section}>
            <Text style={styles.heading}>{section.heading[language]}</Text>
            <Text style={styles.body}>{section.body[language]}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
    gap: 14,
  },
  updated: {
    color: C.muted,
    fontFamily: "NotoSansThai_600SemiBold",
    fontSize: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  intro: {
    color: C.ink,
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 13,
    lineHeight: 21,
  },
  section: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: C.card,
    padding: 15,
    gap: 7,
  },
  heading: {
    color: C.ink,
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 15,
  },
  body: {
    color: "#5F4D50",
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 12,
    lineHeight: 20,
  },
});
