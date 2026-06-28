// Coordinator access gate. Sensitive coordinator endpoints (full PII, match
// recompute, verification) require a shared token compared in constant time
// (AGENTS.md §3). When HOS_COORDINATOR_TOKEN is unset the gate is open for
// local development — documented, and the warning is logged once.
//
// This is deliberately simple: real role-based auth (Supabase/OIDC) is an
// external setup step deferred until credentials are available.

import { timingSafeEqual } from "node:crypto";
import { HttpError } from "../errors.ts";

let warnedOpen = false;

export function assertCoordinator(request: Request): void {
  const expected = process.env.HOS_COORDINATOR_TOKEN;
  if (!expected) {
    if (!warnedOpen) {
      console.warn("[hos] HOS_COORDINATOR_TOKEN unset — coordinator endpoints are OPEN (dev mode).");
      warnedOpen = true;
    }
    return;
  }

  const provided = request.headers.get("x-hos-coordinator-token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new HttpError(401, "unauthorized: coordinator token required");
  }
}
