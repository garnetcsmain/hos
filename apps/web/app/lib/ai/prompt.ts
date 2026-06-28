// Shared matching prompt + output contract used by every external provider, so
// providers are interchangeable and comparable. The model is asked for a strict
// JSON same-person assessment. Only matching-relevant, PII-minimized fields are
// included (no contact, no medical notes, no precise live location).

import type { PairInput } from "./types.ts";

export const MATCH_SYSTEM_PROMPT =
  "You are a humanitarian family-reunification assistant. You compare a MISSING-person report " +
  "(filed by a relative) with a FOUND-person report (filed by a responder) and judge the " +
  "probability they describe the SAME person. Be careful and conservative: in this context a " +
  "false positive can cause real harm. You ASSIST a human reviewer — you never confirm identity. " +
  'Respond with ONLY strict JSON: {"score": <number 0..1>, "rationale": "<one concise sentence>"}. ' +
  "score is your probability the two reports are the same person. No prose outside the JSON.";

function describeMissing(m: PairInput["missing"]): string {
  return [
    `name: ${m.fullName || "(unknown)"}`,
    `age: ${m.age ?? "(unknown)"}`,
    `sex: ${m.sex}`,
    `city: ${m.city || "(unknown)"}`,
    `last seen location: ${m.lastSeenLocation || "(unknown)"}`,
    `last seen date: ${m.lastSeenAt ?? "(unknown)"}`,
    `description: ${m.description || "(none)"}`,
  ].join("\n");
}

function describeFound(f: PairInput["found"]): string {
  return [
    `name: ${f.fullName || "(unidentified)"}`,
    `age: ${f.age ?? "(unknown)"}`,
    `sex: ${f.sex}`,
    `city: ${f.city || "(unknown)"}`,
    `found location: ${f.foundLocation || "(unknown)"}`,
    `found date: ${f.foundAt ?? "(unknown)"}`,
    `description: ${f.description || "(none)"}`,
  ].join("\n");
}

export function buildMatchUserPrompt(input: PairInput): string {
  return (
    `MISSING report:\n${describeMissing(input.missing)}\n\n` +
    `FOUND report:\n${describeFound(input.found)}\n\n` +
    `Are these the same person? Reply with strict JSON only.`
  );
}

/** Parse a model's text response into a 0..1 score + rationale, tolerating
 *  code fences or stray text around the JSON. Returns null if unparseable. */
export function parseMatchResponse(text: string): { score: number; rationale: string } | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { score?: unknown; rationale?: unknown };
    const raw = typeof parsed.score === "number" ? parsed.score : Number(parsed.score);
    if (!Number.isFinite(raw)) return null;
    const score = Math.min(1, Math.max(0, raw));
    const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
    return { score, rationale };
  } catch {
    return null;
  }
}
