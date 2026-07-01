import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { enforceRateLimit } from "@/app/lib/http/rateLimit";
import { searchPublic } from "@/app/lib/services/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public lookup — families check a case by name, city, or case number.
export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, "search", 60, 60_000);
    const query = request.nextUrl.searchParams.get("q") ?? "";
    return json(await searchPublic(query));
  } catch (error) {
    return handleError(error);
  }
}
