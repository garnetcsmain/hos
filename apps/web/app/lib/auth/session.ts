// Server-side Supabase session verification (HOS-2026-001-08). Validates a
// Supabase access token (Bearer) and resolves the signed-in user. Two levels:
//  - userFromSupabase: ANY verified account (self-signup, no approval). This is
//    the "contributor" — can add records and manage sites they own.
//  - coordinatorFromSupabase: a verified account whose email is ALSO on the
//    invite-only allowlist — the trusted tier that reads the sensitive board.
// Never throws — any auth failure resolves to null so the caller can fall
// through to the token gate / fail-closed.

import { createClient } from "@supabase/supabase-js";
import {
  coordinatorAllowlist,
  isSupabaseAuthConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "./supabaseConfig.ts";
import { isAllowedCoordinator } from "./allowlist.ts";

/** Any signed-up user. `isCoordinator` = email on the invite-only allowlist. */
export interface UserIdentity {
  email: string;
  userId: string;
  emailVerified: boolean;
  isCoordinator: boolean;
}

/** A coordinator is just a UserIdentity known to be on the allowlist. */
export type CoordinatorIdentity = UserIdentity;

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Resolve ANY signed-in user (verified email required), or null. Network call
 *  to Supabase to verify the token; every failure (invalid/expired token,
 *  unverified email, network error) resolves to null. Does NOT require the
 *  allowlist — see coordinatorFromSupabase for that. */
export async function userFromSupabase(request: Request): Promise<UserIdentity | null> {
  if (!isSupabaseAuthConfigured()) return null;
  const token = bearerToken(request);
  if (!token) return null;
  try {
    const client = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    const email = data.user?.email;
    if (error || !email) return null;
    // Self-signup is open, but the email must be verified — proof of inbox
    // ownership is the only gate, a bot floor, not human approval.
    const emailVerified = Boolean(data.user?.email_confirmed_at ?? data.user?.confirmed_at);
    if (!emailVerified) return null;
    return {
      email,
      userId: data.user!.id,
      emailVerified,
      isCoordinator: isAllowedCoordinator(email, coordinatorAllowlist()),
    };
  } catch {
    return null;
  }
}

/** Resolve the signed-in COORDINATOR (verified + on the allowlist), or null. */
export async function coordinatorFromSupabase(
  request: Request,
): Promise<CoordinatorIdentity | null> {
  const user = await userFromSupabase(request);
  return user && user.isCoordinator ? user : null;
}
