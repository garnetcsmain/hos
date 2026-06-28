// Verification service — the human-in-the-loop gate. A coordinator's decision
// on a match candidate is the only thing that can resolve a case or notify a
// family. Every decision is an atomic, audited transaction (AGENTS.md §3).
//
// On a confirmed match we resolve both reports and QUEUE a family notification.
// No channel actually reaches the family yet (in-app has no family-readable
// surface; SMS/email/WhatsApp need an external provider), so the notification is
// recorded as "queued" — never "sent" — until a channel returns a real receipt.

import { getCandidate, setCandidateStatus } from "../repositories/matches.ts";
import { getMissing, setMissingStatus } from "../repositories/missingReports.ts";
import { getFound, setFoundStatus } from "../repositories/foundReports.ts";
import { insertVerification } from "../repositories/verifications.ts";
import { insertNotification } from "../repositories/notifications.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newNotificationId, newVerificationId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import { redactContact } from "../domain/projections.ts";
import { notFound } from "../errors.ts";
import type { MissingReport, Notification, Verification } from "@/app/lib/domain/types";
import type { VerificationInput } from "../validation/schemas.ts";

function buildFamilyNotification(missing: MissingReport, candidateId: string): Notification {
  const name = missing.givenName || "su familiar";
  return {
    id: newNotificationId(),
    createdAt: nowIso(),
    missingId: missing.id,
    candidateId,
    channel: "in_app",
    recipient: redactContact(missing.reporterContact),
    // Honest status (Board HOS-2026-002-D4): the message is QUEUED, not delivered.
    // There is no family-readable surface yet, so we must not record "sent".
    // "sent" is only valid once a channel returns a real delivery receipt.
    status: "queued",
    subject: `Coincidencia verificada para ${name}`,
    body:
      `Una organización autorizada verificó una posible coincidencia para ${name} ` +
      `(caso ${missing.id}). Un coordinador se pondrá en contacto con la información disponible. ` +
      `Esta es una verificación humana, no una confirmación automática.`,
  };
}

export interface VerificationResult {
  verification: Verification;
  resolved: boolean;
  notificationId: string | null;
}

export function recordVerification(input: VerificationInput): VerificationResult {
  const candidate = getCandidate(input.candidateId);
  if (!candidate) throw notFound(`candidate ${input.candidateId} not found`);

  const verification: Verification = {
    id: newVerificationId(),
    createdAt: nowIso(),
    candidateId: candidate.id,
    decision: input.decision,
    verifierOrg: input.verifierOrg,
    verifierName: input.verifierName,
    evidence: input.evidence,
    confidence: input.confidence,
  };

  let resolved = false;
  let notificationId: string | null = null;

  transaction(() => {
    insertVerification(verification);
    appendEvent({
      entityType: "verification",
      entityId: verification.id,
      type: "verification.recorded",
      actor: `coordinator:${verification.verifierOrg}`,
      payload: { candidateId: candidate.id, decision: verification.decision, confidence: verification.confidence },
    });
    appendEvent({
      entityType: "match",
      entityId: candidate.id,
      type: `match.${verification.decision}`,
      actor: `coordinator:${verification.verifierOrg}`,
      payload: { verificationId: verification.id },
    });

    if (input.decision === "confirmed") {
      const missing = getMissing(candidate.missingId);
      const found = getFound(candidate.foundId);
      if (!missing || !found) throw notFound("linked report missing for confirmed candidate");

      setCandidateStatus(candidate.id, "confirmed");
      setMissingStatus(missing.id, "resolved");
      setFoundStatus(found.id, "resolved");

      const notification = buildFamilyNotification(missing, candidate.id);
      insertNotification(notification);
      notificationId = notification.id;
      resolved = true;

      appendEvent({
        entityType: "missing_report",
        entityId: missing.id,
        type: "report.resolved",
        actor: `coordinator:${verification.verifierOrg}`,
        payload: { candidateId: candidate.id, foundId: found.id },
      });
      appendEvent({
        entityType: "found_report",
        entityId: found.id,
        type: "report.resolved",
        actor: `coordinator:${verification.verifierOrg}`,
        payload: { candidateId: candidate.id, missingId: missing.id },
      });
      appendEvent({
        entityType: "notification",
        entityId: notification.id,
        // Not "family.notified" — nothing reached the family. That event may only
        // be written by a channel that actually delivered (Board HOS-2026-002-D4).
        type: "notification.queued",
        actor: "system:notifier",
        payload: { channel: notification.channel, missingId: missing.id },
      });
    } else if (input.decision === "rejected") {
      setCandidateStatus(candidate.id, "rejected");
    }
    // "needs_more" leaves the candidate pending for another reviewer.
  });

  return { verification, resolved, notificationId };
}
