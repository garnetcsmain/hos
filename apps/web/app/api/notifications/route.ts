import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { listNotifications } from "@/app/lib/repositories/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coordinator view of the family-notification queue (recipients are redacted).
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator(request);
    return json({ notifications: await listNotifications() });
  } catch (error) {
    return handleError(error);
  }
}
