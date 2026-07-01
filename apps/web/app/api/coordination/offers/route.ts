import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { offerCreateSchema } from "@/app/lib/validation/coordination";
import { createOffer } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const offer = createOffer(offerCreateSchema.parse(body));
    return json({ offer }, 201);
  } catch (error) {
    return handleError(error);
  }
}
