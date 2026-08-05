# Roommate Match — Code Audit & Task Backlog

ตรวจสอบเมื่อ: 5 ส.ค. 2026
ขอบเขต: `roommate-mach` (Expo SDK 54 frontend) + `../roommate-mach-be` (NestJS + Prisma backend)
Commit ล่าสุด: FE `cfb0c97`, BE `b3343be`

---

## ส่วนที่ 1 — สถานะโค้ดปัจจุบัน (ทำอะไรไปแล้ว)

### Frontend (`roommate-mach`) — ~9,000 บรรทัด, 18 ไฟล์ใน `src/`

| ส่วน | ไฟล์ | สถานะ |
|---|---|---|
| Navigation | `App.tsx` (283) | switch/if-else บน state `screen` เดียว — ไม่ได้ใช้ react-navigation, 36 screens ใน union |
| Splash + Onboarding | `splash.tsx` (252), `onboarding.tsx` (272) | swipe-to-enter, welcome 1–3, AuthChoice, แสดงครั้งแรกครั้งเดียวผ่าน `has_seen_onboarding` |
| Auth | `auth.tsx` (2,228) | login / signup / forgot, password strength meter, Google Sign-In (expo-auth-session), real-time check-email (debounce 400ms) |
| Profile setup | `auth.tsx` → `Basics` | basics + housing, dropdown modal เพศ/สาขา (21 สาขา), image picker 1:1, back button, auto-fill เมื่อแก้ไข |
| Questionnaire | `questionnaire.tsx` (1,232) | q1–q6 โหลดจาก API, แปล TH/EN ครบทุก option, summary |
| Discovery | `discovery.tsx` (1,153) | Feed (swipe LIKE/PASS), Filters, Matches, Match, Requests (liked you), BottomNav |
| Chat | `messaging.tsx` (474) | รายการห้องแชท + ค้นหา, Chat polling 4 วิ, Settings (ภาษา, notification prefs, discoverable, logout) |
| Profile | `profile.tsx` (891) | MyProfile + profile strength, Public Profile, Notifications, Report/Block |
| Verification | `verification.tsx` (1,021) | อัปโหลดบัตร นศ. + stepper + poll สถานะ — **ถูกตัดออกจาก flow แล้ว แต่โค้ดยังอยู่** |
| Admin | `admin.tsx` (206) | Dashboard, Users (suspend/verify), Config |
| Infra | `api.ts` (143), `notifications.ts` (52), `i18n.tsx` (177), `theme/`, `components/ui.tsx` | AsyncStorage token persist + auto-login, `formatImageUri`, Expo push token, i18n dict ~100 keys |

### Backend (`roommate-mach-be`) — NestJS 11 + Prisma + PostgreSQL + MinIO

- **Auth (12 endpoints):** register, login, google, check-email (GET+POST), send-otp, resend-otp, verify-otp, verify-email, forgot-password, reset-password
- **Features (~35 endpoints):** me, profile (PUT/GET/alias), users/avatar, users/search, block/unblock, questionnaire (GET/PUT), verification, discover (pagination), swipes, matches, likes, unmatch, conversations, messages, notifications, reports, blocks, password, admin (dashboard/users/suspend/verify/reports/config)
- **Push:** register/unregister Expo push token
- **DB:** 15 Prisma models (User, Profile, Question/QuestionGroup/Answer, Verification, Swipe, Match, Conversation, Message, Notification, Report, Block, PushToken, PasswordReset, AppConfig)
- **Storage:** MinIO upload สำหรับรูปโปรไฟล์ + บัตร นศ.
- **Test:** `test/all-scrum.e2e-spec.ts`, `test/app.e2e-spec.ts`

---

## ส่วนที่ 2 — Task Backlog

### 🔴 P0 — Blocker (ต้องแก้ก่อน demo / deploy)

#### T-01 · ตาราง `Questionnaire` ไม่มีใน `schema.prisma` → DB ใหม่พังทันที
`roommate-mach-be/src/features/features.service.ts:287`, `prisma/schema.prisma`
`questionnaire()` เขียนด้วย `$executeRaw INSERT INTO "Questionnaire"` แต่ไม่มี model นี้ใน schema และไม่มีโฟลเดอร์ `prisma/migrations/` เลย → `prisma db push` บน DB ใหม่จะไม่สร้างตารางนี้ → กด "เสร็จสิ้น" ที่ q6 จะ error 500 → `Profile.completed` ไม่ถูกตั้งเป็น true → ผู้ใช้ **ติดอยู่ที่ onboarding ตลอดไป** และไม่มีใครโผล่ใน `/api/discover` (ที่กรอง `completed: true`)
ซ้ำร้าย `discover()` อ่านตารางนี้ด้วย `.catch(() => [])` → เงียบ → ทุกคนได้คะแนน fallback 70% เท่ากันหมด
**ทำ:** ย้ายไปใช้ Prisma model `Answer` ที่มีอยู่แล้ว (แนะนำ) หรือประกาศ model `Questionnaire` ใน schema + สร้าง migration จริง
**AC:** DB ใหม่จาก `db:push` ทำ onboarding จบได้ครบ, `/api/discover` คืนคะแนนที่คำนวณจริง (ไม่ใช่ 70 ทุกคน)

#### T-02 · หน้าลืมรหัสผ่านเป็นทางตัน (dead-end)
`src/screens/auth.tsx:373-517`
- ปุ่ม "ส่ง" ข้าง OTP **ไม่มี `onPress`** เลย
- ปุ่ม "ดำเนินการต่อ" `onPress={() => go("login")}` — ไม่ verify OTP, ไม่มีหน้าตั้งรหัสใหม่
- `sendOtp()` ยิง `/auth/forgot-password` (ที่สร้าง reset token) แทน `/auth/send-otp` (ที่ส่งอีเมล OTP จริง) → ผู้ใช้ไม่ได้รับ OTP
- `/auth/verify-otp` และ `/auth/reset-password` ที่ backend ทำเสร็จแล้ว **ไม่มีใครเรียก**
**ทำ:** ต่อ flow ให้ครบ send-otp → verify-otp → หน้าตั้งรหัสใหม่ → reset-password → login
**AC:** ผู้ใช้รีเซ็ตรหัสผ่านได้จริงตั้งแต่ต้นจนจบและ login ด้วยรหัสใหม่ได้

#### T-03 · ลบ backdoor OTP `123456` และ resetToken ที่หลุดใน response
`roommate-mach-be/src/auth/auth.service.ts:118`, `:171`
`verifyOtp` ยอมรับ `123456` เมื่อ `NODE_ENV !== 'production'` และ `forgotPassword` คืน `resetToken` ตรง ๆ ใน response
ถ้า deploy โดยไม่ได้ตั้ง `NODE_ENV=production` = ยึดบัญชีใครก็ได้ที่รู้อีเมล
**ทำ:** ใช้ flag แยก (`ALLOW_TEST_OTP`) ที่ default = ปิด, ลบ `resetToken` ออกจาก response ทุกกรณี
**AC:** ไม่มีทางข้าม OTP ได้เมื่อ env ไม่ได้เปิด flag อย่างชัดเจน

#### T-04 · TypeScript error + `tsc` crash
`src/screens/auth.tsx:309`
`npx tsc --noEmit` **crash** ด้วย `RangeError: Maximum call stack size exceeded` (ต้องรัน `node --stack-size=8000 ./node_modules/typescript/lib/tsc.js --noEmit` จึงผ่าน) และเมื่อรันผ่านพบ 1 error: `TS6133: 'checkingEmail' is declared but its value is never read`
(หมายเหตุ: `SUMMARY.md` ระบุ "0 errors" — ไม่ตรงกับสถานะจริงตอนนี้)
**ทำ:** ใช้ `checkingEmail` แสดง spinner ตอนเช็คอีเมล (หรือลบทิ้ง), เพิ่ม script `"typecheck": "tsc --noEmit"` และหาสาเหตุ stack overflow (น่าจะมาจาก `auth.tsx` ที่ยาว 2,228 บรรทัด — แก้ได้ด้วย T-19)
**AC:** `npm run typecheck` ผ่านสะอาดโดยไม่ต้องเพิ่ม stack size

#### T-05 · `sutId` ที่กรอกตอนสมัคร ถูกทิ้งหายไปเฉย ๆ + ไม่บังคับโดเมน SUT
`roommate-mach-be/src/auth/auth.service.ts:36`, `prisma/schema.prisma` (model User)
`RegisterDto` รับ `sutId` (validate `^b\d{7,8}$`) แต่ `user.create()` ไม่เคยบันทึกลง DB และ **model `User` ไม่มี field `sutId`** เลย
ส่วน `email` validate แค่ `@IsEmail()` → สมัครด้วย gmail.com ได้ ขัดกับข้อความในแอป "สำหรับนักศึกษา SUT เท่านั้น"
**ทำ:** เพิ่ม `sutId String? @unique` ใน model User + บันทึกค่า, บังคับโดเมน `@g.sut.ac.th` / `@sut.ac.th` (ยกเว้น ADMIN_EMAIL)
**AC:** สมัครด้วยอีเมลนอกโดเมน SUT ถูกปฏิเสธ, `sutId` ถูกเก็บและ query ได้

---

### 🟠 P1 — Functional gap (ฟีเจอร์มีหน้าจอแต่ไม่ทำงานจริง)

#### T-06 · Feed pagination ไม่ส่ง `?page` → เห็นได้แค่ 30 คนแรกตลอดกาล
`src/screens/discovery.tsx:109`
`loadPage()` เรียก `api('/api/discover')` โดยไม่มี page param ทั้งที่ backend รับ `@Query('page')` และ slice 30 ต่อหน้า → รอบที่สองได้ข้อมูลเดิม → `newItems.length === 0` → `setHasMore(false)` → infinite scroll ตายถาวร
**ทำ:** เก็บ state `page` และส่ง `/api/discover?page=${page}`
**AC:** ปัดเกิน 30 โปรไฟล์แล้วยังโหลดคนต่อไปมาได้

#### T-07 · หน้า Filters เป็น mock UI ล้วน — กดแล้วไม่มีผลอะไร
`src/screens/discovery.tsx:340-457`
`active: true/false` hardcode ในตัว literal, pill ไม่มี `onPress`, "บันทึกตัวกรอง" แค่ `go("feed")` ไม่มี state ไม่มีการยิง API และ `/api/discover` ก็ไม่รับพารามิเตอร์ตัวกรองใด ๆ
**ทำ:** ทำ state ตัวกรอง (zone / roomType / min score / budget) + ส่งเป็น query params + รับที่ `discover()` ฝั่ง backend
**AC:** เลือกโซนแล้ว feed เปลี่ยนตามจริง และค่าตัวกรองคงอยู่เมื่อกลับมาหน้าเดิม

#### T-08 · หน้า "It's a Match!" และคะแนน % เป็นค่า hardcode
`src/screens/discovery.tsx:560-611`, `src/screens/profile.tsx:137,140`
`Match` แสดง `92% Match`, avatar `YOU` / `SUT` และข้อความ "เข้ากันได้สูงถึง 92%" แบบตายตัว — ไม่ได้อ่านโปรไฟล์คนที่แมตช์จริง (ไม่มีการ set `appState.activeProfile` ก่อน `go("match")`)
`Profile` ใช้ `p?.score ?? 92` เป็น fallback → ผู้ใช้เห็น 92% แม้ยังไม่มีคะแนน
**ทำ:** ส่งข้อมูลคนที่แมตช์ผ่าน `appState.activeProfile` ก่อน navigate, แสดงชื่อ/รูป/คะแนนจริง, เปลี่ยน fallback จาก 92 เป็น "–"
**AC:** หน้าแมตช์แสดงชื่อ รูป และ % จริงของคู่นั้น

#### T-09 · ปุ่ม "แชท" ทุกที่พาไปหน้ารายการ ไม่ได้เข้าห้องแชท
`src/screens/discovery.tsx:525,594`, `src/screens/profile.tsx:160`
ทั้ง Matches, Match และ Public Profile เรียก `go("messages")` โดยไม่ตั้ง `appState.activeConversationId` → ผู้ใช้ต้องไปหาห้องแชทเองอีกรอบ
**ทำ:** หา/สร้าง conversation จาก match แล้วตั้ง `activeConversationId` + `go("chat")` (อาจต้องเพิ่ม endpoint `POST /api/conversations` จาก matchId)
**AC:** กด "เริ่มแชท" เข้าห้องแชทของคู่นั้นทันที

#### T-10 · "เปลี่ยนรหัสผ่าน" ขึ้น Alert "Feature enabled in next update" ทั้งที่ API พร้อมแล้ว
`src/screens/messaging.tsx:289`, backend `PATCH /api/password`
นอกจากนี้ `changePassword()` ฝั่ง backend **ไม่ขอรหัสผ่านเดิม** → ใครได้ token ไปเปลี่ยนรหัสได้เลย
**ทำ:** ทำ modal เปลี่ยนรหัสผ่าน (รหัสเดิม + รหัสใหม่ + ยืนยัน) และเพิ่มการตรวจรหัสเดิมฝั่ง backend
**AC:** เปลี่ยนรหัสผ่านได้จาก Settings และต้องกรอกรหัสเดิมถูกก่อน

#### T-11 · "ผู้ใช้ที่บล็อก" พาไปหน้า Requests (คนที่ถูกใจคุณ) — ผิดหน้า
`src/screens/messaging.tsx:360`
`onPress={() => go("requests")}` และยังไม่มีหน้าแสดงรายการที่บล็อกเลย; backend มี `POST /api/users/block|unblock` + `DELETE /api/blocks/:userId` แต่ **ไม่มี endpoint ดึงรายการที่บล็อก**
**ทำ:** เพิ่ม `GET /api/blocks` ฝั่ง backend + สร้างหน้า `blocked` ใน FE (แสดง + ปลดบล็อก)
**AC:** ดูรายชื่อที่บล็อกและปลดบล็อกได้

#### T-12 · `api()` ไม่จัดการ 401 และไม่มี timeout
`src/services/api.ts:78-98`
token หมดอายุ → ทุกหน้าเด้ง `Alert` ข้อความ error ซ้ำ ๆ (Chat ยิงทุก 4 วิ, Verify ทุก 6 วิ) แต่ไม่เคยพากลับหน้า login; ถ้า server ไม่ตอบ `fetch` จะค้างไม่มีกำหนด
**ทำ:** เจอ 401 → `saveToken(null)` + callback กลับ authChoice, เพิ่ม `AbortController` timeout ~15 วิ
**AC:** token หมดอายุ → เด้งกลับหน้า login รอบเดียว, server ล่ม → error ภายใน 15 วิ

#### T-13 · logout ไม่ล้าง `appState` → ข้อมูลรั่วข้ามบัญชี
`App.tsx:222-227`, `src/services/api.ts:100`
ล้างแต่ token; `appState.currentUserId`, `profileDraft`, `questionnaireDraft`, `activeProfile`, `activeConversationId` ยังค้าง → login บัญชีใหม่จะเห็นชื่อ/รูป/คำตอบของคนก่อนจนกว่า `/api/me` จะตอบกลับ
**ทำ:** เพิ่ม `resetAppState()` ใน `api.ts` แล้วเรียกทุกครั้งที่ logout / 401
**AC:** สลับบัญชีแล้วไม่เห็นข้อมูลของบัญชีก่อนหน้าเลย

#### T-14 · ฟอนต์ไทย global อาจไม่ทำงานบน React 19
`App.tsx:53-61`
ใช้ `(Text as any).defaultProps` / `(TextInput as any).defaultProps` — React 19 **เลิกรองรับ `defaultProps` สำหรับ function component** (RN `Text` เป็น forwardRef) → hack นี้น่าจะเป็น no-op เงียบ ๆ ทำให้ text ที่ไม่ได้ระบุ `fontFamily` เอง fallback เป็นฟอนต์ระบบ
**ทำ:** ตรวจบนเครื่องจริงว่าฟอนต์ติดจริงไหม ถ้าไม่ ให้ทำ `<AppText>` wrapper หรือใส่ `fontFamily` ใน base style ของ `theme/styles.ts`
**AC:** ทุกหน้าแสดง NotoSansThai จริง (ไม่มี console warning เรื่อง defaultProps)

#### T-15 · ภาษาไม่ถูกจำ + i18n ปนกันสองระบบ
`src/i18n.tsx:119`
`useState<Language>("th")` ไม่อ่าน/เขียน AsyncStorage → สลับเป็น EN แล้วปิดแอป กลับมาเป็นไทยใหม่
และมีการเขียนสองแบบผสมกัน: `t("key")` (dict ~100 keys) กับ `language === "th" ? "..." : "..."` inline กระจายอยู่ **150+ จุด** ใน discovery/profile/messaging/questionnaire
**ทำ:** persist ภาษาใน AsyncStorage + ค่อย ๆ ย้าย inline ternary เข้า dict
**AC:** ภาษาคงอยู่ข้าม session; หน้าใหม่ ๆ ใช้ `t()` เท่านั้น

#### T-16 · ส่งรูปเป็น base64 ใน body → payload บวม, endpoint avatar ไม่ถูกใช้
`src/screens/auth.tsx:1042-1060`, `:1069`
`changePhoto` ฝัง `data:image/...;base64` แล้วส่งไปกับ `PUT /api/profile` ทั้งก้อน (รูป 2 ใบ ≈ หลาย MB ต่อ request) ทั้งที่ backend มี `POST /api/users/avatar` แยกไว้แล้วแต่ FE ไม่เคยเรียก
อีกจุด: `newPhotos.filter(Boolean)` ทำให้เลือกรูปช่องที่ 2 ก่อนช่องแรก แล้วรูปเด้งไปอยู่ช่องแรก
**ทำ:** อัปโหลดรูปแยกผ่าน `/api/users/avatar` แล้วเก็บแค่ URL, เปลี่ยน `filter(Boolean)` เป็นการรักษาตำแหน่ง slot
**AC:** `PUT /api/profile` payload < 50KB; เลือกรูปช่องไหนอยู่ช่องนั้น

---

### 🟡 P2 — Cleanup / คุณภาพโค้ด

#### T-17 · Admin ยังเป็นโครง — ปุ่มกดไม่ได้ + dead code + fallback อันตราย
`src/screens/admin.tsx`, `App.tsx:232`
- `AdminLogin` มี `Field` ที่ไม่มี value/onChange และ `go("dashboard")` ตรง ๆ — แต่ **ไม่เคยถูก render** (App map `adminLogin` → `<Auth mode="login">`) = dead code
- `Config`: ปุ่ม "Edit Domains", "Add University", "Add Question" ไม่มี `onPress`, ตัวเลข Match Weights hardcode; `GET/PUT /api/admin/config` และ `GET /api/admin/reports` ไม่มีใครเรียก
- `App.tsx:232` ใช้ `else content = <Config go={go} />` เป็น catch-all → **screen ที่ไม่รู้จักจะเด้งเข้าหน้า Admin Config** ของผู้ใช้ทั่วไป
**ทำ:** ลบ `AdminLogin`, ต่อ Config เข้ากับ API จริง, เปลี่ยน catch-all เป็นหน้า fallback ที่ปลอดภัย (หรือ `never` check)

#### T-18 · เศษของฟีเจอร์ยืนยันบัตร นศ. ที่ถูกถอดออกแล้ว
`src/screens/verification.tsx` (1,021 บรรทัด), `App.tsx:201`, `src/screens/onboarding.tsx:71`, `app.json`
หน้า `verify` ไม่อยู่ใน flow แล้ว แต่ยังถูก import + map ไว้ และยัง poll `/api/me` ทุก 6 วิถ้าเข้าถึงได้; ข้อความ welcome3 ยังบอก "ทุกบัญชีต้องยืนยันด้วยบัตรนักศึกษา SUT ก่อนเริ่มแชท"; permission string ใน `app.json` ยังอ้างถึงบัตรนักศึกษา
**ทำ:** ตัดสินใจให้ชัด — ถ้าถอดจริงให้ลบหน้า/route/ข้อความ/permission ออกทั้งชุด, ถ้าจะเก็บไว้ทำภายหลังให้ย้ายไป branch แยก

#### T-19 · ไฟล์ใหญ่เกินไป + StyleSheet สร้างใหม่ทุก render
`src/screens/auth.tsx` (2,228), `questionnaire.tsx` (1,232), `discovery.tsx` (1,153)
`auth.tsx:1140` ประกาศ `StyleSheet.create({...})` **ในตัว component `Basics`** → สร้างใหม่ทุกครั้งที่ rerender (และ `Basics` rerender ทุกครั้งที่พิมพ์)
**ทำ:** แยก `auth.tsx` → `Auth.tsx` / `Basics.tsx` / `styles.ts`, ย้าย StyleSheet ออกไป module scope
**AC:** ไม่มี `StyleSheet.create` อยู่ใน function body; ไฟล์ละไม่เกิน ~600 บรรทัด

#### T-20 · Chat ยัง polling + ไม่มี unread / read receipt
`src/screens/messaging.tsx:119`
`setInterval(load, 4000)` = ยิง API ทุก 4 วิต่อผู้ใช้ต่อคน; `Message.readAt` มีใน schema แต่ไม่มีใครเซ็ตหรืออ่าน; รายการห้องแชทไม่มี badge ข้อความใหม่
**ทำ:** ระยะสั้น—ลด poll + หยุดตอน background; ระยะยาว—WebSocket/SSE + `PATCH /api/messages/:id/read` + unread count

#### T-21 · Types อ่อน + ประกาศซ้ำ
`src/types/models.ts:27,36` — `interface MatchProfile` ประกาศ **สองครั้ง** (TS merge ให้เงียบ ๆ)
`api<T = any>`, `useState<any[]>` และ `me: any` กระจายทั่ว (discovery, messaging, admin, `populateProfileDraft`)
**ทำ:** ลบ interface ซ้ำ, สร้าง type ของ response แต่ละ endpoint, เอา `= any` ออกจาก `api<T>`

#### T-22 · ไม่มี lint / test ใน frontend เลย
ไม่มี `eslint.config.*`, ไม่มี test ไฟล์เดียว, ไม่มี CI (backend มี eslint + jest + e2e แล้ว)
**ทำ:** เพิ่ม `eslint-config-expo` + script `lint`/`typecheck`, เขียน test เริ่มจาก `formatImageUri`, `getPasswordStrength`, `populateProfileDraft`

#### T-23 · `GET /auth/check-email` เปิดโล่ง → enumerate อีเมลได้
`roommate-mach-be/src/auth/auth.controller.ts:11`
ไม่มี guard และไม่มี rate limit → ยิง loop เช็คได้ว่าอีเมลไหนสมัครแล้ว
**ทำ:** เพิ่ม throttling (`@nestjs/throttler`) และพิจารณาตอบแบบไม่ยืนยันตรง ๆ

#### T-24 · โค้ดขยะใน repo backend
`clear-swipes.ts`, `test-query.ts`, `test-service.ts`, `logs/` ถูก commit อยู่ที่ root
Prisma models `Question`, `QuestionGroup`, `Answer` ไม่ได้ถูกใช้เก็บข้อมูลจริง (ใช้ raw table แทน — ดู T-01); `QUESTION_DEFINITIONS` hardcode ใน service
**ทำ:** ย้าย script ไป `scripts/` หรือลบ, ใส่ `logs/` ใน `.gitignore`, จัดการ model ที่ตายแล้วพร้อม T-01

#### T-25 · ของเล็ก ๆ
- `src/screens/auth.tsx:479` — ข้อความปุ่มยังมี debug text ค้าง: `` `Send OTP\n(1.3 s)     in 0:${countdown}` ``
- `src/screens/auth.tsx:194,614` — checkbox "จดจำฉันไว้" ไม่ทำอะไร (token persist ตลอดอยู่แล้ว)
- `src/screens/auth.tsx:461` — หน้า forgot ผสมไทย/อังกฤษในบล็อกเดียว (หัวข้อไทย เนื้อหาอังกฤษ) และ hardcode ไม่ผ่าน `t()`
- `.env` ขาด `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` → Google sign-in บน iOS จะ fallback ไป web client id
- `expo-crypto` อยู่ใน dependencies แต่ไม่มีที่ไหนเรียกใช้
- `SUMMARY.md` ระบุ "0 errors" ซึ่งไม่ตรงกับสถานะจริง (ดู T-04) — ควรอัปเดตหรือเลิก claim ตัวเลขใน docs

---

## สรุปลำดับที่แนะนำ

1. **T-01, T-04** ก่อนอื่นเลย — ตอนนี้ระบบยังทำงานอยู่เพราะตาราง `Questionnaire` ค้างอยู่ใน dev DB เท่านั้น ถ้าใครรัน `db:push` ใหม่หรือ deploy จริงจะพังทั้งระบบทันที
2. **T-03, T-05, T-10 (ส่วน backend)** — ช่องโหว่ความปลอดภัยที่แก้ไม่นาน
3. **T-02, T-06, T-07, T-09** — 4 หน้าจอที่ผู้ใช้เห็นแล้วคิดว่าใช้ได้ แต่กดไปไม่มีอะไรเกิดขึ้น (พังตอน demo แน่)
4. **T-12, T-13, T-14** — ความเสถียรของ session และฟอนต์
5. ที่เหลือทำระหว่างรอบ refactor
