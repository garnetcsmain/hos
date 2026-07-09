import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { requireUser } from "@/app/lib/http/auth";
import { contributorView } from "@/app/lib/services/coordination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The contributor read: public aid points + which ones the caller may manage.
// DELIBERATELY excludes the needs board (precise locations + contacts of people
// in danger stay coordinator-only, per the D1 threat model). A shared-token /
// dev-open operator (no per-user id) simply manages nothing.
export async function GET(request: NextRequest) {
  try {
    const identity = await requireUser(request);
    const view = await contributorView(identity.userId ?? "", identity.email ?? "");
    return json(view);
  } catch (error) {
    return handleError(error);
  }
}
