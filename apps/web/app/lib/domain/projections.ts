// Server-side PII minimization. Public/aggregate callers see the least
// information possible: a given name, a coarse age band, city, and status —
// never the family contact, precise shelter/hospital, medical notes, or exact
// last-known address. Enforcing this here (not in the UI) is a security control
// (AGENTS.md §4): assume an adversary is reading the public API.

import type { Condition, FoundReport, MissingReport, ReportStatus, Sex } from "./types.ts";

export type AgeBand = "child" | "teen" | "adult" | "senior" | "unknown";

export function ageBand(age: number | null): AgeBand {
  if (age === null) return "unknown";
  if (age < 13) return "child";
  if (age < 18) return "teen";
  if (age < 60) return "adult";
  return "senior";
}

export interface PublicMissing {
  id: string;
  givenName: string;
  ageBand: AgeBand;
  sex: Sex;
  city: string;
  status: ReportStatus;
  createdAt: string;
}

export interface PublicFound {
  id: string;
  givenName: string;
  ageBand: AgeBand;
  sex: Sex;
  city: string;
  condition: Condition;
  status: ReportStatus;
  createdAt: string;
}

export function toPublicMissing(report: MissingReport): PublicMissing {
  return {
    id: report.id,
    givenName: report.givenName || "Sin nombre",
    ageBand: ageBand(report.age),
    sex: report.sex,
    city: report.city,
    status: report.status,
    createdAt: report.createdAt,
  };
}

export function toPublicFound(report: FoundReport): PublicFound {
  return {
    id: report.id,
    givenName: report.givenName || "Sin identificar",
    ageBand: ageBand(report.age),
    sex: report.sex,
    city: report.city,
    condition: report.condition,
    status: report.status,
    createdAt: report.createdAt,
  };
}

/** Redact a phone/email for display in coordinator views and audit payloads:
 *  keeps enough to recognize, hides the rest. "+58 412 555 1942" -> "+58 412 ••• 1942". */
export function redactContact(contact: string): string {
  const trimmed = contact.trim();
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  const visibleTail = trimmed.slice(-4);
  const head = trimmed.slice(0, Math.min(6, trimmed.length - 4));
  return `${head}••• ${visibleTail}`;
}
