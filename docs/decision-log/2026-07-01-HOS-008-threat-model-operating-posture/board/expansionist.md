# Expansionist Review: HOS-2026-008

## My Recommendation
🟡 RESHAPE FOR MORE UPSIDE (adopt Option B; reject A as too small, C as premature)

## Biggest Upside
A written, ICRC/Sphere-aligned "safe to operate under an adversarial state" data posture is not overhead — it is the single credential that lets HOS be *adopted* by serious humanitarian institutions. UNHCR, ICRC, and OCHA-cluster partners legally and doctrinally cannot integrate with a beneficiary system that has no data-protection posture. The posture doc is the thing that turns HOS from "a clever reunification app" into "a system an agency's data-protection officer can sign off on." — Scale: every future agency partnership; Timeline: the moat compounds from the first partner who says yes *because* the posture exists.

## Domino Effects
1. **Posture statement → tiered visibility spec (refugee/volunteer/coordinator)** baked into HOS-2026-001-08. This unlocks the first thing HOS has never had:
2. **A refugee-facing minimal view** (my status, nearby services, how to reach a center) — the first *beneficiary-facing* surface in the entire system. Today every surface is coordinator-or-public; a safe minimal tier is the wedge to reach families directly, not only through a coordinator.
3. **A safe de-identified aggregate posture → the UN/OCHA 3W/4W cluster-sharing path.** The proposal's own Expansionist question asks whether hardening forecloses handing aggregated data to coordination clusters. The opposite is true: *only* a system with a documented minimization + de-identification posture can safely contribute to a cluster feed at all. The posture is the enabler of that upside, not its blocker.
4. **A published data-minimization field-list → a reusable standard** other small humanitarian builders can adopt — an audit/minimization convention, the same "become the standard" moat HOS-2026-007 named for coordination.

## Moat Opportunity
Being *the* family-reunification tool that is safe to run when the government is the adversary is a durable, hard-to-copy position. Google Person Finder is explicitly open/public by design — it structurally *cannot* occupy this space. A trust-and-minimization posture, proven under a real adversarial-state deployment (Venezuela-2026), is a brand and a compliance asset that compounds: every agency that adopts it because of the posture makes the next adoption easier.

## Adjacent Opportunities
- The same field-level-protection + tiered-visibility substrate is exactly what the unaccompanied-minor record (HOS-2026-009) needs — that proposal already says it should inherit this decision's posture. One posture decision de-risks the most sensitive future dataset in the system.
- A censorship-resilient reachability *pattern* (offline-first PWA caching + multiple domains + an out-of-band "the site moved to here" channel) is reusable for any future crisis where connectivity is contested, not just this one.

## Resource Bottleneck
**Bake minimization and the field-protection boundary into the schema NOW, while the data is still tiny.** The system is still on default SQLite / early Postgres with a small row count (`apps/web/app/lib/db/client.ts:29-32`). Retrofitting field-level protection and a data-minimization boundary after the schema ossifies and real PII accumulates is the expensive path — the same "model it while it's cheap" logic coordination.ts's authors used to justify modeling Org early. The second cheap-now asset is the *tiered-visibility taxonomy*: get refugee/volunteer/coordinator written into HOS-2026-001-08's acceptance criteria before that work lands, or tiering becomes a retrofit onto a binary gate.

## The one caution I'll raise against my own instinct
Do **not** let this become Option C. Building Tor onion hosting, a second CDN, and full encryption *now*, ahead of Phase 0, repeats the exact mission-displacement risk the board already ring-fenced against in HOS-2026-007. The upside above is captured by the *plan plus minimization*, which is cheap — not by building heavy infrastructure before reunification ships. Ambition here means "write the posture and minimize the data now"; it does not mean "build the bunker now."

## Confidence Score
**0.7** — Why not higher: the biggest upside (agency/cluster adoption) depends on partnerships no board member can commit, and the refugee-facing view depends on tiered visibility, which is itself blocked on Postgres + a role primitive that doesn't exist yet.

## What I Don't Know
Whether any specific agency partner is actually in reach, and whether the human principal wants HOS to stay single-deployment or become multi-tenant infrastructure — the size of the moat depends on that answer.
