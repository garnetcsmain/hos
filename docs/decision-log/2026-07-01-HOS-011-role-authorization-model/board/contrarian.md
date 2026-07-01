# Contrarian Review: HOS-2026-011 (role and authorization model)

## My Recommendation

**RESHAPE — proceed, but not as a four-role taxonomy.** The proposal is asking
the wrong first question. It frames the job as "define agency-admin and slot in
remote contributors," which quietly assumes both are *roles*. My finding after
reading the code: HOS has exactly one authorization primitive today
(`requireCoordinator`, all-or-nothing, 12 routes), and the single most dangerous
thing this board can do is bless a role taxonomy that grants standing *write*
privileges — especially org-scoped ones — on top of a data model that has **no
enforced ownership on any row a coordinator can write**. Define authorization as
**capabilities scoped to actions and resource-ownership**, decided server-side,
with roles as nothing more than named bundles of capabilities. Adopt `agency-admin`
only as an org-scoped capability set *after* org isolation is RLS-enforced (it is
not today, and cannot be faked at the UI layer for a targeting-relevant threat
model). Do **not** make remote/digital contributor a role at all — the board
already ruled against exactly this move six hours ago and you are about to
contradict your own settled precedent.

## Fatal Flaws Found

### Flaw 1: You are re-litigating HOS-2026-010-R1-D2, which explicitly rejected role-scoping — and losing the reason it was rejected
**Severity:** HIGH
**What breaks:** HOS-2026-010-R1-D2 (judge-decided today, confidence 0.85, *no
dissent across all three reviewers including the prior Contrarian*) already
confronted "where do remote contributors fit" and ruled: **scope security-relevant
decisions to the action/submission, not to a self-declared account role.** Its
verbatim rationale, verified in
`docs/decision-log/2026-07-01-HOS-010-volunteer-identity-geofencing/addendum-r1-judge-decision.yaml:65-105`:
a self-declared, unverified role used to grant a security-relevant exemption is a
"trust-and-honesty and auditability problem the action form doesn't have," and
"a coordinator cannot distinguish a genuinely remote contributor from a field
volunteer who falsely declared 'remote' to dodge the check." This proposal's
open question #2 ("new top-level role, a flag on responder, or something else?")
walks straight back into the role-scoping frame the board *just* closed by
construction. If HOS-2026-011 answers "remote contributor is a top-level role,"
it silently overturns R1-D2 without saying so.
**Why it's real:** The word "responder" in the planned taxonomy
(`08-real-auth-and-roles.yaml:25`) is a landmine. In the *actual shipped code*,
`responder` is not a person-role — it is an **OrgKind** (`shelter | responder |
ngo | government | hospital | other`, `apps/web/app/lib/domain/coordination.ts:13-19`)
and a data-provenance string on found-reports (`source: "responder"`,
`services/intake.ts:90`). The taxonomy reuses a token that already means
"a responding *organization*" to mean "an individual field volunteer." Anyone
implementing this will conflate the two.
**Impact:** The board ships a role model that contradicts a decision from the same
day, and the schema grows a `role='responder'` column that collides semantically
with the live `orgs.kind='responder'` value. Downstream: a query or RLS policy
written against "responder" is now ambiguous about whether it means the org or the
person, which is exactly the class of authorization bug that leaks PII.
**Could we fix it?** YES, at proposal-authoring cost (hours). Reconcile with
R1-D2 explicitly: authorization = capabilities on actions/resources; "remote
contributor" is a *contribution mode* (no location claim, no geofence), not a
role, precisely as R1-D2 already decided. Rename the field-volunteer role to
something that does not collide with `OrgKind` (`field-volunteer`, not `responder`).

### Flaw 2: agency-admin as a standing org-scoped *write* role is unsafe on the current data model — there is no enforced row ownership to scope it to
**Severity:** CRITICAL
**What breaks:** The whole point of `agency-admin` (open question #1) is "manage
my own org's stuff without full coordinator power." But I verified the
coordination write paths and **none of them enforce org ownership**. In
`apps/web/app/api/coordination/needs/route.ts` the only gate is
`requireCoordinator` (lines 13, 27) — there is no check that the caller's org owns
the need being mutated. The domain model *documents* an ownership rule — "received
may only be recorded by the requesting site, never optimistically by the claimer"
(`coordination.ts:60-63`) — but that is a **comment, not a constraint**. `orgId`,
`claimedByOrgId`, and `siteId` are columns
(`schema.pg.ts:115,122,127,135`) with *no* linkage to the acting user: there is no
`org_members` table, no `org_id` on any coordinator/user record, no `role` column
anywhere. I grepped the entire `apps/web/app/lib` tree — `agency_admin`,
`org_members`, `membership`, `user_org` return **zero** hits outside the LLM
prompt strings.
**Why it's real:** Today the blast radius is bounded because there is exactly one
trust level (coordinator) and the deployment is invite-only allowlist — everyone
who can write is already fully trusted. The *moment* you introduce agency-admin as
a lower-trust, org-scoped writer, you have created a principal who is *supposed* to
be confined to their org but whom the code **cannot confine**, because ownership is
enforced nowhere.
**Impact — concrete failure walk-through:** Org A ("Fundación Norte") gets an
`agency-admin`, Ana. Org B ("Refugio Sur") runs a shelter with 4 free beds and an
open need for infant formula. Because `needs`/`sites`/`offers` writes check only
`requireCoordinator` and Ana holds a valid session, Ana can: (a) mark Refugio Sur's
formula need as `received` when it wasn't — the "honest lifecycle" now *lies*, and
a family is told supplies arrived that didn't (this is precisely the D4 harm the
board already flagged as the trust-layer's cardinal sin); (b) edit Refugio Sur's
site `beds_free` to 0 and status to `closed`, steering displaced people away from a
real shelter; (c) read Refugio Sur's `notes` field, which in a targeting threat
model may describe *who* is sheltered where. None of this is a role misuse — it is
the code working as written, because "agency-admin is org-scoped" was a *claim in a
yaml*, not an enforced boundary. Ana didn't even have to be malicious; a
copy-pasted org_id in a form does the same damage.
**Could we fix it?** YES but it is real work and it **blocks** this role: you must
(1) add `org_members(user_id, org_id, capabilities)`, (2) put `org_id` on the
acting identity, (3) add ownership predicates to every coordination write, and
(4) enforce it at the DB with RLS (see Flaw 3), not just in route handlers.
HOS-2026-001-08's own acceptance criterion "a user can only see their org's PII"
is already marked TODO/blocked-on-Postgres — agency-admin cannot ship before that
lands, and the proposal should say so in blocking language, not as an open question.

### Flaw 3: "UI-level filter vs RLS" is presented as an open question — but the project's own fail-closed precedent (D3) already answers it, and getting this wrong is the whole ballgame
**Severity:** CRITICAL
**What breaks:** Open question #4 asks whether org isolation is "a hard DB/RLS-
enforced boundary or a UI-level filter a determined actor could bypass." Framing
this as open is itself the flaw. HOS-2026-002-D3 (`judge-decision.yaml:28-37`)
established fail-closed as non-negotiable for exactly this project — the rationale
names *"volunteers on a borrowed VPS, no DevOps"* as the operators and *targeted-
violence adversaries* as an in-scope threat (still-open board question at
`judge-decision.yaml:53`). A UI-level org filter is a fail-*open* boundary the
instant anyone hits the API directly with `curl` and a valid session.
**Why it's real:** Supabase auth issues a JWT the browser holds; the API is the
same one `curl` can call. If isolation lives in React (hide other orgs' rows in the
console), a determined actor with a legitimate low-trust agency-admin login reads
every org's data by calling `/api/coordination/sites` directly — the server returns
everything because the *server* never filtered. This is not hypothetical: the
current `requireCoordinator` returns all rows to any authenticated coordinator by
design; adding a *lower-trust* role without moving the boundary to the DB converts
"trusted coordinator sees all" into "semi-trusted agency-admin sees all," which is
strictly worse.
**Impact:** In a targeting threat model, "an org-scoped account can enumerate every
shelter's district + occupancy + notes across all participating NGOs" is a
person-safety failure, not a bug ticket. It hands an adversary who compromises or
socially-engineers *one* small partner org a map of the entire displaced-population
response.
**Could we fix it?** YES — mandate Postgres RLS as the isolation boundary (row
visibility keyed on the JWT's org claim), UI filtering as convenience only. But
this makes org isolation *hard-blocked on HOS-2026-001-07 (Postgres)*, which the
proposal must state as a dependency, not discover later. The board should convert
open question #4 into a **finding**: RLS-enforced, per D3; anything less is rejected.

### Flaw 4: The missing "in-between" role is not optional polish — folding site-lead into agency-admin recreates Flaw 2 one level down
**Severity:** MEDIUM
**What breaks:** Open question #5 (a shelter/site-level lead between org-admin and
field volunteer) is treated as a nice-to-have. But the data model *already* has the
seam: `needs.site_id` and `sites` are first-class, and the honesty rule
(`coordination.ts:60-63`) is written at **site** granularity ("the requesting
*site*"), not org granularity. If you define agency-admin as "can write anything
for my org" and stop there, then in a multi-site org, the admin of a 6-shelter NGO
can mark *any* of its sites' needs received — the same "received wasn't received"
lie as Flaw 2, just intra-org. The domain model's own ownership rule is
site-scoped, so an org-only permission model cannot express it faithfully.
**Why it's real:** The granularity mismatch is in the schema right now: ownership
that matters (`received` may only be set by the requesting site) is a *site* fact,
but the proposed role boundary is *org*. A role model that can't represent the
constraint the domain already documents will either under-enforce (admin overreaches
across sites) or the constraint stays a dead comment forever.
**Impact:** Either the site-lead capability exists and the "received" honesty rule
becomes enforceable, or it doesn't and the rule remains decorative. Given the board
has twice treated "don't record something that didn't happen" as sacred (D4, and
the R1-D1 boolean-only audit condition), leaving it decorative is a values
regression.
**Could we fix it?** YES — model capabilities as *(action, resource-scope)* pairs
where scope can be `site:<id>` or `org:<id>`, and let "site-lead" be a bundle scoped
to one site. Then agency-admin is not "god of my org" but "org-scope bundle," and
site-lead is "site-scope bundle" — same machinery, correct granularity. No separate
role taxonomy needed.

### Flaw 5: No account-lifecycle / deprovisioning story — the failure mode that actually happens in volunteer orgs
**Severity:** MEDIUM
**What breaks:** The proposal enumerates *permissions* per role but says nothing
about *revocation, expiry, or org-membership change*. Volunteer response is
high-churn: people rotate out weekly (the R1 addendum's shared-shelter-device
lifecycle discussion confirms this reality). The current model has no per-user
revocation finer than editing `HOS_COORDINATOR_EMAILS` and redeploying — verified
in `allowlist.ts` (the gate is a static env-var list;
`08-real-auth-and-roles.yaml:49` confirms it lives in Vercel env).
**Why it's real:** An agency-admin who leaves Org A, or whose org is removed from
the coalition, must lose access *immediately* — but a JWT-org-claim design happily
honors a stale token until expiry (the same ~1h token-refresh window the console
already had to work around, per the R1 standup in `08-...yaml:52`). Without an
explicit "membership is checked live, not just embedded in the token" rule, a
deprovisioned org-admin retains org-scoped write access for the token's lifetime.
**Impact:** A removed partner (e.g. one expelled *for* a data-handling incident)
keeps writing to and reading from the coordination console for up to an hour after
removal — the worst possible hour.
**Could we fix it?** YES — require that authorization checks resolve org membership
from the DB per-request (not solely from JWT claims), and define a revocation path
that takes effect without redeploy. This should be an explicit condition on any
role that can write.

## My Proposed Role Model

**Reframe: don't ship "roles." Ship capabilities. Roles are named bundles.**
A capability is `(action, scope)`. `scope ∈ {global, org:<id>, site:<id>, self}`.
Every privileged route resolves the caller's capabilities **server-side** and, for
org/site scopes, checks them against the target row's `org_id`/`site_id` **and RLS
enforces the same at the DB**. This directly satisfies R1-D2 (decide server-side
from the action, never a client-supplied role flag) and D3 (fail-closed, DB-enforced).

**coordinator** — `global` scope. Cross-org: full PII, match verify/recompute,
family-reach, all sites/needs/offers, timeline/audit. Exactly today's
`requireCoordinator` surface. The break-glass/oversight role. Small, allowlisted,
human-signed-off. *Distinct from agency-admin on the cross-org axis.*

**agency-admin** — `org:<id>` scope. Concretely can, **for its own org only**:
create/update/close its sites; create/update/cancel its needs and offers; claim
other orgs' needs (cross-org *write on a shared workflow field* is inherent to the
need lifecycle, so this is an explicit, narrow exception, logged); manage its own
org's site-leads/field-volunteers (invite/revoke within the org). **Cannot**:
see or verify reunification matches, read another org's site notes/needs, touch
missing/found PII, act cross-org except claiming. **Blocked** until org isolation is
RLS-enforced (HOS-2026-001-07). Its distinctness from coordinator is the org
boundary; its distinctness from a bare coordinator-clone is that it *cannot* see the
PII-heavy reunification surface at all.

**site-lead** — `site:<id>` scope. Manage one site's capacity (`beds_free`,
status), and its needs — including the site-owned `received` transition the domain
model reserves to "the requesting site." This is the role that makes the honesty
rule enforceable instead of decorative. Adopt it; do not fold it into agency-admin
(Flaw 4).

**field-volunteer** (rename of the taxonomy's misnamed "responder") — `self`
scope. Submit found/sighted reports; view/update their own submissions. Geofencing
is **action-scoped** per R1-D2 (a found-at-shelter report carries a location claim;
the volunteer's *role* is not the trigger). Note the found-intake path is currently
account-optional (`api/found/route.ts` has no gate; `api/missing/route.ts` is
explicitly public); this role formalizes *attribution* for volunteers who do have
device-key+PIN identity from HOS-2026-010, it does not newly gate public intake.

**remote/digital contributor — NOT a role.** Per HOS-2026-010-R1-D2, "remote" is a
**contribution mode**, not an account type: it means "this actor's actions carry no
physical-presence claim, so no geofence applies." A translator is a
`field-volunteer`-equivalent (or a coordinator-invited helper) whose *submissions*
happen to be non-location-asserting. Encoding "remote" as a role would (a) contradict
R1-D2, (b) create the self-declared-exemption bypass the board already rejected, and
(c) demand the schema carry a role that the geofence logic is explicitly told
*not* to read (it reads the action, not the role). **Schema impact of getting this
right:** you need `org_members(user_id, org_id, capabilities_json)` and capability
resolution; you do **not** need a `remote` enum value anywhere. That is the answer
to open question #2's "does it change what the schema needs" — it *reduces* what the
schema needs versus the role framing.

**Roles I'd cut/merge:** cut "responder" *as a role name* (collides with `OrgKind`;
rename to field-volunteer). Merge the notion of "remote contributor role" *out of
existence* (it's a mode). Add site-lead (the schema already implies it).

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
| --- | --- | --- |
| Postgres + RLS (HOS-2026-001-07) lands before any org-scoped write role ships | Medium | agency-admin ships on a UI-only boundary → any authed low-trust account reads all orgs' data via direct API (Flaw 3). Person-safety failure. |
| The real threat model includes targeted-violence adversaries (still an *open* board question, `HOS-002 judge:53`) | Medium-High | If NO, UI-level isolation might be tolerable and this review over-hardens. If YES (likely, given Venezuela-2026 framing), RLS is mandatory and non-negotiable. The board should *close* this question, not keep betting on it. |
| Capabilities can be resolved server-side from identity + target row without a client-supplied role/flag | High | If any check trusts a client-supplied `role`/`org` field, it's the R1-D2 bypass renamed — the exact vector the board closed by construction. |
| Org membership is high-churn and needs live (non-JWT-only) revocation | High | Deprovisioned org-admins retain org-scoped write/read for the token's ~1h life (Flaw 5), worst hour being right after a removal-for-cause. |
| "received/claimed" ownership matters at *site*, not just org, granularity | High (it's in the domain model already) | Org-only roles can't express the site-scoped honesty rule → "received" lies become possible intra-org (Flaw 4). |

## Edge Cases We Haven't Addressed

1. **One human, multiple orgs.** A translator or medic who volunteers with two
   coalition NGOs → is identity per-person or per-(person,org)? If capabilities are
   `org:<id>`-scoped, one user needs *rows* in `org_members` for each. A role-enum
   on the user record can't represent this at all. -> Multi-org humans break any
   single-`role`-column design.
2. **Org deletion / merger.** `sites.org_id`, `needs.org_id`, `offers.org_id`,
   `needs.claimed_by_org_id` are FKs to `orgs(id)` with **no ON DELETE behavior
   specified** (`schema.pg.ts:102,115,122,127,135`). Delete an org and either the
   FK blocks it or orphans appear. -> Deprovisioning an org isn't modeled; today it
   would either error or silently strand claimed needs.
3. **Cross-org need claiming vs. isolation.** Isolation says "can't see other orgs'
   data," but the need lifecycle *requires* Org B to see and claim Org A's open need.
   -> The isolation boundary is not "org-private" — it's "open needs are shared,
   notes/PII are private." A naive `WHERE org_id = mine` RLS policy breaks the core
   claim workflow. This *must* be designed, not assumed.
4. **Self-registered field-volunteer with device-key+PIN but no org.** HOS-2026-010
   volunteers self-register with no coordinator relationship. What org owns them?
   -> `field-volunteer` may have *no* org membership; capability model must allow
   `self`-scope with null org, or these accounts can't act.
5. **agency-admin invites a field-volunteer who is malicious.** Org-admin can
   invite/revoke within its org → a compromised org-admin mints attributed
   volunteer identities inside a trusted org. -> Invitation is itself a privileged
   action needing its own audit and rate limit; who watches the org-admin?
6. **Break-glass coordinator token vs. role model.** `requireCoordinator` still
   honors a static `HOS_COORDINATOR_TOKEN` as break-glass (`http/auth.ts:41-46`).
   A bearer of that token has `global` scope with **no user identity** → every
   capability check that assumes "identity → org" has a hole where identity is null.
   -> The role model must define what capabilities the tokenful-but-identityless
   caller has (probably: global read + break-glass only, never org-scoped writes
   attributed to a person).

## Questions for the Proposer

1. R1-D2 (today) chose action-scoping over role-scoping and rejected self-declared
   roles for security-relevant decisions. **How does introducing agency-admin/remote
   as roles not contradict that?** If your answer is "authorization roles are
   different from the geofence exemption," explain why the same "self-declared,
   unverified, no audit trail, can't-tell-a-liar" objection doesn't apply to a
   role that grants org-scoped *write*.
2. Name one capability `agency-admin` has that `coordinator` lacks. If there is
   none (agency-admin = coordinator minus cross-org), then it is a *scope*, not a
   role — will you model it as scope?
3. Can agency-admin ship before Postgres+RLS (HOS-2026-001-07)? Walk me through how
   an org-scoped account is *prevented* from reading another org's `/api/coordination/sites`
   response via direct `curl`, on today's code, without RLS. (I believe it cannot be —
   prove me wrong or accept the dependency.)
4. The domain model reserves `received` to "the requesting site." With an org-only
   role model, what stops a 6-shelter org's admin from marking site #4's need
   received when site #4 didn't receive it?
5. Is `remote` ever read by the geofence logic? If yes, you've re-created the
   client-declared bypass. If no, why is it a role at all rather than an
   action-property?
6. When an org-admin is removed for a data-handling incident, how fast do they lose
   access — token expiry (~1h) or immediately? What in the design makes it immediate?
7. "responder" already means an OrgKind in shipped code. Which name wins, and how do
   you prevent the person-role and org-kind from colliding in queries/RLS?

## Confidence Score

**0.72** — Not higher because two of the biggest questions are genuinely unresolved
*outside* this proposal and the board is still betting on them: (a) the real threat
model (targeted-violence in scope?) is an *open* HOS-2026-002 board question that
decides whether UI-isolation is merely sloppy or actively person-endangering, and
(b) org isolation is hard-blocked on Postgres (HOS-2026-001-07), whose landing date
I can't verify from here. My structural findings (no enforced ownership, the R1-D2
contradiction, the responder/OrgKind name collision, the site-vs-org granularity
mismatch) are all **verified in the codebase** and I'm highly confident in them; the
residual uncertainty is about external dependencies and one unanswered threat-model
question the board itself hasn't closed.

## Final Note

The dangerous move here is not defining agency-admin — it's defining it as a
*standing org-scoped writer* on a data model where I verified **no coordination
write path enforces org ownership** and the one honesty rule that matters is a
code comment. Ship capabilities-on-owned-resources enforced by RLS, keep "remote"
as the *mode* the board already decided it was six hours ago, and do not let a
lower-trust role touch the console until the DB — not React — is what says no.
