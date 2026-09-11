import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Platform-safe key-value storage:
// - Web: localStorage (expo-secure-store is native-only)
// - Native: expo-secure-store (encrypted)
export const storage = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === "web"
      ? Promise.resolve(
          typeof localStorage === "undefined" ? null : localStorage.getItem(key),
        )
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};
