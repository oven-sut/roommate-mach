export type UserRole = "ADMIN" | "USER";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  profile?: (Partial<ProfileDraft> & { completed?: boolean }) | null;
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
  profile?: Partial<ProfileDraft>;
  /** Lifestyle tags derived from the questionnaire ("Night Owl 22:00–23:00"). */
  tags?: string[];
  verification?: {
    status?: string;
  };
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
