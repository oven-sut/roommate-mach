import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "./theme/colors";
import { F } from "./theme/typography";

const LANGUAGE_KEY = "roomie_language";

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
  verifyRow: { en: "Verify your student status", th: "ยืนยันสถานะนักศึกษา" },
  verifyRowSub: {
    en: "Optional. Verified profiles get a badge and more matches",
    th: "ไม่บังคับ ผู้ที่ยืนยันแล้วจะได้รับตราสัญลักษณ์และจับคู่ได้มากขึ้น",
  },
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

  /* ---------------------------------------------------------- onboarding */
  appName: { en: "SUT Roommate Match", th: "SUT Roommate Match" },
  tagline: {
    en: "Find your people. Share your space.",
    th: "หาคนที่ใช่ แชร์พื้นที่ที่ชอบ",
  },
  university: {
    en: "SURANAREE UNIVERSITY OF TECHNOLOGY",
    th: "มหาวิทยาลัยเทคโนโลยีสุรนารี",
  },
  swipeToEnter: { en: "Swipe to enter", th: "ปัดเพื่อเริ่ม" },
  getStart: { en: "Get start", th: "เริ่มใช้งาน" },
  w1Title: { en: "Build your lifestyle profile", th: "สร้างโปรไฟล์ไลฟ์สไตล์ของคุณ" },
  w1Sub: {
    en: "Answer a fun 4-part questionnaire — sleep, cleanliness, guests, and study habits.",
    th: "ตอบแบบสอบถามสั้น ๆ 4 หมวด — การนอน ความสะอาด แขก และการอ่านหนังสือ",
  },
  w2Title: { en: "Get high-compatibility matches", th: "จับคู่กับคนที่เข้ากันได้จริง" },
  w2Sub: {
    en: "Our score compares 20+ lifestyle signals so you only meet people who fit how you live.",
    th: "ระบบเทียบพฤติกรรมกว่า 20 จุด เพื่อให้คุณเจอเฉพาะคนที่ใช้ชีวิตเข้ากับคุณ",
  },
  w3Title: { en: "Connect & chat safely", th: "เชื่อมต่อและแชทอย่างปลอดภัย" },
  w3Sub: {
    en: "Only SUT students can join, and you can verify your student ID for a badge.",
    th: "เฉพาะนักศึกษา SUT เท่านั้นที่สมัครได้ และยืนยันบัตรนักศึกษาเพื่อรับตราสัญลักษณ์ได้",
  },

  /* ---------------------------------------------------------------- auth */
  resetPassword: { en: "Reset password", th: "ตั้งรหัสผ่านใหม่" },
  resetYourPassword: { en: "Reset your password", th: "ตั้งรหัสผ่านใหม่ของคุณ" },
  resetSub: {
    en: "Enter your SUT email and we'll send you a secure reset code. It expires in 15 minutes.",
    th: "กรอกอีเมล SUT ของคุณ แล้วเราจะส่งรหัสยืนยันให้ รหัสมีอายุ 15 นาที",
  },
  emailOrCell: { en: "Email or Cell", th: "อีเมลหรือเบอร์โทร" },
  emailOrCellHint: {
    en: "Enter your email or Cell for OTP",
    th: "กรอกอีเมลหรือเบอร์โทรเพื่อรับ OTP",
  },
  enterOtpLabel: { en: "Enter OTP", th: "กรอกรหัส OTP" },
  sendOtp: { en: "Send OTP", th: "ส่ง OTP" },
  submit: { en: "Submit", th: "ยืนยัน" },
  didntGetIt: { en: "Didn't get it? Check spam, or resend in", th: "ยังไม่ได้รับ? ตรวจสอบสแปม หรือส่งใหม่ใน" },
  newPassword: { en: "New password", th: "รหัสผ่านใหม่" },
  perfect: { en: "Perfect", th: "ยอดเยี่ยม" },
  sutIdHint: { en: "B67xxxxx", th: "B67xxxxx" },
  otpVerified: { en: "Code verified", th: "ยืนยันรหัสแล้ว" },
  otpLabel: { en: "Verification code", th: "รหัสยืนยัน" },
  otpPlaceholder: { en: "6-digit code", th: "รหัส 6 หลัก" },
  otpSentTo: { en: "We sent a code to", th: "ส่งรหัสไปที่" },
  sendCode: { en: "Send verification code", th: "ส่งรหัสยืนยัน" },
  verifyAndRegister: { en: "Verify and create account", th: "ยืนยันและสร้างบัญชี" },
  resendCode: { en: "Resend code", th: "ส่งรหัสอีกครั้ง" },
  resendIn: { en: "Resend in", th: "ส่งใหม่ได้ใน" },

  /* -------------------------------------------------------------- basics */
  aboutYou: { en: "About you", th: "เกี่ยวกับคุณ" },
  aboutYouSub: {
    en: "This appears on your match card",
    th: "ข้อมูลนี้จะแสดงบนการ์ดจับคู่ของคุณ",
  },
  photosHint: { en: "1-3 photos", th: "รูป 1-3 ใบ" },
  fullName: { en: "Full Name", th: "ชื่อ-นามสกุล" },
  enterYourName: { en: "Enter your name", th: "กรอกชื่อของคุณ" },
  age: { en: "Age", th: "อายุ" },
  yourAge: { en: "your age", th: "อายุ" },
  major: { en: "Major", th: "สาขาวิชา" },
  chooseMajor: { en: "Choose your major", th: "เลือกสาขาวิชา" },
  gender: { en: "Gender", th: "เพศ" },
  yourGender: { en: "your gender", th: "เพศ" },
  shortBio: { en: "Short Bio", th: "แนะนำตัวสั้น ๆ" },
  bioPlaceholder: {
    en: "write something sounds likes you",
    th: "เขียนอะไรที่บอกความเป็นคุณ",
  },
  roomType: { en: "Room Type", th: "ประเภทห้อง" },
  single: { en: "Single", th: "ห้องเดี่ยว" },
  double: { en: "Double", th: "ห้องคู่" },
  either: { en: "Either", th: "ได้ทั้งคู่" },
  propertyType: { en: "Property Type", th: "ประเภทที่พัก" },
  onCampus: { en: "On-campus", th: "ในมหาวิทยาลัย" },
  offCampus: { en: "Off-campus", th: "นอกมหาวิทยาลัย" },
  house: { en: "House", th: "บ้าน" },
  condo: { en: "Condo", th: "คอนโด" },
  roommateGenderPref: {
    en: "Roommate Gender Preference",
    th: "เพศของเพื่อนร่วมห้องที่ต้องการ",
  },
  sameGender: { en: "Same Gender", th: "เพศเดียวกัน" },
  anyGender: { en: "Any", th: "ได้ทุกเพศ" },
  nonBinaryFriendly: { en: "Non-binary friendly", th: "เปิดรับทุกเพศสภาพ" },
  male: { en: "Male", th: "ชาย" },
  female: { en: "Female", th: "หญิง" },
  otherGender: { en: "Other", th: "อื่น ๆ" },

  /* ------------------------------------------------------- questionnaire */
  introTitle: { en: "Let's find how you live", th: "มาดูกันว่าคุณใช้ชีวิตยังไง" },
  introSub: {
    en: "4 quick categories power your match score. Be honest — it's how we find your fit. Takes about 3 minutes.",
    th: "4 หมวดสั้น ๆ ที่ใช้คำนวณคะแนนจับคู่ ตอบตามจริงเพื่อให้เจอคนที่เข้ากับคุณ ใช้เวลาประมาณ 3 นาที",
  },
  retakeAnytime: {
    en: "You can retake it anytime from your profile",
    th: "ทำใหม่ได้ทุกเมื่อจากหน้าโปรไฟล์",
  },
  catSleep: { en: "Sleep & wake", th: "การนอน" },
  catClean: { en: "Cleanliness", th: "ความสะอาด" },
  catGuests: { en: "Guests", th: "แขก" },
  catTemp: { en: "Temp & Study", th: "อุณหภูมิและการเรียน" },

  q1Title: { en: "Sleep & wake", th: "เวลานอนและเวลาตื่น" },
  q1Sub: { en: "Drag the handles to your usual range", th: "เลื่อนปุ่มให้ตรงกับช่วงเวลาปกติของคุณ" },
  sleepAt: { en: "I usually sleep at", th: "ปกติฉันเข้านอนเวลา" },
  wakeAt: { en: "I usually wake at", th: "ปกติฉันตื่นเวลา" },
  nightOwlNotePrefix: { en: "Based on your answers you'll get the", th: "จากคำตอบของคุณ คุณจะได้แท็ก" },
  nightOwlNoteSuffix: { en: "tag on your card.", th: "บนการ์ดของคุณ" },

  q2Title: { en: "Cleanliness", th: "ความสะอาด" },
  q2Sub: { en: "Pick every habit that sounds like you", th: "เลือกทุกนิสัยที่ตรงกับคุณ" },
  cleanMatter: { en: "How much does a clean room matter?", th: "ห้องสะอาดสำคัญกับคุณแค่ไหน?" },
  relaxed: { en: "Relaxed", th: "สบาย ๆ" },
  nonNegotiable: { en: "Non-negotiable", th: "ต่อรองไม่ได้" },
  q2Weight: {
    en: "Cleanliness is weighted 25% of your match score — the single biggest factor in roommate conflicts.",
    th: "ความสะอาดคิดเป็น 25% ของคะแนนจับคู่ และเป็นสาเหตุขัดแย้งอันดับหนึ่งของเพื่อนร่วมห้อง",
  },
  chipSpotless: { en: "Spotless", th: "สะอาดเอี่ยม" },
  chipDishes: { en: "Dishes same day", th: "ล้างจานภายในวัน" },
  chipChoreChart: { en: "Shared chore chart", th: "แบ่งเวรทำความสะอาด" },
  chipOrganizedChaos: { en: "Organized chaos", th: "รกแบบมีระบบ" },
  chipDeepClean: { en: "Weekly deep clean", th: "ทำความสะอาดใหญ่ทุกสัปดาห์" },
  chipLaundryPiles: { en: "Laundry piles up", th: "ผ้ากองได้บ้าง" },
  chipShoesOff: { en: "Shoes off inside", th: "ถอดรองเท้าก่อนเข้าห้อง" },
  chipTidyish: { en: "Tidy-ish", th: "เรียบร้อยพอประมาณ" },

  q3Title: { en: "Guests & social life", th: "แขกและการเข้าสังคม" },
  q3Sub: { en: "Set your comfort zone for visitors", th: "กำหนดขอบเขตที่คุณสบายใจกับผู้มาเยือน" },
  allowOvernight: { en: "Allow overnight guests", th: "อนุญาตให้แขกค้างคืน" },
  optNo: { en: "no", th: "ไม่" },
  optSometime: { en: "sometime", th: "บางครั้ง" },
  optYes: { en: "yes", th: "ได้" },
  preferredFrequency: { en: "Preferred frequency", th: "ความถี่ที่รับได้" },
  freqNever: { en: "never", th: "ไม่เลย" },
  freqMonthly: { en: "monthly", th: "เดือนละครั้ง" },
  freqWeekly: { en: "weekly", th: "สัปดาห์ละครั้ง" },
  freqAnytime: { en: "anytime", th: "เมื่อไหร่ก็ได้" },
  guestsOkayWith: { en: "guests i'm okay with", th: "แขกที่ฉันโอเค" },
  chipCloseFriends: { en: "Close friends", th: "เพื่อนสนิท" },
  chipStudyGroup: { en: "Study group", th: "กลุ่มติว" },
  chipPartner: { en: "Partner", th: "แฟน" },
  chipFamily: { en: "Family", th: "ครอบครัว" },
  chipAnyone: { en: "Anyone", th: "ใครก็ได้" },
  chipNoOne: { en: "No one", th: "ไม่มีใคร" },

  q4Title: { en: "Temperature & study", th: "อุณหภูมิและการเรียน" },
  q4Sub: { en: "the room environment", th: "สภาพแวดล้อมในห้อง" },
  acTemperature: { en: "AC Temperature", th: "อุณหภูมิแอร์" },
  acJustDay: { en: "Just day", th: "เฉพาะกลางวัน" },
  acJustNight: { en: "Just night", th: "เฉพาะกลางคืน" },
  acAnytime: { en: "Anytime", th: "เมื่อไหร่ก็ได้" },
  acAllTime: { en: "All time", th: "ตลอดเวลา" },
  noiseTolerance: { en: "How much does quiet matter?", th: "ความเงียบสำคัญแค่ไหน?" },
  noiseFine: { en: "Fine", th: "เสียงดังได้" },
  noiseSilence: { en: "Silence please", th: "ขอเงียบ ๆ" },
  mostlyStudy: { en: "I mostly study..", th: "ส่วนใหญ่ฉันอ่านหนังสือ.." },
  studyInRoom: { en: "In room", th: "ในห้อง" },
  studyLibrary: { en: "Library", th: "ห้องสมุด" },
  studyCafe: { en: "Cafe / out", th: "คาเฟ่ / นอกห้อง" },
  finish: { en: "Finish", th: "เสร็จสิ้น" },

  summaryTitle: { en: "looking good", th: "ดูดีมาก" },
  summarySub: {
    en: "Here's the profile your match will see",
    th: "นี่คือโปรไฟล์ที่คู่แมตช์ของคุณจะเห็น",
  },
  lifestyleSignature: { en: "Your lifestyle signature", th: "ลายเซ็นไลฟ์สไตล์ของคุณ" },
  signatureNote: {
    en: "These signals are compared with every profile to compute your match %. Edit any category by tapping its tag.",
    th: "สัญญาณเหล่านี้จะถูกเทียบกับทุกโปรไฟล์เพื่อคำนวณ % ความเข้ากัน แตะแท็กเพื่อแก้ไขหมวดนั้น",
  },
  completeProfile: { en: "Complete Profile", th: "บันทึกโปรไฟล์" },
  nextFirstMatches: { en: "Next: your first matches", th: "ถัดไป: แมตช์แรกของคุณ" },

  /* ----------------------------------------------------------- discovery */
  tapCardExpand: { en: "Tap card to expand", th: "แตะการ์ดเพื่อดูเพิ่ม" },
  slideToMatch: { en: "Slide to start matching", th: "เลื่อนเพื่อเริ่มจับคู่" },
  noMoreProfiles: { en: "No one left for now", th: "ยังไม่มีคนใหม่ตอนนี้" },
  noMoreProfilesSub: {
    en: "Widen your filters or check back later.",
    th: "ลองปรับตัวกรองหรือกลับมาดูใหม่ภายหลัง",
  },
  wantsRoom: { en: "wants", th: "ต้องการ" },
  year: { en: "Year", th: "ชั้นปี" },

  filters: { en: "Filters", th: "ตัวกรอง" },
  resetAll: { en: "Reset all", th: "ล้างทั้งหมด" },
  showMe: { en: "SHOW ME", th: "แสดง" },
  yearUnder: { en: "Under", th: "ปีน้อยกว่า" },
  yearPeer: { en: "Peer", th: "ปีเดียวกัน" },
  yearUpper: { en: "Upper", th: "ปีสูงกว่า" },
  yearEveryone: { en: "Everyone", th: "ทุกคน" },
  budget: { en: "Budget", th: "งบประมาณ" },
  perMonth: { en: "THB / month", th: "บาท / เดือน" },
  mustMatchOn: { en: "MUST MATCH ON", th: "ต้องตรงกันเรื่อง" },
  sleepSchedule: { en: "Sleep schedule", th: "เวลานอน" },
  cleanlinessFilter: { en: "Cleanliness", th: "ความสะอาด" },
  guestsFilter: { en: "Guests", th: "แขก" },
  acTempFilter: { en: "AC temp", th: "อุณหภูมิแอร์" },
  minMatchScore: { en: "Minimum match score", th: "คะแนนจับคู่ขั้นต่ำ" },
  apply: { en: "Apply", th: "ใช้ตัวกรอง" },
  anyOption: { en: "Any", th: "ทั้งหมด" },

  /* ------------------------------------------------------------- matches */
  matchTab: { en: "Match", th: "แมตช์" },
  yourMatches: { en: "YOUR MATCHES", th: "แมตช์ของคุณ" },
  likeYouSection: { en: "LIKE YOU", th: "คนที่ถูกใจคุณ" },
  totalSuffix: { en: "Total", th: "ทั้งหมด" },
  noOneNow: { en: "No one now,", th: "ยังไม่มีตอนนี้" },
  letsMatch: { en: "let's match?", th: "ไปจับคู่กันไหม?" },
  chat: { en: "Chat", th: "แชท" },
  likeBackNote: {
    en: "Liking back creates a match and opens chat immediately — no waiting.",
    th: "กดถูกใจกลับจะกลายเป็นแมตช์และเปิดแชททันที ไม่ต้องรอ",
  },
  matchedAgo: { en: "matched", th: "แมตช์เมื่อ" },
  whyScore: { en: "Why", th: "ทำไมถึง" },
  messagePrefix: { en: "Message", th: "ส่งข้อความหา" },

  /* ------------------------------------------------------------ messages */
  messageTab: { en: "Message", th: "ข้อความ" },
  searchConversations: { en: "Search conversations...", th: "ค้นหาบทสนทนา..." },
  typing: { en: "typing...", th: "กำลังพิมพ์..." },
  online: { en: "Online", th: "ออนไลน์" },
  messagePlaceholder: { en: "Message...", th: "พิมพ์ข้อความ..." },
  noConversations: { en: "No conversations yet", th: "ยังไม่มีบทสนทนา" },
  sayHi: { en: "Say hi to start the conversation", th: "ทักทายเพื่อเริ่มบทสนทนา" },

  /* ------------------------------------------------------------- profile */
  profileStrength: { en: "Profile strength", th: "ความสมบูรณ์ของโปรไฟล์" },
  strengthHint: {
    en: "Add a 3rd photo to reach 100% and get seen more.",
    th: "เพิ่มรูปที่ 3 เพื่อให้ครบ 100% และถูกเห็นมากขึ้น",
  },
  photosRow: { en: "Photos", th: "รูปภาพ" },
  uploadedCount: { en: "uploaded", th: "อัปโหลดแล้ว" },
  basicsBio: { en: "Basics & bio", th: "ข้อมูลพื้นฐาน" },
  basicsBioSub: {
    en: "Name, major, room type, preference",
    th: "ชื่อ สาขา ประเภทห้อง ความชอบ",
  },
  lifestyleQuestionnaire: { en: "Lifestyle questionnaire", th: "แบบสอบถามไลฟ์สไตล์" },
  lastTaken: { en: "Last taken", th: "ทำล่าสุด" },
  affectsScores: { en: "affects all match scores", th: "มีผลกับคะแนนจับคู่ทั้งหมด" },
  neverTaken: { en: "Not taken yet", th: "ยังไม่ได้ทำ" },
  retake: { en: "Retake", th: "ทำใหม่" },
  accountStatus: { en: "Account status", th: "สถานะบัญชี" },
  activeVisible: { en: "Active · visible in Discover", th: "ใช้งานอยู่ · แสดงในหน้าค้นหา" },
  hiddenFromDiscover: { en: "Hidden from Discover", th: "ซ่อนจากหน้าค้นหา" },
  settingTitle: { en: "Setting", th: "ตั้งค่า" },
  blockUsers: { en: "Block users", th: "ผู้ใช้ที่บล็อก" },
  messageNotif: { en: "Message", th: "ข้อความ" },

  /* --------------------------------------------------------------- misc */
  save: { en: "Save", th: "บันทึก" },
  cancel: { en: "Cancel", th: "ยกเลิก" },
  done: { en: "Done", th: "เสร็จสิ้น" },
  loading: { en: "Loading...", th: "กำลังโหลด..." },
  somethingWrong: { en: "Something went wrong", th: "เกิดข้อผิดพลาด" },
  retry: { en: "Try again", th: "ลองใหม่" },
  block: { en: "Block", th: "บล็อก" },
  unblock: { en: "Unblock", th: "ปลดบล็อก" },
  report: { en: "Report", th: "รายงาน" },
  search: { en: "Search", th: "ค้นหา" },
  empty: { en: "Nothing here yet", th: "ยังไม่มีข้อมูล" },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");

  // Restore the last choice. Thai stays the default until we know otherwise,
  // so the first frame never flashes the wrong language.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (active && (stored === "en" || stored === "th")) {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "th" : "en"),
      t: (key: string) => dict[key]?.[language] ?? key,
    }),
    [language, setLanguage],
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
    fontFamily: F.bold,
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
