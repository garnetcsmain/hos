import { db, lazyStatement } from "../db/client.ts";
import { mapCandidate } from "../db/mappers.ts";
import { nowIso } from "../domain/time.ts";
import type { MatchCandidate, MatchStatus } from "@/app/lib/domain/types";

const upsertStmt = lazyStatement(
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
export async function upsertCandidate(candidate: MatchCandidate): Promise<void> {
  await upsertStmt().run(
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

export async function getCandidate(id: string): Promise<MatchCandidate | null> {
  const row = await db.prepare(`SELECT * FROM match_candidates WHERE id = ?`).get(id);
  return row ? mapCandidate(row) : null;
}

export async function listCandidates(status?: MatchStatus): Promise<MatchCandidate[]> {
  const rows = status
    ? await db.prepare(`SELECT * FROM match_candidates WHERE status = ? ORDER BY score DESC`).all(status)
    : await db.prepare(`SELECT * FROM match_candidates ORDER BY score DESC`).all();
  return rows.map(mapCandidate);
}

export async function candidatesForMissing(missingId: string): Promise<MatchCandidate[]> {
  const rows = await db
    .prepare(`SELECT * FROM match_candidates WHERE missing_id = ? ORDER BY score DESC`)
    .all(missingId);
  return rows.map(mapCandidate);
}

export async function setCandidateStatus(id: string, status: MatchStatus): Promise<void> {
  await db.prepare(`UPDATE match_candidates SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id,
  );
}

export async function countCandidates(status?: MatchStatus): Promise<number> {
  const row = (
    status
      ? await db.prepare(`SELECT COUNT(*) AS n FROM match_candidates WHERE status = ?`).get(status)
      : await db.prepare(`SELECT COUNT(*) AS n FROM match_candidates`).get()
  ) as { n: number } | undefined;
  return Number(row?.n ?? 0);
}
