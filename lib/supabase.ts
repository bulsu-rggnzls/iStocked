import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

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

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  supabaseUrl || "https://not-configured.supabase.co",
  supabaseAnonKey || "not-configured",
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Deep link that Google OAuth redirects back to.
// - Expo Go: exp:// deep link (istocked:// is not resolvable inside Expo Go and would hang)
// - Production build / dev build: istocked://auth/callback (scheme registered in app.json)
const isExpoGo = Constants.appOwnership === "expo";
export const oauthRedirectUri = isExpoGo
  ? Linking.createURL("auth/callback")
  : "istocked://auth/callback";

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: oauthRedirectUri, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? "Could not start Google sign-in." };
  }

  return new Promise((resolve) => {
    let settled = false;
    let linkSub: { remove: () => void } | null = null;

    const complete = async (url: string | undefined, timeoutError?: string) => {
      if (settled) return;
      settled = true;
      linkSub?.remove();
      void WebBrowser.dismissBrowser();
      // Free the Android browser task after auth completes
      void WebBrowser.coolDownAsync().catch(() => {});

      if (!url) {
        resolve({ ok: false, error: timeoutError ?? "Sign-in cancelled." });
        return;
      }

      // Supabase implicit flow returns tokens in the URL fragment (query as fallback)
      const payload = url.includes("#") ? url.split("#")[1] : (url.split("?")[1] ?? "");
      const params = new Map(
        payload
          .split("&")
          .filter(Boolean)
          .map((pair) => {
            const [k, v = ""] = pair.split("=");
            return [k, decodeURIComponent(v)] as const;
          }),
      );

      if (params.get("error")) {
        resolve({
          ok: false,
          error: params.get("error_description") ?? params.get("error")!,
        });
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) {
        resolve({
          ok: false,
          error:
            "Sign-in did not return a session. Verify the redirect URI is added in Supabase → Authentication → URL Configuration.",
        });
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      resolve(sessionError ? { ok: false, error: sessionError.message } : { ok: true });
    };

    // Safety net: deep-link listener catches the redirect even when the
    // browser session promise never resolves (some Android OEM browsers)
    linkSub = Linking.addEventListener("url", (event) => {
      if (event.url.includes("access_token") || event.url.startsWith(oauthRedirectUri)) {
        void complete(event.url);
      }
    });

    // Primary: browser session, resolves on redirect or dismissal
    void WebBrowser.openAuthSessionAsync(data.url, oauthRedirectUri).then((res) => {
      void complete(res.type === "success" && res.url ? res.url : undefined);
    });

    // Hard timeout: the button can never spin forever
    setTimeout(() => {
      void complete(undefined, "Sign-in timed out. Check your internet and the redirect URLs in Supabase → Authentication → URL Configuration.");
    }, 90000);
  });
}

// Warm up the browser for faster OAuth (call once when Settings mounts)
export function warmUpBrowser() {
  void WebBrowser.warmUpAsync();
}
