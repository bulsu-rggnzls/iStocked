import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { AppHeader } from "../components/ui/AppHeader";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { oauthRedirectUri, signInWithGoogle, supabase, supabaseConfigured, warmUpBrowser } from "../lib/supabase";
import { syncAll, type SyncResult } from "../lib/sync";

export default function SettingsScreen() {
  const { session, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    warmUpBrowser();
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
    setSyncing(true);
    try {
      const sync = await syncAll();
      setSyncResult(sync);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }, [signingIn]);

  const handleSyncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);
    try {
      const result = await syncAll();
      setSyncResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const handleSignOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setSyncResult(null);
  }, []);

  return (
    <View className="flex-1 bg-zinc-100">
      <AppHeader title="Settings" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10 pt-2 gap-4"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Account
          </Text>
          {!supabaseConfigured ? (
            <>
              <Text className="mt-1.5 text-sm leading-5 text-amber-700">
                Cloud sync is not configured. Add EXPO_PUBLIC_SUPABASE_URL and
                EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then restart Metro
                with the -c flag. Your data stays safe on this phone meanwhile.
              </Text>
            </>
          ) : loading ? (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#09090b" />
            </View>
          ) : session ? (
            <>
              <View className="mt-2 flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                  <Text className="text-lg font-bold text-emerald-700">
                    {(session.user.email ?? "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-zinc-950" numberOfLines={1}>
                    {session.user.email ?? "Signed in"}
                  </Text>
                  <Text className="text-[11px] text-zinc-500">
                    Your inventory syncs to this account
                  </Text>
                </View>
              </View>

              <View className="mt-3 gap-2">
                <Button
                  title={syncing ? "Syncing…" : "Sync now"}
                  onPress={handleSyncNow}
                  loading={syncing}
                />
                <Button title="Sign out" variant="secondary" onPress={handleSignOut} />
              </View>
            </>
          ) : (
            <>
              <Text className="mt-1.5 text-sm leading-5 text-zinc-500">
                Sign in with Google to keep your inventory safe and carry it to any
                phone. Everything still works offline without an account.
              </Text>
              <View className="mt-3">
                <Button
                  title={signingIn ? "Opening Google…" : "Sign in with Google"}
                  onPress={handleSignIn}
                  loading={signingIn}
                />
              </View>
              <Text className="mt-2 text-[11px] leading-4 text-zinc-400">
                If sign-in fails, add this redirect URL in Supabase → Authentication
                → URL Configuration → Redirect URLs:
              </Text>
              <Text className="mt-1 font-mono text-[10px] text-zinc-500" selectable>
                {oauthRedirectUri}
              </Text>
            </>
          )}
        </View>

        {/* Sync status */}
        {session ? (
          <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
            <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Last sync
            </Text>
            {syncResult && !syncResult.skipped ? (
              <Text className="mt-1 text-sm font-medium text-zinc-950">
                Pushed {syncResult.pushed} · Pulled {syncResult.pulled}
              </Text>
            ) : (
              <Text className="mt-1 text-sm text-zinc-500">
                {syncResult?.skipped
                  ? "Skipped — you were offline or signed out"
                  : "Tap Sync now to back up your inventory"}
              </Text>
            )}
          </View>
        ) : null}

        {/* How sync works */}
        <View className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            How syncing works
          </Text>
          <View className="mt-2 gap-2">
            <Text className="text-xs leading-5 text-zinc-500">
              · Everything is saved on this phone first — the app works fully offline.
            </Text>
            <Text className="text-xs leading-5 text-zinc-500">
              · Signed in? Every add, edit, sale, refund and delete is also copied to
              your account.
            </Text>
            <Text className="text-xs leading-5 text-zinc-500">
              · New phone: install, sign in, done — your whole ledger comes back.
            </Text>
            <Text className="text-xs leading-5 text-zinc-500">
              · Each account only sees its own data. Nobody else can.
            </Text>
          </View>
        </View>

        {error ? (
          <Text className="px-1 text-sm leading-5 text-red-600">{error}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
