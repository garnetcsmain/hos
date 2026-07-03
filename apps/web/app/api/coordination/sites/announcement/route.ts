import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorFrom, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { siteAnnouncementSchema } from "@/app/lib/validation/coordination";
import { setSiteAnnouncement } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Set or clear a site broadcast ("hoy entregan comida 2-5pm"). Authorized in
// the service to the site's responsable, a delegated site-coordinator, or a
// coordinator — the "responsable of the location" model (HOS-2026-011).
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = await setSiteAnnouncement(siteAnnouncementSchema.parse(body), actorFrom(identity));
    return json({ site });
  } catch (error) {
    return handleError(error);
  }
}
