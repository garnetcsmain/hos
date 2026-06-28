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

export function dashboardStats(): DashboardStats {
  return {
    missing: countMissing(),
    found: countFound(),
    candidates: countCandidates(),
    pending: countCandidates("pending"),
    confirmed: countCandidates("confirmed"),
    notifications: countNotifications(),
    recentEvents: recentEvents(12),
  };
}
