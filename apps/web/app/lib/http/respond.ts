import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "../errors.ts";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Map a thrown error to a safe JSON response. Validation and HttpError surface
 *  their messages; anything else is logged and returned as a generic 500 so we
 *  never leak internals to a public caller. */
export function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "validation_failed", issues: error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[hos] unhandled route error:", error);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
