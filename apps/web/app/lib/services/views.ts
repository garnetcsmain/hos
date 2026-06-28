// Read-model assembly for the coordinator console: join candidates to their
// reports, attach verification history, and build a per-case timeline from the
// event store.

import { candidatesForMissing, getCandidate, listCandidates } from "../repositories/matches.ts";
import { getMissing } from "../repositories/missingReports.ts";
import { getFound } from "../repositories/foundReports.ts";
import { verificationsForCandidate } from "../repositories/verifications.ts";
import { eventsForEntities } from "../repositories/events.ts";
import type {
  FoundReport,
  HosEvent,
  MatchCandidate,
  MatchStatus,
  MissingReport,
  Verification,
} from "@/app/lib/domain/types";

export interface CandidateView {
  candidate: MatchCandidate;
  missing: MissingReport;
  found: FoundReport;
}

export interface CandidateDetail extends CandidateView {
  verifications: Verification[];
  timeline: HosEvent[];
}

function join(candidate: MatchCandidate): CandidateView | null {
  const missing = getMissing(candidate.missingId);
  const found = getFound(candidate.foundId);
  if (!missing || !found) return null;
  return { candidate, missing, found };
}

export function listCandidateViews(status?: MatchStatus): CandidateView[] {
  return listCandidates(status)
    .map(join)
    .filter((view): view is CandidateView => view !== null);
}

/** Full timeline for a case: the missing report, every candidate it spawned,
 *  the linked found reports, and any verifications — oldest first. */
export function missingTimeline(missingId: string): HosEvent[] {
  const candidates = candidatesForMissing(missingId);
  const verificationIds = candidates.flatMap((c) =>
    verificationsForCandidate(c.id).map((v) => v.id),
  );
  const ids = [
    missingId,
    ...candidates.map((c) => c.id),
    ...candidates.map((c) => c.foundId),
    ...verificationIds,
  ];
  return eventsForEntities(Array.from(new Set(ids)));
}

export function candidateDetail(candidateId: string): CandidateDetail | null {
  const candidate = getCandidate(candidateId);
  if (!candidate) return null;
  const view = join(candidate);
  if (!view) return null;
  return {
    ...view,
    verifications: verificationsForCandidate(candidate.id),
    timeline: missingTimeline(candidate.missingId),
  };
}
