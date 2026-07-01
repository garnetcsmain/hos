// Verification service — the human-in-the-loop gate. A coordinator's decision
// on a match candidate is the only thing that can resolve a case or notify a
// family. Every decision is an atomic, audited transaction (AGENTS.md §3).
//
// A confirmed match does NOT resolve the case or reach the family. It creates a
// tracked family-reach OBLIGATION (a "queued" notification on the
// coordinator_callback channel) and moves both reports to "matched". The public
// "Resuelto" status and the real delivery receipt are written only later, when a
// coordinator records that the family was actually reached (see familyReach.ts,
// Board HOS-2026-002-D4).

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
import {
  FAMILY_REACH_CHANNEL,
  familyReachObligationText,
} from "./familyReach.ts";
import type { FoundReport, MissingReport, Notification, Verification } from "@/app/lib/domain/types";
import type { VerificationInput } from "../validation/schemas.ts";

function buildFamilyReachObligation(
  missing: MissingReport,
  found: FoundReport,
  candidateId: string,
): Notification {
  const { subject, body } = familyReachObligationText(missing.givenName, found.condition);
  return {
    id: newNotificationId(),
    createdAt: nowIso(),
    missingId: missing.id,
    candidateId,
    channel: FAMILY_REACH_CHANNEL,
    recipient: redactContact(missing.reporterContact),
    // "queued" = obligation open, family NOT yet reached. Only recordFamilyReach
    // may move it to "delivered", and only when a human actually made contact.
    status: "queued",
    subject,
    body,
  };
}

export interface VerificationResult {
  verification: Verification;
  /** The human confirmed the match. The case is now "matched", awaiting family
   *  contact — it is NOT yet resolved (that happens on family reach). */
  confirmed: boolean;
  /** Reserved: a confirm never resolves the case directly anymore. Kept for the
   *  API contract; resolution is recorded via the family-reach obligation. */
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

  let confirmed = false;
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
      // Not "resolved": the case becomes "matched" and stays out of the public
      // "Resuelto" state until a coordinator records that the family was
      // actually reached (Board HOS-2026-002-D4).
      setMissingStatus(missing.id, "matched");
      setFoundStatus(found.id, "matched");

      const obligation = buildFamilyReachObligation(missing, found, candidate.id);
      insertNotification(obligation);
      notificationId = obligation.id;
      confirmed = true;

      appendEvent({
        entityType: "missing_report",
        entityId: missing.id,
        type: "report.matched",
        actor: `coordinator:${verification.verifierOrg}`,
        payload: { candidateId: candidate.id, foundId: found.id },
      });
      appendEvent({
        entityType: "found_report",
        entityId: found.id,
        type: "report.matched",
        actor: `coordinator:${verification.verifierOrg}`,
        payload: { candidateId: candidate.id, missingId: missing.id },
      });
      appendEvent({
        entityType: "notification",
        entityId: obligation.id,
        // Not "family.notified" — nothing reached the family. This is a QUEUED
        // obligation; only recordFamilyReach may write "family.reached" once a
        // human actually made contact (Board HOS-2026-002-D4).
        type: "notification.queued",
        actor: "system:notifier",
        payload: { channel: obligation.channel, missingId: missing.id },
      });
    } else if (input.decision === "rejected") {
      setCandidateStatus(candidate.id, "rejected");
    }
    // "needs_more" leaves the candidate pending for another reviewer.
  });

  return { verification, confirmed, resolved: false, notificationId };
}
