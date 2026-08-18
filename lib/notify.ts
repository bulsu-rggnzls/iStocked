import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    (globalThis as { alert?: (m: string) => void }).alert?.(
      message ? `${title}: ${message}` : title,
    );
  } else {
    Alert.alert(title, message);
  }
}