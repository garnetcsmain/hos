# Principals Review: HOS-2026-011 (role and authorization model)

Reviewer: Principals (pure logic / first principles)
Date: 2026-07-01
Scope reviewed against verified code: `apps/web/app/lib/db/schema.pg.ts`, `schema.ts`, `supabase/migrations/20260701000000_hos_init.sql`, `apps/web/app/lib/http/auth.ts`, `apps/web/app/lib/auth/{allowlist,session,supabaseConfig}.ts`, `apps/web/app/lib/services/coordination.ts`, `apps/web/app/api/**/route.ts`, `tasks/backlog/HOS-2026-001-ai-matching/08-real-auth-and-roles.yaml`, `docs/decision-log/2026-06-28-HOS-002-mvp-architecture/` (Board D3).

## My Recommendation

**Do not add two new named roles. Reject the 4-way (coordinator / agency-admin / responder / remote-contributor) and 5-way (+ site-lead) taxonomies as premature.** The requirements as verified are satisfied by a **2-role + 2-attribute** model:

- **Two roles** on the account: `coordinator` (org-scoped administrator of one org — this is what "agency-admin" actually is) and `responder` (a member of one org who submits/acts within it). Both are **always bound to exactly one `org_id`**.
- **`platform_admin` is not a third role — it is a boolean flag** (`is_platform_admin`) on a coordinator account, granting cross-org visibility. It exists only if a real shared-instance deployment with a real platform operator exists; today it does not, so it is defined-but-dormant.
- **`remote` is a boolean attribute** (`is_remote` / `field` vs `remote`) on `responder`, NOT a separate role. It changes exactly one thing — whether action-scoped geofencing applies — and per HOS-2026-010-R1 geofencing is already ACTION-scoped, not role-scoped, so `remote` is a UI/consent hint, not an authorization primitive at all.
- **Org isolation MUST be DB/RLS-enforced (fail-closed), not app-layer filtering.** Anything less is inconsistent with this project's own Board-D3 precedent and with the auditability principle.

Naming note (verified hazard): `orgs.kind` **already** contains the literal value `"responder"` as an *organization* kind (`apps/web/app/lib/domain/coordination.ts:14`). Introducing `responder` as a *person-role* name creates a same-string collision across two dimensions (org-kind vs person-role). This is a real internal-consistency defect the proposal does not mention. Prefer naming the person-role `member` (or `contributor`) to keep the two axes orthogonal.

## Principles Alignment

- **AI recommends, people decide**: NEUTRAL — This decision is about human-to-human authorization, not AI action. It neither strengthens nor weakens the recommend/decide boundary. (One adjacency: the `verify` route is the human-decides gate; whatever role model ships must keep `verify` behind a real, attributable human identity — see auditability.)

- **Information before interfaces**: ALIGNED (for the minimal model) — The 2-role/2-attribute model puts the *correct* authorization information (who may see whose PII) into the DB layer where it is load-bearing, rather than into UI polish. VIOLATED by the maximal reading: a 4- or 5-way named taxonomy is *interface* elaboration (more role labels to render, assign, and explain) ahead of any verified need for the extra roles. The information that actually matters — "this row belongs to org X, this actor belongs to org X" — is a single `org_id` comparison, not four role names.

- **Trust & honesty layer**: VIOLATED by current state; the decision is the fix. Today `actor` is a free-text string written as `` `org:${org.name}` `` (`coordination.ts:58,88,111,145,173,179`) and `verifier_org` is caller-supplied (`verifications.ts`). Under one shared token any holder can self-attribute as any org — Contrarian F4 from Board D3 ("Auditability that records an attacker-supplied actor string is theater") is still literally true in the code. A role model that leaves attribution as a self-declared string would re-violate this principle. **ALIGNED only if** the account's real, server-resolved `org_id` (not a request-body field) becomes the source of the actor stamp.

- **Data minimization / least-PII**: ALIGNED (and this principle is decisive here). The whole point of org isolation is *least-PII by construction*: an agency-admin should be structurally unable to load another org's volunteers/cases. Least-PII is only honored if the boundary is enforced where the data is fetched (the DB), because "minimum exposure" that depends on the UI remembering to add a `WHERE org_id = ?` clause is not minimization — it is a hope. Adding roles beyond what the permission surface needs also violates minimization in the *schema* sense: don't model distinctions you can't yet justify. Two roles + two flags is the least structure that covers every verified action.

- **Auditability**: ALIGNED / conditionally. Every state change must be append-only and *attributable to a real identity* (`events` table, `actor` column). The role model serves this only if `actor` is derived from the authenticated account's server-side `org_id`+identity, making the audit log non-forgeable. If org isolation is app-layer only, an actor who bypasses the UI filter also produces audit rows that lie about scope — auditability and isolation stand or fall together on the same fail-closed mechanism.

- **Crisis-grade & reversible**: NEUTRAL-to-ALIGNED. A smaller role set is more reversible: promoting `member → coordinator` or flipping `is_platform_admin` is a column update; collapsing a wrongly-added top-level role after data references it is a migration. Occam favors the change that is cheapest to undo. RLS itself is crisis-grade (enforced regardless of which client/edge function connects, including future offline-sync workers).

## Logic Check

1. **Claim: agency-admin is a genuinely distinct role from coordinator.** Holds? **No — not as a distinct *role*.** Verified: today "coordinator" is defined by the code as *un-scoped full access* (`requireCoordinator` is binary; `auth.ts` has no org or role dimension). "Agency-admin" as described — "sees only their own org's data" — is not a different *kind* of actor; it is **coordinator with an org scope applied**. The real distinction is a single boolean axis (scoped-to-one-org vs cross-org), not two role identities. So the honest model is: the base role is org-scoped-admin (= "agency-admin's" behavior), and unscoped/cross-org is the *exception* gated by a flag. This inverts the proposal's framing but matches the verified reality that there is exactly one admin behavior in code today.

2. **Claim: remote/digital contributors need a new top-level role.** Holds? **No.** Verified: HOS-2026-010-R1 settled geofencing as **ACTION-scoped, not role-scoped** ("does this submission carry a location claim?"), *specifically because* HOS has no role primitive and role-scoping "would expand unbuilt work to serve a soft signal." A new `remote` top-level role would re-introduce exactly the role-scoping the addendum rejected. The only behavioral difference a remote contributor has (no geofencing) is *already* handled by action-scoping. Therefore `remote` carries **zero** authorization weight — it is at most a `field`/`remote` attribute for consent/UX copy. Elevating it to a role is logically unsupported by the very decision that created the requirement.

3. **Claim: org isolation could be UI-level filtering.** Holds? **No — inconsistent with the project's own precedent.** Board D3 established fail-closed as a first-principle for this codebase (5/5 reviewers; "unset token → 503, not open"). The governing logic there: for a low-resource team on a routine misconfiguration, the *default* must deny. App-layer filtering fails **open** on the two most likely real failures — a forgotten `WHERE org_id` clause in one new query, or a direct DB/edge path that skips the app layer entirely. RLS fails **closed**: absent a matching policy, the row is invisible. A project that flipped fail-*open* auth to fail-*closed* as its single most urgent D3 fix cannot consistently accept fail-open isolation for the *same* PII. The claim contradicts HOS's stated posture.

4. **Claim: there is a need for a site-level lead role between agency-admin and responder.** Holds? **Not demonstrated.** Verified: site management is 100% coordinator-gated today (`coordination/sites/route.ts`), and `sites.org_id` already binds each site to an org. No verified requirement, user story, or code path establishes a person who manages *one site* but not their *org*. This is speculative surface. Occam: do not add the role; if it ever materializes, `site_id` scoping is an attribute addable later without reshaping the role set. (See Technical Debt for the one thing to preserve now.)

5. **Claim (implicit in the proposal): the two gaps must be solved by *adding roles*.** Holds? **No — this is a false dichotomy.** The requirements are (a) org-scoped admin, (b) a place for remote contributors. Both are satisfiable by *scoping an existing role + one flag*, which is strictly simpler than new roles and strictly more consistent (fewer name collisions, less unbuilt surface). "Define the roles" does not entail "add roles."

## My Proposed Role Model

Justified per principle, grounded in the verified action surface (gated routes: `coordination/{sites,needs,offers,orgs}`, `matches` + `matches/[id]` + `matches/recompute`, `verify`, `family-reach`, `notifications`, `timeline`; open routes: `found`, `missing`, `search`, dashboards).

**Roles (two), every account bound to exactly one `org_id`:**

| Capability (verified action) | `member` (field or remote) | `coordinator` (org-scoped admin) | `+ is_platform_admin` flag |
|---|---|---|---|
| Submit found/missing report (`found`,`missing`) | yes (open today; would carry attribution once accounts exist) | yes | yes |
| Public search (`search`) | yes (stays account-free) | yes | yes |
| View coordination console / dashboards | own org only | own org only | all orgs |
| Create/update site, post/claim need, post offer (`coordination/*`) | no (or narrowly: post need/offer for own org, if a verified need arises) | own org only | all orgs |
| Verify a match (`verify`, `matches/[id]`) | no | own org's cases only | all orgs |
| Contact a family (`family-reach`, `notifications`) | no | own org's cases only | all orgs |
| Recompute matches (`matches/recompute`) | no | own org only | all orgs |
| Edit/retract a report (unbuilt, HOS-2026-010-R2) | no | own org, append-only/tombstone per R2 | all orgs |

- **`member`** — *Data-minimization*: the lowest-privilege participant; sees and touches only within their org. Has a `field` vs `remote` attribute that gates **nothing in authz** (geofencing is action-scoped per R1) and exists only for consent copy and UX.
- **`coordinator`** — *this is the role the proposal calls "agency-admin."* Org-scoped administrator: full case/coordination powers **within one `org_id`**. *Least-PII + auditability*: cannot load another org's rows (RLS), and every action stamps the audit `actor` from their server-resolved identity+org, not a request field.
- **`is_platform_admin`** (flag on a coordinator) — cross-org visibility for a genuine platform operator of a shared instance. *Crisis-grade/reversible*: a boolean, not a role, so granting/revoking cross-org reach is one auditable column change. **Dormant today** — no verified shared-instance operator exists — so it ships defined but unset, fail-closed (default false = no cross-org access), consistent with D3.

**Remote/digital contributor placement:** a **boolean attribute on `member`** (`is_remote`), not a role. It is the honest structural home because the only real difference (no geofencing) is already handled one layer down by action-scoping; giving it role status would model a distinction that carries no permissions — a minimization violation in the schema and a re-litigation of R1's rejected role-scoping.

**Org-isolation enforcement mechanism: Postgres Row-Level Security, fail-closed.**
- Every PII/coordination table already carries `org_id NOT NULL REFERENCES orgs(id)` (verified: `sites`, `needs`, `offers`; `missing_reports`/`match_candidates` reachable via their own `org` provenance and the `events.actor` stamp). The columns exist; **only the policies are missing** (grep confirms zero `CREATE POLICY` / `ENABLE ROW LEVEL SECURITY` in migrations).
- Enforce with `ENABLE ROW LEVEL SECURITY` + a `USING (org_id = current_setting('hos.org_id') OR current_setting('hos.platform_admin') = 'true')`-style policy keyed off the authenticated session's server-set org claim (Supabase `auth.jwt()` / a session GUC), never a client-supplied value.
- *Why RLS and not app-layer* (the decisive point): **auditability + data-minimization + Board-D3 fail-closed all require that the boundary hold even when the app layer is wrong or bypassed.** RLS denies by default; a forgotten `WHERE` clause or a direct edge-function query cannot leak. This is the single most principle-load-bearing choice in the decision.

## Simplest Solution

**Yes — there is a strictly simpler structure than adding two named roles, and it is the correct one.**

Minimum set that satisfies every *verified* requirement:

- **2 roles**: `member`, `coordinator` — both mandatorily `org_id`-bound.
- **2 booleans**: `is_platform_admin` (on coordinator; the cross-org exception), `is_remote` (on member; a consent/UX hint with no authz weight).
- **1 enforcement mechanism**: RLS keyed on the session's server-set `org_id`, default-deny.

Against the alternatives the proposal floats:
- **"agency-admin as a wholly distinct role" → collapse it.** It is `coordinator` with an org scope. The scope is the default; cross-org is the flagged exception. One admin behavior exists in code; model one.
- **"remote-contributor as a 4th role" → collapse it to a boolean.** R1 already moved its only real behavior (geofencing) to action-scope. A role with no permissions is dead schema.
- **"site-lead as a 5th role" → do not add.** No verified need; addable later as `site_id` scoping without touching the role set.

This is the Occam answer: **2 roles beat 4 or 5** because every additional role is (a) a name to collide (see the `orgs.kind = "responder"` collision), (b) unbuilt surface to maintain, and (c) a distinction the verified action list does not require. The 2-role/2-flag model covers 100% of the gated routes above with the fewest primitives.

## Technical Debt Created

- **The one thing the minimal model must preserve now (cheap, else expensive later):** the account's `org_id` must be a **real column on the account/identity record from day one**, and the audit `actor` must be derived from it server-side. This is the exact Expansionist/D3 lesson — org identity retrofitted after the corpus grows is "the retrofit that gets structurally harder every day." Keeping `is_platform_admin`/`is_remote` as columns (even if dormant/unused) is near-zero cost and avoids a later migration.
- **Deferred, acceptably:** `site_id`-level scoping (the "site-lead" case). Not-adding it is not debt; the debt would be *adding* a speculative role now. Flag only that RLS policies should be written so a future `site_id` predicate can `AND` in without restructuring.
- **Naming collision (must fix in this decision):** `orgs.kind` value `"responder"` vs a proposed `responder` person-role. If the person-role keeps that name, every future reader (and every RLS/authz predicate touching both axes) inherits an ambiguity. Rename the person-role to `member`. Cost: a naming choice, made now, free.
- **Attribution debt already on the books (this decision is the intended fix, not new debt):** free-text `actor`/`verifier_org`. The role model should close it; if the role model ships without wiring server-resolved identity into `actor`, the trust-layer violation persists and becomes *this* decision's debt.

## Confidence Score

**0.82.**

Why this high: the verified code is unambiguous on the load-bearing facts — exactly one binary admin role exists, no `role` column, no RLS, free-text `actor`, `org_id` already on every coordination table, and Board D3 is an explicit 5/5-reviewer fail-closed precedent. R1's action-scoping decision directly forecloses the "remote as a role" branch by its own reasoning. The minimal model follows from applying least-PII + auditability + fail-closed to those facts.

Why not higher: (1) I cannot see any *product* signal on whether a real shared-instance platform operator will exist — if HOS is always single-org-per-deployment, even `is_platform_admin` may be dead, pushing toward an even simpler model; conversely if federation is imminent the cross-org rules need more than a boolean. (2) The `missing_reports`/`match_candidates` isolation path is via provenance + `events.actor` rather than a first-class `org_id` on those specific tables in the slice I read — worth a schema confirm that *case* PII (not just coordination PII) has a clean RLS key. (3) Whether Supabase RLS + the app's `node:sqlite` dev backend can share one isolation model without divergence is an implementation risk I did not fully trace (dual-runtime schema is maintained in both `schema.ts` and `schema.pg.ts`; RLS is Postgres-only, so dev/test would enforce isolation differently — a real consistency seam).

## What I Don't Know

- Whether a genuine **platform-wide operator** (cross-org superuser) is a real HOS deployment shape or a hypothetical. Decisive for whether `is_platform_admin` ships at all. (Board D3 itself flagged "how many people share the coordinator token" as unknown — the same information gap persists.)
- Whether **case PII** (`missing_reports`, `match_candidates`, `verifications`) gets a first-class `org_id` for RLS, or stays isolated only via provenance strings — I confirmed `org_id` on `sites/needs/offers` but not that every PII-bearing case table has a clean RLS key.
- How RLS-based isolation (Postgres-only) reconciles with the **`node:sqlite` dev/test backend**, which has no RLS — i.e., whether isolation is testable in the dual-runtime harness or only in the Postgres path. This is where an app-layer *defense-in-depth* filter may still be warranted (belt-and-suspenders), even though RLS remains the fail-closed primary.
- The intended **write** surface for `member`/remote contributors beyond the currently-open `found`/`missing` intake — e.g., can a remote translator annotate a case? That defines whether `member` needs any gated write capability at all, which slightly affects the table above.
