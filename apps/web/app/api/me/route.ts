import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireUser } from "@/app/lib/http/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Who am I? The console uses this to branch: a coordinator gets the full board;
// a signed-up contributor gets the contributor surface. 401 => not signed in.
export async function GET(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    return json({
      authenticated: true,
      isCoordinator: identity.isCoordinator,
      email: identity.email,
      userId: identity.userId,
    });
  } catch (error) {
    return handleError(error);
  }
}
