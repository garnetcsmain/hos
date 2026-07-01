// AI augmentation: for a set of candidates, ask every configured cloud-AI
// provider for an independent same-person signal, blend it with the
// deterministic baseline, and record the result + an audit event.
//
// This is additive and best-effort: with no providers configured it does
// nothing, and a provider failure never alters the baseline candidate. Every
// AI-influenced score change is logged to the event store (providers, models,
// scores) so the outcome is auditable and reproducible (AGENTS.md §5).

import { activeProviders } from "../ai/registry.ts";
import { blendScore } from "../ai/blend.ts";
import { scoreMatch } from "../matching/engine.ts";
import { getCandidate, upsertCandidate } from "../repositories/matches.ts";
import { getMissing } from "../repositories/missingReports.ts";
import { getFound } from "../repositories/foundReports.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { nowIso } from "../domain/time.ts";
import { scrubFreeText } from "../ai/redact.ts";
import type { PairInput } from "../ai/types.ts";
import type { FoundReport, MissingReport } from "@/app/lib/domain/types";

function toPairInput(missing: MissingReport, found: FoundReport): PairInput {
  // Only matching-relevant fields are sent to external models — never the
  // reporter contact or sensitive notes (separate fields, withheld here). The
  // free-text description is scrubbed of phone/email/handle patterns first,
  // because families often paste contact info into it (Board HOS-2026-002-D1).
  // A name written in prose still passes; enabling a provider in production also
  // requires a no-retention/no-train DPA (see the decision log).
  return {
    missing: {
      id: missing.id,
      fullName: missing.fullName,
      age: missing.age,
      sex: missing.sex,
      lastSeenLocation: missing.lastSeenLocation,
      city: missing.city,
      lastSeenAt: missing.lastSeenAt,
      description: scrubFreeText(missing.description),
    },
    found: {
      id: found.id,
      fullName: found.fullName,
      age: found.age,
      sex: found.sex,
      foundLocation: found.foundLocation,
      city: found.city,
      foundAt: found.foundAt,
      description: scrubFreeText(found.description),
    },
  };
}

/** Augment each candidate with configured AI providers. No-op when none are
 *  configured. Returns the number of candidates whose score was updated. */
export async function augmentCandidates(candidateIds: string[]): Promise<number> {
  const providers = activeProviders();
  if (providers.length === 0 || candidateIds.length === 0) return 0;

  let updated = 0;
  for (const id of candidateIds) {
    const candidate = await getCandidate(id);
    if (!candidate || candidate.status !== "pending") continue;
    const missing = await getMissing(candidate.missingId);
    const found = await getFound(candidate.foundId);
    if (!missing || !found) continue;

    const input = toPairInput(missing, found);
    const signals = await Promise.all(providers.map((provider) => provider.scorePair(input)));
    const usable = signals.filter((signal) => signal.ok);

    const baseline = scoreMatch(missing, found);
    const blended = blendScore(baseline.score, signals);

    await transaction(async () => {
      if (usable.length > 0) {
        await upsertCandidate({
          ...candidate,
          score: blended.score,
          factors: [...baseline.factors, ...blended.factors],
          updatedAt: nowIso(),
        });
      }
      await appendEvent({
        entityType: "match",
        entityId: candidate.id,
        type: usable.length > 0 ? "match.ai_augmented" : "match.ai_failed",
        actor: "system:ai",
        payload: {
          baseline: baseline.score,
          blended: blended.score,
          providers: signals.map((s) => ({ provider: s.provider, model: s.model, score: s.score, ok: s.ok })),
        },
      });
    });

    if (usable.length > 0) updated += 1;
  }
  return updated;
}
