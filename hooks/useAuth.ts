import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Stays true for the rest of the run once a session existed — lets the
  // auth gate keep signed-out users in-app instead of bouncing to welcome
  const [everSignedIn, setEverSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session) setEverSignedIn(true);
      })
      .finally(() => setLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) setEverSignedIn(true);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading, everSignedIn, userId: session?.user.id ?? null };
}
