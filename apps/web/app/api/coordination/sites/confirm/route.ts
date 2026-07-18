import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorFrom, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { siteConfirmSchema } from "@/app/lib/validation/coordination";
import { confirmSiteOperational } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-tap "confirmar operativo" (HOS-2026-014-01): records an operational-
// liveness confirmation, kept SEPARATE from the capacity PATCH so each keeps its
// own freshness. Authorized in the service (responsable, delegated
// site-coordinator, or coordinator; 403 otherwise).
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
