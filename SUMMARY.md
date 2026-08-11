# 🚀 Roommate Match - Summary of Development & Improvements

**Project Name**: Roommate Match (`roommate-mach`)  
**Developer**: Sitthisak Phaisanphiphak (`b6824310@g.sut.ac.th`)  
**Date**: July 28, 2026  
**Jira Board**: [SCRUM Board - Roommate Match](https://g03se692.atlassian.net/jira/software/projects/SCRUM/boards/1)

---

## 📌 Summary of Key Features & Fixes Completed

### 1. 🇹🇭🇬🇧 Lifestyle Questionnaire Full Localization (TH / EN)
- **File Updated**: [`src/screens/questionnaire.tsx`](./src/screens/questionnaire.tsx)
- Implemented full bilingual translation mapping (`TH` / `EN`) for all 6 questionnaire sections (`q1` – `q6`).
- Translated titles, subtitles, category pills, group labels, lightbulb notes, and item choice chips:
  - `q1`: Bedtime & Wake-up rhythm (`21:00 – 22:30 น.`, `23:00 – 00:30 น.`, `01:00 น. ขึ้นไป`)
  - `q2`: Cleanliness standards & tidiness ratings (`1/5` to `5/5`)
  - `q3`: Guests, quiet hours, and social energy
  - `q4`: Preferred AC temp (`22–24°C`, `25–26°C`, `27°C+`) & study location
  - `q5`: Smoking/vaping policy, alcohol, and pet preferences
  - `q6`: Shared expenses (`50/50`, actual usage) and adaptability level
- Real-time dynamic language switching when changing language in settings.

---

### 2. 🔑 Persistent Auth Token (Auto-Login) & Single-Time Onboarding
- **Files Updated**: [`src/services/api.ts`](./src/services/api.ts), [`App.tsx`](./App.tsx)
- **Dependency Added**: `@react-native-async-storage/async-storage`
- **Auto-Login**: Saved `roomie_token` persistently across app restarts. On app startup, `/api/me` automatically re-authenticates the user and opens **Feed** or **Basics** without prompting for login credentials again.
- **Single-Time Splash & Welcome Flow**: Implemented `has_seen_onboarding` flag. The **Splash Screen Slider** and **Welcome 1–3** onboarding pages are displayed **only once on first launch** and skipped on all subsequent app opens and logouts.

---

### 3. 🖼️ Profile Image Display & Storage Resolution
- **Files Updated**: [`src/services/api.ts`](./src/services/api.ts), [`src/screens/profile.tsx`](./src/screens/profile.tsx), [`src/screens/discovery.tsx`](./src/screens/discovery.tsx), [`src/screens/auth.tsx`](./src/screens/auth.tsx)
- Added `formatImageUri()` helper function to handle Base64 data URIs (`data:image/...`), local file URIs (`file://`), and remote HTTP/MinIO URLs.
- Resolved `localhost:9000` IP resolution issue on mobile devices and Expo Go by dynamically routing to the active server IP.
- Improved ImagePicker picker with aspect ratio cropping (`1:1`) and array bounds checking to prevent blank avatar boxes.

---

### 4. 🎨 UI Redesign & Lucide SVG Icons Migration
- **Files Updated**: `discovery.tsx`, `questionnaire.tsx`, `profile.tsx`, `messaging.tsx`, `auth.tsx`
- **Dependency Added**: `lucide-react-native`, `react-native-svg`
- Replaced ASCII text and legacy icons across the application with Lucide SVG icons (`Search`, `Heart`, `MessageCircle`, `User`, `SlidersHorizontal`, `Flame`, `ShieldCheck`, `Pencil`, `Settings`, `Target`, `Globe`, `LogOut`, `ArrowLeft`, `ArrowRight`, `Check`, etc.).

---

### 5. ↩️ Profile Setup Back Button & Editing Flow Optimization
- **File Updated**: [`src/screens/auth.tsx`](./src/screens/auth.tsx)
- Added a top navigation header with `← Back` button on **"เกี่ยวกับคุณ" (Basics)** and **"หอพักและการศึกษา" (Housing)** screens.
- Auto-fills existing profile data when editing from `MyProfile`.
- Updated save button behavior so completed profiles save and return directly to `MyProfile` instead of restarting questionnaire intro.

---

### 6. 🆔 Removed ID Card Photo & Verification Requirement
- **Files Updated**: [`App.tsx`](./App.tsx), [`src/screens/onboarding.tsx`](./src/screens/onboarding.tsx), [`src/screens/profile.tsx`](./src/screens/profile.tsx)
- Removed student ID card photo upload and admin verification (`verify` screen) step from registration/login flows. Non-admin users navigate directly to profile setup (`basics`).

---

### 7. 🛠️ Build Export & EAS CLI Integration
- Verified TypeScript compilation (`npx tsc --noEmit`) with 0 errors across frontend and NestJS backend.
- Exported production bundle with `npx expo export`:
  - **iOS Bundle**: `4.37 MB` (Hermes Bytecode)
  - **Android Bundle**: `4.38 MB` (Hermes Bytecode)
  - **Web Bundle**: `2.8 MB`
- Installed `eas-cli` and configured `"eas": "eas-cli"` script shortcut in `package.json`.

---

### 📋 Jira Ticket Updates
- Updated Jira tasks **SCRUM-154** (Parent Task) and sub-tasks **SCRUM-279** through **SCRUM-283**:
  - **Assignee**: Sitthisak Phaisanphiphak (`b6824310@g.sut.ac.th`)
  - **Status**: Updated to "In Review" / "Done"

---

## 🛠️ Build & Run Commands Reference

### Run Application locally
```bash
# Start Frontend Expo Server
npm start

# Run on iOS (LAN / Expo Go)
npm run ios

# Run on Android
npm run android
```

### Production EAS Build Commands
```bash
# Build Android APK / AAB
npx eas-cli build --platform android

# Build iOS IPA
npx eas-cli build --platform ios

# Build All Platforms
npx eas-cli build --platform all
```

---
*Created automatically by Antigravity AI Assistant for Sitthisak Phaisanphiphak.*
