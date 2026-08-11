import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Storage for values that must not be readable by other apps or by anyone with
 * the device in hand — currently the auth token.
 *
 * On iOS and Android this is the Keychain / Keystore via expo-secure-store. On
 * web there is no equivalent, so it falls back to localStorage; treat anything
 * stored on web as readable by any script that manages to run on the page.
 *
 * Use `appStorage` instead for values that are merely inconvenient to lose.
 */

const isWeb = Platform.OS === "web";

function webStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      if (isWeb) return webStorage()?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      if (isWeb) webStorage()?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      // A device with a locked keychain is not a reason to crash the sign-in
      // flow; the user simply has to authenticate again next launch.
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (isWeb) webStorage()?.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore — the caller has already dropped the in-memory copy.
    }
  },
};
