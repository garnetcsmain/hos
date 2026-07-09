# HOS-2026-008 ship-now delivery log

Tracks concrete delivery of the Judge's `ships_now_no_external_dependency` pile
(judge_decision.yaml), which requires no credentials and no answer to the
escalated D1 adversary-classification question.

## 2026-07-06 — D4: close the live public search existence oracle (DONE)

**What was wrong.** `apps/web/app/lib/services/search.ts` built its match
haystack from each record's **full name + city + id** and returned a hit on any
substring. Because the query matched the full name (surname included), the
unauthenticated `/api/search` endpoint was a precise existence oracle: type a
person's full name and confirm that exact individual is in the system, along
with their city and case status. This is the D3 re-identification CRITICAL named
in HOS-2026-002 and re-flagged as HOS-2026-008-D4 — the single most
user-visible trust lever and, per the User review, the one control a frightened
family can actually feel.

**What shipped.** Public search is now a **case-number lookup, not a name
browser**, exactly as the D4 condition specifies ("require a case-number match
rather than open name browsing"):

- `searchPublic` no longer matches on name or city at all. It matches only when
  the normalized query equals a record's full case number (e.g. `MP-VE-A1B2C3`)
  or its 6-char random code (`A1B2C3`), case-insensitive and dash-insensitive.
- A minimum length equal to the 6-char code is enforced, so a partial prefix
  (`MP`, `VE`, `MP-VE`) cannot browse the registry.
- A bare name or city returns nothing. Only a caller who already holds the case
  number — the family who filed it, or was given it — can confirm a case, and
  even then sees only the least-PII projection (first name, age band, city,
  status).
- The plain-language promise the User review asked for is surfaced in both
  search UIs (`search.promise`, es + en): "Only someone who already has the case
  number can confirm this person is here. Searching by name or city no longer
  returns results."

**Verification.** 4 new hermetic tests (`search.test.ts`) pin the closed oracle
(full number, bare code, name/city miss, prefix/wrong-code miss). Full suite
92/92 pass; `npm run build:web` clean.

**What this does NOT close (honest scope).** The `/api/missing` and `/api/found`
GET listings still serve **first-name-only** least-PII projections (no surname)
to the public, so a coarse first-name+city browse surface remains. That is a
lesser surface than the full-name search oracle just closed, and its remedy is
the *enforced tiered visibility* half of D4 — written as acceptance criteria on
HOS-2026-001-08 and hard-blocked on a role primitive that does not exist yet
plus Postgres (BLK-001). Per the honesty principle in this decision, the search
narrowing is not labeled a full closure of public re-identification; it removes
the precise, surname-level oracle and leaves the coarse listing to the blocked
tiered-visibility work.

**Still open in the ship-now pile** (no creds / no political answer needed):
D3 event-log payload minimization + retention TTL; D2 written field-by-field
data-minimization classification; D4/D5 the tiered-visibility spec and
reachability plan as documents. These are separate deliverables and were not
mixed into this focused change.

**Next gate check (per judge_decision.yaml `next_gate`).** Confirmed: the oracle
no longer confirms presence by bare name (tests + build). The event-payload and
field-classification items remain for a subsequent focused change; Phase 0 did
not regress (92/92 tests, clean build).
