import { db } from "../db/client.ts";
import { mapCandidate } from "../db/mappers.ts";
import { nowIso } from "../domain/time.ts";
import type { MatchCandidate, MatchStatus } from "@/app/lib/domain/types";

const upsertStmt = db.prepare(
  `INSERT INTO match_candidates
     (id, created_at, updated_at, missing_id, found_id, score, factors, status, model)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(missing_id, found_id) DO UPDATE SET
     score = excluded.score,
     factors = excluded.factors,
     model = excluded.model,
     updated_at = excluded.updated_at`,
);

/** Insert a candidate, or refresh its score/evidence if the pair already
 *  exists. A human decision (status) is intentionally preserved on conflict —
 *  recomputing the score must never resurrect a rejected match. */
export function upsertCandidate(candidate: MatchCandidate): void {
  upsertStmt.run(
    candidate.id,
    candidate.createdAt,
    candidate.updatedAt,
    candidate.missingId,
    candidate.foundId,
    candidate.score,
    JSON.stringify(candidate.factors),
    candidate.status,
    candidate.model,
  );
}

export function getCandidate(id: string): MatchCandidate | null {
  const row = db.prepare(`SELECT * FROM match_candidates WHERE id = ?`).get(id);
  return row ? mapCandidate(row) : null;
}

export function listCandidates(status?: MatchStatus): MatchCandidate[] {
  const rows = status
    ? db.prepare(`SELECT * FROM match_candidates WHERE status = ? ORDER BY score DESC`).all(status)
    : db.prepare(`SELECT * FROM match_candidates ORDER BY score DESC`).all();
  return rows.map(mapCandidate);
}

export function candidatesForMissing(missingId: string): MatchCandidate[] {
  const rows = db
    .prepare(`SELECT * FROM match_candidates WHERE missing_id = ? ORDER BY score DESC`)
    .all(missingId);
  return rows.map(mapCandidate);
}

export function setCandidateStatus(id: string, status: MatchStatus): void {
  db.prepare(`UPDATE match_candidates SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id,
  );
}

export function countCandidates(status?: MatchStatus): number {
  const row = (
    status
      ? db.prepare(`SELECT COUNT(*) AS n FROM match_candidates WHERE status = ?`).get(status)
      : db.prepare(`SELECT COUNT(*) AS n FROM match_candidates`).get()
  ) as { n: number };
  return Number(row.n);
}
