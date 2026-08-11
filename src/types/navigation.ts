/**
 * Every destination in the app.
 *
 * Filters is deliberately absent: the redesign presents it as a sheet layered
 * over Discover rather than a screen of its own.
 */
export type Screen =
  // onboarding
  | "splash"
  | "welcome1"
  | "welcome2"
  | "welcome3"
  | "authChoice"
  // auth
  | "login"
  | "signup"
  | "forgot"
  | "terms"
  | "privacy"
  | "verify"
  // profile setup
  | "basics"
  | "intro"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "summary"
  // main app
  | "feed"
  | "matches"
  | "match"
  | "profile"
  | "messages"
  | "chat"
  | "myprofile"
  | "photos"
  | "notifications"
  | "report"
  // settings
  | "settings"
  | "blocked"
  | "search"
  // admin
  | "dashboard"
  | "users"
  | "config";

/** The four questionnaire steps, in order. */
export const QUESTION_SCREENS = ["q1", "q2", "q3", "q4"] as const;
export type QuestionScreen = (typeof QUESTION_SCREENS)[number];
