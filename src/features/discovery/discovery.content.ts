import type { Language } from "../../i18n";
import type { MatchProfile } from "../../types/models";
import { MAJOR_OPTIONS, labelFor } from "../profile/profile.content";

/** The four score components the match profile breaks a percentage down into. */
export const BREAKDOWN_ROWS = [
  { key: "sleep", labelKey: "catSleep" },
  { key: "cleanliness", labelKey: "catClean" },
  { key: "guests", labelKey: "catGuests" },
  { key: "temperature", labelKey: "catTemp" },
] as const;

/** Year bands the feed filter offers, relative to the signed-in student. */
export const YEAR_BANDS = [
  { value: "under", key: "yearUnder" },
  { value: "peer", key: "yearPeer" },
  { value: "upper", key: "yearUpper" },
  { value: "everyone", key: "yearEveryone" },
] as const;

/** Categories a match can be required to agree on. */
export const MUST_MATCH = [
  { value: "sleep", key: "sleepSchedule" },
  { value: "cleanliness", key: "cleanlinessFilter" },
  { value: "guests", key: "guestsFilter" },
  { value: "acTemp", key: "acTempFilter" },
] as const;

export const BUDGET_MIN = 1500;
export const BUDGET_MAX = 15000;
export const BUDGET_STEP = 500;

/**
 * Second line of a discover card: "Computer ENG - Year 1 - wants double room".
 * Pieces that the API did not send are dropped rather than rendered blank.
 */
export function describe(
  person: MatchProfile | null | undefined,
  language: Language,
  t: (key: string) => string,
): string {
  const profile = person?.profile;
  if (!profile) return "";

  const parts: string[] = [];
  if (profile.major) parts.push(labelFor(MAJOR_OPTIONS, profile.major, language));
  if (profile.year) parts.push(`${t("year")} ${profile.year}`);
  if (profile.roomType) {
    parts.push(`${t("wantsRoom")} ${profile.roomType.toLowerCase()}`);
  }
  return parts.join(" - ");
}

/** Name and age as one string, tolerating either being missing. */
export function nameAndAge(person: MatchProfile | null | undefined): string {
  const name = person?.displayName?.trim() || "—";
  const age = person?.profile?.age;
  return age ? `${name}, ${age}` : name;
}

/**
 * Lifestyle chips for a card. The API returns them pre-computed when the other
 * student has finished the questionnaire; anything else falls back to the
 * housing preferences, so a card is never chip-less.
 */
export function cardTags(person: MatchProfile | null | undefined): string[] {
  if (person?.tags?.length) return person.tags;
  const profile = person?.profile;
  if (!profile) return [];
  return [profile.roomType, profile.propertyType].filter(Boolean) as string[];
}

export function isVerified(person: MatchProfile | null | undefined): boolean {
  return person?.verification?.status === "VERIFIED";
}

/** "matched 2 h ago" — coarse on purpose; exact times add no value here. */
export function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 60) return `${minutes} m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
