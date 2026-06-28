// Scrub likely direct-contact PII from free text before it is sent to an
// external model. Defense in depth (Board HOS-2026-002-D1): families routinely
// paste a phone number, email, or social handle into the free-text description
// even though there is a dedicated, withheld contact field. We strip those
// patterns so a reachable contact tied to a vulnerable person does not leave the
// system inside a model prompt.
//
// This is NOT anonymization — a name written in prose still passes. It removes
// the most damaging leak (a way to reach the person), not every trace of PII.
// Enabling a provider in production additionally requires a no-retention /
// no-train DPA and an explicit per-deployment opt-in.

const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
const HANDLE = /(^|[^\w@])@\w{2,}/g;
// 7+ digit runs, allowing spaces and common phone punctuation between digits.
const PHONE = /\+?\d[\d\s().-]{6,}\d/g;

export function scrubFreeText(text: string): string;
export function scrubFreeText(text: string | undefined): string | undefined;
export function scrubFreeText(text: string | undefined): string | undefined {
  if (!text) return text ?? undefined;
  return text
    .replace(EMAIL, "[correo]")
    .replace(HANDLE, (_m, lead) => `${lead}[usuario]`)
    .replace(PHONE, "[telefono]")
    .trim();
}
