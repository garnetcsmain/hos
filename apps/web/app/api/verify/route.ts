import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { verificationSchema } from "@/app/lib/validation/schemas";
import { recordVerification } from "@/app/lib/services/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coordinator records a decision on a candidate. Confirming marks the case
// "matched" and opens a tracked family-reach obligation; it does not resolve
// the case (that happens when the family is actually reached, /api/family-reach).
export async function POST(request: NextRequest) {
  try {
    await requireCoordinator(request);
    enforceRateLimit(request, "verify", 60, 60_000);
    const body = await request.json().catch(() => ({}));
    const input = verificationSchema.parse(body);
    const result = await recordVerification(input);
    return json(
      {
        verificationId: result.verification.id,
        decision: result.verification.decision,
        confirmed: result.confirmed,
        resolved: result.resolved,
        notificationId: result.notificationId,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
