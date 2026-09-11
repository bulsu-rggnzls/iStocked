import { storage } from "./storage";

const OFFLINE_MODE_KEY = "istocked.offline-mode";

// Remembers the user's "use without account" choice so the welcome
// screen only appears on first launch (or until they sign out)
export async function setOfflineMode(value: boolean): Promise<void> {
  await storage.setItem(OFFLINE_MODE_KEY, value ? "true" : "false");
}

export async function getOfflineMode(): Promise<boolean> {
  try {
    return (await storage.getItem(OFFLINE_MODE_KEY)) === "true";
  } catch {
    return false;
  }
}
