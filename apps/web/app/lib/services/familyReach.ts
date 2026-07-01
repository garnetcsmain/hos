// Family-reach obligation (Board HOS-2026-002-D4).
//
// Confirming a match does NOT reach a family — it creates a tracked OBLIGATION
// for a human to contact them. The board found the old flow recorded a delivery
// that never happened and flipped the case to a bare public "Resuelto" that a
// mother could read before anyone spoke to her, unable to tell if her son was
// alive or deceased. So:
//
//  - the obligation is a real, queryable record (a notification on the
//    `coordinator_callback` channel, status "queued"), never a promise buried
//    in body text;
//  - the case resolves publicly ONLY when a coordinator records that the family
//    was actually reached — that write is the real receipt ("family.reached");
//  - a deceased outcome carries explicit, compassionate handling guidance and
//    must never be communicated through an automated channel.

import { getCandidate } from "../repositories/matches.ts";
import { setMissingStatus } from "../repositories/missingReports.ts";
import { setFoundStatus } from "../repositories/foundReports.ts";
import { getNotification, setNotificationStatus } from "../repositories/notifications.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { badRequest, notFound } from "../errors.ts";
import type { Condition, NotificationStatus } from "@/app/lib/domain/types";
import type { FamilyReachInput } from "../validation/schemas.ts";

/** The outbox channel that represents "a coordinator must personally contact
 *  the family" — the honest Phase-0 reach path until an external channel is
 *  wired (SMS/WhatsApp all need a signed DPA first). */
export const FAMILY_REACH_CHANNEL = "coordinator_callback";

/** A grave outcome the family must never learn from an automated channel or a
 *  bare status word — it requires careful, ideally in-person, human contact. */
export function isSensitiveOutcome(condition: Condition): boolean {
  return condition === "deceased";
}

export interface ObligationText {
  subject: string;
  body: string;
}

/** The coordinator-facing text of a family-reach obligation. Pure and
 *  condition-aware so the deceased path is handled with dignity (Board D4 /
 *  User "Fallecida" concern). */
export function familyReachObligationText(
  givenName: string,
  condition: Condition,
): ObligationText {
  const name = givenName || "su familiar";
  const base =
    `Una organización autorizada verificó una coincidencia para ${name}. ` +
    `Un coordinador debe contactar a la familia (por teléfono o en persona) con la ` +
    `información disponible antes de cerrar el caso. Es una verificación humana, no ` +
    `una confirmación automática.`;
  if (isSensitiveOutcome(condition)) {
    return {
      subject: `Contacto sensible: familia de ${name}`,
      body:
        `${base} ATENCIÓN: la persona fue reportada como fallecida. Comunique la ` +
        `noticia con cuidado, preferiblemente en persona y con apoyo psicosocial. ` +
        `Nunca por un canal automático ni como un simple cambio de estado.`,
    };
  }
  return { subject: `Contactar a la familia de ${name}`, body: base };
}

export interface FamilyReachResult {
  resolved: boolean;
  status: NotificationStatus;
}

/** Record the outcome of a family-reach obligation. Reaching the family is the
 *  only thing that resolves the case; an unreachable attempt is tracked (never
 *  silently dropped) and leaves the case awaiting another attempt. */
export async function recordFamilyReach(input: FamilyReachInput): Promise<FamilyReachResult> {
  const notification = await getNotification(input.notificationId);
  if (!notification) throw notFound(`notification ${input.notificationId} not found`);
  if (notification.channel !== FAMILY_REACH_CHANNEL) {
    throw badRequest("notification is not a family-reach obligation");
  }
  // Idempotent: a family already reached stays reached; the case is resolved.
  if (notification.status === "delivered") {
    return { resolved: true, status: "delivered" };
  }

  const candidate = notification.candidateId ? await getCandidate(notification.candidateId) : null;
  const actor = `coordinator:${input.coordinatorOrg}`;
  let resolved = false;
  let status: NotificationStatus = notification.status;

  await transaction(async () => {
    if (input.outcome === "reached") {
      await setNotificationStatus(notification.id, "delivered");
      status = "delivered";
      await appendEvent({
        entityType: "notification",
        entityId: notification.id,
        // The real receipt: only ever written when a human actually reached the
        // family (Board D4). This is what "delivered" means here.
        type: "family.reached",
        actor,
        payload: { missingId: notification.missingId, note: input.note },
      });

      // Now — and only now — the case becomes publicly "resolved".
      await setMissingStatus(notification.missingId, "resolved");
      await appendEvent({
        entityType: "missing_report",
        entityId: notification.missingId,
        type: "report.resolved",
        actor,
        payload: { via: "family_reach", candidateId: candidate?.id ?? null },
      });
      if (candidate) {
        await setFoundStatus(candidate.foundId, "resolved");
        await appendEvent({
          entityType: "found_report",
          entityId: candidate.foundId,
          type: "report.resolved",
          actor,
          payload: { via: "family_reach", missingId: notification.missingId },
        });
      }
      resolved = true;
    } else {
      // A failed attempt is a tracked fact, not a dropped one. The case stays
      // "matched" (out of matching, not yet resolved) for another attempt.
      await appendEvent({
        entityType: "notification",
        entityId: notification.id,
        type: "family.reach_attempted",
        actor,
        payload: { missingId: notification.missingId, note: input.note },
      });
    }
  });

  return { resolved, status };
}
