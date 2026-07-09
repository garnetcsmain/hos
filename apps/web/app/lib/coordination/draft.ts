// Free-text -> form draft (HOS-2026-007-14). A coordinator (or, later, a public
// reporter through the intake gate) can type a sentence and have the need/offer
// form pre-filled as a DRAFT they review before publishing. Nothing here ever
// submits: it only proposes values a human then confirms or corrects.
//
// Deterministic and dependency-light on purpose — same pluggable-AI philosophy
// as classify.ts: an AI can later refine this, but with no key configured the
// rules still fill the obvious fields. It reuses the classifier so the free-text
// path and the import path agree on what a word means.

import {
  districtFromText,
  needCategoryFromText,
  normalizeText,
  urgencyFromText,
} from "./classify.ts";
import type { NeedCategory, Urgency } from "../domain/coordination.ts";

export interface DraftFields {
  category: NeedCategory;
  urgency: Urgency;
  district: string | null;
  quantity: number | null;
  unit: string | null;
  /** Matched existing org id, if the text names one closely enough. */
  orgId: string | null;
}

// Spanish quantity units seen in the field data, normalized -> canonical label.
const UNIT_WORDS: ReadonlyArray<{ pattern: RegExp; unit: string }> = [
  { pattern: /litros?|lts?\b/, unit: "L" },
  { pattern: /botellones?/, unit: "botellones" },
  { pattern: /botellas?/, unit: "botellas" },
  { pattern: /cajas?/, unit: "cajas" },
  { pattern: /latas?/, unit: "latas" },
  { pattern: /bolsas?/, unit: "bolsas" },
  { pattern: /kilos?|kg\b/, unit: "kg" },
  { pattern: /sacos?/, unit: "sacos" },
  { pattern: /panales|panal|pañales|pañal/, unit: "pañales" },
  { pattern: /kits?|kit/, unit: "kits" },
  { pattern: /personas?|familias?/, unit: "personas" },
  { pattern: /unidades?/, unit: "unidades" },
];

/** First integer in the text (e.g. "necesitamos 40 litros" -> 40). */
function parseQuantity(t: string): number | null {
  const m = t.match(/\b(\d{1,6})\b/);
  return m ? Number(m[1]) : null;
}

function parseUnit(t: string): string | null {
  for (const { pattern, unit } of UNIT_WORDS) {
    if (pattern.test(t)) return unit;
  }
  return null;
}

/** Fuzzy-match the text against known org names: an org whose name (or a
 *  distinctive word of it) appears in the text. Returns the best (longest)
 *  match so "caracasayuda" beats a short common word. */
export function matchOrg(text: string, orgs: ReadonlyArray<{ id: string; name: string }>): string | null {
  const t = normalizeText(text);
  let best: { id: string; score: number } | null = null;
  for (const org of orgs) {
    const name = normalizeText(org.name);
    // Whole-name containment is the strongest signal.
    if (name.length >= 4 && t.includes(name)) {
      if (!best || name.length > best.score) best = { id: org.id, score: name.length };
      continue;
    }
    // Otherwise a distinctive word (>= 4 chars, not a generic stopword). Word
    // boundaries so "roja" doesn't match inside "arroja".
    for (const word of name.split(/[^a-z0-9]+/)) {
      if (word.length < 4 || STOPWORDS.has(word)) continue;
      if (new RegExp(`\\b${word}\\b`).test(t)) {
        if (!best || word.length > best.score) best = { id: org.id, score: word.length };
      }
    }
  }
  return best?.id ?? null;
}

const STOPWORDS = new Set([
  "grupo",
  "equipo",
  "comunidad",
  "iglesia",
  "fundacion",
  "asociacion",
  "voluntarios",
  "rescate",
  "ayuda",
  "centro",
]);

/** Build a form draft from free text. Every field is a suggestion; the form
 *  keeps its current value when the text yields nothing for that field. */
export function draftFromText(
  text: string,
  orgs: ReadonlyArray<{ id: string; name: string }> = [],
): DraftFields {
  const t = normalizeText(text);
  const category = needCategoryFromText(text);
  return {
    category,
    urgency: urgencyFromText(text, category),
    district: districtFromText(text),
    quantity: parseQuantity(t),
    unit: parseUnit(t),
    orgId: matchOrg(text, orgs),
  };
}
