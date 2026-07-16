# HOS incident-response runbook — revoke, rotate, notify

**Owner:** whoever holds the Vercel + Supabase project (the operator / responsable).
**Audience:** internal operators. Not shown to families; the framework name and this
document stay out of user-facing copy (HOS-2026-015-D2).
**Delivered under:** HOS-2026-015-D6 (board GREEN_LIGHT, 2026-07-08). This is the one
concrete RESPOND runbook the Judge required as a ship-now, no-dependency deliverable.

> **The one limit that governs everything below (read first).** NIST/FIPS alignment and
> this runbook are HOS's hygiene floor; they do **not** defend against legal compulsion of
> the host (Supabase / Vercel). If the apex threat materializes — a lawful order served on
> the foreign host, or an insider at the host — revoking a token and rotating a key does
> **not** un-disclose data already compelled. The controls that hold there are the
> HOS-2026-008 ones (collect less, retain no free-text who-helped-whom ledger, key custody
> outside the compellable jurisdiction), not anything in this file. This runbook handles the
> attacks it *can* handle honestly, and says plainly where it cannot.

---

## 0. Before an incident — know these facts

**What HOS holds that can hurt a person if disclosed** (see `docs/DATA_MINIMIZATION.md`):
reunification case PII (names, cities, conditions incl. `Fallecida`), coordinator contact
notes, and the append-only `events` audit trail. FIPS 199 categorization: **Confidentiality
HIGH, Integrity HIGH, Availability MODERATE** — a confidentiality breach here is a life-safety
event, not a privacy inconvenience.

**Where the credentials live.** All secrets are in **Vercel project env** (and Supabase
project settings) — never in the repo. `OPENAI_API_KEY` and `GOOGLE_MAPS_API_KEY` live in
Vercel env, not in this tree. The credential surface (from `docs/EXTERNAL_DEPENDENCIES.md`):

| Secret / control | Env var | Guards |
|---|---|---|
| Coordinator break-glass token (shared) | `HOS_COORDINATOR_TOKEN` | full-PII board, match recompute, verification (`http/auth.ts`) |
| Coordinator allowlist (Supabase path) | `HOS_COORDINATOR_EMAILS` | which signed-in emails are coordinators |
| Local dev open gate | `HOS_DEV_OPEN` | must be **unset** in every deployed env |
| Supabase project | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, service key | auth + data |
| Database | `DATABASE_URL`, `HOS_PG_SSL`, `HOS_PG_CA_CERT(_FILE)` | Postgres transport |
| Cloud AI | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | matching boost |
| Cron | `CRON_SECRET` | nightly caracasayuda sync route |

**Detection is today's weakest function — be honest about it.** There is **no active
detection**: no Sentry, no access-anomaly alerting, no uptime monitoring
(`EXTERNAL_DEPENDENCIES.md` #13, blocked on a Sentry DSN). Incidents are found by
**after-the-fact forensic reconstruction from the append-only `events` table**, or by an
external report (a partner, a coordinator, an affected person). Assume you will learn late.
Wiring Sentry is the highest-leverage improvement to this runbook and is tracked, not done.

---

## 1. Severity and first move (triage in the first 10 minutes)

| Sev | Definition | First move |
|---|---|---|
| **SEV-1** | Confirmed or likely PII exposure of real people (leaked token in use, DB dump, insider read, `HOS_DEV_OPEN=1` in prod). | Execute **Revoke** (§2) immediately, then **Rotate** (§3), then start the **Notify** assessment (§4). |
| **SEV-2** | Credential exposed but no evidence of use yet (key pasted in a log/PR, laptop lost). | **Rotate** (§3) the exposed secret now; **Revoke** sessions if it was an auth credential; monitor `events` for use. |
| **SEV-3** | Integrity / abuse without PII exposure (spam intake, a forged `need received`, sync anomaly). | Contain in-app (pause the affected surface); reconstruct from `events`; no key rotation unless a credential is implicated. |

**Always, regardless of severity:** open a dated incident file in this directory
(`YYYY-MM-DD-short-slug.md`), start a timeline, and record every action with a timestamp.
The append-only `events` table is your source of truth for what was accessed — pull it early
before doing anything that adds noise.

---

## 2. REVOKE — cut off access now

Goal: make the exposed credential or session stop working. In order of what is most likely
compromised.

**A. Shared coordinator token (`HOS_COORDINATOR_TOKEN`).** This is a single shared secret; if
it leaks, every coordinator capability is exposed and the audit log cannot tell you *which
person* used it (that is the per-person-attribution gap, HOS-2026-001-08 — AAL2 is not yet
achieved; assume the shared token is a break-glass credential, not an identity).
1. In **Vercel → project → Settings → Environment Variables**, set `HOS_COORDINATOR_TOKEN` to
   a new high-entropy value (see §3 for how to generate). Save.
2. **Redeploy** (Vercel → Deployments → Redeploy) so the new value takes effect — env changes
   do not apply to a running deployment until redeploy.
3. The old token now returns `401` at the gate (`http/auth.ts`). Verify: an unauthenticated
   call to a coordinator route returns `401`/`503`, not `200`.
4. Distribute the new token to legitimate coordinators out-of-band (not email/chat that shares
   the same compromise).

**B. A specific coordinator account (Supabase path).** If a named coordinator's account is
compromised (and Supabase Auth is configured):
1. **Supabase → Authentication → Users** → find the user → **revoke sessions** (sign out
   everywhere), then reset password or **delete/ban** the user.
2. Remove their email from `HOS_COORDINATOR_EMAILS` in Vercel and redeploy — this drops them
   from the coordinator allowlist even if a session lingers.

**C. `HOS_DEV_OPEN` set in a deployed environment (critical misconfiguration).** This opens
the coordinator gate to anonymous callers. **Unset it in Vercel and redeploy immediately.**
Then treat as SEV-1 and assess exposure from `events` for the window it was set.

**D. Cron secret (`CRON_SECRET`).** If leaked, an attacker can trigger the caracasayuda sync.
Rotate it (§3) and redeploy; the sync route rejects a bad bearer token.

**E. Database credential (`DATABASE_URL`).** If the connection string leaks, rotate the DB
password in **Supabase → Settings → Database** (this invalidates the old string), update
`DATABASE_URL` in Vercel, redeploy. If a **dump** is suspected, this is SEV-1 → go to §4.

---

## 3. ROTATE — replace the secret and close the door behind it

Rotate any secret that was exposed, and any secret that shared a compromised channel with it.

**Generate a strong secret** (approved RNG per AGENTS.md §3 / SP 800-131A):
```
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Rotation targets and where:
- `HOS_COORDINATOR_TOKEN` — Vercel env → redeploy → redistribute out-of-band.
- `CRON_SECRET` — Vercel env → redeploy (also update the Vercel Cron config if it carries the
  bearer).
- **Supabase keys** (anon / service) — Supabase → Settings → API → rotate → update every env
  var that carries them in Vercel → redeploy.
- **Database password / `DATABASE_URL`** — Supabase → Settings → Database → reset password →
  update `DATABASE_URL` in Vercel → redeploy. Keep `HOS_PG_SSL` verifying the peer
  (`rejectUnauthorized:true` is the default and the `require` mode; never move to `no-verify`
  as part of an incident — that would add a MITM hole while responding to one, HOS-2026-015-01).
- **Cloud AI keys** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) — rotate in the provider console,
  update Vercel, redeploy. Note: PII is minimized before any AI call, but rotate anyway if the
  key is exposed.

**After every rotation:** redeploy, then confirm the old secret is dead (old token → `401`)
and the new one works (a legitimate coordinator call → `200`). Record both checks in the
incident file.

**What rotation does NOT fix:** data already read or exfiltrated. Rotation closes future
access; it does not reach the disclosure that already happened. That is the Notify problem.

---

## 4. NOTIFY — tell the people who were actually affected

This is the step that protects people, and the one most easily done dishonestly. HOS's
guiding rule (HOS-2026-008): *a protection we claim but do not deliver is the same failure as
a delivery we claim but do not make, applied to safety.* Notification is a delivery.

**Step 1 — scope who was affected, from evidence.** Reconstruct from the append-only `events`
table what records were accessible during the exposure window (which cases, which fields,
which contact notes). Do not guess wider or narrower than the evidence: over-notifying can
itself put people on a list; under-notifying abandons someone exposed.

**Step 2 — assess real-world risk, not just data type.** This population faces a **latent
state adversary** (HOS-2026-008-D1) — *Operación Tun Tun* has a named fatal precedent. Ask:
could this disclosure lead to a person being located, detained, or harmed? Deceased-condition
(`Fallecida`) and precise-location disclosures are the highest-harm cases; the deceased
condition is normally withheld from public projections precisely so a family never reads it
before a coordinator reaches them (HOS-2026-001-12).

**Step 3 — reach affected people through the human family-reach path, not an automated blast.**
HOS deliberately has no automated external notification channel yet
(`familyReach.ts` records a `coordinator_callback` obligation for a human to fulfill;
`isSensitiveOutcome` marks the cases a human must handle in person). Sensitive news is
delivered by a coordinator, out-of-band, in plain language — never by an automated message
that could reach the wrong person or a monitored channel. Use the least-exposing channel the
person chose.

**Step 4 — say what is true and plain (no framework name, no false comfort).** Tell an
affected person: what was exposed, when, what you have done (revoked/rotated), what you cannot
undo, and what they can do to stay safe (e.g. the "we moved, contact this number" out-of-band
fallback). **Never tell anyone HOS is "secure against the state"** — say what is true. If the
exposure was host compulsion, be honest that revocation cannot reverse it.

**Step 5 — external / partner notification.** If a partner agency's data or people are
involved, notify that partner through the agreed contact. Governance defines an expedited
breach path (24h target + a human in the loop). If there is any legal dimension (host
compulsion, cross-border data), escalate to the human principal and, where available, counsel
before any public statement — HOS-2026-008-D2 (key custody / jurisdiction) is exactly this
class of decision and is a human call, not an operator one.

---

## 5. After the incident

1. **Close the timeline.** Finalize the dated incident file: what happened, detection method
   and *lag* (how long until you knew — this is the Detect-gap cost, measure it), actions with
   timestamps, who was notified and how.
2. **Confirm no regression.** If any code changed during response, `npm run build:web`,
   `npm test`, and `npm run check:crypto` must be green before it is considered closed.
3. **Feed it back into governance.** If the incident revealed a design gap, it becomes a task
   or a board proposal (`TASK_MANAGEMENT.md`) — the same board→judge culture that produced this
   runbook. A recurring class of incident is a signal to prioritize the blocked control that
   would prevent it (most often: wire Sentry for Detect; land per-person attribution so the
   audit log names a person, not a shared token; enable coordinator MFA).
4. **Do not silently widen collection or retention** in the name of "better forensics." More
   retained data is more to leak next time — the minimization posture is the primary control,
   and an incident is not license to abandon it.

---

## 6. Honest limits of this runbook (do not overstate coverage)

- **Detect is weak.** Without Sentry/monitoring, you will usually learn of an incident late or
  from outside. Everything above assumes late discovery.
- **The shared coordinator token cannot attribute an action to a person** until
  HOS-2026-001-08 lands. During an incident on the token path, the audit log tells you *what*
  was accessed, not *who* did it.
- **Revoke + rotate do not reverse a disclosure**, and nothing here defeats lawful compulsion
  of the host. Those are the HOS-2026-008 minimization/retention/key-custody controls' job,
  and the key-custody decision (HOS-2026-008-D2) is still owed by a human.

> Companion: `docs/security/HOS-2026-015-security-posture.md` (CSF §2 RESPOND row points
> here). Standards frame: NIST CSF 2.0 RESPOND (RS) / RECOVER (RC); SP 800-61 (incident
> handling) for the "how"; ISO 27001 A.5.24–5.26 and the ICRC breach-management guidance
> outward.
