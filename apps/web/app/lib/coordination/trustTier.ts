// Trust tier of a site-stewardship write (HOS-2026-014-01, Judge D1/D2).
//
// The board's single non-negotiable for the honest interim stewardship slice is
// that EVERY liveness write records the trust tier of whoever made it — and that
// this is done NOW, because the event store is append-only: a `site.confirmed`
// or `site.capacity_updated` row written today without a trust label can never
// be re-labelled later. It is prevent-now-or-never, so we stamp it on the write.
//
// Honesty rule (matches the AAL2 / per-person-attribution honesty running
// through the repo — attribution != trustworthiness):
//   - `verified` ONLY when the write comes from an invite-only COORDINATOR whose
//     identity is actually attested — i.e. a signed-in Supabase coordinator with
//     a real userId. That is the strongest identity assurance the system has
//     today (email-verified + on the coordinator allowlist).
//   - `honor` for everything else: the shared operator token and the dev-open
//     escape hatch (isCoordinator but NO userId — they cannot attribute to a
//     person), a self-signup contributor managing their own site (self-declared,
//     not coordinator-vouched), and system/seed/legacy writes.
//
// A coordinator-vouched STEWARD grant would also be `verified` once that record
// exists; until then the only `verified` writer is the coordinator themselves.

export type TrustTier = "honor" | "verified";

/** The subset of a SiteActor that determines trust. Kept structural so this
 *  module stays free of service/auth imports and is trivially unit-testable. */
export interface TrustSubject {
  isCoordinator: boolean;
  userId: string | null;
}

/** Trust tier to stamp on a stewardship write. `verified` requires BOTH the
 *  invite-only coordinator tier AND an attested identity (a real userId); a
 *  shared-token coordinator is honestly `honor` because it names no person. */
export function trustTierOf(subject: TrustSubject): TrustTier {
  return subject.isCoordinator && !!subject.userId ? "verified" : "honor";
}
