# Researcher Review: HOS-2026-008

## My Recommendation
🟡 RESHAPE

The proposal's core premise — that a beneficiary database becomes a targeting asset under an adversarial state and must be minimized accordingly — is strongly supported by humanitarian data-protection doctrine and by at least one canonical real-world failure. Where it needs reshaping is not the direction but two mechanisms it leans on: field-level encryption (weaker against the named adversary than the proposal implies) and location coarsening (a weak, slow-acting defense on its own).

## Comparable Systems
- **ICRC "Handbook on Data Protection in Humanitarian Action" (ICRC + Brussels Privacy Hub, 2nd ed. 2020):** treats state authorities explicitly as potential threat actors and makes **data minimization + purpose limitation** the primary controls, not encryption. It devotes specific attention to the risk of humanitarian data being compelled or repurposed by authorities. → Directly supports Option B's minimization framing and, notably, ranks *not collecting* above *encrypting*.
- **Rohingya biometric registration (UNHCR / Bangladesh, 2018–2021):** data collected for aid delivery was shared with the Bangladeshi government and onward toward Myanmar — the persecuting state — without adequate consent, per Human Rights Watch's 2021 investigation. → The canonical proof that a beneficiary database becomes a targeting asset the moment a state can compel or request it. Already cited by the board for HOS-2026-006; it is the single most on-point precedent for this decision's core question. Verdict: "assume adversarial state" is not paranoia, it is the documented base rate.
- **TraceTogether (Singapore, 2020–2021):** a deliberately coarse, non-biometric, publicly-promised *contact-tracing-only* log was nonetheless compelled into a murder investigation once state pressure arrived; the government conceded the police could access it. → Proves purpose-limitation *promises* do not survive state pressure; only **retention minimization** (not keeping the data) is a durable control. (Same precedent the board used in HOS-2026-012-D4 for location logs — it applies identically to HOS's event store.)
- **Sphere Handbook / Humanitarian Charter — "do no harm":** data protection is treated as a protection principle, not an IT concern. Collecting sensitive data you cannot protect is itself a potential harm. → Supports scoping the field list to what is genuinely needed.
- **Censorship-resilience patterns:** Tor onion services and Signal-style infrastructure work but are heavy and can degrade low-bandwidth reach. The lighter, better-precedented pattern for contested-connectivity humanitarian contexts is **offline-first PWA caching + multiple domains + an out-of-band "we moved" channel** (mirrors the resilience approach of tools built for intermittent connectivity). → Supports the proposal's "plan reachability, don't build Tor now" instinct.

## Ground-Truth Data
- **Encryption vs. legal compulsion:** field/column encryption defeats a stolen database dump. It defeats *host compulsion* only when key custody is separated from ciphertext custody (client-held keys, or a KMS in a different control/jurisdiction domain). Cloud providers' transparency reports confirm compelled production includes anything the provider can decrypt for the customer. → **Marks the Contrarian's Flaw 1 as SUPPORTED:** encryption with a co-located key is a leak control, not a state-adversary control. HOS today has *no* application encryption (`apps/web/app/lib/http/auth.ts:15` and `ids.ts:5` are the only crypto uses), so this is a design choice being made from scratch — the right time to get custody right.
- **Location coarsening (de Montjoye et al., *Nature Scientific Reports* 2013):** coarsening a mobility signal decays identifiability only as roughly the **10th root** of resolution — a real but weak, slow-acting defense. → Coarse-district location (which HOS already enforces: `schema.ts:109` "coarse only; never precise address") helps but is not a categorical fix; **minimization + short retention** is the load-bearing control, consistent with the TraceTogether lesson. (Same finding the board recorded in HOS-2026-012-D4.)
- **The event log as correlation asset:** HOS's `events` table is append-only by design (`schema.ts:145`, `events.ts`) and already stores actor-linked, timestamped, per-case rows including family-reach contact notes (`familyReach.ts:96-104`). Humanitarian doctrine (ICRC handbook, above) would classify an indefinitely-retained, queryable who-helped-whom log as a high-risk processing activity requiring a retention limit and access restriction — which the proposal correctly lists in scope.

## Assumption Tests
| Assumption (from proposal) | Verdict | Evidence |
|---|---|---|
| A targeted state actor is a realistic threat to this data | SUPPORTED | Rohingya precedent; the proposal's own VenApp/Operación Tun Tun context; ICRC doctrine treats it as baseline |
| Field-level encryption meaningfully protects against that actor | CONTRADICTED (as written) | Only true with separated key custody; otherwise host compulsion reaches key+ciphertext (transparency reports) |
| Data minimization is the primary control | SUPPORTED | ICRC handbook ranks minimization/purpose-limitation above encryption; TraceTogether shows retention is what matters |
| Coarse location is sufficient protection | PARTIALLY CONTRADICTED | de Montjoye: coarsening decays identifiability only ~10th-root; needs retention limits too |
| Building heavy infra (Tor, 2nd CDN) now is unnecessary for the upside | SUPPORTED | Lighter offline-first + multi-domain patterns are the better-precedented fit for low-bandwidth contexts; heavy infra can reduce reach |
| Tiered visibility is reachable via 001-08 | UNKNOWN/OPTIMISTIC | Correct as a spec, but 001-08 is blocked on Postgres (BLK-001) and no role primitive exists today (`auth.ts:66-79`) |

## Unknown Unknowns
- **Jurisdiction:** which country's legal process can compel the specific Supabase project (its region is unspecified) is a legal question no board member can resolve — and it determines whether "US-hosted, so hard for Venezuela to compel" is even true. Needs counsel.
- **No humanitarian data-protection specialist on this review** — the proposal itself flags this; my precedent grounding is a partial substitute, not equivalent to an ICRC/Sphere practitioner's sign-off.
- Whether Venezuela's specific technical capability includes network-level TLS interception at scale (affects how much the reachability/transport question matters) — I can't verify.

## Confidence Score
**0.72** — Why not higher: the two strongest precedents (Rohingya, TraceTogether) are directionally decisive but from other domains/regions; I cannot cite a Venezuela-2026-specific deployment postmortem, and the jurisdictional-compulsion question is genuinely legal, not researchable from engineering ground truth.
