import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { dashboardStats } from "@/app/lib/services/stats";
import { aiEnabled } from "@/app/lib/ai/registry";
import { ensureSeeded } from "@/app/lib/db/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, "dashboard", 120, 60_000);
    ensureSeeded();
    return json({ ...dashboardStats(), aiEnabled: aiEnabled() });
  } catch (error) {
    return handleError(error);
  }
}
