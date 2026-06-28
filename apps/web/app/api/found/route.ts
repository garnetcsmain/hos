import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { foundReportSchema } from "@/app/lib/validation/schemas";
import { submitFoundReport } from "@/app/lib/services/intake";
import { listFound } from "@/app/lib/repositories/foundReports";
import { toPublicFound } from "@/app/lib/domain/projections";
import { ensureSeeded } from "@/app/lib/db/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public list — least-PII projection (precise location stays server-side).
export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, "found:list", 90, 60_000);
    ensureSeeded();
    return json({ reports: listFound().map(toPublicFound) });
  } catch (error) {
    return handleError(error);
  }
}

// Responder intake — shelters, hospitals, volunteers report a found person.
export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "found:create", 30, 60_000);
    const body = await request.json().catch(() => ({}));
    const input = foundReportSchema.parse(body);
    const { report, candidates } = await submitFoundReport(input);
    return json({ id: report.id, status: report.status, candidates: candidates.length }, 201);
  } catch (error) {
    return handleError(error);
  }
}
