// Server-side Supabase session verification (HOS-2026-001-08). Validates a
// Supabase access token (Bearer) and, only if the user's email is on the
// invite-only allowlist, returns their identity. Never throws — any auth failure
// resolves to null so the caller falls through to the token gate / fail-closed.

import { createClient } from "@supabase/supabase-js";
import {
  coordinatorAllowlist,
  isSupabaseAuthConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "./supabaseConfig.ts";
import { isAllowedCoordinator } from "./allowlist.ts";

export interface CoordinatorIdentity {
  email: string;
  userId: string;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Resolve the signed-in coordinator from a request, or null. Network call to
 *  Supabase to verify the token; failures (invalid/expired token, not on the
 *  allowlist, network error) all resolve to null. */
export async function coordinatorFromSupabase(
  request: Request,
): Promise<CoordinatorIdentity | null> {
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
    if (!isAllowedCoordinator(email, coordinatorAllowlist())) return null;
    return { email, userId: data.user!.id };
  } catch {
    return null;
  }
}
