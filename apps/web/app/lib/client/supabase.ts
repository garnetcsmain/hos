"use client";

// Browser Supabase client for coordinator sign-in (HOS-2026-001-08). Only
// active when the public env vars are set; otherwise the app uses the
// coordinator-token fallback. The current access token is mirrored into
// localStorage so the API client can attach it as a Bearer header.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUILD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUILD_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_URL_KEY = "hos_supabase_url";
const SUPABASE_ANON_KEY_KEY = "hos_supabase_anon_key";

/** localStorage key holding the current Supabase access token (read by the API
 *  client in api.ts — kept as a literal there to avoid bundling this module). */
export const SUPABASE_TOKEN_KEY = "hos_supabase_token";

type PublicSupabaseConfig = { url: string; anonKey: string };

let runtimeConfig: PublicSupabaseConfig | null = null;

function readStoredConfig(): PublicSupabaseConfig | null {
  if (typeof window === "undefined") return null;
  const url = window.localStorage.getItem(SUPABASE_URL_KEY) ?? "";
  const anonKey = window.localStorage.getItem(SUPABASE_ANON_KEY_KEY) ?? "";
  return url && anonKey ? { url, anonKey } : null;
}

function currentConfig(): PublicSupabaseConfig | null {
  if (runtimeConfig) return runtimeConfig;
  if (BUILD_URL && BUILD_KEY) return { url: BUILD_URL, anonKey: BUILD_KEY };
  return readStoredConfig();
}

export function configureBrowserSupabase(config: PublicSupabaseConfig | null): void {
  if (!config?.url || !config.anonKey) return;
  if (runtimeConfig?.url !== config.url || runtimeConfig.anonKey !== config.anonKey) {
    client = null;
  }
  runtimeConfig = config;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SUPABASE_URL_KEY, config.url);
    window.localStorage.setItem(SUPABASE_ANON_KEY_KEY, config.anonKey);
  }
}

export function isSupabaseConfiguredClient(): boolean {
  return currentConfig() !== null;
}

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfiguredClient() || typeof window === "undefined") return null;
  const config = currentConfig();
  if (!config) return null;
  if (!client) {
    client = createClient(config.url, config.anonKey);
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

/** Self-signup, no approval (human direction 2026-07-03). Supabase sends a
 *  verification email; the account can't act until the email is confirmed
 *  (proof of inbox ownership — a bot floor, not human approval). Returns
 *  `needsVerification` when a confirmation email was sent, or a live session
 *  when the project has email confirmation disabled. The verify link returns
 *  to /login on the same origin. */
export async function signUp(
  email: string,
  password: string,
): Promise<{ error: string | null; needsVerification: boolean }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { error: "auth no está configurado", needsVerification: false };
  const emailRedirectTo = `${window.location.origin}/login`;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo },
  });
  if (error) return { error: error.message, needsVerification: false };
  if (data.session?.access_token) {
    window.localStorage.setItem(SUPABASE_TOKEN_KEY, data.session.access_token);
    return { error: null, needsVerification: false };
  }
  return { error: null, needsVerification: true };
}
