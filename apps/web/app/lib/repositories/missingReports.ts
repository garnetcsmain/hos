import { db, lazyStatement } from "../db/client.ts";
import { mapMissing } from "../db/mappers.ts";
import { nowIso } from "../domain/time.ts";
import type { MissingReport, ReportStatus } from "@/app/lib/domain/types";

const insertStmt = lazyStatement(
  `INSERT INTO missing_reports
     (id, created_at, updated_at, full_name, given_name, age, sex,
      last_seen_location, city, last_seen_at, description, sensitive_notes,
      reporter_name, reporter_relationship, reporter_contact, consent,
      status, source, photo_url)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertMissing(report: MissingReport): Promise<void> {
  await insertStmt().run(
    report.id,
    report.createdAt,
    report.updatedAt,
    report.fullName,
    report.givenName,
    report.age,
    report.sex,
    report.lastSeenLocation,
    report.city,
    report.lastSeenAt,
    report.description,
    report.sensitiveNotes,
    report.reporterName,
    report.reporterRelationship,
    report.reporterContact,
    report.consent ? 1 : 0,
    report.status,
    report.source,
    report.photoUrl,
  );
}

export async function getMissing(id: string): Promise<MissingReport | null> {
  const row = await db.prepare(`SELECT * FROM missing_reports WHERE id = ?`).get(id);
  return row ? mapMissing(row) : null;
}

export async function listMissing(status?: ReportStatus): Promise<MissingReport[]> {
  const rows = status
    ? await db.prepare(`SELECT * FROM missing_reports WHERE status = ? ORDER BY created_at DESC`).all(status)
    : await db.prepare(`SELECT * FROM missing_reports ORDER BY created_at DESC`).all();
  return rows.map(mapMissing);
}

/** Open reports still seeking a match. A "matched" case has a human-confirmed
 *  link awaiting family contact, so it is no longer actively matched (nor is a
 *  "resolved" one). */
export async function openMissing(): Promise<MissingReport[]> {
  const rows = await db
    .prepare(`SELECT * FROM missing_reports WHERE status NOT IN ('resolved', 'matched') ORDER BY created_at DESC`)
    .all();
  return rows.map(mapMissing);
}

export async function setMissingStatus(id: string, status: ReportStatus): Promise<void> {
  await db.prepare(`UPDATE missing_reports SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id,
  );
}

export async function countMissing(): Promise<number> {
  const row = (await db.prepare(`SELECT COUNT(*) AS n FROM missing_reports`).get()) as
    | { n: number }
    | undefined;
  return Number(row?.n ?? 0);
}
