import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn(
    "[iStocked] Supabase is not configured — account sync is disabled. " +
      "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, " +
      "then restart Metro with: npx expo start -c",
  );
}

// ─── Session storage ──────────────────────────────────────────────────────────
// Web: localStorage (expo-secure-store has no web implementation).
// Native: chunked SecureStore — Supabase sessions exceed SecureStore's
// 2KB-per-key limit on Android, so the value is split across chunk keys.

const CHUNK_SIZE = 2000;

const localStorageAdapter = {
  getItem: (key: string) => {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
};

const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunkCount`);
    if (!chunkCount) return (await SecureStore.getItemAsync(key)) ?? null;
    let value = "";
    for (let i = 0; i < Number(chunkCount); i++) {
      value += (await SecureStore.getItemAsync(`${key}_${i}`)) ?? "";
    }
    return value || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length > CHUNK_SIZE) {
      const chunks = Math.ceil(value.length / CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}_chunkCount`, String(chunks));
      for (let i = 0; i < chunks; i++) {
        await SecureStore.setItemAsync(
          `${key}_${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        );
      }
      await SecureStore.deleteItemAsync(key);
    } else {
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunkCount`);
      if (chunkCount) {
        for (let i = 0; i < Number(chunkCount); i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_chunkCount`);
      }
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunkCount`);
    if (chunkCount) {
      for (let i = 0; i < Number(chunkCount); i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}_chunkCount`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const storageAdapter = Platform.OS === "web" ? localStorageAdapter : secureStorageAdapter;

export const supabase = createClient(
  supabaseUrl || "https://not-configured.supabase.co",
  supabaseAnonKey || "not-configured",
  {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // Web OAuth returns to the page with tokens in the URL — let the
      // client detect them there; native parses the deep link manually
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);

// Redirect that Google OAuth sends the user back to.
// - Web: the page URL itself (session is detected on arrival)
// - Expo Go: exp:// deep link (istocked:// is not resolvable inside Expo Go and would hang)
// - Production build / dev build: istocked://auth/callback (scheme registered in app.json)
export const oauthRedirectUri =
  Platform.OS === "web"
    ? Linking.createURL("")
    : makeRedirectUri({
        scheme: "istocked",
        path: "auth/callback",
      });

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: Linking.createURL("") },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return { ok: false, error: error?.message ?? "Could not start Google sign-in." };
    }

    // Await the browser session directly
    const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirectUri, {
      showInRecents: true,
    });

    if (result.type === "success" && result.url) {
      const url = result.url;
      const payload = url.includes("#") ? url.split("#")[1] : (url.split("?")[1] ?? "");
      const params = new URLSearchParams(payload);

      const errorParam = params.get("error_description") || params.get("error");
      if (errorParam) return { ok: false, error: errorParam };

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) return { ok: false, error: sessionError.message };
        return { ok: true };
      }
    }

    return { ok: false, error: "Sign-in was cancelled or closed." };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "An unexpected error occurred." };
  } finally {
    void WebBrowser.coolDownAsync();
  }
}

// Warm up the browser for faster OAuth (call once when Settings mounts)
export function warmUpBrowser() {
  if (Platform.OS === "web") return;
  void WebBrowser.warmUpAsync();
}
