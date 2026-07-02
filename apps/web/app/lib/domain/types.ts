// Core domain model for HOS Phase 0 (family reunification).
// One mission: reduce the time it takes a family to find a loved one.
// Everything below carries trust metadata (provenance, timestamps, confidence)
// because — per the thesis — trust must be measurable.

export type Sex = "F" | "M" | "U";

// "matched" = a human confirmed the link but the family has NOT yet been
// reached. The case is out of active matching but is NOT publicly "resolved":
// a bare "Resuelto" must never be the first thing a family learns (Board D4).
export type ReportStatus = "open" | "candidate" | "verifying" | "matched" | "resolved";

export type MatchStatus = "pending" | "confirmed" | "rejected";

export type Condition = "alive" | "injured" | "hospitalized" | "deceased" | "unknown";

export type VerificationDecision = "confirmed" | "rejected" | "needs_more";

// "delivered" is only written when a channel (or a coordinator callback)
// actually reached the family — a real receipt, never assumed (Board D4).
export type NotificationStatus = "queued" | "sent" | "delivered" | "failed";

/** A family's report that they cannot reach a loved one. */
export interface MissingReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  givenName: string;
  age: number | null;
  sex: Sex;
  lastSeenLocation: string;
  city: string;
  lastSeenAt: string | null;
  description: string;
  /** Medical / sensitive context — never exposed publicly. */
  sensitiveNotes: string;
  reporterName: string;
  reporterRelationship: string;
  /** Phone / email of the reporting relative — sensitive PII. */
  reporterContact: string;
  consent: boolean;
  status: ReportStatus;
  source: string;
  photoUrl: string | null;
}

/** A responder's report of a found or sighted person. */
export interface FoundReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  givenName: string;
  age: number | null;
  sex: Sex;
  /** Precise location (shelter/hospital) — sensitive, access-controlled. */
  foundLocation: string;
  city: string;
  foundAt: string | null;
  condition: Condition;
  description: string;
  /** Reporting organization — provenance of the signal. */
  reporterOrg: string;
  reporterName: string;
  reporterContact: string;
  status: ReportStatus;
  source: string;
  photoUrl: string | null;
}

/** One scored factor contributing to a match. The evidence chain. */
export interface MatchFactor {
  key: string;
  label: string;
  /** Relative weight of this factor in the overall score. */
  weight: number;
  /** Normalized 0..1 agreement for this factor. */
  score: number;
  /** Human-readable explanation of why this factor scored as it did. */
  detail: string;
}

/** An AI-suggested link between a missing and a found report. Always a
 *  candidate to verify — never an automatic confirmation. */
export interface MatchCandidate {
  id: string;
  createdAt: string;
  updatedAt: string;
  missingId: string;
  foundId: string;
  /** Overall confidence 0..100. */
  score: number;
  factors: MatchFactor[];
  status: MatchStatus;
  /** Model/version that produced the candidate, for auditability. */
  model: string;
}

export interface Verification {
  id: string;
  createdAt: string;
  candidateId: string;
  decision: VerificationDecision;
  verifierOrg: string;
  verifierName: string;
  evidence: string;
  confidence: number | null;
}

export interface Notification {
  id: string;
  createdAt: string;
  missingId: string;
  candidateId: string | null;
  channel: string;
  recipient: string;
  status: NotificationStatus;
  subject: string;
  body: string;
}

export type EntityType =
  | "missing_report"
  | "found_report"
  | "match"
  | "verification"
  | "notification"
  // Coordination epic (HOS-2026-007) — kept in the same append-only event store.
  | "org"
  | "site"
  | "need"
  | "offer"
  // Whole-slice operations (bulk import/clear of coordination data).
  | "coordination";

/** Append-only event store record. Once written, never rewritten. */
export interface HosEvent {
  id: number;
  occurredAt: string;
  entityType: EntityType;
  entityId: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
}

/** Minimal shape the matching engine needs from a missing report. */
export type MatchableMissing = Pick<
  MissingReport,
  "fullName" | "age" | "sex" | "lastSeenLocation" | "city" | "lastSeenAt" | "description"
>;

/** Minimal shape the matching engine needs from a found report. */
export type MatchableFound = Pick<
  FoundReport,
  "fullName" | "age" | "sex" | "foundLocation" | "city" | "foundAt" | "description"
>;
