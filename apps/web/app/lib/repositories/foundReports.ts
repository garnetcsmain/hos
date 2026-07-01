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

export async function insertFound(report: FoundReport): Promise<void> {
  await insertStmt().run(
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

export async function getFound(id: string): Promise<FoundReport | null> {
  const row = await db.prepare(`SELECT * FROM found_reports WHERE id = ?`).get(id);
  return row ? mapFound(row) : null;
}

export async function listFound(status?: ReportStatus): Promise<FoundReport[]> {
  const rows = status
    ? await db.prepare(`SELECT * FROM found_reports WHERE status = ? ORDER BY created_at DESC`).all(status)
    : await db.prepare(`SELECT * FROM found_reports ORDER BY created_at DESC`).all();
  return rows.map(mapFound);
}

/** Found reports still available to match. A "matched" report has a
 *  human-confirmed link awaiting family contact, so it leaves the active pool
 *  alongside "resolved" ones. */
export async function openFound(): Promise<FoundReport[]> {
  const rows = await db
    .prepare(`SELECT * FROM found_reports WHERE status NOT IN ('resolved', 'matched') ORDER BY created_at DESC`)
    .all();
  return rows.map(mapFound);
}

export async function setFoundStatus(id: string, status: ReportStatus): Promise<void> {
  await db.prepare(`UPDATE found_reports SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    nowIso(),
    id,
  );
}

export async function countFound(): Promise<number> {
  const row = (await db.prepare(`SELECT COUNT(*) AS n FROM found_reports`).get()) as
    | { n: number }
    | undefined;
  return Number(row?.n ?? 0);
}
