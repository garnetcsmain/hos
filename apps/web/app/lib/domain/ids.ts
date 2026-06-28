// Human-readable, collision-resistant identifiers. Case numbers are shown to
// families and coordinators, so they need to be short and legible while still
// being unique (random suffix avoids races on a shared counter).

import { randomUUID } from "node:crypto";

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

export const newMissingId = (): string => `MP-VE-${shortId()}`;
export const newFoundId = (): string => `FP-VE-${shortId()}`;
export const newCandidateId = (): string => `MC-${shortId()}`;
export const newVerificationId = (): string => `VR-${shortId()}`;
export const newNotificationId = (): string => `NT-${shortId()}`;

/** First/given name derived from a full name, for least-PII public views. */
export function deriveGivenName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  return first;
}
