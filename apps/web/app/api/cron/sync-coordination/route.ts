import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { runCoordinationSync } from "@/app/lib/db/coordinationSync";
import { HttpError } from "@/app/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The full-table reconcile can take a while on a cold serverless boot.
export const maxDuration = 120;

// Nightly window (human direction 2026-07-03): sync daily at 23:45
// America/Caracas (03:45 UTC) for one week, then stop pulling — HOS becomes
// the primary system of record ("inicialmente" copy in the console matches
// this). Extend by setting HOS_SYNC_UNTIL (ISO instant) if the week is not
// enough; unset after the window and the cron self-disables without a deploy.
const DEFAULT_SYNC_UNTIL = "2026-07-11T12:00:00Z";

function windowOpen(): boolean {
  const until = process.env.HOS_SYNC_UNTIL ?? DEFAULT_SYNC_UNTIL;
  const end = Date.parse(until);
  return Number.isFinite(end) && Date.now() <= end;
}

/** Vercel Cron invokes GET with `Authorization: Bearer $CRON_SECRET`. A signed
 *  in coordinator may also trigger a manual pull. Fail closed otherwise. */
async function authorize(request: NextRequest): Promise<string> {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (secret) {
    const expected = Buffer.from(`Bearer ${secret}`);
    const provided = Buffer.from(header);
    if (expected.length === provided.length && timingSafeEqual(expected, provided)) {
      return "cron";
    }
  }
  const identity = await requireCoordinator(request).catch(() => null);
  if (identity) return identity.email ?? identity.via;
  throw new HttpError(401, "unauthorized");
}

export async function GET(request: NextRequest) {
  try {
    const by = await authorize(request);
    if (!windowOpen()) {
      return json({ skipped: "sync window closed (HOS_SYNC_UNTIL)", by });
    }
    const summary = await runCoordinationSync();
    console.log(`[hos] coordination sync (${by}):`, JSON.stringify(summary));
    return json({ ok: true, by, summary });
  } catch (error) {
    return handleError(error);
  }
}
