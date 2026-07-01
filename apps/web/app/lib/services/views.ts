// Read-model assembly for the coordinator console: join candidates to their
// reports, attach verification history, and build a per-case timeline from the
// event store.

import { candidatesForMissing, getCandidate, listCandidates } from "../repositories/matches.ts";
import { getMissing, openMissing } from "../repositories/missingReports.ts";
import { getFound, openFound } from "../repositories/foundReports.ts";
import { verificationsForCandidate } from "../repositories/verifications.ts";
import { eventsForEntities } from "../repositories/events.ts";
import { countSharedName } from "../matching/baseRate.ts";
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
  /** How many OTHER open reports share this candidate's name — base-rate /
   *  name-commonness context so a high score on a common name is read with
   *  appropriate caution (Board D1). */
  nameBaseRate: number;
}

export interface CandidateDetail extends CandidateView {
  verifications: Verification[];
  timeline: HosEvent[];
}

interface CandidatePair {
  candidate: MatchCandidate;
  missing: MissingReport;
  found: FoundReport;
}

function join(candidate: MatchCandidate): CandidatePair | null {
  const missing = getMissing(candidate.missingId);
  const found = getFound(candidate.foundId);
  if (!missing || !found) return null;
  return { candidate, missing, found };
}

/** Names of all currently-open reports (both sides) — the pool a name could be
 *  confused within. Loaded once per request, not once per candidate. */
function openNamePool(): Array<{ id: string; fullName: string }> {
  return [
    ...openMissing().map((r) => ({ id: r.id, fullName: r.fullName })),
    ...openFound().map((r) => ({ id: r.id, fullName: r.fullName })),
  ];
}

function withBaseRate(
  pair: CandidatePair,
  pool: Array<{ id: string; fullName: string }>,
): CandidateView {
  const otherNames = pool
    .filter((r) => r.id !== pair.missing.id && r.id !== pair.found.id)
    .map((r) => r.fullName);
  return { ...pair, nameBaseRate: countSharedName(pair.missing.fullName, otherNames) };
}

export function listCandidateViews(status?: MatchStatus): CandidateView[] {
  const pairs = listCandidates(status)
    .map(join)
    .filter((pair): pair is CandidatePair => pair !== null);
  const pool = openNamePool();
  return pairs.map((pair) => withBaseRate(pair, pool));
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
  const pair = join(candidate);
  if (!pair) return null;
  const view = withBaseRate(pair, openNamePool());
  return {
    ...view,
    verifications: verificationsForCandidate(candidate.id),
    timeline: missingTimeline(candidate.missingId),
  };
}
