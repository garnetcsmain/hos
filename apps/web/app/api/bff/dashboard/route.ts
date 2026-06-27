import { NextResponse } from "next/server";
import { getDashboardData } from "@/app/lib/bff/dashboard";

export function GET() {
  return NextResponse.json(getDashboardData());
}
