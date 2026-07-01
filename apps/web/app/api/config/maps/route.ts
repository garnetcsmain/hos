import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireCoordinator } from "@/app/lib/http/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves the Google Maps browser key to the coordinator map. A Maps JS key is
// exposed to the browser by design (the SDK loads it in a URL), so we reuse the
// single GOOGLE_MAPS_API_KEY env instead of a NEXT_PUBLIC copy. Restrict the key
// by HTTP referrer in Google Cloud so it only works from our domains. Gated to
// coordinators — the map is coordinator-only.
export async function GET(request: NextRequest) {
  try {
    await requireCoordinator(request);
    return json({ apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "" });
  } catch (error) {
    return handleError(error);
  }
}
