// Deploy-time boot guard for coordinator access (Board HOS-2026-002-D3).
//
// The per-request gate in auth.ts already FAILS CLOSED (503) when the
// coordinator token is unconfigured. This guard is its loud companion: rather
// than letting a misconfigured production deploy come up and quietly serve 503s
// to families, it refuses to START the server when running outside local dev
// with no token and no explicit dev-open opt-in. A crash at boot is far harder
// for a no-DevOps volunteer team to miss than a silent 503 (Board D3: "refuses
// to start in any non-local NODE_ENV when no token and no explicit dev-open
// flag is set").
//
// "Open" must always be something a human typed: an explicit HOS_DEV_OPEN=1 is
// honored (matching auth.ts), a forgotten token is not.
//
// A coordinator gate is also "configured" when invite-only Supabase auth is set
// up (HOS-2026-001-08): the per-request gate (auth.ts) accepts a signed-in user
// whose email is on the allowlist, so a deploy using that path — and NOT the
// legacy shared token — is correctly configured and must be allowed to start.
// This guard must stay in lockstep with auth.ts; a deploy the per-request gate
// can admit through must never be refused at boot (that was the /coordination
// 500: Supabase auth was live but this guard only knew the legacy token).

import { parseAllowlist } from "../auth/allowlist.ts";

type BootEnv = {
  NODE_ENV?: string;
  HOS_COORDINATOR_TOKEN?: string;
  HOS_DEV_OPEN?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  HOS_COORDINATOR_EMAILS?: string;
};

export type BootCheck = { ok: boolean; reason: string };

// Invite-only Supabase auth is a valid, non-open coordinator gate — but only
// when the allowlist actually names someone. An empty allowlist admits NOBODY
// (auth.ts / isAllowedCoordinator), which is the very misconfiguration this
// guard exists to catch loudly, so URL + anon key alone are NOT enough.
function supabaseInviteAuthConfigured(env: BootEnv): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const hasCoordinators = parseAllowlist(env.HOS_COORDINATOR_EMAILS).length > 0;
  return url.length > 0 && anonKey.length > 0 && hasCoordinators;
}

// Local, non-deployed environments where an unconfigured gate is acceptable
// (there the per-request gate still fails closed). Anything that is NOT
// explicitly development/test is treated as a real deployment and must be
// configured — a custom NODE_ENV like "staging" is not a free pass.
function isLocalEnv(nodeEnv: string | undefined): boolean {
  return nodeEnv === "development" || nodeEnv === "test" || nodeEnv === undefined;
}

export function checkCoordinatorBootConfig(env: BootEnv): BootCheck {
  if (env.HOS_COORDINATOR_TOKEN) {
    return { ok: true, reason: "coordinator token configured" };
  }
  if (env.HOS_DEV_OPEN === "1") {
    return { ok: true, reason: "HOS_DEV_OPEN=1 (explicit open)" };
  }
  if (supabaseInviteAuthConfigured(env)) {
    return { ok: true, reason: "invite-only Supabase auth configured (allowlist set)" };
  }
  if (isLocalEnv(env.NODE_ENV)) {
    return {
      ok: true,
      reason: `local env (NODE_ENV=${env.NODE_ENV ?? "unset"}); per-request gate fails closed`,
    };
  }
  return {
    ok: false,
    reason:
      `coordinator access is unconfigured in a non-local environment (NODE_ENV=${env.NODE_ENV}). ` +
      "Configure one of: HOS_COORDINATOR_TOKEN (shared token); invite-only Supabase auth " +
      "(NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + HOS_COORDINATOR_EMAILS with at " +
      "least one address); or HOS_DEV_OPEN=1 to run intentionally open (never in production).",
  };
}

// Throws to abort server startup when misconfigured. Safe to call from the
// Next.js instrumentation register() hook, which runs once per server boot.
export function assertCoordinatorBootConfig(env: BootEnv = process.env): void {
  const result = checkCoordinatorBootConfig(env);
  if (!result.ok) {
    throw new Error(`[hos] refusing to start: ${result.reason}`);
  }
  if (env.HOS_DEV_OPEN === "1") {
    // Surface the open state in boot logs too, before any traffic arrives.
    console.warn(
      "[hos] HOS_DEV_OPEN=1 — coordinator endpoints will be OPEN. Never set this in a deployed environment.",
    );
  }
}
