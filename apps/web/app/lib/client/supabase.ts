"use client";

// Browser Supabase client for coordinator sign-in (HOS-2026-001-08). Only
// active when the public env vars are set; otherwise the app uses the
// coordinator-token fallback. The current access token is mirrored into
// localStorage so the API client can attach it as a Bearer header.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** localStorage key holding the current Supabase access token (read by the API
 *  client in api.ts — kept as a literal there to avoid bundling this module). */
export const SUPABASE_TOKEN_KEY = "hos_supabase_token";

export function isSupabaseConfiguredClient(): boolean {
  return URL.length > 0 && KEY.length > 0;
}

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfiguredClient() || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(URL, KEY);
    // Keep the mirrored token fresh across refreshes / sign-out.
    client.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        window.localStorage.setItem(SUPABASE_TOKEN_KEY, session.access_token);
      } else {
        window.localStorage.removeItem(SUPABASE_TOKEN_KEY);
      }
    });
  }
  return client;
}
