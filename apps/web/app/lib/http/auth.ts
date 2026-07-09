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
import type { UserIdentity } from "../auth/session.ts";

/** Who passed the coordinator gate. `email`/`userId` are only known on the
 *  Supabase path — the shared token and the explicit dev-open escape hatch
 *  authenticate a caller without identifying a person. Threaded into event
 *  payloads (`by`) so the audit log is forensic, not decorative
 *  (HOS-2026-001-08 Phase 1; closes the gate re-review's MET_WITH_WATCH). */
export interface CoordinatorIdentity {
  via: "supabase" | "token" | "dev-open";
  email: string | null;
  userId: string | null;
}

/** Any authenticated caller. `isCoordinator` distinguishes an invite-only
 *  coordinator (full board access) from a self-signup contributor (may add
 *  records and manage sites they own, but NOT read the sensitive board). */
export interface RequestActor extends CoordinatorIdentity {
  isCoordinator: boolean;
}

/** Audit string for event payloads. Honest by construction: a shared-token
 *  caller is labeled as such, a contributor as `user:`, never dressed up as a
 *  coordinator they are not. */
export function actorTag(identity: CoordinatorIdentity & { isCoordinator?: boolean }): string {
  const role = identity.isCoordinator === false ? "user" : "coordinator";
  if (identity.via === "supabase" && identity.email) return `${role}:${identity.email}`;
  return `${role}:${identity.via}`;
}

/** Build the actor the coordination service expects: audit label + identity +
 *  role, so per-site ownership/authorization can be enforced. */
export function actorFrom(identity: RequestActor): {
  by: string;
  userId: string | null;
  email: string | null;
  isCoordinator: boolean;
} {
  return {
    by: actorTag(identity),
    userId: identity.userId,
    email: identity.email,
    isCoordinator: identity.isCoordinator,
  };
}

let warnedDevOpen = false;

export function assertCoordinator(request: Request): CoordinatorIdentity {
  const expected = process.env.HOS_COORDINATOR_TOKEN;

  if (!expected) {
    if (process.env.HOS_DEV_OPEN === "1") {
      if (!warnedDevOpen) {
        console.warn(
          "[hos] HOS_DEV_OPEN=1 — coordinator endpoints are OPEN. Never set this in a deployed environment.",
        );
        warnedDevOpen = true;
      }
      return { via: "dev-open", email: null, userId: null };
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
  return { via: "token", email: null, userId: null };
}

export interface CoordinatorGateDeps {
  sessionFromRequest: (request: Request) => Promise<{ email: string; userId: string } | null>;
}

export interface UserGateDeps {
  userFromRequest: (request: Request) => Promise<UserIdentity | null>;
}

// Lazy import so @supabase/supabase-js is never pulled into the edge/build graph
// of routes; it loads only at request time on the Node runtime.
async function defaultSessionFromRequest(request: Request) {
  const { coordinatorFromSupabase } = await import("../auth/session.ts");
  return coordinatorFromSupabase(request);
}

async function defaultUserFromRequest(request: Request) {
  const { userFromSupabase } = await import("../auth/session.ts");
  return userFromSupabase(request);
}

// The gate for ANY signed-in caller — a self-signup contributor OR a
// coordinator. Used by the CREATE endpoints (anyone verified may contribute)
// and by contributor reads. Coordinators also pass (isCoordinator=true), as do
// the shared token / dev-open escape hatches (treated as coordinator-level,
// since those are operator credentials). Throws 401 when nobody is signed in.
export async function requireUser(
  request: Request,
  deps: UserGateDeps = { userFromRequest: defaultUserFromRequest },
): Promise<RequestActor> {
  if (isSupabaseAuthConfigured()) {
    const user = await deps.userFromRequest(request);
    if (user) {
      return { via: "supabase", email: user.email, userId: user.userId, isCoordinator: user.isCoordinator };
    }
    // No verified session: only the operator token / dev-open may still pass.
    if (request.headers.get("x-hos-coordinator-token") || process.env.HOS_DEV_OPEN === "1") {
      return { ...assertCoordinator(request), isCoordinator: true };
    }
    throw new HttpError(401, "unauthorized: inicie sesión o cree una cuenta");
  }
  // Supabase not configured: only the token / dev-open path exists.
  return { ...assertCoordinator(request), isCoordinator: true };
}

// The coordinator gate for routes. When Supabase auth is CONFIGURED, an
// invite-only signed-in coordinator (valid Supabase session, email on the
// allowlist) is accepted; a configured service token still works as a
// break-glass fallback. When Supabase auth is NOT configured, this is exactly
// the token gate (assertCoordinator) — so existing deployments are unchanged
// (HOS-2026-001-08, respecting the D3 fail-closed default).
//
// Returns WHO passed, so routes can attribute writes to a real identity.
// Existing callers that ignore the return value are unchanged.
export async function requireCoordinator(
  request: Request,
  deps: CoordinatorGateDeps = { sessionFromRequest: defaultSessionFromRequest },
): Promise<CoordinatorIdentity> {
  if (isSupabaseAuthConfigured()) {
    const identity = await deps.sessionFromRequest(request);
    if (identity) return { via: "supabase", email: identity.email, userId: identity.userId };
    // No valid session: only fall through to the token path if one was provided.
    if (!request.headers.get("x-hos-coordinator-token")) {
      throw new HttpError(401, "unauthorized: sign in as a coordinator");
    }
  }
  return assertCoordinator(request);
}
