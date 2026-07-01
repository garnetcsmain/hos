// Matching service: runs the engine over reports and persists candidates +
// audit events. Every AI suggestion is logged into the event store (input
// refs, model/version, score) so every AI-influenced outcome is reproducible.
//
// A candidate here is exactly that — a candidate. This service never changes a
// report to "resolved" or confirms an identity; only human verification does.

import { MATCH_FLOOR, MODEL_VERSION, TOP_K, scoreMatch } from "../matching/engine.ts";
import { openFound } from "../repositories/foundReports.ts";
import { openMissing, setMissingStatus } from "../repositories/missingReports.ts";
import { candidatesForMissing, upsertCandidate } from "../repositories/matches.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newCandidateId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import type { FoundReport, MatchCandidate, MissingReport } from "@/app/lib/domain/types";

interface PairOutcome {
  candidate: MatchCandidate;
  isNew: boolean;
}

/** Score one missing report against a set of found reports and persist the
 *  candidates at or above the floor. Returns the candidates that are new this
 *  run (so the caller can notify / surface them). Runs in one transaction. */
async function persistForMissing(
  missing: MissingReport,
  founds: FoundReport[],
): Promise<MatchCandidate[]> {
  const existing = new Map(
    (await candidatesForMissing(missing.id)).map((c) => [c.foundId, c]),
  );

  const ranked = founds
    .map((found) => ({ found, result: scoreMatch(missing, found) }))
    .filter((entry) => entry.result.score >= MATCH_FLOOR)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, TOP_K);

  const outcomes: PairOutcome[] = [];

  await transaction(async () => {
    for (const { found, result } of ranked) {
      const prior = existing.get(found.id);
      const now = nowIso();
      const candidate: MatchCandidate = {
        id: prior?.id ?? newCandidateId(),
        createdAt: prior?.createdAt ?? now,
        updatedAt: now,
        missingId: missing.id,
        foundId: found.id,
        score: result.score,
        factors: result.factors,
        status: prior?.status ?? "pending",
        model: MODEL_VERSION,
      };
      await upsertCandidate(candidate);

      if (!prior) {
        await appendEvent({
          entityType: "match",
          entityId: candidate.id,
          type: "match.suggested",
          actor: "system:matcher",
          payload: { missingId: missing.id, foundId: found.id, score: result.score, model: MODEL_VERSION },
        });
        await appendEvent({
          entityType: "missing_report",
          entityId: missing.id,
          type: "match.candidate_added",
          actor: "system:matcher",
          payload: { candidateId: candidate.id, foundId: found.id, score: result.score },
        });
      }
      outcomes.push({ candidate, isNew: !prior });
    }

    if (outcomes.length > 0 && missing.status === "open") {
      await setMissingStatus(missing.id, "candidate");
    }
  });

  return outcomes.filter((o) => o.isNew).map((o) => o.candidate);
}

/** Recompute candidates for a single missing report against all open found
 *  reports. Returns newly suggested candidates. */
export async function recomputeForMissing(missing: MissingReport): Promise<MatchCandidate[]> {
  return persistForMissing(missing, await openFound());
}

/** Recompute candidates triggered by a new/updated found report: evaluate it
 *  against every open missing report. Returns newly suggested candidates. */
export async function recomputeForFound(found: FoundReport): Promise<MatchCandidate[]> {
  const fresh: MatchCandidate[] = [];
  for (const missing of await openMissing()) {
    fresh.push(...(await persistForMissing(missing, [found])));
  }
  return fresh;
}

/** Full re-scan (used by seed and the manual "recompute" action). */
export async function recomputeAll(): Promise<{ missing: number; newCandidates: number }> {
  const founds = await openFound();
  const missings = await openMissing();
  let newCandidates = 0;
  for (const missing of missings) {
    newCandidates += (await persistForMissing(missing, founds)).length;
  }
  return { missing: missings.length, newCandidates };
}
