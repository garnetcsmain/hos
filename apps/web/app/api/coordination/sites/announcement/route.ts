import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorTag, requireCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { siteAnnouncementSchema } from "@/app/lib/validation/coordination";
import { setSiteAnnouncement } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Set or clear a site broadcast ("hoy entregan comida 2-5pm"). Coordinator
// gate today; the site:<id> capability scope takes over when HOS-2026-011
// lands (this is the "responsible of the location" seam).
export async function POST(request: NextRequest) {
  try {
    const identity = await requireCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = await setSiteAnnouncement(siteAnnouncementSchema.parse(body), actorTag(identity));
    return json({ site });
  } catch (error) {
    return handleError(error);
  }
}
