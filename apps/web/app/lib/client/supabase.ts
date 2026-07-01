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

/** Send a password-reset email. The recovery link returns the user to
 *  /reset-password ON THE SAME ORIGIN they requested it from — so in production
 *  it lands on hos-alpha (the unprotected domain), not a Vercel-SSO'd preview.
 *  The redirect target must be in the Supabase "Redirect URLs" allow-list. */
export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { error: "auth no está configurado" };
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  return { error: error?.message ?? null };
}

/** Set a new password for the recovery session established by the email link. */
export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { error: "auth no está configurado" };
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message ?? null };
}
