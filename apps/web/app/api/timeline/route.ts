import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";
import { badRequest } from "@/app/lib/errors";
import { missingTimeline } from "@/app/lib/services/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI timeline: "What happened to <case>?" reconstructed from the event store.
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator(request);
    const missingId = request.nextUrl.searchParams.get("missingId");
    if (!missingId) throw badRequest("missingId is required");
    return json({ missingId, events: await missingTimeline(missingId) });
  } catch (error) {
    return handleError(error);
  }
}
