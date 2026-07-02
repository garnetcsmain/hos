# Contrarian Review: HOS-2026-008

## My Recommendation
🟠 RESHAPE

Option B is the right direction, but as written it buys a *feeling* of protection against the named adversary without the mechanism that would actually deliver it. Option A is the genuine danger (it leaves the exposure the human principal personally named). The reshape is about making Option B's controls real rather than theatrical, and about pulling the parts that need nothing external out from behind the parts that are blocked.

## Fatal Flaws Found

### Flaw 1: Field-level encryption is theater if the key lives where the ciphertext lives
**Severity:** 🔴 CRITICAL

**What breaks:** Option B commits to "field-level encryption for the most sensitive fields." Today there is *zero* application encryption — the only `node:crypto` uses are `randomUUID` for ids (`apps/web/app/lib/domain/ids.ts:5`) and `timingSafeEqual` for token comparison (`apps/web/app/lib/http/auth.ts:15`). `sensitive_notes`, `reporter_contact`, and the precise `found_location`/`last_seen_location` columns are stored plaintext (`apps/web/app/lib/db/schema.ts:26,29,44,51`). The documented production backend is Supabase-hosted Postgres (`.env.example` `DATABASE_URL` example points at `pooler.supabase.com`). The named adversary in this proposal is a *state actor via legal compulsion of the host*. If we encrypt those fields but keep the decryption key in the same Vercel env the app already reads, or in the same Supabase project, then legal process against the host — or a host compromise, or an insider with prod env access — reaches the key and the ciphertext together. That is not a control against the stated adversary; it only defeats a raw stolen-DB-dump.

**Why it's real:** Cloud providers' own transparency reports confirm compelled disclosure includes anything the provider can decrypt on the customer's behalf. Encryption only raises the bar against legal compulsion when key custody is genuinely separated from ciphertext custody (client-held key, or a KMS in a different legal jurisdiction/control domain than the DB host).

**Impact:** We would tell the human principal "sensitive fields are encrypted against the government" while the government's most likely access path — compel the host — still works. That is a dishonest control, and dishonesty about a safety control is worse than no control, because people disclose *more* believing they are protected.

**Could we fix it?** YES — but it must be a hard condition: specify key custody explicitly (who holds the key, in what control domain, and does host compulsion reach it) before any encryption is called a state-adversary control. If we can't separate custody in this build context, then say honestly that encryption defeats leaks/dumps but not compulsion, and lean on *minimization* (don't collect the field at all) as the real state-adversary control.

### Flaw 2: The asset is the event log, and Option B under-scopes it
**Severity:** 🔴 CRITICAL

**What breaks:** The proposal treats the sensitive *report fields* as the thing to protect. But the highest-value correlation asset is the append-only `events` table (`apps/web/app/lib/db/schema.ts:145-154`): every row carries `actor`, `entity_id`, `occurred_at`, and a free-text `payload`. Family-reach events write `actor: coordinator:<org>`, the `missingId`, and human-entered contact notes (`apps/web/app/lib/services/familyReach.ts:96-104,129-135`); verifications tie a coordinator org to a match/missing/found id at a timestamp (`verification.ts:85-135`). `eventsForEntities` (`events.ts:47-54`) exists specifically to join a family's whole timeline. That is a ready-made "who contacted which family, when, at which org" graph. Encrypting `reporter_contact` on the reports table does nothing for it — it's a different table, still plaintext, and by the Auditability principle it is *designed* to be permanent.

**Why it's real:** This is the exact TraceTogether failure mode (a purpose-limited log repurposed under state pressure) that this project already cited in HOS-2026-012-D4. The log is our trust mechanism and our biggest liability in the same object.

**Impact:** A breach or compulsion of the event store re-identifies not just victims but the *volunteers and coordinators* who helped them — precisely the Operación Tun Tun targeting pattern, against our own responders.

**Could we fix it?** YES — the audit-log retention/redaction policy the proposal lists as in-scope must be treated as the *primary* deliverable, not a secondary one: minimize what goes into `payload` (no free-text contact detail in events), set a retention TTL for the highest-signal event types, and decide who may query the log. This needs no external dependency and should ship regardless of the political answer.

### Flaw 3: The live re-identification oracle is out of scope but shouldn't be
**Severity:** 🟠 HIGH

**What breaks:** `apps/web/app/api/search/route.ts` is unauthenticated (rate-limited only) and answers name+city queries with `givenName`, `city`, and `status` (`apps/web/app/lib/services/search.ts:18-37`). That is a working existence-and-status oracle: anyone — including the adversary — can type a name and confirm the person is in the system and whether they've been found. This is the D3 re-identification CRITICAL, already flagged three times. This proposal names D3 as its reason to exist, then scopes its concrete reachability work around *site-blocking* while leaving the actual live oracle as someone else's ticket.

**Why it's real:** It's shipping today. No decision is needed to know it's exposed; the code is in `main`.

**Impact:** If the answer to the core question is "yes, state in scope," this endpoint is the single most direct contradiction of that answer currently running.

**Could we fix it?** YES, cheaply, and it needs nothing external — gate or coarsen the search response (require a case-number match rather than open name browsing, or move it behind the coordinator gate) as part of *this* posture, not a later one.

### Flaw 4: Tiered visibility is written as an in-flight condition but is two blockers deep
**Severity:** 🟡 MEDIUM

**What breaks:** Option B formalizes tiered visibility as "HOS-2026-001-08's acceptance criteria." But 001-08 is `in_progress` only nominally — its org-isolation half is hard-blocked on Postgres (BLK-001), which is blocked on a human providing `DATABASE_URL`. And there is *no role primitive at all today* — the gate is binary coordinator-vs-public (`requireCoordinator`, `auth.ts:66-79`), no refugee/volunteer/coordinator tier exists. Writing tiered visibility as an acceptance criterion is correct and cheap *as a spec*, but calling it in-flight overstates how reachable it is.

**Impact:** The condition looks scheduled when it is actually gated behind two external unblocks. If we don't say so, the gate "still open" reappears next review — exactly the pattern this proposal was written to end.

**Could we fix it?** YES — state the dependency chain explicitly and separate "spec the tiers now" (free) from "enforce them" (needs Postgres + role model).

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|---|---|---|
| "Field-level encryption protects against the state adversary" | 30% | False security; host compulsion still reaches co-located keys (Flaw 1) |
| "Protecting report fields covers the exposure" | 25% | The event log — the real correlation asset — stays plaintext and permanent (Flaw 2) |
| "The heavy risk is site-blocking (reachability)" | 50% | The live search oracle is a bigger, already-shipping exposure (Flaw 3) |
| "Tiered visibility is in-flight via 001-08" | 40% | It's blocked two deep (Postgres + no role primitive); gate stays open (Flaw 4) |
| "A single shared coordinator token is an acceptable interim" | 45% | One token leak = full read of all PII with no per-identity revocation |

## Edge Cases We Haven't Addressed
1. Coerced/leaked coordinator token → full-database read, no way to revoke one holder (shared token, `auth.ts:41-45`).
2. Supabase backups/read-replicas/support staff → compulsion or leak of a copy the app never sees.
3. Insider with prod env access → holds both the DB and any co-located key.
4. Region of the Supabase project unknown → which jurisdiction's legal process even applies is undecided.

## Questions for the Proposer
1. Where does the encryption key live, and does legal compulsion of the host reach it? If yes, stop calling encryption a state-adversary control and lean on non-collection.
2. What is the retention/redaction plan for the `events` payload, specifically the family-reach contact notes?
3. Why is the live public search oracle out of scope when it's the most direct contradiction of a "state in scope" answer?

## What Would Change My Mind
- A key-custody design that survives host compulsion (or an honest re-labeling of encryption as leak-only + a minimization-first commitment).
- The audit-log retention/redaction policy elevated to a primary, ship-now deliverable.
- The public search oracle pulled into scope and closed here.

…then I'd move from RESHAPE to PROCEED WITH CONDITIONS.

## Confidence Score
**0.8** — I'm 80% confident. Why not higher: I can't see the intended key-custody design (it isn't specified), and the legal question of whether a US-hosted Supabase project is compellable by Venezuela is genuinely outside my competence.

## Final Note
The good news is that the two things that actually defend the named population — minimize what we collect, and don't keep a permanent free-text who-helped-whom log — need no keys, no infra, and no political answer. Do those now; escalate the rest honestly.
