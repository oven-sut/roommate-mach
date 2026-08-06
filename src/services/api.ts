import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { MatchProfile, ProfileDraft } from "../types/models";
import { secureStorage } from "./secureStorage";

/** Port the backend listens on in development (see roommate-mach-be/.env). */
const DEV_API_PORT = 18888;
/** Abandon a request that has not responded in this long. */
const REQUEST_TIMEOUT_MS = 20_000;

const TOKEN_KEY = "roomie_token";
const ONBOARDING_KEY = "has_seen_onboarding";

/**
 * Where the API lives.
 *
 * `EXPO_PUBLIC_API_URL` wins and is what a production build must set. Failing
 * that we derive the host from the Expo dev server the app was loaded from, so
 * a physical phone reaches the developer's machine over the LAN without anyone
 * hardcoding an address that goes stale the next time DHCP moves.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (devHost) return `http://${devHost}:${DEV_API_PORT}`;

  return `http://localhost:${DEV_API_PORT}`;
}

export const API_URL = resolveApiUrl();

const API_HOST = API_URL.match(/^https?:\/\/([^:/]+)/)?.[1] ?? "localhost";

/**
 * Makes a server-supplied image URL reachable from this device.
 *
 * Object storage hands back URLs built from its own configured endpoint, which
 * in development is `localhost` — and on a phone `localhost` is the phone. The
 * host is swapped for the API host while the port is preserved, because the
 * storage port (19000 in this project) differs from the API port.
 */
export function formatImageUri(uri?: string): string {
  if (!uri || typeof uri !== "string") return "";

  const trimmed = uri.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("file://")) {
    return trimmed;
  }

  return trimmed.replace(
    /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/,
    `$1${API_HOST}`,
  );
}

let accessToken: string | null = null;

export async function initAuthToken(): Promise<string | null> {
  accessToken = await secureStorage.get(TOKEN_KEY);

  if (!accessToken) {
    // Tokens used to live in AsyncStorage. Move any leftover one across so an
    // existing install is not silently signed out by the upgrade.
    const legacy = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
    if (legacy) {
      accessToken = legacy;
      await secureStorage.set(TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
    }
  }

  return accessToken;
}

export function saveToken(token: string | null) {
  accessToken = token;
  if (token) void secureStorage.set(TOKEN_KEY, token);
  else void secureStorage.remove(TOKEN_KEY);
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(seen = true): Promise<void> {
  try {
    if (seen) await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    else await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // Worst case the welcome screens show once more.
  }
}

/**
 * Calls the API with the stored bearer token attached.
 *
 * Rejects with the server's message so screens can surface it directly, and
 * gives up after `REQUEST_TIMEOUT_MS` rather than leaving a spinner running
 * forever on a flaky connection.
 */
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The server took too long to respond");
    }
    throw new Error("Unable to reach the server");
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      Array.isArray(data.message)
        ? data.message[0]
        : data.message || "Request failed",
    );
  }
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
  const draft = appState.profileDraft;

  appState.profileDraft = {
    displayName: me.displayName || draft.displayName || "",
    age: p.age != null ? String(p.age) : draft.age || "",
    major: p.major ?? (draft.major || ""),
    gender: p.gender ?? (draft.gender || ""),
    bio: p.bio ?? (draft.bio || ""),
    year: p.year ?? (draft.year || 1),
    roomType: p.roomType ?? (draft.roomType || "Single"),
    roommateGender: p.roommateGender ?? (draft.roommateGender || "Same gender"),
    zone: p.zone ?? (draft.zone || "Gate 1"),
    budgetMin: p.budgetMin ?? (draft.budgetMin ?? 2500),
    budgetMax: p.budgetMax ?? (draft.budgetMax ?? 4500),
    photos: p.photos ?? (draft.photos || []),
    completed: Boolean(p.completed),
  };
}

export const getAccessToken = () => accessToken;
