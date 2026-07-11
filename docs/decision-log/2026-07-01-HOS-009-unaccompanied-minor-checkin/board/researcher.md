# Researcher Review: HOS-2026-009

## My Recommendation
🟡 RESHAPE — the underlying need is well-documented and the non-biometric direction matches the sector's own hard-won guidance; but the proposal should be reshaped to align with the established Identification–Documentation–Tracing–Family-reunification (IDTR) practice model, to drop or gate the stored photo, and to name that no comparable system relies on absence-alerting as a primary safeguarding control. Option B is contradicted by direct sector precedent and should be declined.

## Comparable Systems

- **CPIMS+ / Primero (UNICEF + Save the Children + IRC)** — the sector-standard case management system for child protection, including unaccompanied and separated children (UASC). *What they chose:* structured, **strictly access-controlled, coordinator/caseworker-only** individual child records with role-based access; explicitly NOT a public or enumerable registry; biometrics deliberately avoided in the core UASC workflow. *Outcome:* widely deployed (multiple refugee responses); the recurring documented failure is not the data model but **data-sharing governance** — who the records can be compelled toward or shared with. Directly relevant: Option A's shape (minimal attributed record, coordinator-only) is *convergent* with CPIMS+; the risk it must inherit is CPIMS+'s risk (governance/compulsion), which is exactly what HOS-2026-008 is about. (High confidence this system exists and is the standard; medium confidence on the specific field-level choices, which vary by deployment.)

- **RapidFTR (Rapid Family Tracing and Reunification, UNICEF, ~2011)** — predecessor to Primero; mobile-first UASC registration for tracing. *What they chose:* photo + demographic record for **tracing/reunification** (matching a lost child to searching family), captured by trusted field workers. *Outcome:* merged into Primero; the lesson carried forward was toward *stronger* access control and consolidation, not looser. Note the divergence: RapidFTR's photo existed to serve **tracing** (find this child's family), a purpose HOS-2026-001 already covers. It did **not** exist to serve **presence/absence detection**, which is HOS-2026-009's stated purpose. This supports Principals' point: a stored photo is justified by a tracing purpose, not by an absence-detection purpose. If HOS wants the photo, it belongs to the reunification module (HOS-2026-001), not bolted onto the check-in feature.

- **ICRC Restoring Family Links / "Trace the Face"** — *What they chose:* family-initiated tracing; photos published only with consent and strict controls; for children, additional safeguards. *Outcome:* the governing lesson is consent + minimization for images of vulnerable people. Reinforces: a child's photo is not a casually-stored field.

- **Rohingya biometric registration (UNHCR/Bangladesh, 2018+)** — the board's standing cautionary case (cited in HOS-2026-006). *What they chose:* biometric (including facial/iris) registration of a persecuted population; data-sharing arrangements later drew serious criticism (Human Rights Watch, 2021) over consent and the risk of the data reaching the government the population fled. *Outcome:* the canonical example of a protection dataset becoming a targeting risk. This is direct evidence **against Option B** and a warning that even Option A's named list must never become shareable/compellable without governance.

- **Alarm/monitoring systems (clinical & industrial, general literature)** — not a humanitarian comparable, but the relevant evidence for the absence-alert mechanism: **alarm fatigue** is a well-documented, near-universal failure of low-specificity alerting (The Joint Commission named alarm fatigue a patient-safety priority; industrial alarm-management standards like ISA-18.2 exist precisely because operators tune out noisy alarms). Directly supports Contrarian Flaw 3: an absence alert with a high false-positive rate will be ignored.

## Ground-Truth Data

- **The underlying risk is real and documented.** Unaccompanied and separated children are a recognized high-risk group for trafficking and exploitation in displacement (UNICEF, UNHCR, and IOM have all documented this across multiple crises; the Venezuela/Latin America migration context specifically has documented UASC protection concerns). The problem HOS-2026-009 targets is not speculative. [High confidence.]

- **The sector's own model is IDTR / case management, not electronic presence-tracking.** The dominant intervention for UASC is *identification → documentation → tracing → reunification* plus interim alternative care with a designated caseworker — a **human, relationship-based** model. There is **no established sector practice of electronic per-child presence/absence alerting as a safeguarding control.** [Medium-high confidence.] This is the most important finding: Option A is proposing a mechanism that is *reasonable* but *without close precedent as a primary control*. That is not disqualifying, but it must be stated honestly (mirrors how HOS-2026-012's "switchable skill" was flagged as an untested HOS-specific design needing pilot validation).

- **Interim/alternative care standards** (Inter-agency Guiding Principles on UASC; the Alternative Care Guidelines; Sphere/CPMS — the Minimum Standards for Child Protection in Humanitarian Action, esp. the standards on UASC and case management) center on: a designated responsible caseworker, best-interests procedures, and strict information-sharing limits. HOS-2026-009's "named responsible adult + coordinator-only visibility" is *directionally consistent* with these. [Medium confidence on exact standard numbers — I'm citing the frameworks by name, not paragraph.]

## Assumption Tests

| Assumption | Verdict | Evidence |
|---|---|---|
| UASC are a real, documented trafficking-risk group | SUPPORTED | UNICEF/UNHCR/IOM displacement child-protection literature; Venezuela migration context |
| Non-biometric is the safer choice | SUPPORTED | CPIMS+/Primero avoid biometrics in core UASC workflow; Rohingya case is the counter-example |
| Electronic absence-alerting is an established safeguarding control | CONTRADICTED / UNKNOWN | No close sector precedent found; sector uses human case management + IDTR, not presence alarms |
| A stored reference photo is needed for this feature's purpose | CONTRADICTED (for *this* purpose) | Photos in comparables serve *tracing* (RapidFTR/RFL), which HOS-2026-001 already owns — not absence detection |
| The absence alert will be trusted/used | UNKNOWN, leans CONTRADICTED at high false-positive rates | Alarm-fatigue literature (Joint Commission, ISA-18.2) |
| Coordinator-only + no-export is sufficient governance | PARTIAL | CPIMS+ shows access control is necessary but the real failure is *compulsion/sharing* governance — HOS-2026-008's domain |

## Unknown Unknowns
- The **real missed-check-in base rate** in a chaotic HOS deployment. Everything about whether the absence alert is usable hinges on this and it cannot be known without a pilot. Recommend: if built, instrument the false-alert rate from day one and treat the feature as provisional until it's measured (same posture the board took toward HOS-2026-012's unvalidated mechanisms).
- Whether HOS's actual deployment context has **any designated caseworker structure** at all, or whether "the named responsible adult" will in practice be whoever is standing nearest. The sector model assumes a case-management scaffold that HOS may not have — if that scaffold is absent, Option A is being asked to substitute for it, which it cannot.
- Whether a **QR-wristband middle option** (the Expansionist's likely pitch) has real UASC precedent. I did not find a strong one; wristbands appear in triage/festival/hospital contexts, not as a documented UASC safeguarding standard. Flag as unvalidated if pursued.
- Legal/consent regime for holding minors' records at all in the deployment jurisdiction — a child-protection specialist + counsel question the proposal already escalates. I cannot resolve it.

## Confidence Score
**0.72** — why not higher: I'm citing the correct frameworks (CPIMS+/Primero, RFL, Inter-agency Guiding Principles, CPMS/Sphere, the Rohingya case) by name and documented reputation, but without live web access I can't pin exact standard paragraph numbers or current 2026 deployment specifics, and I'm inferring the "no established electronic-absence-alerting precedent" from absence-of-known-precedent, which is weaker than a positive citation. The direction of every finding is well-supported; the precision is limited.
