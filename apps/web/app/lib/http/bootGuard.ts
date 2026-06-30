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

type BootEnv = {
  NODE_ENV?: string;
  HOS_COORDINATOR_TOKEN?: string;
  HOS_DEV_OPEN?: string;
};

export type BootCheck = { ok: boolean; reason: string };

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
      "Set HOS_COORDINATOR_TOKEN to a strong secret, or set HOS_DEV_OPEN=1 to run intentionally open " +
      "(never in production).",
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
