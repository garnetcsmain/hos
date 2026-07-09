import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorFrom, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { siteCreateSchema, siteUpdateSchema } from "@/app/lib/validation/coordination";
import { createSite, updateSiteCapacity } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Any signed-up (verified) user may add a site — and becomes its responsable.
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = await createSite(siteCreateSchema.parse(body), actorFrom(identity));
    return json({ site }, 201);
  } catch (error) {
    return handleError(error);
  }
}

// Modifying a site is authorized in the service: the responsable, a delegated
// site-coordinator, or a coordinator (403 otherwise).
export async function PATCH(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = await updateSiteCapacity(siteUpdateSchema.parse(body), actorFrom(identity));
    return json({ site });
  } catch (error) {
    return handleError(error);
  }
}
