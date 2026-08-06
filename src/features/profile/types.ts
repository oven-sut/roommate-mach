/** Shape of `GET /api/me` as the profile screens consume it. */
export interface MyProfileData {
  displayName: string;
  discoverable: boolean;
  profile?: {
    age?: number | null;
    major?: string | null;
    year?: number | null;
    bio?: string | null;
    roomType?: string | null;
    roommateGender?: string | null;
    zone?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    photos?: string[];
    completed?: boolean;
  } | null;
  verification?: {
    status?: "PENDING" | "VERIFIED" | "REJECTED";
  } | null;
  answers?: unknown[];
}
