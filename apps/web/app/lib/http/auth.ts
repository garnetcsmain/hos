// Coordinator access gate. Sensitive coordinator endpoints (full PII, match
// recompute, verification) require a shared token compared in constant time
// (AGENTS.md §3).
//
// FAIL CLOSED (Board HOS-2026-002-D3): when HOS_COORDINATOR_TOKEN is unset the
// gate REFUSES access (503) instead of opening. The exact teams who run this —
// volunteers on a borrowed VPS, no DevOps — are the most likely to deploy with
// the env var unset; a fail-open default would silently expose full PII and let
// anonymous callers confirm reunifications. Local dev opens the gate ONLY when
// HOS_DEV_OPEN=1 is set explicitly, so "open" is always something a human typed.
//
// This is deliberately simple: real role-based auth (Supabase/OIDC) with
// non-forgeable per-actor attribution is tracked as HOS-2026-001-08.

import { timingSafeEqual } from "node:crypto";
import { HttpError } from "../errors.ts";
import { isSupabaseAuthConfigured } from "../auth/supabaseConfig.ts";

let warnedDevOpen = false;

export function assertCoordinator(request: Request): void {
  const expected = process.env.HOS_COORDINATOR_TOKEN;

  if (!expected) {
    if (process.env.HOS_DEV_OPEN === "1") {
      if (!warnedDevOpen) {
        console.warn(
          "[hos] HOS_DEV_OPEN=1 — coordinator endpoints are OPEN. Never set this in a deployed environment.",
        );
        warnedDevOpen = true;
      }
      return;
    }
    // Fail closed: not configured, not explicitly opened for dev.
    throw new HttpError(
      503,
      "coordinator access not configured: set HOS_COORDINATOR_TOKEN (or HOS_DEV_OPEN=1 for local dev)",
    );
  }

  const provided = request.headers.get("x-hos-coordinator-token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new HttpError(401, "unauthorized: coordinator token required");
  }
}

export interface CoordinatorGateDeps {
  sessionFromRequest: (request: Request) => Promise<{ email: string; userId: string } | null>;
}

// Lazy import so @supabase/supabase-js is never pulled into the edge/build graph
// of routes; it loads only at request time on the Node runtime.
async function defaultSessionFromRequest(request: Request) {
  const { coordinatorFromSupabase } = await import("../auth/session.ts");
  return coordinatorFromSupabase(request);
}

// The coordinator gate for routes. When Supabase auth is CONFIGURED, an
// invite-only signed-in coordinator (valid Supabase session, email on the
// allowlist) is accepted; a configured service token still works as a
// break-glass fallback. When Supabase auth is NOT configured, this is exactly
// the token gate (assertCoordinator) — so existing deployments are unchanged
// (HOS-2026-001-08, respecting the D3 fail-closed default).
export async function requireCoordinator(
  request: Request,
  deps: CoordinatorGateDeps = { sessionFromRequest: defaultSessionFromRequest },
): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const identity = await deps.sessionFromRequest(request);
    if (identity) return;
    // No valid session: only fall through to the token path if one was provided.
    if (!request.headers.get("x-hos-coordinator-token")) {
      throw new HttpError(401, "unauthorized: sign in as a coordinator");
    }
  }
  assertCoordinator(request);
}
