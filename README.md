# Roommate Match — แอปมือถือ 🏠

แอปหาเพื่อนร่วมห้องสำหรับนักศึกษา จับคู่จากไลฟ์สไตล์/งบประมาณ/หอพัก พร้อมแชทในแอป
สร้างด้วย **Expo SDK 54 · React Native 0.81 · React 19 · TypeScript** — UI ภาษาไทย/อังกฤษ ฟอนต์ Noto Sans Thai ใช้ไอคอน Lucide ทั้งแอป

> เป็นส่วน client ของโปรเจกต์ — ทำงานคู่กับ API ใน [`../roommate-mach-be`](../roommate-mach-be)
> ข้อมูลทั้งหมดมาจาก REST API (ไม่มี mock/SQLite ในเครื่อง)

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Expo SDK 54 · React Native 0.81 · React 19 |
| Routing | state machine เขียนเองใน [`App.tsx`](./App.tsx) (ไม่ได้ใช้ expo-router / react-navigation) |
| UI | `StyleSheet` เอง ([`src/theme/`](./src/theme)) · ไอคอน `lucide-react-native` · `expo-linear-gradient` |
| ฟอนต์ | `@expo-google-fonts/noto-sans-thai` (ตั้งเป็น default ให้ `Text`/`TextInput` ใน `App.tsx`) |
| ภาษา | i18n TH/EN เขียนเอง ([`src/i18n.tsx`](./src/i18n.tsx)) |
| State/Data | REST (`fetch`) · `appState` object กลางใน [`src/services/api.ts`](./src/services/api.ts) |
| Auth | JWT เก็บใน `AsyncStorage` (key `roomie_token`) · Google login ผ่าน `expo-auth-session` |
| Media/Push | `expo-image-picker` · `expo-notifications` (Expo push token) |

> ⚠️ **แชทยังไม่ใช่ realtime** — [`src/screens/messaging.tsx`](./src/screens/messaging.tsx) ดึงข้อความใหม่ด้วย
> `setInterval` ทุก 4 วินาที ยังไม่มี Socket.IO ทั้งฝั่ง client และ server

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env    # ตั้ง EXPO_PUBLIC_API_URL ให้ชี้ backend ของคุณ
npm start
```

- **มือถือ**: ติดตั้ง [Expo Go](https://expo.dev/go) แล้วสแกน QR (Wi-Fi วงเดียวกับคอม)
- **เว็บ**: `npm run web`
- **Android emulator**: `npm run android`

> ต้องมี **backend รันอยู่** ด้วย (ดู [`../roommate-mach-be`](../roommate-mach-be))

## ชี้ไปที่ Backend ตัวไหน (สำคัญ)

base URL อ่านจาก [`src/services/api.ts`](./src/services/api.ts) ตามลำดับ:

1. `EXPO_PUBLIC_API_URL` (จาก `.env`) — ทางที่ควรใช้
2. ถ้าไม่ตั้ง จะ fallback เป็นค่า hardcode ในไฟล์ — Android → `http://192.168.1.237:18888`, อื่น ๆ → `http://localhost:18888`

**ทดสอบบนมือถือจริง** ต้องใช้ LAN IP ของเครื่อง dev (ไม่ใช่ `localhost`):

```bash
EXPO_PUBLIC_API_URL="http://<LAN-IP>:18888" npm start
```

> ⚠️ ก่อน **build production** ต้องตั้ง `EXPO_PUBLIC_API_URL` ให้ชี้โดเมน production
> ตอนนี้ `app.json` **ไม่มี** `extra.apiUrl` — ถ้าไม่ตั้ง env ตอน build แอปจะวิ่งไปหา LAN IP ที่ hardcode ไว้

## Environment (`.env`)

| ตัวแปร | คำอธิบาย |
|---|---|
| `EXPO_PUBLIC_API_URL` | base URL ของ backend (เช่น `http://192.168.1.20:18888`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | OAuth client ID (web) สำหรับ Google login |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | OAuth client ID (Android) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | OAuth client ID (iOS) |

## ฟีเจอร์

**ผู้ใช้**
- สมัครสมาชิก → **ยืนยันอีเมลด้วย OTP** (เช็กอีเมลซ้ำแบบเรียลไทม์) · เข้าสู่ระบบด้วยอีเมลหรือ Google
- **ลืมรหัสผ่าน** ด้วย OTP
- **auto-login**: มี token ค้างอยู่ → เรียก `GET /api/me` ตอนเปิดแอปแล้วเข้า feed/basics เลย
- Splash + Welcome 1–3 แสดง **ครั้งแรกครั้งเดียว** (flag `has_seen_onboarding` ใน AsyncStorage)
- ตั้งค่าโปรไฟล์ (ข้อมูลพื้นฐาน + หอพัก/การศึกษา) · อัปโหลดรูปโปรไฟล์จริง
- แบบสอบถามไลฟ์สไตล์ 6 หมวด (`q1`–`q6`) → คะแนนความเข้ากันได้
- ค้นหาแบบปัดการ์ด (swipe) + ตัวกรอง · จับคู่เมื่อสนใจกันทั้งคู่
- แชท (polling), การแจ้งเตือน, ค้นหาผู้ใช้, บล็อก/รายงาน, ลบบัญชีถาวร

**แอดมิน** (หน้า login เดียวกัน) — แดชบอร์ดสถิติ, จัดการสมาชิก, ตั้งค่าระบบ

## Build APK (EAS)

```bash
# ตั้ง EXPO_PUBLIC_API_URL เป็น production ก่อน
npx eas-cli build --platform android --profile preview      # APK สำหรับแจกทดสอบ
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios
```

- โปรไฟล์ build อยู่ใน [`eas.json`](./eas.json) (`preview` = APK, `distribution: internal`)
- EAS project id อยู่ใน `app.json` → `extra.eas.projectId`
- **Push จริงทดสอบได้เฉพาะบน build จริง** — Expo Go (SDK 53+) ไม่รองรับ remote push
  ([`src/services/notifications.ts`](./src/services/notifications.ts) จะคืน `null` เมื่ออยู่ใน Expo Go)

## โครงสร้าง

```
App.tsx                   # entry + state machine สลับหน้าจอ + bootstrap auth/push
app.json                  # config Expo (ไอคอน, permission, plugins, eas.projectId)
eas.json                  # โปรไฟล์ build
src/
  screens/                # หน้าจอทั้งหมด — แต่ละไฟล์ export หลายหน้า
    onboarding.tsx        # Welcome, AuthChoice
    splash.tsx            # SplashScreen
    auth.tsx              # Auth (login/signup/forgot), Basics (โปรไฟล์ + หอพัก)
    questionnaire.tsx     # Intro, Question (q1-q6), Summary
    discovery.tsx         # Feed, Filters, Matches, Match, Requests
    profile.tsx           # Profile, MyProfile, Notifications, Report
    messaging.tsx         # Messages, Chat, Settings, SearchUsers, BlockedUsers
    verification.tsx      # Verify
    admin.tsx             # Dashboard, Users, Config
    legal.tsx             # Legal (terms/privacy)
  components/ui.tsx       # UI kit ที่ใช้ร่วมกัน
  services/api.ts         # base URL, token, ตัวห่อ fetch, appState
  services/notifications.ts  # ขอ Expo push token
  theme/                  # colors.ts, styles.ts (design tokens)
  types/                  # models.ts, navigation.ts (union ของชื่อหน้าจอ)
  i18n.tsx                # I18nProvider + คำแปล TH/EN
```

> โฟลเดอร์ `src/app/`, `src/hooks/`, `src/navigation/`, `src/store/`, `src/utils/` ยังว่าง (มีแค่ `.gitkeep`)

## คำสั่งที่ใช้บ่อย

```bash
npm start                # dev server
npm run web              # เปิดบนเว็บ
npm run android          # Android (expo run:android)
npm run ios              # iOS ผ่าน Expo Go บน LAN
npm run ios:tunnel       # iOS ผ่าน tunnel (เมื่อ LAN ใช้ไม่ได้)
npx expo start --clear   # ล้าง Metro cache (เมื่อเพิ่ม dependency ใหม่)
npx tsc --noEmit         # typecheck
```

> เอกสาร Expo ของเวอร์ชันนี้: <https://docs.expo.dev/versions/v54.0.0/>
