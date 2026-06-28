import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { assertCoordinator } from "@/app/lib/http/auth";
import { recomputeAll } from "@/app/lib/services/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manual full re-scan of the deterministic baseline matcher.
export async function POST(request: NextRequest) {
  try {
    assertCoordinator(request);
    return json(recomputeAll());
  } catch (error) {
    return handleError(error);
  }
}
