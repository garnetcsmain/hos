import { NextResponse } from "next/server";
import { getCoordinationEntities, getSectorStatus } from "@/app/lib/bff/coordinate";

export function GET() {
  const entities = getCoordinationEntities();
  const sectors = getSectorStatus();
  return NextResponse.json({ entities, sectors });
}
