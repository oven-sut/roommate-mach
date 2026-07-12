# Roommate Match — แอปมือถือ 🏠

แอปหาเพื่อนร่วมห้องสำหรับนักศึกษา จับคู่จากไลฟ์สไตล์/งบประมาณ/หอพัก พร้อมแชทเรียลไทม์
สร้างด้วย **Expo SDK 57 · React Native 0.86 · expo-router · TypeScript · Tamagui** — UI ภาษาไทย ฟอนต์ Prompt ใช้ไอคอน Ionicons ทั้งแอป

> เป็นส่วน client ของโปรเจกต์ — ทำงานคู่กับ API ใน [`../sut-roommate-backend`](../sut-roommate-backend)
> ข้อมูลทั้งหมดมาจาก REST API + Socket.IO (ไม่มี mock/SQLite ในเครื่องแล้ว)

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Expo SDK 57 · React Native 0.86 · React 19 |
| Routing | expo-router (typed routes) |
| UI | Tamagui · Ionicons (`@expo/vector-icons`) · reanimated |
| State/Data | REST (`fetch`) · Socket.IO client · SecureStore (JWT) |
| Media/Push | expo-image-picker · expo-file-system · expo-notifications (FCM) |

## เริ่มต้นใช้งาน

```bash
npm install
npx expo start
```

- **มือถือ**: ติดตั้ง [Expo Go](https://expo.dev/go) แล้วสแกน QR (Wi-Fi วงเดียวกับคอม)
- **เว็บ**: กด `w`
- **Emulator**: กด `a` (Android)

> ต้องมี **backend รันอยู่** ด้วย (ดู [`../sut-roommate-backend`](../sut-roommate-backend))

## ชี้ไปที่ Backend ตัวไหน (สำคัญ)

การเลือก base URL อยู่ใน [`src/lib/config.ts`](./src/lib/config.ts) ตามลำดับ:

1. `EXPO_PUBLIC_API_URL` (env) — override ชั่วคราวสำหรับ dev
2. `app.json` → `expo.extra.apiUrl` — ค่าที่ฝังใน build (production)
3. auto-detect — เว็บ→`localhost:3000`, Expo Go→LAN IP ของเครื่อง dev, emulator→`10.0.2.2:3000`

**ทดสอบกับ backend local** โดยไม่แก้ `app.json`:

```bash
EXPO_PUBLIC_API_URL="http://<LAN-IP>:3000" npx expo start
```

> ⚠️ ก่อน **build APK production** ต้องแน่ใจว่า `app.json → extra.apiUrl` ชี้โดเมน production

## ฟีเจอร์

**ผู้ใช้**
- สมัคร 3 ขั้นตอน → **ยืนยันอีเมลด้วย OTP** (เช็กอีเมลซ้ำแบบเรียลไทม์)
- เข้าสู่ระบบหน้าเดียว แยกเส้นทางตามบทบาท · **ลืมรหัสผ่าน** ด้วย OTP
- แบบสอบถามไลฟ์สไตล์ → คะแนนความเข้ากันได้
- ค้นหาแบบปัดการ์ด (swipe) + ตัวกรอง · จับคู่เมื่อสนใจกันทั้งคู่
- แชทเรียลไทม์ (Socket.IO) · การแจ้งเตือน + push (FCM)
- **รูปโปรไฟล์** อัปโหลดจริง · ตั้งค่าโปรไฟล์/แจ้งเตือน/ความเป็นส่วนตัว · ลบบัญชีถาวร

**แอดมิน** (หน้า login เดียวกัน) — แดชบอร์ดสถิติ, จัดการสมาชิก/มหาวิทยาลัย/แบบสอบถาม/รายงาน

## Build APK (Android)

```bash
# ตรวจ app.json → extra.apiUrl = production ก่อน
npx expo prebuild -p android --clean
cd android && ./gradlew assembleRelease --no-daemon
# → android/app/build/outputs/apk/release/app-release.apk
```

- ต้องมี **JDK 21** + Android SDK, และ `android/local.properties` ระบุ `sdk.dir`
- ต้องมี `google-services.json` (Firebase, package `app.roommatematch.mobile`) ที่รากโฟลเดอร์นี้
- **Push จริงทดสอบได้เฉพาะบน APK** — Expo Go (SDK 53+) ไม่รองรับ remote push

## โครงสร้าง

```
app.json                  # config + extra.apiUrl (backend URL)
tamagui.config.ts         # ธีม + ฟอนต์ Prompt
google-services.json      # Firebase (client) — ต้องมีตอน build
src/
  app/                    # หน้าจอ (expo-router): login, register, verify-email,
  │                       # forgot/reset-password, (tabs), chat/[id], profile/[id],
  │                       # match, admin, settings, terms, ...
  components/ui/          # UI kit (Avatar, Button, Chip, SectionHeader, ...)
  components/screens/     # คอมโพเนนต์เฉพาะหน้า (admin/)
  constants/theme.ts      # design tokens (สี, ฟอนต์, Type)
  lib/                    # api, auth, repo, socket, push, session, config, types
```

## คำสั่งที่ใช้บ่อย

```bash
npx expo start           # dev server
npx expo start --clear   # ล้าง Metro cache (เมื่อเพิ่ม dependency ใหม่)
npm run web              # เปิดบนเว็บ
npx tsc --noEmit         # typecheck
```
