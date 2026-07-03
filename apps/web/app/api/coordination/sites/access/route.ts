import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleError, json } from "@/app/lib/http/respond";
import { actorFrom, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import {
  grantSiteCoordinator,
  revokeSiteCoordinator,
  siteCoordinators,
} from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const grantSchema = z.object({
  siteId: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(160),
  hoursValid: z.number().int().min(1).max(24 * 90).nullish(),
});
const revokeSchema = z.object({
  siteId: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(160),
});

// Peer delegation: a site's responsable grants/revokes another person's right
// to manage THAT site (authorized in the service). GET lists current grants.
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    await grantSiteCoordinator(grantSchema.parse(body), actorFrom(identity));
    return json({ ok: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    await revokeSiteCoordinator(revokeSchema.parse(body), actorFrom(identity));
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const siteId = new URL(request.url).searchParams.get("siteId") ?? "";
    return json({ grants: await siteCoordinators(siteId) });
  } catch (error) {
    return handleError(error);
  }
}
