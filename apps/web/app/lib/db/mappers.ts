// Map raw SQLite rows (snake_case columns) to domain types (camelCase).
// node:sqlite returns plain objects keyed by column name.

import type {
  Condition,
  FoundReport,
  MatchCandidate,
  MatchFactor,
  MissingReport,
  Notification,
  ReportStatus,
  Sex,
  Verification,
  VerificationDecision,
  HosEvent,
  EntityType,
  MatchStatus,
  NotificationStatus,
} from "@/app/lib/domain/types";

export type Row = Record<string, unknown>;

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const strOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const num = (v: unknown): number => Number(v ?? 0);

export function mapMissing(row: Row): MissingReport {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    fullName: str(row.full_name),
    givenName: str(row.given_name),
    age: numOrNull(row.age),
    sex: str(row.sex) as Sex,
    lastSeenLocation: str(row.last_seen_location),
    city: str(row.city),
    lastSeenAt: strOrNull(row.last_seen_at),
    description: str(row.description),
    sensitiveNotes: str(row.sensitive_notes),
    reporterName: str(row.reporter_name),
    reporterRelationship: str(row.reporter_relationship),
    reporterContact: str(row.reporter_contact),
    consent: num(row.consent) === 1,
    status: str(row.status) as ReportStatus,
    source: str(row.source),
    photoUrl: strOrNull(row.photo_url),
  };
}

export function mapFound(row: Row): FoundReport {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    fullName: str(row.full_name),
    givenName: str(row.given_name),
    age: numOrNull(row.age),
    sex: str(row.sex) as Sex,
    foundLocation: str(row.found_location),
    city: str(row.city),
    foundAt: strOrNull(row.found_at),
    condition: str(row.condition) as Condition,
    description: str(row.description),
    reporterOrg: str(row.reporter_org),
    reporterName: str(row.reporter_name),
    reporterContact: str(row.reporter_contact),
    status: str(row.status) as ReportStatus,
    source: str(row.source),
    photoUrl: strOrNull(row.photo_url),
  };
}

export function mapCandidate(row: Row): MatchCandidate {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    missingId: str(row.missing_id),
    foundId: str(row.found_id),
    score: num(row.score),
    factors: JSON.parse(str(row.factors) || "[]") as MatchFactor[],
    status: str(row.status) as MatchStatus,
    model: str(row.model),
  };
}

export function mapVerification(row: Row): Verification {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    candidateId: str(row.candidate_id),
    decision: str(row.decision) as VerificationDecision,
    verifierOrg: str(row.verifier_org),
    verifierName: str(row.verifier_name),
    evidence: str(row.evidence),
    confidence: numOrNull(row.confidence),
  };
}

export function mapNotification(row: Row): Notification {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    missingId: str(row.missing_id),
    candidateId: strOrNull(row.candidate_id),
    channel: str(row.channel),
    recipient: str(row.recipient),
    status: str(row.status) as NotificationStatus,
    subject: str(row.subject),
    body: str(row.body),
  };
}

export function mapEvent(row: Row): HosEvent {
  return {
    id: num(row.id),
    occurredAt: str(row.occurred_at),
    entityType: str(row.entity_type) as EntityType,
    entityId: str(row.entity_id),
    type: str(row.type),
    actor: str(row.actor),
    payload: JSON.parse(str(row.payload) || "{}") as Record<string, unknown>,
  };
}
