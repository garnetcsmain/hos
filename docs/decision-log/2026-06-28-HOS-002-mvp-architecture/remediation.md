# HOS-2026-002 — Remediation log

What changed in code in response to the Board review (2026-06-28), and what is
deferred to tracked tasks. The Board verdicts: **D1 RESHAPE, D2 GREEN_LIGHT,
D3 RESHAPE, D4 RESHAPE** (see `judge-decision.yaml`).

## Fixed immediately (in this branch)

| Board finding | Verdict | Fix | Where |
|---|---|---|---|
| D3 fail-OPEN coordinator auth (CRITICAL, all 5 reviewers) | RESHAPE | Fail **closed**: unset token → 503; dev requires explicit `HOS_DEV_OPEN=1` | `app/lib/http/auth.ts` (+ `auth.test.ts`) |
| D4 notification recorded as delivered when nothing reached the family (CRITICAL) | RESHAPE | `status: "queued"` not `"sent"`; event `notification.queued` not `family.notified` | `app/lib/services/verification.ts`, `components/HosDashboard.tsx` |
| D1 AI blend could RAISE a sub-floor pair over the match floor (CRITICAL) | RESHAPE | Baseline is the ceiling: AI may only demote/flag, never raise | `app/lib/ai/blend.ts` (+ `blend.test.ts`) |
| D1 "PII minimized" was false — full name + raw free-text sent to cloud (CRITICAL) | RESHAPE | Free-text scrubbed of phone/email/handle before any model call; claim corrected | `app/lib/ai/redact.ts`, `app/lib/services/aiAugment.ts`, `proposal.yaml` |
| D2 hand-rolled transaction not nesting-safe (HIGH) | GREEN | `transaction()` made reentrant-safe (joins an open tx; no nested BEGIN) | `app/lib/db/client.ts` |

Verified: 29 tests pass, `tsc` + `eslint` clean, and the queued-not-sent change
confirmed end-to-end in the running app (Messages inbox shows "En cola").

## Deferred to tracked tasks (need design or external setup)

| Board condition | Task |
|---|---|
| Surface base-rate / name-commonness ("N other open reports share this name") | HOS-2026-001-13 |
| Surname-disagreement signal; don't drop name evidence on asymmetric apellidos | HOS-2026-001-13 |
| Relabel the bare % as a triage aid until calibrated on real outcomes | HOS-2026-001-13 |
| Per-deployment DPA + opt-in before enabling any cloud-AI key | HOS-2026-001-05 (gate) / EXTERNAL_DEPENDENCIES #1 |
| Non-forgeable per-actor attribution (real auth, org isolation) | HOS-2026-001-08 |
| Boot guard refusing to start unconfigured in non-local env; abuse challenge | HOS-2026-001-11 |
| Family-readable surface (or model a tracked callback obligation); honest public "Resuelto" | HOS-2026-001-12 |
| Re-scope open public name+city search (re-identification threat model) | HOS-2026-001-11 / human sign-off |

## Escalated to human (no code can close these)

- D3 fail-closed default + open-public-search re-identification → **security sign-off before any deploy**.
- D1 cloud-AI enablement → **no provider key in a real deployment until a no-retention/no-train DPA is signed**.
- D4 external channel wiring → **human sign-off; queued-not-sent semantics must hold first**.
- Confirm the Venezuela-2026 threat model (targeted-violence adversaries in scope?) and how many people hold the coordinator token.
