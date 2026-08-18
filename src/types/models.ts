export type UserRole = "ADMIN" | "USER";

/** Mirrors the `VerificationStatus` enum in the API's Prisma schema. */
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

/**
 * A profile as the API stores it.
 *
 * Deliberately not `Partial<ProfileDraft>`: the draft keeps `age` as a string
 * because it is bound to a text input, while the server keeps it as a number.
 */
export interface ApiProfile {
  age?: number | null;
  major?: string | null;
  gender?: string | null;
  bio?: string | null;
  year?: number | null;
  roomType?: string | null;
  propertyType?: string | null;
  roommateGender?: string | null;
  zone?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  photos?: string[];
  completed?: boolean;
}

/** What the sign-in and register responses carry. */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  sutId?: string | null;
  profile?: ApiProfile | null;
}

export interface NotificationPrefs {
  matches?: boolean;
  messages?: boolean;
  likes?: boolean;
}

/** The fuller picture `GET /api/me` returns. */
export interface Me extends AuthenticatedUser {
  /** Whether this account appears in other students' decks. */
  discoverable?: boolean;
  notificationPrefs?: NotificationPrefs;
  createdAt?: string;
  verification?: { status?: VerificationStatus } | null;
  answers?: { questionId: string; selections: string[][] }[];
}

export interface ProfileDraft {
  displayName: string;
  age: string;
  major: string;
  gender: string;
  bio: string;
  year: number;
  /** "Single" | "Double" | "Either" */
  roomType: string;
  /** "On-campus" | "Off-campus" | "House" | "Condo" */
  propertyType: string;
  /** "Same gender" | "Any" | "Non-binary friendly" */
  roommateGender: string;
  zone: string;
  budgetMin: number;
  budgetMax: number;
  photos: string[];
  completed?: boolean;
}

/** Per-category compatibility breakdown shown on the match profile. */
export interface ScoreBreakdown {
  sleep?: number;
  cleanliness?: number;
  guests?: number;
  temperature?: number;
}

export interface MatchProfile {
  id?: string;
  /** Overall compatibility, 0–100. */
  score?: number;
  breakdown?: ScoreBreakdown;
  displayName?: string;
  profile?: ApiProfile | null;
  /** Lifestyle tags derived from the questionnaire ("Night Owl 22:00–23:00"). */
  tags?: string[];
  verification?: {
    status?: VerificationStatus;
  } | null;
  matchedAt?: string;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  name?: string;
  displayName?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread?: number;
  score?: number;
}

export interface Message {
  id: string;
  body?: string;
  text?: string;
  senderId?: string;
  createdAt?: string;
  readAt?: string | null;
}
