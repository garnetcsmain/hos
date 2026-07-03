# Closing the auth/RLS gap — Phase 1 shipped, honest scope for the rest

**Context:** HOS-2026-011 (capabilities-on-scoped-resources) found that all 12
privileged coordination routes were gated only by `requireCoordinator`, no
route checked row ownership, and event actors were hardcoded strings. Human
direction 2026-07-03: "complete the auth/RLS gap." This document records what
is now closed, what is designed-but-not-enforced, and what remains blocked —
per the trust-and-honesty principle, nothing below claims a protection it
does not deliver.

## Phase 1 — SHIPPED (this change)

1. **Identity is no longer thrown away.** `requireCoordinator` returns a
   `CoordinatorIdentity` (`via: supabase|token|dev-open`, plus email/userId on
   the Supabase path). All coordination write routes thread `actorTag(identity)`
   into the service layer.
2. **Forensic event attribution.** Every coordination event payload now
   carries `by`: `coordinator:<email>` for a signed-in coordinator, honestly
   `coordinator:token` / `coordinator:dev-open` when the caller was only
   authenticated, not identified. This closes the HOS-2026-007 gate
   re-review's MET_WITH_WATCH item to the extent possible before real
   per-user auth: with Supabase auth active in prod, every write is now
   traceable to a person.
3. **`org_memberships` table provisioned** (sqlite + pg + supabase migration):
   `(user_id, org_id, capability_bundle, created_at)` — the user↔org↔bundle
   join HOS-2026-011-D3 requires. UNUSED by any code path yet, by design: a
   membership check that nothing populates would be a fake control. It exists
   now so activating org-scoped authorization is a data + policy change, not
   a schema retrofit.

## Phase 2 — DESIGNED, blocked on activation decisions

- **App-layer org ownership checks** on coordination writes (need transition
  only by requesting/claiming org's members, site capacity only by owning
  org's members). Blocked on: memberships actually being populated, which
  needs real per-user auth as the norm (HOS-2026-001-08) and an org admin
  flow. Enforcing before that would lock out today's single shared
  coordinator team.
- **Org claim in the JWT** must live in `raw_app_meta_data` (server-set), NEVER
  `user_metadata` (user-writable → silent fail-open). Recorded here so it
  cannot be "discovered" during implementation.

## Phase 3 — RLS, honestly stated

**RLS policies would not bite today**, and we will not ship decorative ones:

- The app connects through one `pg` Pool as a single role
  (`DATABASE_URL`); no per-request user context reaches Postgres.
- That role owns the tables; a table owner bypasses RLS unless
  `FORCE ROW LEVEL SECURITY`, which would then apply one policy to ALL
  queries indiscriminately — either a no-op or an outage, never isolation.

For RLS to be a real control, one of:
1. **Per-request context**: `SET LOCAL hos.user_id = $1` inside a transaction
   + policies keyed on `current_setting('hos.user_id')`, with the pool role
   made non-owner and non-bypass. Compatible with the current architecture;
   the repository layer already funnels through one client.
2. **Supabase-native**: per-user JWT connections (PostgREST-style). A larger
   re-architecture; not justified while the app layer is the only caller.

Option 1 is the chosen design. It ships together with Phase 2 (it needs the
same populated memberships), sequenced behind HOS-2026-001-08.

## Still blocked on a human policy decision (unchanged)

**HOS-2026-011-D4:** case/PII tables (`missing_reports`, `found_reports`,
`verifications`) have NO `org_id`. Whether reunification case data is a
deliberately shared cross-org pool or must be org-partitioned is a mission
decision, not an engineering one. Until answered, "agency-admin sees only
their org's PII" is unbuildable on the most sensitive data. (4 reviews have
now named it; it did NOT get answered by the 2026-07-03 D1 answer, which
covered the state-adversary question only.)

## What a reviewer should check

- `apps/web/app/lib/http/auth.ts` — `CoordinatorIdentity`, `actorTag`.
- `apps/web/app/api/coordination/*/route.ts` — identity threading.
- `apps/web/app/lib/services/coordination.ts` — `by` in every event payload.
- `org_memberships` in `schema.ts`, `schema.pg.ts`,
  `supabase/migrations/20260703000000_coordination_sync_and_memberships.sql`.
