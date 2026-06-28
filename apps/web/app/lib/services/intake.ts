// Intake services: turn a validated report payload into a persisted record +
// audit event, then run matching (deterministic baseline, then optional AI
// augmentation). The matcher only ever proposes candidates — it never resolves
// a case or confirms an identity.

import { insertMissing } from "../repositories/missingReports.ts";
import { insertFound } from "../repositories/foundReports.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newFoundId, newMissingId, deriveGivenName } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import { recomputeForFound, recomputeForMissing } from "./matcher.ts";
import { augmentCandidates } from "./aiAugment.ts";
import { aiEnabled } from "../ai/registry.ts";
import type { FoundReport, MatchCandidate, MissingReport } from "@/app/lib/domain/types";
import type { FoundReportInput, MissingReportInput } from "../validation/schemas.ts";

async function augmentBestEffort(candidates: MatchCandidate[]): Promise<void> {
  if (!aiEnabled() || candidates.length === 0) return;
  try {
    await augmentCandidates(candidates.map((c) => c.id));
  } catch {
    // AI is additive — never let an augmentation failure break intake.
  }
}

export async function submitMissingReport(
  input: MissingReportInput,
): Promise<{ report: MissingReport; candidates: MatchCandidate[] }> {
  const now = nowIso();
  const report: MissingReport = {
    id: newMissingId(),
    createdAt: now,
    updatedAt: now,
    fullName: input.fullName,
    givenName: deriveGivenName(input.fullName),
    age: input.age,
    sex: input.sex,
    lastSeenLocation: input.lastSeenLocation,
    city: input.city,
    lastSeenAt: input.lastSeenAt,
    description: input.description,
    sensitiveNotes: input.sensitiveNotes,
    reporterName: input.reporterName,
    reporterRelationship: input.reporterRelationship,
    reporterContact: input.reporterContact,
    consent: input.consent,
    status: "open",
    source: "family_web",
    photoUrl: input.photoUrl,
  };

  transaction(() => {
    insertMissing(report);
    appendEvent({
      entityType: "missing_report",
      entityId: report.id,
      type: "report.created",
      actor: "family",
      payload: { city: report.city, hasPhoto: Boolean(report.photoUrl) },
    });
  });

  const candidates = recomputeForMissing(report);
  await augmentBestEffort(candidates);
  return { report, candidates };
}

export async function submitFoundReport(
  input: FoundReportInput,
): Promise<{ report: FoundReport; candidates: MatchCandidate[] }> {
  const now = nowIso();
  const report: FoundReport = {
    id: newFoundId(),
    createdAt: now,
    updatedAt: now,
    fullName: input.fullName,
    givenName: deriveGivenName(input.fullName),
    age: input.age,
    sex: input.sex,
    foundLocation: input.foundLocation,
    city: input.city,
    foundAt: input.foundAt,
    condition: input.condition,
    description: input.description,
    reporterOrg: input.reporterOrg,
    reporterName: input.reporterName,
    reporterContact: input.reporterContact,
    status: "open",
    source: "responder",
    photoUrl: input.photoUrl,
  };

  transaction(() => {
    insertFound(report);
    appendEvent({
      entityType: "found_report",
      entityId: report.id,
      type: "report.created",
      actor: `org:${report.reporterOrg || "unknown"}`,
      payload: { city: report.city, condition: report.condition, hasPhoto: Boolean(report.photoUrl) },
    });
  });

  const candidates = recomputeForFound(report);
  await augmentBestEffort(candidates);
  return { report, candidates };
}
