# Incident-response runbook — revoke / rotate / notify

**What this is:** the one concrete, follow-at-2am runbook for a suspected or confirmed
security incident in HOS: how to **revoke** access, **rotate** every secret, and **notify**
the people a breach could put at risk. Ship-now deliverable under decision HOS-2026-015
(Judge D6, RESPOND), the honestly-weakest CSF function.

**Audience:** the human principal and the on-call orchestrator agent. HOS is a small,
AI-first NGO — there is no 24/7 SRE rotation. This runbook assumes one human with host
access and one agent, not a staffed SOC.

**Status:** Living document. Grounded in the code and env vars as of 2026-07-15. When a
credential, host, or channel changes, update the tables here in the same PR.

---

## The one limit that governs everything below (read first)

> **NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT defend
> against legal compulsion of the host, which is addressed only by data minimization,
> non-retention, and key custody outside the compellable jurisdiction.**

This runbook handles **breach, leak, and credential-compromise** — an attacker who should not
have access getting it. It does **not** handle **lawful compulsion of the host** (Supabase /
Vercel served a valid order). That is the apex threat (HOS-2026-008-D1: state in scope as a
latent adversary), and no revoke/rotate step defeats it — the controls that hold there are
minimization, non-retention, and off-host key custody, not this document. If the incident is a
legal order rather than an intrusion, this runbook's **notify** and **do-no-harm** duties still
apply, but containment shifts to legal counsel and the HOS-2026-008-D2 key-custody escalation,
not to rotating keys the host can still be compelled to hand over.

**Why confidentiality comes first:** FIPS 199 rates HOS **Confidentiality = HIGH** because
disclosure can get a person detained, disappeared, or killed (Rohingya biometric precedent;
*Operación Tun Tun* tied to a fatality in this population). Treat every PII-exposure incident as
a **life-safety event**, not a privacy inconvenience. When in doubt, over-contain and notify.

---

## 0. Severity — decide this first (2 minutes)

| Sev | Definition | Examples | Clock |
|---|---|---|---|
| **SEV-1 life-safety** | PII of real families/volunteers is or may be exposed to someone who could harm them | Coordinator token or DB credential leaked; `events`/PII dump exfiltrated; unauthorized read of the coordinator board; a named person's location confirmed to an outsider | Act **now**. Human principal engaged immediately. Affected-person notification path opens in parallel with containment. |
| **SEV-2 access/integrity** | A privileged path is compromised but no confirmed PII egress yet | Suspicious coordinator sign-in; forged `need.received`/verification; cron endpoint abused; AI key leaked | Contain within the hour; investigate egress. |
| **SEV-3 hygiene** | Security-relevant defect, no active exploitation | Misconfig found in review; a secret committed to git but not yet deployed/used | Rotate at next opportunity; fix + regression test. |

Escalate a SEV-2 to SEV-1 the moment egress of PII is plausible. **Ambiguity resolves upward**,
not downward — the cost of over-notifying a family is far below the cost of a missed exposure.

---

## 1. Detection reality — how you actually find out

Be honest about this: **Detect is HOS's weakest CSF function.** There is **no active alerting**
today — no Sentry, no anomalous-access detection, no uptime/error monitoring (blocked on a
Sentry DSN, EXTERNAL_DEPENDENCIES #13). In practice an incident reaches you by one of:

- a **human report** (a coordinator, a family, a partner agency, a security researcher);
- **host-console signals** you go looking for (Supabase auth logs, Vercel deploy/function logs);
- **forensic reconstruction after the fact** from the append-only `events` table.

The `events` store is append-only and immutable and carries actor attribution (`by`) on every
coordination action, so *reconstruction* is strong even though *detection* is weak. First
investigative query is always: pull the `events` timeline for the affected entity/actor and
build the sequence. Note the known limit — a shared `HOS_COORDINATOR_TOKEN` caller is attributed
`coordinator:token`, not a person, so token-path actions are not individually attributable until
per-person attribution lands (HOS-2026-001-08).

---

## 2. First 60 minutes — triage checklist

1. **Classify severity** (§0). Write the timestamp and what you know into a fresh incident file
   `docs/incident-responses/YYYY-MM-DD-short-slug.md` (copy the skeleton in §7). Facts only;
   update as you learn.
2. **Engage the human principal.** For SEV-1 this is not optional and not deferrable — an agent
   must not decide alone whether to notify frightened families or to take the service down.
3. **Preserve evidence before you change anything.** Export the relevant Supabase auth logs and
   Vercel function logs, and snapshot the `events` timeline for the affected entities. Rotation
   and revocation destroy the state an investigation needs; capture it first.
4. **Contain** (§3) — revoke the compromised access path.
5. **Rotate** (§4) — replace the exposed secret(s).
6. **Assess egress** — what PII could the attacker actually read in the exposure window? This
   scopes the notify decision (§5).
7. **Notify** (§5) — affected people, and any partner/legal obligations.
8. **Recover + review** (§6).

---

## 3. CONTAIN — revoke access

Pick the row that matches the compromised path. Revocation is reversible-in-effect (you re-issue
a new credential); do it early and liberally.

| Compromised path | Revoke action | Effect / blast radius |
|---|---|---|
| **Coordinator shared token** (`HOS_COORDINATOR_TOKEN`) | In **Vercel → Project → Settings → Environment Variables**, replace the value with a fresh `openssl rand -hex 32`, then redeploy (or rotate + redeploy in §4). To hard-lock immediately, **unset** it — the gate **fails closed** (503), so an empty value denies all coordinator access rather than opening it. | Every coordinator using the shared token is logged out at once. This is the blunt instrument; it stops the bleed. Re-distribute the new token out-of-band to known coordinators. |
| **A specific coordinator account** (Supabase Auth) | Supabase **Dashboard → Authentication → Users** → find the user → **revoke sessions / ban / delete**. Remove their address from `HOS_COORDINATOR_EMAILS` (Vercel env) so they cannot pass the allowlist even with a valid session. | Scoped to one person — preferred over the token nuke when you know which account. Requires Supabase Auth to be live. |
| **Dev-open escape hatch left on** (`HOS_DEV_OPEN=1`) | Unset it in the affected environment and redeploy. It must never be set outside local dev; its presence in a hosted env is itself a SEV-2. | Closes an unauthenticated coordinator hole immediately. |
| **Cron endpoint** (`CRON_SECRET`, `/api/cron/sync-coordination`) | Rotate `CRON_SECRET` (§4). If abuse is ongoing, set `HOS_SYNC_UNTIL` to a past date to self-disable the sync route entirely. | Stops nightly-sync abuse; no PII path, but a write vector into coordination data. |
| **Cloud-AI key** (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) | Revoke the key in the provider console (console.anthropic.com / platform.openai.com), then remove/replace in Vercel. | Stops billing abuse and any egress via the AI path. Matching falls back to the deterministic rule engine — degraded, not down. |
| **Database credential** (`DATABASE_URL`) | In **Supabase → Project Settings → Database**, reset the database password; update `DATABASE_URL` in Vercel. If exfiltration is suspected, also **pause the project** to stop all connections while you assess. | The big one for a SEV-1 data incident. Pausing the DB takes the service down — a deliberate availability trade (A:MODERATE) to stop confidentiality loss (C:HIGH). Human principal decides. |
| **Supabase anon/publishable key** (`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`) | Rotate in the Supabase dashboard; redeploy. Note the anon key is public-by-design (client-side) and is **not** a secret — its leak alone is not an incident. The service-role key, if ever introduced, would be. | Low blast radius unless paired with a missing RLS policy. |
| **Whole host account compromised** (Vercel or Supabase login) | Rotate the human's host-account password, enable/verify host-account MFA, review the account's audit log for unauthorized changes, and rotate **every** secret in §4 (assume all env values were readable). | Highest blast radius. Treat as SEV-1 regardless of confirmed egress — the attacker could read every env secret. |

---

## 4. ROTATE — replace every secret

Rotate the specific compromised secret immediately; rotate **all** of them if the host account
itself was compromised (an attacker with env-var read access saw everything).

| Secret | Lives in | How to rotate | Notes |
|---|---|---|---|
| `HOS_COORDINATOR_TOKEN` | Vercel env | `openssl rand -hex 32` → set in Vercel → redeploy → redistribute out-of-band | Constant-time compared (`http/auth.ts`). Interim control until real per-person auth. |
| `CRON_SECRET` | Vercel env | new random value → update Vercel + the cron caller | Gates `/api/cron/sync-coordination`. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Vercel env | revoke + re-issue in provider console → update Vercel | Off unless set; deterministic engine still works without them. |
| `DATABASE_URL` (password) | Vercel env + Supabase | reset DB password in Supabase → update `DATABASE_URL` | Not deployed until BLK-001 (Postgres) lands; when it is, this is the crown-jewel credential. |
| Supabase `_ANON_KEY` | Vercel env | rotate in Supabase dashboard → redeploy | Public-by-design; rotate for hygiene, not urgency. |
| `HOS_PG_CA_CERT` / `_FILE` | Vercel env / file | replace with the current Supabase root CA PEM | Pins the DB TLS peer (HOS-2026-015-01); a stale CA breaks connection but is not a leak. |
| Host-account passwords (Vercel, Supabase) | The host itself | change password + confirm account MFA is on | Rotate first if the host login itself was the vector. |

**After any rotation:** confirm the service still boots (the boot guard refuses to start an
unconfigured non-local deploy rather than serving 503s — a failed boot after rotation means a
value is wrong, not that the guard is broken), and record old→new rotation in the incident file
(the *fact* of rotation and its timestamp, never the secret values themselves).

**Not implemented (state honestly):** there is no automated secret-rotation tooling and no secrets
manager — rotation is a manual console operation today. That is a real gap, not a covered control.

---

## 5. NOTIFY — the people a breach could put at risk

This is the hardest and most important part, and the one a technical team most often gets wrong.
The obligation runs **to the affected people first**, not only to funders or the host.

**Who must be told, and in what order:**

1. **The human principal** — already engaged at triage for SEV-1 (§2). The decision to notify
   affected individuals is a **human + do-no-harm judgment**, never an agent-only call.
2. **Affected individuals** (families, volunteers whose PII was exposed) — for a SEV-1
   confidentiality breach. See the do-no-harm constraints below.
3. **Partner agencies / any data-sharing counterpart** whose data or people are implicated.
4. **Legal counsel** — engage for any breach of real-person PII, and immediately if the incident
   is or may be a legal order rather than an intrusion (the compulsion path, §top).

**How affected-person notification actually works today — and its limits:**

- HOS has **no external notification channels wired** (SMS/WhatsApp/email/Telegram are all
  blocked on provider credentials, EXTERNAL_DEPENDENCIES #6-9). The in-app family-reach path
  (`services/familyReach.ts`, `api/notifications`) is **queued-not-sent by design** and is an
  in-app coordinator workflow, **not** an outbound blast channel. **Do not** expect to notify
  affected people through the product. Notification today is **out-of-band and human-run** —
  the coordinator or principal reaches known contacts through the same trusted channel used to
  reach that family originally.
- **Do-no-harm governs the message.** For this population, a careless breach notification can
  itself be the harm — a message intercepted, or one that names the person and the platform,
  can confirm to an adversary exactly what the breach risked. Notification content must be
  minimal, must not restate the exposed PII, and must go through a channel already trusted by
  the recipient. When reaching the person could endanger them more than the breach, that is a
  counsel-and-principal judgment, recorded, not an automated send.
- **Never tell a family HOS is "secure against the state."** What they are told stays true and
  plain (posture doc §9). The framework name never appears in a notification.
- **Expedited path (governance):** for a confirmed breach of real-person PII, brief the human
  principal within **24 hours** with what is known, the exposure scope, and the notify
  recommendation. This is HOS's stated breach-response expectation (RESPOND); the 24h is the
  brief-the-human clock, not a substitute for notifying affected individuals as fast as
  do-no-harm allows.

---

## 6. RECOVER + post-incident review

1. **Confirm containment held** — the revoked path is dead, new secrets are live, the service
   boots and serves (or is deliberately paused, logged as such).
2. **Restore** — if data was corrupted, restore from Supabase managed backups (RECOVER is
   Partial; a restore-test and a stated recovery-time expectation are open items — do not assume
   an untested backup restores cleanly).
3. **Fix the root cause with a regression test.** An incident that can silently recur is not
   closed. Land the fix + test as its own PR (the TLS-defect fix, HOS-2026-015-01, is the model:
   fail-closed + a test that pins it).
4. **Post-incident review** — run HOS's existing post-decision-review ritual: what happened,
   what worked, what didn't, what control or detection would have caught it earlier. Feed the
   Detect gap findings into the Sentry/monitoring item (EXTERNAL_DEPENDENCIES #13) so the weakest
   function gets the evidence for its business case.
5. **Update this runbook** if the incident revealed a step that was wrong, missing, or unclear.

---

## 7. Incident file skeleton

Copy into `docs/incident-responses/YYYY-MM-DD-short-slug.md`:

```markdown
# Incident YYYY-MM-DD — <short title>

- Severity: SEV-<n>
- Detected: <UTC timestamp> via <how>
- Reported by: <who>
- Status: investigating | contained | resolved

## Timeline (UTC, facts only)
- HH:MM — <what happened / what we did>

## Exposure scope
- What data/paths were reachable, for how long, by whom (from the events timeline + host logs).

## Actions
- [ ] Evidence preserved (Supabase auth logs, Vercel logs, events snapshot)
- [ ] Contained (revoked: <path>)
- [ ] Rotated (secrets: <list — the fact and time, never the values>)
- [ ] Human principal briefed (<time>)
- [ ] Affected people notified (<how, when> or <why not / deferred by do-no-harm>)
- [ ] Legal engaged (if PII / if compulsion)
- [ ] Root cause fixed + regression test (PR #)

## Post-incident review
- Root cause / what worked / what didn't / what detection would have caught it earlier.
```

---

## 8. Owners

| Role | Who | Responsible for |
|---|---|---|
| **Incident lead** | Human principal | Severity/notify/take-down decisions; anything touching real people |
| **Executor** | On-call orchestrator agent | Triage, evidence capture, revoke/rotate mechanics, incident file, forensic `events` query |
| **Host access** | Human principal | Vercel + Supabase consoles (only a human holds host credentials) |
| **Legal / do-no-harm** | Human principal + counsel (to engage) | PII-breach obligations; the compulsion path; notification safety |

---

## 9. Honest gaps (do not mistake a plan for a control)

- **No active detection.** Incidents are found by human report or after-the-fact forensics, not
  alerting. Sentry/access-anomaly monitoring is blocked on a DSN (EXTERNAL_DEPENDENCIES #13).
- **No outbound notification channel.** Affected-person notification is out-of-band and manual;
  in-app family-reach is queued-not-sent, not a broadcast path.
- **No per-person attribution on the shared token.** Token-path actions read `coordinator:token`;
  individual attribution lands with HOS-2026-001-08.
- **No automated secret rotation / secrets manager.** Rotation is manual console work.
- **No tested restore / stated RTO.** Backups planned with Postgres (BLK-001); restore-test open.
- **Compulsion is out of scope here.** A valid legal order to the host is handled by counsel +
  the HOS-2026-008-D2 key-custody escalation, not by this runbook.

These are stated so no reader mistakes this runbook for coverage HOS does not have. The runbook
makes the response HOS *can* run today concrete and fast; the gaps above are tracked, not hidden.
