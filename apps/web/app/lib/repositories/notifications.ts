import { db, lazyStatement } from "../db/client.ts";
import { mapNotification } from "../db/mappers.ts";
import type { Notification, NotificationStatus } from "@/app/lib/domain/types";

const insertStmt = lazyStatement(
  `INSERT INTO notifications
     (id, created_at, missing_id, candidate_id, channel, recipient, status, subject, body)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertNotification(notification: Notification): Promise<void> {
  await insertStmt().run(
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

export async function getNotification(id: string): Promise<Notification | null> {
  const row = await db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(id);
  return row ? mapNotification(row) : null;
}

export async function listNotifications(limit = 100): Promise<Notification[]> {
  const rows = await db
    .prepare(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
  return rows.map(mapNotification);
}

export async function setNotificationStatus(id: string, status: NotificationStatus): Promise<void> {
  await db.prepare(`UPDATE notifications SET status = ? WHERE id = ?`).run(status, id);
}

export async function countNotifications(): Promise<number> {
  const row = (await db.prepare(`SELECT COUNT(*) AS n FROM notifications`).get()) as
    | { n: number }
    | undefined;
  return Number(row?.n ?? 0);
}
