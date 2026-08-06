import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { MatchProfile, ProfileDraft } from "../types/models";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://192.168.1.237:18888"
    : "http://localhost:18888")
).replace(/\/$/, "");

export function formatImageUri(uri?: string): string {
  if (!uri || typeof uri !== "string") return "";
  const trimmed = uri.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("file://")) return trimmed;

  if (trimmed.includes("localhost:9000") || trimmed.includes("127.0.0.1:9000")) {
    const apiHostMatch = API_URL.match(/https?:\/\/([^:]+)/);
    const host = apiHostMatch ? apiHostMatch[1] : "localhost";
    return trimmed.replace(/localhost|127\.0\.0\.1/, host);
  }
  return trimmed;
}

let accessToken: string | null = null;

export async function initAuthToken(): Promise<string | null> {
  try {
    const storedToken = await AsyncStorage.getItem("roomie_token");
    if (storedToken) {
      accessToken = storedToken;
    } else if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      accessToken = localStorage.getItem("roomie_token");
    }
  } catch (e) {
    console.error("Error initializing auth token", e);
  }
  return accessToken;
}

export function saveToken(token: string | null) {
  accessToken = token;
  if (token) {
    AsyncStorage.setItem("roomie_token", token).catch(() => undefined);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem("roomie_token", token);
    }
  } else {
    AsyncStorage.removeItem("roomie_token").catch(() => undefined);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.removeItem("roomie_token");
    }
  }
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem("has_seen_onboarding");
    return value === "true";
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(seen = true): Promise<void> {
  try {
    if (seen) {
      await AsyncStorage.setItem("has_seen_onboarding", "true");
    } else {
      await AsyncStorage.removeItem("has_seen_onboarding");
    }
  } catch (e) {
    console.error("Error setting has_seen_onboarding", e);
  }
}

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
    photos: p.photos ?? (appState.profileDraft.photos || []),
    completed: Boolean(p.completed),
  };
}

export const getAccessToken = () => accessToken;
