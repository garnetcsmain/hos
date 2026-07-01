import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { assertCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { familyReachSchema } from "@/app/lib/validation/schemas";
import { recordFamilyReach } from "@/app/lib/services/familyReach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coordinator records the outcome of a family-reach obligation. Reaching the
// family is what resolves the case; an unreachable attempt is tracked so the
// obligation stays visible for a retry (Board HOS-2026-002-D4).
export async function POST(request: NextRequest) {
  try {
    assertCoordinator(request);
    enforceRateLimit(request, "family-reach", 60, 60_000);
    const body = await request.json().catch(() => ({}));
    const input = familyReachSchema.parse(body);
    const result = recordFamilyReach(input);
    return json({ resolved: result.resolved, status: result.status }, 201);
  } catch (error) {
    return handleError(error);
  }
}
