# Researcher Review: HOS-2026-007

## My Recommendation
🟡 RESHAPE

## Comparable Systems
- **UN OCHA "3W/4W" (Who does What, Where, [When])**: the standing humanitarian
  primitive for coordination — activities/needs mapped to actors and locations.
  Outcome: works as a shared reconciliation layer; its known failure is data
  staleness and manual upkeep. Lesson: freshness and low-friction entry decide
  success, not schema richness. (well-documented in humanitarian practice)
- **Sahana Eden / Ushahidi**: open crisis-coordination platforms with shelter
  registries, resource/needs management, situational maps. Outcome: powerful but
  heavy; deployments that tried to enable everything at once saw low sustained
  adoption vs. narrow, well-run instances. Lesson: start narrow. (project histories)
- **HXL (Humanitarian Exchange Language)** + HDX: a lightweight interop standard
  that succeeded precisely because it was thin and additive over existing data.
  Lesson for the Expansionist's "standard" moat: interop wins by being small. (OCHA HDX)
- **RapidPro / DHIS2 logistics, KoBoToolbox**: field data + supply/stock tracking.
  Outcome: adoption tracks offline tolerance and simplicity of the input step.
- **Ad hoc WhatsApp/Sheets** (the real incumbent): fast, ubiquitous, but no audit,
  no dedup, no shared truth. This is what HOS actually competes with today.

## Ground-Truth Data
- Manually-maintained 3W/needs datasets are frequently stale within days without
  a dedicated info-management role — [strong pattern in humanitarian IM, estimate].
- Low-connectivity contexts: offline-first + SMS/USSD reach far exceeds app-only
  (consistent with the D4 Refunite finding) — [estimate]; argues for keeping the
  coordination surface simple and syncable, not a rich live app.
- No reliable public metric that a needs board improves outcomes absent adoption;
  the binding variable everywhere is who keeps it current — [unknown].

## Assumption Tests
| Assumption | Verdict | Evidence |
|---|---|---|
| Coordination is the right next layer | SUPPORTED | 3W/Sahana/Ushahidi all exist because this need is real and standing |
| A thin slice is the safe way in | SUPPORTED | Narrow instances outperform "enable everything"; HXL won by being small |
| Data stays fresh enough to trust | CONTRADICTED (default) | Staleness is the #1 documented failure of coordination boards |
| Coordination data is low-sensitivity | PARTIAL/CONTRADICTED | Site+beneficiary concentration data is sensitive in conflict settings |
| It won't slow Phase 0 | UNKNOWN | No evidence either way; depends on scope discipline |

## Unknown Unknowns
- Whether Venezuelan responders will publish real capacity/needs into a neutral
  system vs. keep it in closed channels (adoption is the make-or-break, and I
  cannot verify it from here).
- The real threat model (are targeted-violence adversaries in scope?) — same open
  question D3 escalated; it directly sets how much of any board can ever be public.

## Confidence Score
0.72 — the comparable-systems signal is consistent and strong (start narrow,
freshness is destiny, interop-by-being-small). Not higher because the two
decisive variables — adoption and the threat model — are exactly the ones I
cannot measure from here.
