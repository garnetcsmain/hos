# Self-signup + ownership-based site authorization (HOS-2026-011 made concrete)

**Status:** BUILT 2026-07-03 (backend + UI), per direct human direction.
**Model chosen by the human principal**, 2026-07-03:

> "I don't want to approve anyone except for a site coordinator that a volunteer
> will vet onsite before giving them the right to modify a specific site. If
> someone creates a site, that person becomes the responsable."

This is HOS-2026-011's *capabilities-on-scoped-resources* model made real at the
`site:<id>` scope, with **zero central approval** — the only approval is
peer-to-peer.

## The three tiers

| Tier | How you get it | What you can do |
|---|---|---|
| **Anonymous** | — | the public explainer only |
| **Contributor** | **self sign-up, email-verified, no approval** | add records (needs, offers, orgs, sites); manage sites you own or were delegated; see public aid points. **Cannot** read the needs board. |
| **Coordinator** | invite-only (`HOS_COORDINATOR_EMAILS`) — unchanged | the full board: precise need locations, contacts, mark-received, ops map |

## The hard security invariant (D1)

A self-signup contributor **cannot read the sensitive needs board.** Needs can
carry precise locations and contacts of people in danger; that is the
coordinator-only layer under the binding D1 answer
(`human_answer_D1.yaml`). Enforced in three places:

- `GET /api/coordination` (full board) stays `requireCoordinator`.
- Contributors read `GET /api/coordination/mine` → `contributorView`, which
  returns public **aid points** (sites are public by design) and which ones the
  caller may manage — and has **no `needs` field at all** (asserted by a test).
- Verified live: `/api/coordination/mine` returns `hasNeeds: false`.

## Authorization mechanics (app-layer, real enforcement)

- **Sign-up:** `supabase.auth.signUp` + email verification. Verification proves
  inbox ownership (a bot floor) — it is NOT human approval. `userFromSupabase`
  requires `email_confirmed_at`.
- **Two gates** (`http/auth.ts`): `requireUser` (any verified session — used by
  all CREATE endpoints and contributor reads) and `requireCoordinator`
  (verified + on the allowlist — the sensitive board and need transitions).
- **Ownership:** `sites.created_by_user_id` / `created_by_email`. Whoever
  creates a site is its responsable.
- **`canManageSite(site, actor)`** = coordinator ∨ creator ∨ an active grant on
  the actor's verified email. Enforced in `updateSiteCapacity`,
  `setSiteAnnouncement` (403 otherwise).
- **Peer delegation:** `site_grants (site_id, email, granted_by, created_at,
  expires_at)`. The responsable (or a coordinator) grants another person by
  EMAIL — what they enter after vetting them onsite; no admin user-id lookup
  needed. Revocable, optionally time-boxed. Only the owner/coordinator may
  grant (403 otherwise). Every grant/revoke is audited.

## What a contributor can and cannot write

- **Create:** needs, offers, orgs, sites — `requireUser`. (Opens public write;
  see abuse note.)
- **Modify a site** (capacity, status, announcement): only the responsable, a
  delegate, or a coordinator.
- **Need transitions** (claim / receive / cancel): coordinator-only for now — a
  site-responsable "receive" is a later refinement.

## Abuse posture (opening public write)

Opening create-access to any verified account raises spam/poisoning risk.
Mitigations today: email verification (bot floor), per-write rate limits,
non-forgeable `by` attribution, coordinators can close/cancel, and the
duplicate-location guard. The intake-gate design (HOS-2026-007-08) remains the
place for heavier public-submission classification/quarantine if abuse appears.
Reading sensitive data is NOT opened, so the worst case is noise on the board a
coordinator can clean up — not a data leak.

## Deferred / honest gaps

- **RLS:** authorization is app-layer (route/service checks) — real enforcement,
  not decorative. Postgres RLS as defense-in-depth is still the Phase 3 plan in
  `2026-07-03-auth-rls-phase1.md` (single pool role today).
- **Need-owner receive**, org-membership-based publishing (`org_memberships`
  already carries `expires_at`), and the case/PII org-partitioning (D4) remain
  future work.
- `?vista=colaborador` lets a coordinator preview the contributor surface
  (only ever downgrades what is shown — harmless).

## Files

- Gates: `lib/auth/session.ts`, `lib/http/auth.ts`.
- Ownership/authz/grants: `lib/services/coordination.ts`,
  `lib/repositories/coordination.ts`; schema `schema.ts` / `schema.pg.ts` /
  `supabase/migrations/20260703000000_*.sql`.
- Routes: `api/me`, `api/coordination/mine`, `api/coordination/sites/access`,
  and the create routes now on `requireUser`.
- UI: `signup/`, `components/CoordinationEntry.tsx`,
  `components/ContributorView.tsx`, login "Crear cuenta" link.
- Tests: `coordination.flow.test.ts` (ownership, forbidden-modify, peer
  grant/revoke, contributor-view-excludes-needs).
