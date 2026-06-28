import type { NextRequest } from "next/server";
import { handleError, json } from "@/app/lib/http/respond";
import { assertCoordinator } from "@/app/lib/http/auth";
import { notFound } from "@/app/lib/errors";
import { candidateDetail } from "@/app/lib/services/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertCoordinator(request);
    const { id } = await context.params;
    const detail = candidateDetail(id);
    if (!detail) throw notFound(`candidate ${id} not found`);
    return json(detail);
  } catch (error) {
    return handleError(error);
  }
}
