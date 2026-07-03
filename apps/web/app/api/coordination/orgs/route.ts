import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { actorTag, requireUser } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { orgCreateSchema } from "@/app/lib/validation/coordination";
import { createOrg } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Register a participating org (accountable actor). Any signed-up user may
// register their organization.
export async function POST(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    enforceRateLimit(request, "coordination-write", 120, 60_000);
    const body = await request.json().catch(() => ({}));
    const org = await createOrg(orgCreateSchema.parse(body), actorTag(identity));
    return json({ org }, 201);
  } catch (error) {
    return handleError(error);
  }
}
