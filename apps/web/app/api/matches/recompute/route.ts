import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { recomputeAll } from "@/app/lib/services/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manual full re-scan of the deterministic baseline matcher.
export async function POST(request: NextRequest) {
  try {
    await requireCoordinator(request);
    return json(recomputeAll());
  } catch (error) {
    return handleError(error);
  }
}
