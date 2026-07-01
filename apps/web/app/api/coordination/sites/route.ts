import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { assertCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { siteCreateSchema, siteUpdateSchema } from "@/app/lib/validation/coordination";
import { createSite, updateSiteCapacity } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = createSite(siteCreateSchema.parse(body));
    return json({ site }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const site = updateSiteCapacity(siteUpdateSchema.parse(body));
    return json({ site });
  } catch (error) {
    return handleError(error);
  }
}
