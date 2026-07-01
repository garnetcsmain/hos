import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { missingReportSchema } from "@/app/lib/validation/schemas";
import { submitMissingReport } from "@/app/lib/services/intake";
import { listMissing } from "@/app/lib/repositories/missingReports";
import { toPublicMissing } from "@/app/lib/domain/projections";
import { ensureSeeded } from "@/app/lib/db/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public list — least-PII projection only.
export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, "missing:list", 90, 60_000);
    await ensureSeeded();
    return json({ reports: (await listMissing()).map(toPublicMissing) });
  } catch (error) {
    return handleError(error);
  }
}

// Public intake — "I can't reach my family". No account required.
export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "missing:create", 12, 60_000);
    const body = await request.json().catch(() => ({}));
    const input = missingReportSchema.parse(body);
    const { report, candidates } = await submitMissingReport(input);
    return json({ id: report.id, status: report.status, candidates: candidates.length }, 201);
  } catch (error) {
    return handleError(error);
  }
}
