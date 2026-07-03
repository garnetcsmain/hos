import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorTag, requireCoordinator, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { needCreateSchema, needTransitionSchema } from "@/app/lib/validation/coordination";
import { createNeed, transitionNeed } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Any signed-up user may report a need (e.g. a volunteer in the field).
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const need = await createNeed(needCreateSchema.parse(body), actorTag(identity));
    return json({ need }, 201);
  } catch (error) {
    return handleError(error);
  }
}

// Status transition: claim / receive / cancel. "receive" is the requesting site
// confirming real receipt (Board HOS-2026-007 honest-state rule). These are
// operational board decisions — coordinator-only for now (a site-responsable
// "receive" is a later refinement).
export async function PATCH(request: NextRequest) {
  try {
    const identity = await requireCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const need = await transitionNeed(needTransitionSchema.parse(body), actorTag(identity));
    return json({ need });
  } catch (error) {
    return handleError(error);
  }
}
