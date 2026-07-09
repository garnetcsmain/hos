# AI intake gate for public coordination reports (HOS-2026-007-08)

**Status:** DESIGN — implementation stays gated until public intake opens.
**Gate inputs now satisfied:** HOS-2026-008-D1 answered 2026-07-03 (latent
adversary — see `docs/decision-log/2026-07-01-HOS-008-threat-model-operating-posture/human_answer_D1.yaml`).
**Gate inputs still open:** real per-user auth (HOS-2026-001-08); a decision to
actually open a public submission form.

## The problem, from observed data

caracasayuda.com shows exactly what happens without an intake gate. Verified
against the live source (2026-07-03):

- The `categoria` field is unreliable: most reports tagged `comida`/`agua` are
  trapped-people rescue reports (~61% of the active corridor needs classify as
  rescue from their text).
- Map pins routinely contradict the text: rescue reports for Caracas pinned in
  Porlamar or abroad; the 2026-07-01 import relocated 111 needs and 11 sites
  on text evidence.
- Person-reports (names + phone numbers of missing/trapped people) sit mixed
  into a logistics board where nobody works reunification.

Human direction (2026-07-02): person-in-danger / missing-person reports may
come from ANYWHERE (reunification already accepts that); logistics/supply
reports must NOT pollute coordination geography.

## Placement

One gate at the intake boundary, BEFORE anything reaches a board:

```
public submission ──► intake gate ──► one of:
                                       A. reunification intake (person-report)
                                       B. coordination board (supply need / aid point)
                                       C. human review queue (unresolvable)
```

Internal coordinator writes (the current console) do NOT pass through the
gate — coordinators are trusted, gated by auth, and already attributed.

## Pipeline (per submission)

1. **Deterministic classification first** — reuse the proven, tested seam from
   the nightly sync (`apps/web/app/lib/coordination/classify.ts`):
   `needCategoryFromText`, `urgencyFromText`, `siteCategoryFromSource`,
   `locateNeed` (text-first locality; pin only kept when it agrees).
2. **Kind decision:**
   - Text names a person being sought / trapped with identity ("buscan a X",
     names + relationship, "dio señales de vida") → **person-report** →
     route to reunification intake (missing/found report draft), from ANY
     location — no corridor restriction.
   - Text describes supplies/logistics → **need** → corridor-grounded via
     `locateNeed`; locality from TEXT, never the pin alone.
   - Text describes a standing aid point (acopio/refugio/…) → **site**.
   - Text describes a PROTECTION incident (child alone, sexual violence,
     police/state abuse, trafficking) → **protection** → RESTRICTED
     quarantine visible only to the protection capability (HOS-2026-016),
     never the board, never any public surface, and — pending the
     HOS-2026-016-D4 human/legal answer — stored as type + district +
     referral pointer only, no narrative retention.
3. **AI assist, pluggable and optional** (same seam as HOS-2026-001 matching):
   when an AI key is configured, a model may (a) refine rule-classifier output,
   (b) extract locality strings the district matcher missed, (c) split mixed
   submissions ("mi tía está atrapada Y necesitamos agua" → person-report +
   need). With no key configured the rules run alone — the gate NEVER depends
   on an external AI to function (fail-open to rules, never fail-closed on
   intake).
4. **Quarantine, not silent drop:** anything unresolvable (no kind, no
   locality for a need, contradictory signals, suspected spam/flooding) goes
   to a human review queue with the classifier's reasons attached. Nothing
   unclassifiable ever lands on the live board, and nothing is deleted.

## Honesty & audit conditions (inherit HOS-2026-007 board conditions)

- Every gate decision appends an event: `intake.classified` /
  `intake.routed` / `intake.quarantined` with the rule/AI reasons and a
  content hash — the audit trail explains every record's provenance.
- AI output is advisory input to a deterministic decision — the event records
  which rules fired and whether AI changed the outcome (same "advisory only"
  posture as offer matching).
- Person-report PII goes ONLY to reunification storage (which carries the
  HOS-2026-008-D2 minimization obligations); the coordination board never
  stores names/phones of people in danger beyond the free-text the source
  already publishes.
- Public submitters get an honest receipt: "recibido y en revisión" vs
  "publicado" — never a fake "help is coming".

## Abuse posture (latent adversary, D1)

- Rate-limit by IP + device hint at the route (reuse `enforceRateLimit`).
- Flood detection: if quarantine volume spikes, the gate flips to
  queue-everything (board freeze) rather than letting a flood write to the
  live board — a coordinator unfreezes after review.
- No public reads of the raw queue; quarantine review is coordinator-only.

## Capability linkage (HOS-2026-011)

- Reviewing the quarantine queue = capability `intake.review` at org or
  global scope — a bundle entry, not a new role.
- Site-liveness confirmations from the public ("sigue operativo") map to the
  existing `site.capacity_updated` path but arrive as intake events needing
  the same review capability until real auth lands.

## Build order (when the gate opens)

1. `intake` table + review queue UI on the console (reuses Panel/list parts).
2. Route `POST /api/intake` (public, rate-limited) → classifier → router.
3. AI refinement behind the pluggable seam (env-keyed, optional).
4. Reunification hand-off (draft missing/found reports from person-reports).

No schema or code in this design blocks Phase 0; steps 1–2 are a thin slice
that can ship the week public intake is approved.
