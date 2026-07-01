// Supabase Auth configuration (HOS-2026-001-08). Everything is env-driven and
// OFF by default: when the URL/anon key are not set, isSupabaseAuthConfigured()
// is false and the app uses only the existing coordinator-token gate — so
// today's deployments behave exactly as before. Enabling this in a real
// deployment requires human security sign-off (Board D3).

import { parseAllowlist } from "./allowlist.ts";

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function isSupabaseAuthConfigured(): boolean {
  return supabaseUrl().length > 0 && supabaseAnonKey().length > 0;
}

/** Invite-only coordinator emails from HOS_COORDINATOR_EMAILS (server-only). */
export function coordinatorAllowlist(): string[] {
  return parseAllowlist(process.env.HOS_COORDINATOR_EMAILS);
}
