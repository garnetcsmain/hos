import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorTag, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { offerCreateSchema } from "@/app/lib/validation/coordination";
import { createOffer } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Any signed-up user (e.g. a donor org) may post a supply offer.
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const offer = await createOffer(offerCreateSchema.parse(body), actorTag(identity));
    return json({ offer }, 201);
  } catch (error) {
    return handleError(error);
  }
}
