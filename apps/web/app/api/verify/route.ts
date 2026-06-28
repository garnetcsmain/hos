import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { assertCoordinator } from "@/app/lib/http/auth";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { verificationSchema } from "@/app/lib/validation/schemas";
import { recordVerification } from "@/app/lib/services/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coordinator records a decision on a candidate. Confirming resolves the case
// and queues a family notification.
export async function POST(request: NextRequest) {
  try {
    assertCoordinator(request);
    enforceRateLimit(request, "verify", 60, 60_000);
    const body = await request.json().catch(() => ({}));
    const input = verificationSchema.parse(body);
    const result = recordVerification(input);
    return json(
      {
        verificationId: result.verification.id,
        decision: result.verification.decision,
        resolved: result.resolved,
        notificationId: result.notificationId,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
