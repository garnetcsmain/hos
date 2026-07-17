import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { ensureSeeded } from "@/app/lib/db/seed";
import { publicAggregateFeed } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The versioned, PII-free aggregate feed (HOS-2026-013-05 contract, Judge D3):
// district×category open-need counts with k-suppression, no names, no free text,
// no coordinates, no cadence. This is the single public projection SHAPE that the
// gated public pulse board, the Ver-como public preview, and HOS-2026-014's
// public "confirmado" surface all share.
//
// IMPORTANT — this endpoint is COORDINATOR-GATED, not public. Building the
// contract now is schema discipline only; it ships NOTHING publicly and does NOT
// pre-empt the HOS-2026-007 public-feed gate. No unauthenticated caller receives
// this payload until that re-review passes (human threat-model sign-off + real
// auth HOS-2026-001-08 + a written adversarial pattern-inference simulation on
// the real district data). See docs/decision-log/
// 2026-07-03-HOS-013-public-presentation-ux/aggregate-feed-contract.md.
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator(request);
    await ensureSeeded();
    return json(await publicAggregateFeed());
  } catch (error) {
    return handleError(error);
  }
}
