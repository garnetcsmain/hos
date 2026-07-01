import { db, lazyStatement } from "../db/client.ts";
import { mapNotification } from "../db/mappers.ts";
import type { Notification, NotificationStatus } from "@/app/lib/domain/types";

const insertStmt = lazyStatement(
  `INSERT INTO notifications
     (id, created_at, missing_id, candidate_id, channel, recipient, status, subject, body)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export function insertNotification(notification: Notification): void {
  insertStmt().run(
    notification.id,
    notification.createdAt,
    notification.missingId,
    notification.candidateId,
    notification.channel,
    notification.recipient,
    notification.status,
    notification.subject,
    notification.body,
  );
}

export function getNotification(id: string): Notification | null {
  const row = db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(id);
  return row ? mapNotification(row) : null;
}

export function listNotifications(limit = 100): Notification[] {
  const rows = db
    .prepare(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
  return rows.map(mapNotification);
}

export function setNotificationStatus(id: string, status: NotificationStatus): void {
  db.prepare(`UPDATE notifications SET status = ? WHERE id = ?`).run(status, id);
}

export function countNotifications(): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM notifications`).get() as { n: number };
  return Number(row.n);
}
