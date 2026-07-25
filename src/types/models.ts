export type UserRole = "ADMIN" | "USER";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  profile?: {
    completed?: boolean;
  } | null;
}

export interface ProfileDraft {
  displayName: string;
  age: string;
  major: string;
  gender: string;
  bio: string;
  year: number;
  roomType: string;
  roommateGender: string;
  zone: string;
  budgetMin: number;
  budgetMax: number;
  photos: string[];
}

export interface MatchProfile {
  id?: string;
  score?: number;
  displayName?: string;
  profile?: Partial<ProfileDraft>;
  verification?: {
    status?: string;
  };
}

export interface MatchProfile {
  score?: number;
  displayName?: string;
  profile?: Partial<ProfileDraft>;
  verification?: {
    status?: string;
  };
}
