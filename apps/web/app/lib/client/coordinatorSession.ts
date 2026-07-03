// Shared coordinator-session helpers for gated screens (/coordination, /pulso).
// Extracted from CoordinationConsole so every coordinator surface refreshes and
// detects credentials the same way.

import { COORDINATOR_TOKEN_KEY } from "./api";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  SUPABASE_TOKEN_KEY,
} from "./supabase";

/** Refresh the mirrored Supabase access token before a request so a coordinator
 *  isn't 401'd after ~1h just because a tab stayed open (supabase-js refreshes
 *  the session under the hood; we mirror the fresh token for the Bearer header). */
export async function refreshCoordinatorSession(): Promise<void> {
  if (!isSupabaseConfiguredClient() || typeof window === "undefined") return;
  const supabase = getBrowserSupabase();
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (token) window.localStorage.setItem(SUPABASE_TOKEN_KEY, token);
}

export function hasAnyCredential(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!window.localStorage.getItem(SUPABASE_TOKEN_KEY) ||
    !!window.localStorage.getItem(COORDINATOR_TOKEN_KEY)
  );
}
