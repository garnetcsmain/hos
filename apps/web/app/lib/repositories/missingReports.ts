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

export function insertMissing(report: MissingReport): void {
  insertStmt().run(
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

export function getMissing(id: string): MissingReport | null {
  const row = db.prepare(`SELECT * FROM missing_reports WHERE id = ?`).get(id);
  return row ? mapMissing(row) : null;
}

export function listMissing(status?: ReportStatus): MissingReport[] {
  const rows = status
    ? db.prepare(`SELECT * FROM missing_reports WHERE status = ? ORDER BY created_at DESC`).all(status)
    : db.prepare(`SELECT * FROM missing_reports ORDER BY created_at DESC`).all();
  return rows.map(mapMissing);
}

/** Open reports still seeking a match (anything not yet resolved). */
export function openMissing(): MissingReport[] {
  const rows = db
    .prepare(`SELECT * FROM missing_reports WHERE status != 'resolved' ORDER BY created_at DESC`)
    .all();
  return rows.map(mapMissing);
}

export function setMissingStatus(id: string, status: ReportStatus): void {
  db.prepare(`UPDATE missing_reports SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id,
  );
}

export function countMissing(): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM missing_reports`).get() as { n: number };
  return Number(row.n);
}
