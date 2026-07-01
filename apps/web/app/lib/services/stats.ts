// Dashboard aggregates, computed from real data (not the old mock constants).

import { countMissing } from "../repositories/missingReports.ts";
import { countFound } from "../repositories/foundReports.ts";
import { countCandidates } from "../repositories/matches.ts";
import { countNotifications } from "../repositories/notifications.ts";
import { recentEvents } from "../repositories/events.ts";
import type { HosEvent } from "@/app/lib/domain/types";

export interface DashboardStats {
  missing: number;
  found: number;
  candidates: number;
  pending: number;
  confirmed: number;
  notifications: number;
  recentEvents: HosEvent[];
}

export async function dashboardStats(): Promise<DashboardStats> {
  const [missing, found, candidates, pending, confirmed, notifications, events] =
    await Promise.all([
      countMissing(),
      countFound(),
      countCandidates(),
      countCandidates("pending"),
      countCandidates("confirmed"),
      countNotifications(),
      recentEvents(12),
    ]);
  return { missing, found, candidates, pending, confirmed, notifications, recentEvents: events };
}
