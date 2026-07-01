import { db, lazyStatement } from "../db/client.ts";
import { mapVerification } from "../db/mappers.ts";
import type { Verification } from "@/app/lib/domain/types";

const insertStmt = lazyStatement(
  `INSERT INTO verifications
     (id, created_at, candidate_id, decision, verifier_org, verifier_name, evidence, confidence)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertVerification(verification: Verification): Promise<void> {
  await insertStmt().run(
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

export async function verificationsForCandidate(candidateId: string): Promise<Verification[]> {
  const rows = await db
    .prepare(`SELECT * FROM verifications WHERE candidate_id = ? ORDER BY created_at ASC`)
    .all(candidateId);
  return rows.map(mapVerification);
}
