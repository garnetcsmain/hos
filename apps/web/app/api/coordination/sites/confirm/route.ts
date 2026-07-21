import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorFrom, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { siteConfirmSchema } from "@/app/lib/validation/coordination";
import { confirmSiteOperational } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-tap "confirmar operativo" (HOS-2026-014-01, Judge D3-c). Records an
// operational-liveness confirmation WITHOUT touching bed counts, so an easy
// confirm can never launder a stale number. Authorized in the service to the
// site's responsable, a delegated site-coordinator, or a coordinator.
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = await confirmSiteOperational(siteConfirmSchema.parse(body), actorFrom(identity));
    return json({ site });
  } catch (error) {
    return handleError(error);
  }
}
