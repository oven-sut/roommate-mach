import React, { createContext, useContext, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "./theme/colors";

export type Language = "en" | "th";

type Dict = Record<string, { en: string; th: string }>;

const dict: Dict = {
  language: { en: "TH", th: "EN" },
  login: { en: "Login", th: "เข้าสู่ระบบ" },
  register: { en: "Register", th: "สมัครสมาชิก" },
  continue: { en: "Continue", th: "ดำเนินการต่อ" },
  next: { en: "Next", th: "ถัดไป" },
  skip: { en: "Skip", th: "ข้าม" },
  getStarted: { en: "Get Started", th: "เริ่มใช้งาน" },
  welcomeBack: { en: "Welcome", th: "ยินดีต้อนรับ" },
  createAccount: { en: "Create account", th: "สร้างบัญชี" },
  loginSub: { en: "Log in to keep matching", th: "เข้าสู่ระบบเพื่อจับคู่ต่อ" },
  signupSub: { en: "Only SUT students can join", th: "สำหรับนักศึกษา SUT เท่านั้น" },
  firstName: { en: "First name", th: "ชื่อ" },
  lastName: { en: "Last name", th: "นามสกุล" },
  sutId: { en: "SUT ID", th: "รหัสนักศึกษา SUT" },
  password: { en: "Password", th: "รหัสผ่าน" },
  confirmPassword: { en: "Confirm password", th: "ยืนยันรหัสผ่าน" },
  enterFirstName: { en: "Enter your first name", th: "กรอกชื่อ" },
  enterLastName: { en: "Enter your last name", th: "กรอกนามสกุล" },
  enterPassword: { en: "Enter your password", th: "กรอกรหัสผ่าน" },
  confirmYourPassword: { en: "Confirm your password", th: "กรอกรหัสผ่านอีกครั้ง" },
  rememberMe: { en: "Remember me", th: "จดจำฉันไว้" },
  forgotPassword: { en: "Forgot password?", th: "ลืมรหัสผ่าน?" },
  termsAgreePrefix: { en: "I agree to the", th: "ฉันยอมรับ" },
  terms: { en: "Terms", th: "ข้อกำหนด" },
  and: { en: "and", th: "และ" },
  privacyPolicy: { en: "Privacy Policy", th: "นโยบายความเป็นส่วนตัว" },
  sutConfirm: {
    en: "and confirm\nI'm a current SUT student.",
    th: "และยืนยันว่า\nฉันเป็นนักศึกษา SUT ปัจจุบัน",
  },
  pleaseWait: { en: "Please wait...", th: "กรุณารอสักครู่..." },
  orContinueWith: { en: "or continue with", th: "หรือเข้าสู่ระบบด้วย" },
  continueGoogle: { en: "Continue with Google", th: "เข้าสู่ระบบด้วย Google" },
  weak: { en: "Weak", th: "อ่อน" },
  fair: { en: "Fair", th: "พอใช้" },
  good: { en: "Good", th: "ดี" },
  strong: { en: "Strong", th: "แข็งแรง" },
  pwdEmpty: { en: "Use at least 8 characters.", th: "ใช้อย่างน้อย 8 ตัวอักษร" },
  pwdWeak: {
    en: "Use 8+ characters with letters, numbers, and symbols.",
    th: "ใช้ 8 ตัวขึ้นไป พร้อมตัวอักษร ตัวเลข และสัญลักษณ์",
  },
  pwdFair: { en: "Add uppercase, numbers, or symbols.", th: "เพิ่มตัวพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์" },
  pwdGood: {
    en: "Good. Add a symbol or more length to make it stronger.",
    th: "ดีแล้ว เพิ่มสัญลักษณ์หรือความยาวเพื่อให้แข็งแรงขึ้น",
  },
  pwdStrong: { en: "Strong password.", th: "รหัสผ่านแข็งแรง" },
  termsTitle: { en: "Terms of Service", th: "ข้อกำหนดการใช้งาน" },
  privacyTitle: { en: "Privacy Policy", th: "นโยบายความเป็นส่วนตัว" },
  legalUpdated: { en: "Last updated: July 26, 2026", th: "อัปเดตล่าสุด: 26 กรกฎาคม 2026" },
  legalIntro: {
    en: "Please read this page before creating an account. You can go back to sign up after reviewing it.",
    th: "โปรดอ่านหน้านี้ก่อนสร้างบัญชี เมื่ออ่านเสร็จสามารถย้อนกลับไปสมัครสมาชิกได้",
  },
  verifyTitle: { en: "Verify your student ID", th: "ยืนยันบัตรนักศึกษา" },
  verifyRequired: { en: "Required before you can match", th: "ต้องยืนยันก่อนเริ่มจับคู่" },
  uploadId: { en: "Upload your SUT ID card", th: "อัปโหลดบัตรนักศึกษา SUT" },
  adminReviewPassed: { en: "Admin review passed", th: "ผู้ดูแลตรวจผ่านแล้ว" },
  verifiedPassed: { en: "Verified passed", th: "ยืนยันสำเร็จ" },
  waitAdmin: { en: "Wait for Admin review", th: "รอผู้ดูแลตรวจสอบ" },
  choosePhoto: { en: "Choose Photo", th: "เลือกรูปภาพ" },
  submitReview: { en: "Submit for review", th: "ส่งให้ตรวจสอบ" },
  submitting: { en: "Submitting...", th: "กำลังส่ง..." },
  verificationStatus: { en: "Verification status", th: "สถานะการยืนยัน" },
  pendingReview: { en: "Pending review", th: "รอตรวจสอบ" },
  usually24: { en: "Usually within 24 hours", th: "ปกติใช้เวลาภายใน 24 ชั่วโมง" },
  uploaded: { en: "Uploaded", th: "อัปโหลดแล้ว" },
  adminReview: { en: "Admin\nreview", th: "ผู้ดูแล\nตรวจสอบ" },
  verified: { en: "Verified", th: "ยืนยันแล้ว" },
  alreadyAccount: { en: "Already have an account?", th: "มีบัญชีอยู่แล้ว?" },
  newHere: { en: "New here?", th: "ยังไม่มีบัญชี?" },
  signUp: { en: "Sign Up", th: "สมัครสมาชิก" },
  logInAction: { en: "Log in", th: "เข้าสู่ระบบ" },
  rememberedIt: { en: "Remembered it?", th: "จำรหัสผ่านได้แล้ว?" },
  backToLogin: { en: "Back to Log In", th: "กลับไปเข้าสู่ระบบ" },
  messages: { en: "Messages", th: "ข้อความ" },
  settings: { en: "Settings", th: "ตั้งค่า" },
  languageSetting: { en: "Language", th: "ภาษา" },
  currentLanguage: { en: "English", th: "ไทย" },
  logout: { en: "Log Out", th: "ออกจากระบบ" },
  discover: { en: "Discover", th: "ค้นหา" },
  matches: { en: "Matches", th: "แมตช์" },
  profile: { en: "Profile", th: "โปรไฟล์" },
  account: { en: "ACCOUNT", th: "บัญชี" },
  email: { en: "Email", th: "อีเมล" },
  changePassword: { en: "Change password", th: "เปลี่ยนรหัสผ่าน" },
  notifications: { en: "NOTIFICATIONS", th: "การแจ้งเตือน" },
  newMatches: { en: "New matches", th: "แมตช์ใหม่" },
  likesYou: { en: "Likes you", th: "คนที่ถูกใจคุณ" },
  privacy: { en: "PRIVACY", th: "ความเป็นส่วนตัว" },
  hideDiscover: { en: "Hide me from Discover", th: "ซ่อนฉันจากหน้าค้นหา" },
  blockedUsers: { en: "Blocked users", th: "ผู้ใช้ที่บล็อก" },
  downloadData: { en: "Download my data", th: "ดาวน์โหลดข้อมูลของฉัน" },
  support: { en: "SUPPORT", th: "ช่วยเหลือ" },
  helpFaq: { en: "Help centre & FAQ", th: "ศูนย์ช่วยเหลือและ FAQ" },
  reportProblem: { en: "Report a problem", th: "รายงานปัญหา" },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("th");
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "en" ? "th" : "en")),
      t: (key: string) => dict[key]?.[language] ?? key,
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useI18n();
  return (
    <Pressable onPress={toggleLanguage} style={styles.toggle}>
      <Text style={styles.toggleText}>{t("language")}</Text>
      <View style={[styles.dot, language === "th" && styles.dotThai]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    minWidth: 58,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  toggleText: {
    color: C.wine,
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.orange,
  },
  dotThai: {
    backgroundColor: C.green,
  },
});
