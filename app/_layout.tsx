import "../global.css";

import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useAuth } from "../hooks/useAuth";
import { getOfflineMode } from "../lib/appMode";

// Completes the OAuth return when the browser redirects back into the app
WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

// First-launch gate: signed-in users go straight in; everyone else chooses
// between Google sign-in and offline mode exactly once (choice is remembered).
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, everSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [offlineMode, setOfflineMode] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    getOfflineMode()
      .then((v) => setOfflineMode(v))
      .catch(() => setOfflineMode(false))
      .finally(() => setBooted(true));
  }, []);

  const ready = booted && !loading;

  useEffect(() => {
    if (!ready) return;
    const inWelcome = segments[0] === "welcome";
    if (session && inWelcome) {
      router.replace("/(tabs)");
    } else if (!session && !offlineMode && !everSignedIn && !inWelcome) {
      router.replace("/welcome");
    }
  }, [ready, session, offlineMode, everSignedIn, segments, router]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-100">
        <ActivityIndicator size="large" color="#09090b" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#f4f4f5" },
            headerTintColor: "#09090b",
            headerShadowVisible: false,
            contentStyle: { backgroundColor: "#f4f4f5" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="inventory/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthGate>
    </QueryClientProvider>
  );
}
