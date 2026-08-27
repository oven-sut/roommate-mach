# CI Pipeline — แอปมือถือ (roommate-mach)

ไฟล์เดียวที่คุมทุกอย่างคือ [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
รันบน **GitHub Actions** (`ubuntu-latest`, Node 22)

## รันเมื่อไหร่

| เหตุการณ์ | รัน |
|---|---|
| `push` ขึ้น `main` | ✅ 4 job หลัก |
| เปิด/อัปเดต pull request | ✅ 4 job หลัก |
| กดเอง (`workflow_dispatch`) | ✅ 4 job หลัก + EAS build (ถ้ามี token) |

push ซ้ำบน branch เดิมจะยกเลิกรันเก่าที่ค้างอยู่ (`concurrency` + `cancel-in-progress`)

## Stage ทั้ง 4

```
                   ┌── Lint ──────────────────┐
                   ├── Type check ────────────┤
push / PR ─────────┼── Unit tests ────────────┼──► CI passed
                   └── Bundle (expo export) ──┘
                                                      │
                              (กดเอง + มี EXPO_TOKEN) └──► EAS build
```

| # | Job | ทำอะไร | พังแปลว่า |
|---|---|---|---|
| 1 | **Lint** | `npm run lint -- --max-warnings=0` | โค้ดผิดกติกา ESLint (CI เข้มกว่าเครื่องตัวเอง: warning = พัง) |
| 2 | **Type check** | `npm run typecheck` (`tsc --noEmit`) | type ไม่ตรง — จับได้ก่อนถึงมือถือ |
| 3 | **Unit tests** | `npm run test:cov` — Jest 3 suites / 53 tests + coverage | ตรรกะ auth / questionnaire / api client พัง |
| 4 | **Bundle** | `npx expo export --platform android` | import path ผิด, asset หาย, native module ไม่เข้ากับ SDK |

**ทำไมต้องมี stage 4 ทั้งที่มี typecheck แล้ว** — `tsc` ไม่รู้จัก path ที่ Metro resolve
ไม่รู้ว่า asset มีอยู่จริงไหม และไม่แตะ native module เลย การ bundle จริงคือทางเดียวที่จับ
ของพวกนี้ได้โดยไม่ต้องรอ build APK เต็ม ๆ (bundle ใช้เวลาไม่กี่นาที, EAS build ใช้เป็นสิบนาที)

ปิดท้ายด้วย job **`CI passed`** ที่รวมผลทั้ง 4 เป็นเช็คเดียวสำหรับ branch protection

## EAS build (ไม่บังคับ)

job `EAS build (manual)` จะทำงานเฉพาะตอนกดรันเอง และเฉพาะเมื่อมี repository secret
ชื่อ `EXPO_TOKEN` เท่านั้น — ถ้ายังไม่ได้ตั้ง job จะ **ข้ามไปเงียบ ๆ ไม่ทำให้ pipeline แดง**

วิธีเปิดใช้:
1. `npx eas-cli login` แล้วสร้าง token ที่ https://expo.dev/settings/access-tokens
2. GitHub → Settings → Secrets and variables → Actions → New repository secret ชื่อ `EXPO_TOKEN`
3. Actions → CI → Run workflow

จะสั่ง `eas build --profile preview` (ตาม `eas.json`) แบบ `--no-wait` คือสั่งแล้วปล่อย
ไปดูผลต่อบน expo.dev ไม่กิน runner ทิ้งไว้

## ของที่ได้กลับมา (Artifacts)

| ชื่อ | คือ | เก็บไว้ |
|---|---|---|
| `app-coverage` | รายงาน coverage ของ Jest | 14 วัน |
| `android-bundle` | ผล `expo export` (`.hbc` + assets + `metadata.json`) | 7 วัน |

## รันแบบเดียวกันในเครื่อง

```bash
npm ci
npm run lint -- --max-warnings=0   # stage 1
npm run typecheck                  # stage 2
npm run test:cov                   # stage 3
npx expo export --platform android --output-dir dist   # stage 4
```
