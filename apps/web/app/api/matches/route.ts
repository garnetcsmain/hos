import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { listCandidateViews } from "@/app/lib/services/views";
import { ensureSeeded } from "@/app/lib/db/seed";
import type { MatchStatus } from "@/app/lib/domain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set<MatchStatus>(["pending", "confirmed", "rejected"]);

// Coordinator console — full candidate views with both reports.
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator(request);
    ensureSeeded();
    const raw = request.nextUrl.searchParams.get("status");
    const status = raw && STATUSES.has(raw as MatchStatus) ? (raw as MatchStatus) : undefined;
    return json({ candidates: listCandidateViews(status) });
  } catch (error) {
    return handleError(error);
  }
}
