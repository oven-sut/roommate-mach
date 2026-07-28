import { Platform } from "react-native";
import type { MatchProfile, ProfileDraft } from "../types/models";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://192.168.1.55:8888"
    : "http://localhost:8888")
).replace(/\/$/, "");

let accessToken =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? localStorage.getItem("roomie_token")
    : null;

export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message[0]
        : data.message || "Request failed",
    );
  return data as T;
}

export const appState = {
  activeConversationId: null as string | null,
  activeConversationName: "Chat",
  currentUserId: null as string | null,
  activeProfile: null as MatchProfile | null,
  profileDraft: {
    displayName: "",
    age: "",
    major: "",
    gender: "",
    bio: "",
    year: 1,
    roomType: "Single",
    roommateGender: "Same gender",
    zone: "Gate 1",
    budgetMin: 2500,
    budgetMax: 4500,
    photos: [],
  } as ProfileDraft,
  questionnaireDraft: null as Record<string, number[][]> | null,
  questions: null as Record<string, unknown> | null,
};

export function populateProfileDraft(me: any) {
  if (!me) return;
  const p = me.profile || {};
  appState.profileDraft = {
    displayName: me.displayName || appState.profileDraft.displayName || "",
    age: p.age != null ? String(p.age) : (appState.profileDraft.age || ""),
    major: p.major ?? (appState.profileDraft.major || ""),
    gender: p.gender ?? (appState.profileDraft.gender || ""),
    bio: p.bio ?? (appState.profileDraft.bio || ""),
    year: p.year ?? (appState.profileDraft.year || 1),
    roomType: p.roomType ?? (appState.profileDraft.roomType || "Single"),
    roommateGender: p.roommateGender ?? (appState.profileDraft.roommateGender || "Same gender"),
    zone: p.zone ?? (appState.profileDraft.zone || "Gate 1"),
    budgetMin: p.budgetMin ?? (appState.profileDraft.budgetMin ?? 2500),
    budgetMax: p.budgetMax ?? (appState.profileDraft.budgetMax ?? 4500),
    photos: Array.isArray(p.photos) && p.photos.length > 0 ? p.photos : (appState.profileDraft.photos || []),
  };
}

export function saveToken(token: string | null) {
  accessToken = token;
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    token
      ? localStorage.setItem("roomie_token", token)
      : localStorage.removeItem("roomie_token");
  }
}

export const getAccessToken = () => accessToken;
