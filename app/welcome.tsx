import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/ui/Button";
import { signInWithGoogle, supabaseConfigured } from "../lib/supabase";
import { syncAll } from "../lib/sync";
import { setOfflineMode } from "../lib/appMode";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web OAuth errors (e.g. expired state cookie) arrive as URL params —
  // surface them instead of failing silently
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") ?? params.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError.replace(/\+/g, " ")));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const enterOffline = useCallback(async () => {
    await setOfflineMode(true);
    router.replace("/(tabs)");
  }, []);

  const handleSignIn = useCallback(async () => {
    if (signingIn) return;
    setSigningIn(true);
    setError(null);
    const result = await signInWithGoogle();
    setSigningIn(false);
    if (!result.ok) {
      setError(result.error ?? "Sign-in failed.");
      return;
    }
    try {
      await syncAll();
    } catch {
      // Account is set — sync can be retried from Settings
    }
    router.replace("/(tabs)");
  }, [signingIn]);

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }}
    >
      {/* Brand */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white">
          <Text className="text-4xl font-bold text-zinc-950">₱</Text>
        </View>
        <Text className="mt-5 text-3xl font-bold text-white">iStocked</Text>
        <Text className="mt-1.5 text-sm text-white/60">The phone-flipper&apos;s ledger</Text>

        <View className="mt-10 w-full gap-3">
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="phone-portrait-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text className="text-[13px] text-white/70">
              Track every phone from purchase to sale
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="cloud-offline-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text className="text-[13px] text-white/70">
              Works fully offline, always
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="cloud-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text className="text-[13px] text-white/70">
              Sign in and your ledger follows you to any phone
            </Text>
          </View>
        </View>
      </View>

      {/* Choices */}
      <View className="px-6">
        {supabaseConfigured ? (
          <>
            <Button
              title={signingIn ? "Opening Google…" : "Sign in with Google"}
              onPress={handleSignIn}
              loading={signingIn}
            />
            <Pressable
              onPress={enterOffline}
              className="mt-3 h-12 items-center justify-center rounded-2xl border border-white/25 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">Use without account</Text>
            </Pressable>
            <Text className="mt-3 text-center text-[11px] leading-4 text-white/40">
              You can always sign in later from Settings.
            </Text>
          </>
        ) : (
          <>
            <Button title="Start selling" onPress={enterOffline} />
            <Text className="mt-3 text-center text-[11px] leading-4 text-white/40">
              Cloud backup is unavailable on this install — your data stays safe on
              this phone. You can add an account later from Settings.
            </Text>
          </>
        )}

        {error ? (
          <Text className="mt-3 text-center text-xs leading-4 text-red-400">{error}</Text>
        ) : null}
      </View>
    </View>
  );
}
