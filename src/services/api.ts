import { Platform } from "react-native";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:8888" : "http://localhost:8888")
).replace(/\/$/, "");
let accessToken =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? localStorage.getItem("roomie_token")
    : null;
let activeConversationId: string | null = null;
let activeConversationName = "Chat";
let currentUserId: string | null = null;
let activeProfile: any = null;
const profileDraft: any = {
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
};
export async function api(path: string, options: RequestInit = {}) {
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
  return data;
}
export const appState = {
  activeConversationId: null as string | null,
  activeConversationName: "Chat",
  currentUserId: null as string | null,
  activeProfile: null as any,
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
} as any,
};
export function saveToken(token: string | null) {
  accessToken = token;
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    token
      ? localStorage.setItem("roomie_token", token)
      : localStorage.removeItem("roomie_token");
  }
}
export const getAccessToken = () => accessToken;

