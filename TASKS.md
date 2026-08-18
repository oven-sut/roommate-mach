# Roommate Match — Code Audit & Task Backlog

ตรวจครั้งแรก 5 ส.ค. 2026 · **ปรับปรุงล่าสุด 18 ส.ค. 2026** — งาน P0/P1 ทั้งหมดปิดแล้ว
ขอบเขต: `roommate-mach` (Expo SDK 54) + `../roommate-mach-be` (NestJS 11 + Prisma)

สถานะตอนนี้: `npm run typecheck` ผ่านสะอาด · `npm run lint` ไม่มี error · `npm test` 53/53 ผ่าน
· `npx expo export --platform web` สร้าง bundle ได้

---

## ส่วนที่ 1 — งานที่ปิดแล้ว

### 🔴 P0

| # | เรื่อง | สิ่งที่ทำ |
|---|---|---|
| T-01 | ตาราง `Questionnaire` ไม่มีใน schema → DB ใหม่พังทันที | ฝั่ง backend ย้ายไปใช้ model `Answer` ที่มีอยู่แล้ว + มี migrations จริง · ทำ onboarding จบได้บน DB ใหม่ และ `/api/discover` คืนคะแนนที่คำนวณจริง |
| T-02 | หน้าลืมรหัสผ่านเป็นทางตัน | ทำครบแล้วใน `features/auth/ResetPassword.tsx` — send-otp → verify-otp → ตั้งรหัสใหม่ → `reset-password-otp` → login |
| T-03 | Backdoor OTP `123456` และ resetToken หลุดใน response | ฝั่ง backend ย้ายไปใช้ flag `ALLOW_DEV_OTP` ที่ default ปิด และ throw ตอนบูตถ้าเปิดค้างใน production |
| T-04 | TypeScript error + `tsc` crash | เพิ่ม script `typecheck` ที่ให้ stack ใหญ่พอ (`node --stack-size=10000 …/tsc.js --noEmit`) — รันผ่านสะอาด 0 error |
| T-05 | `sutId` ถูกทิ้งหาย + ไม่บังคับโดเมน SUT | backend เพิ่ม `sutId String? @unique` และบันทึกจริง · บังคับโดเมน `@g.sut.ac.th` / `@sut.ac.th` ทั้งตอนสมัคร ตอน Google Sign-In และตอน send-otp (แอดมินแก้รายชื่อโดเมนได้จากหน้า Admin) |

### 🟠 P1

| # | เรื่อง | สิ่งที่ทำ |
|---|---|---|
| T-06 | Feed pagination ไม่ส่ง `?page` | `Feed.tsx` เก็บ state `page` แล้วส่งไปกับทุกคำขอ พร้อม prefetch เมื่อเหลือการ์ด 5 ใบ |
| T-07 | หน้า Filters เป็น mock UI ล้วน | ตัวกรองมี state จริง เก็บใน `appState.feedFilters` และส่งเป็น query params · **backend รับและใช้จริงแล้ว** ทั้ง `yearBand`, `major`, `budgetMin/Max`, `minScore`, `mustMatch` |
| T-08 | หน้า "It's a Match!" และคะแนนเป็น hardcode | `Match.tsx` อ่านคู่ที่แมตช์จาก `appState.activeProfile` · คะแนนมาจาก API จริง · ไม่มี fallback 92 แล้ว |
| T-09 | ปุ่ม "แชท" พาไปหน้ารายการ ไม่เข้าห้องแชท | `openChatWith()` ตั้ง `activeConversationId` แล้วเข้า `chat` ตรง ๆ · backend มี `POST /api/conversations` และส่ง `conversationId` มากับ match/swipe แล้ว |
| T-10 | "เปลี่ยนรหัสผ่าน" ขึ้น Alert ว่ายังไม่รองรับ | มี modal เปลี่ยนรหัสใน `Settings.tsx` · backend บังคับกรอกรหัสเดิมให้ถูกก่อน |
| T-11 | "ผู้ใช้ที่บล็อก" พาไปหน้า Requests | มีหน้า `BlockedUsers.tsx` จริง · backend มี `GET /api/blocks` |
| T-12 | `api()` ไม่จัดการ 401 และไม่มี timeout | มี timeout 20 วิผ่าน `AbortController` · เจอ 401 (ที่ไม่ใช่หน้า login) จะล้าง token + ล้าง app state + เด้งกลับหน้า authChoice **ครั้งเดียว** ไม่ว่าจะมีกี่ request ค้างอยู่ |
| T-13 | logout ไม่ล้าง `appState` → ข้อมูลรั่วข้ามบัญชี | `resetAppState()` ถูกเรียกทั้งตอน logout, ตอน 401 และตอนเข้าหน้า login/signup |
| T-14 | ฟอนต์ไทย global อาจไม่ทำงานบน React 19 | เลิกใช้ `defaultProps` แล้ว — ทุกหน้าวาดผ่าน `<Txt>` ที่กำหนด `fontFamily` เอง |
| T-15 | ภาษาไม่ถูกจำ | `I18nProvider` อ่าน/เขียน AsyncStorage แล้ว — สลับภาษาแล้วปิดแอป กลับมายังเป็นภาษาเดิม |
| T-16 | ส่งรูปเป็น base64 ใน body → payload บวม | อัปโหลดผ่าน `POST /api/users/avatar` แยก แล้วเก็บแค่ URL · backend validate mime type + จำกัด 6 รูป |

### 🟡 P2

| # | เรื่อง | สิ่งที่ทำ |
|---|---|---|
| T-17 | Admin ยังเป็นโครง | `AdminLogin` ที่เป็น dead code หายไปตอนแยกไฟล์ · `Config.tsx` ต่อกับ `GET/PUT /api/admin/config` จริง (backend เพิ่ม route ให้ตรงกับที่หน้าจอยิงมา) · catch-all อันตรายหายไปแล้ว — `renderScreen` เป็น switch ที่ครอบทุก `Screen` |
| T-18 | เศษของฟีเจอร์ยืนยันบัตร นศ. | ตัดสินใจว่า **เก็บไว้แบบไม่บังคับ** — เพิ่มทางเข้าจากหน้า MyProfile (ซ่อนเมื่อยืนยันแล้ว) · แก้ข้อความ welcome3 และ permission ใน `app.json` ให้ตรงว่าไม่ใช่ข้อบังคับ |
| T-19 | ไฟล์ใหญ่เกินไป + StyleSheet สร้างใหม่ทุก render | แยกเป็น feature folders ไฟล์ละหน้าจอแล้ว ไฟล์ใหญ่สุด ~570 บรรทัด · ไม่มี `StyleSheet.create` อยู่ใน function body |
| T-20 | Chat ยัง polling + ไม่มี unread / read receipt | มี unread badge และ read receipt จริงแล้ว (backend มี `PATCH /api/conversations/:id/read` และนับ unread) · หยุด poll เมื่อแอปลงพื้นหลัง · **ยังเป็น polling** ดูส่วนที่ 2 |
| T-21 | Types อ่อน + ประกาศซ้ำ | `MatchProfile` ที่ประกาศซ้ำหายไปแล้ว · `api<T>` เลิก default เป็น `any` (เป็น `unknown`) · เพิ่ม type `Me` และ `ApiProfile` แยกจาก `ProfileDraft` เพราะ `age` ฝั่ง server เป็นตัวเลข แต่ในฟอร์มเป็นสตริง |
| T-22 | ไม่มี lint / test ใน frontend เลย | มี `eslint.config.js` (eslint-config-expo รุ่นที่ตรงกับ SDK 54) + `npm run lint` · มีเทสต์ 53 ตัวครอบ `formatImageUri`, `populateProfileDraft`, `resetAppState`, พฤติกรรมของ `api()` รวมถึงเส้นทาง 401, การแปลงคำตอบแบบสอบถามไป-กลับ, ความแข็งแรงของรหัสผ่าน และการแปลงรหัสนักศึกษาเป็นอีเมล |
| T-23 | `GET /auth/check-email` เปิดโล่ง | มี throttling แล้ว และคืน `allowedDomain` มาด้วยเพื่อให้ฟอร์มบอกผู้ใช้ได้ทันทีว่าโดเมนไม่รองรับ |
| T-24 | โค้ดขยะใน repo backend | ลบ `clear-swipes.ts`, `test-query.ts`, `test-service.ts` · ใส่ `logs/` ใน `.gitignore` |
| T-25 | ของเล็ก ๆ | ข้อความ debug ที่ปุ่ม OTP หายไปแล้ว · checkbox "จดจำฉันไว้" **ทำงานจริงแล้ว** (ไม่ติ๊ก = ไม่เก็บ token ลง keychain ปิดแอปแล้วต้อง login ใหม่) · หน้าลืมรหัสผ่านใช้ `t()` ทั้งหน้า · ลบ `expo-crypto` ที่ไม่ได้ใช้ · `.env` มีที่สำหรับ iOS client id |

### งานที่พบเพิ่มระหว่างแก้ (ไม่ได้อยู่ในรายการเดิม)

- **`.env` ชี้ผิดพอร์ต** — `EXPO_PUBLIC_API_URL` ยังเป็น `:8888` แต่ API ย้ายไป `:18888`
  นานแล้ว แปลว่าแอปยิง API ไม่ติดเลย · แก้แล้วทั้ง `.env` และ `.env.example`
- **ตราสัญลักษณ์ "ยืนยันแล้ว" ไม่เคยขึ้น** — โค้ดเทียบสถานะกับ `"APPROVED"` แต่ enum ฝั่ง server
  คือ `"VERIFIED"` · แก้ทั้ง `discovery.content.ts` และ `MyProfile.tsx`
- **สวิตช์ "ซ่อนจาก Discover" อ่านค่าผิดที่** — อ่าน `me.profile.discoverable` แต่ค่าจริงอยู่ที่
  `me.discoverable` ระดับบัญชี · แก้แล้ว
- **`propertyType` หายทั้งเส้น** — แอปเก็บและแสดงผลแต่ backend ไม่มี field · เพิ่มลง schema แล้ว
- **ตัวกรอง "อุณหภูมิแอร์" กดแล้วเงียบ** — แอปส่งค่า `acTemp` แต่ backend รู้จักแค่ `temperature`
- **`GET /api/questionnaire` คืนคนละรูปกับที่ `MyProfile` อ่าน** — ทำให้ปุ่ม "ทำใหม่" เริ่มจากค่าว่าง
  และ "ทำล่าสุดเมื่อ" ว่างตลอด · backend คืน `{ questions, answers, updatedAt }` แล้ว

---

## ส่วนที่ 2 — สิ่งที่ยังเหลือ (จงใจไม่ทำในรอบนี้)

| เรื่อง | เหตุผล |
|---|---|
| แชทเป็น realtime แทน polling ทุก 4 วิ | เป็นงานเปลี่ยนสถาปัตยกรรมทั้งสองฝั่ง · ลด cost ไปแล้วบางส่วนด้วยการหยุด poll ตอนแอปลงพื้นหลัง |
| ย้าย `language === "th" ? … : …` ที่เหลือเข้า dict | ยังมีกระจายอยู่บ้าง ทำงานถูกต้องแต่ไม่สม่ำเสมอ · ค่อยย้ายตอนแตะไฟล์นั้น ๆ |
| เทสต์ระดับ component (render จริง) | ตอนนี้เทสต์ครอบเฉพาะ logic ล้วน · การ render ยังพึ่ง typecheck + การกดใช้งานจริง |
| ตั้ง `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | ต้องสร้าง OAuth client id ฝั่ง iOS ใน Google Cloud Console ก่อน · ตอนนี้ fallback ไป web client id |
