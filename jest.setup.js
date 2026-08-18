// `api.ts` resolves the API address once, at import time. Pinning it here to a
// LAN-style address (rather than the localhost fallback) is what lets the
// image-URL rewrite be tested for what it actually does on a phone.
process.env.EXPO_PUBLIC_API_URL = "http://192.168.1.50:18888";

// expo-secure-store and AsyncStorage both need a native module that does not
// exist under Jest, so the tests get in-memory stand-ins.
jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  };
});

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map();
  return {
    getItem: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});
