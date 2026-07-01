import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { ensureSeeded } from "@/app/lib/db/seed";
import { coordinationView } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The coordinator board: sites (capacity), needs (with advisory offer matches),
// offers, and orgs. Coordinator-gated — there is NO public coordination endpoint
// (Board HOS-2026-007: a live needs/site board must not be a targeting map).
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator(request);
    ensureSeeded();
    return json(coordinationView());
  } catch (error) {
    return handleError(error);
  }
}
