import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { orgCreateSchema } from "@/app/lib/validation/coordination";
import { createOrg } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Register a participating org (accountable actor). Modeled now so multi-org
// accountability is not a later retrofit (Board HOS-2026-007).
export async function POST(request: NextRequest) {
  try {
    await requireCoordinator(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const org = createOrg(orgCreateSchema.parse(body));
    return json({ org }, 201);
  } catch (error) {
    return handleError(error);
  }
}
