import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { needCreateSchema, needTransitionSchema } from "@/app/lib/validation/coordination";
import { createNeed, transitionNeed } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const need = await createNeed(needCreateSchema.parse(body));
    return json({ need }, 201);
  } catch (error) {
    return handleError(error);
  }
}

// Status transition: claim / receive / cancel. "receive" is the requesting site
// confirming real receipt (Board HOS-2026-007 honest-state rule).
export async function PATCH(request: NextRequest) {
  try {
    await requireCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const need = await transitionNeed(needTransitionSchema.parse(body));
    return json({ need });
  } catch (error) {
    return handleError(error);
  }
}
