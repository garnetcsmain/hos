// Text + value normalization for the matching engine.
// Spanish-first: accents are stripped so "José" and "Jose" compare equal,
// and common name particles ("de", "la") are dropped from name tokens.

/** Particles that carry no identifying signal in Venezuelan/Spanish names. */
const NAME_PARTICLES = new Set(["de", "del", "la", "las", "los", "el", "y", "da", "do"]);

/** Trait words too generic to count as shared identifying detail. */
const TRAIT_STOPWORDS = new Set([
  "de",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "con",
  "y",
  "o",
  "the",
  "a",
  "an",
  "and",
  "with",
  "of",
  "near",
  "cerca",
  "persona",
  "person",
  "anos",
  "years",
  "old",
]);

// Combining diacritical marks (U+0300–U+036F), left over after NFD decomposition.
const DIACRITICS = /[̀-ͯ]/g;

/** Lowercase, strip diacritics, collapse non-alphanumerics to single spaces. */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize a person name, dropping particles and single-letter initials. */
export function nameTokens(value: string | null | undefined): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !NAME_PARTICLES.has(token));
}

/** Tokenize free-text traits/description, dropping generic stopwords. */
export function traitTokens(value: string | null | undefined): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !TRAIT_STOPWORDS.has(token));
}

/** Whole-days between two ISO dates; null if either is missing/invalid.
 *  Positive when `later` is after `earlier`. */
export function daysBetween(earlier: string | null, later: string | null): number | null {
  if (!earlier || !later) return null;
  const a = Date.parse(earlier);
  const b = Date.parse(later);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}
