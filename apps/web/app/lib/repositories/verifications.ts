import { db } from "../db/client.ts";
import { mapVerification } from "../db/mappers.ts";
import type { Verification } from "@/app/lib/domain/types";

const insertStmt = db.prepare(
  `INSERT INTO verifications
     (id, created_at, candidate_id, decision, verifier_org, verifier_name, evidence, confidence)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

export function insertVerification(verification: Verification): void {
  insertStmt.run(
    verification.id,
    verification.createdAt,
    verification.candidateId,
    verification.decision,
    verification.verifierOrg,
    verification.verifierName,
    verification.evidence,
    verification.confidence,
  );
}

export function verificationsForCandidate(candidateId: string): Verification[] {
  const rows = db
    .prepare(`SELECT * FROM verifications WHERE candidate_id = ? ORDER BY created_at ASC`)
    .all(candidateId);
  return rows.map(mapVerification);
}
