// Intake minimization for the coordination create forms.
// HOS-2026-013-02 — Board HOS-2026-013 D3 / Contrarian Flaw 5 (rated HIGH):
// "lowering friction to DO must not lower friction to inject PII." Under the
// ratified HOS-2026-008 latent-state-adversary posture, the least PII we keep at
// rest is the least a host compulsion can ever surrender. The create forms are
// the intake boundary that exists today (the free-text draft box + the
// need "detalle / punto de referencia" note), so the minimization posture is
// applied here, not only at publication.
//
// Two layers, matching the board condition:
//   1. Minimize BY CONSTRUCTION — structured category + district + site are the
//      primary inputs; free text is optional and secondary. That is enforced by
//      the form shape, not by this module.
//   2. A standing plain-usted NUDGE plus an ADVISORY detector for the free-text
//      fields, provided here.
//
// Scope honesty (same discipline as tools/checks/approved-crypto.mjs leaving
// Math.random review-only): we only auto-flag identifiers a regex catches with
// near-zero false positives — phone numbers, national ID (cedula), and email.
// Personal NAMES and exact home addresses are not machine-detectable in free
// Spanish prose without heavy false positives, so the standing nudge — not a
// detector — is what covers them. We would rather under-flag than cry wolf and
// train authors to dismiss the warning.
//
// The warning is ADVISORY and never blocks submission: a hard gate on creating
// content is a duress footgun and a mis-marking incentive (HOS-2026-010-R2), and
// wrongly blocking a real need in a crisis is the worse failure. We surface, the
// human decides.

/** The standing in-flow nudge shown on every free-text intake field. Plain
 *  usted, no jargon — legible to the person the board's User persona speaks for. */
export const INTAKE_NUDGE =
  "No escriba nombres, teléfonos ni direcciones exactas de personas. " +
  "Basta la categoría, el distrito y el sitio.";

export type IntakePiiKind = "phone" | "id" | "email";

export interface IntakePiiFlag {
  kind: IntakePiiKind;
  /** Short human label for the caution line, in Spanish. */
  label: string;
}

const LABEL: Record<IntakePiiKind, string> = {
  phone: "un teléfono",
  id: "una cédula",
  email: "un correo",
};

// Venezuelan mobile (0414/0424/0412/0416/0426) and Caracas landline (0212),
// with or without the leading 0 and with common separators; plus the +58
// international form. Kept specific so quantities like "2.000.000" never match.
const PHONE_PATTERNS: readonly RegExp[] = [
  /\+?\s?58[\s.-]?\d[\d\s.-]{7,}\d/, // +58 ... (>= ~9 digits)
  /\b0?4(?:14|24|12|16|26)[\s.-]?\d{3}[\s.-]?\d{4}\b/, // mobile
  /\b0?212[\s.-]?\d{3}[\s.-]?\d{4}\b/, // Caracas landline
  /\b(?:tel[eé]fono|telf?|whatsapp|wsp|contacto|celular|cel)\b\s*:?\s*\d[\d\s.-]{6,}/i, // labelled
];

// Cédula: V/E/J prefix + 6-8 digits (dotted or not), or the word cedula/CI + digits.
const ID_PATTERNS: readonly RegExp[] = [
  /\b[VEJvej][-.\s]?\d{1,2}\.?\d{3}\.?\d{3}\b/,
  /\b(?:c[eé]dula|c\.?\s?i\.?)\b\s*:?\s*[VEJvej]?[-.\s]?\d{6,8}\b/i,
];

const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i;

function anyMatch(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Detect high-confidence personal identifiers in a free-text intake string.
 *  Returns at most one flag per kind, in a stable order. Empty when clean. */
export function detectIntakePii(text: string): IntakePiiFlag[] {
  if (!text || !text.trim()) return [];
  const flags: IntakePiiFlag[] = [];
  if (anyMatch(text, PHONE_PATTERNS)) flags.push({ kind: "phone", label: LABEL.phone });
  if (anyMatch(text, ID_PATTERNS)) flags.push({ kind: "id", label: LABEL.id });
  if (EMAIL_PATTERN.test(text)) flags.push({ kind: "email", label: LABEL.email });
  return flags;
}

/** True when the free text contains at least one detectable identifier. */
export function hasIntakePii(text: string): boolean {
  return detectIntakePii(text).length > 0;
}

/** Build the advisory caution line for a set of flags (empty when clean).
 *  e.g. "Parece que escribió un teléfono y una cédula. Puede quitarlos: no hacen
 *  falta para coordinar la ayuda." */
export function intakePiiCaution(flags: IntakePiiFlag[]): string {
  if (flags.length === 0) return "";
  const labels = flags.map((f) => f.label);
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
  return `Parece que escribió ${list}. Puede quitarlo: no hace falta para coordinar la ayuda.`;
}
