import { db, lazyStatement } from "../db/client.ts";
import { mapFound } from "../db/mappers.ts";
import { nowIso } from "../domain/time.ts";
import type { FoundReport, ReportStatus } from "@/app/lib/domain/types";

const insertStmt = lazyStatement(
  `INSERT INTO found_reports
     (id, created_at, updated_at, full_name, given_name, age, sex,
      found_location, city, found_at, condition, description,
      reporter_org, reporter_name, reporter_contact, status, source, photo_url)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export function insertFound(report: FoundReport): void {
  insertStmt().run(
    report.id,
    report.createdAt,
    report.updatedAt,
    report.fullName,
    report.givenName,
    report.age,
    report.sex,
    report.foundLocation,
    report.city,
    report.foundAt,
    report.condition,
    report.description,
    report.reporterOrg,
    report.reporterName,
    report.reporterContact,
    report.status,
    report.source,
    report.photoUrl,
  );
}

export function getFound(id: string): FoundReport | null {
  const row = db.prepare(`SELECT * FROM found_reports WHERE id = ?`).get(id);
  return row ? mapFound(row) : null;
}

export function listFound(status?: ReportStatus): FoundReport[] {
  const rows = status
    ? db.prepare(`SELECT * FROM found_reports WHERE status = ? ORDER BY created_at DESC`).all(status)
    : db.prepare(`SELECT * FROM found_reports ORDER BY created_at DESC`).all();
  return rows.map(mapFound);
}

export function openFound(): FoundReport[] {
  const rows = db
    .prepare(`SELECT * FROM found_reports WHERE status != 'resolved' ORDER BY created_at DESC`)
    .all();
  return rows.map(mapFound);
}

export function setFoundStatus(id: string, status: ReportStatus): void {
  db.prepare(`UPDATE found_reports SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id,
  );
}

export function countFound(): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM found_reports`).get() as { n: number };
  return Number(row.n);
}
