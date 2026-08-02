// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { ConfirmationFreshness, Freshness } from "../coordination/freshness.ts";

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Decay of ANY write to the site (incl. a bed-count edit or nightly import).
   *  "Has this row changed recently?" — not the same as "is it still open?". */
  freshness: Freshness;
  /** Coordinator-only liveness signal (HOS-2026-014-01): the occurred_at of the
   *  most recent explicit "confirmar operativo" (site.confirmed), or null if the
   *  site has never been confirmed operative. Decays independently of `freshness`
   *  so a busy bed-count churn cannot masquerade as a fresh confirmation.
   *  Omitted on the contributor tier — steward cadence stays coordinator-only
   *  per HOS-2026-014-02. */
  confirmedAt?: string | null;
  confirmationFreshness?: ConfirmationFreshness;
}

export interface NeedView {
  need: Need;
  org: Org | null;
  claimedByOrg: Org | null;
  freshness: Freshness;
  /** Advisory offer suggestions — only for still-open needs. */
  matches: OfferMatch[];
}

export interface OfferView {
  offer: Offer;
  org: Org | null;
}

export interface CoordinationView {
  orgs: Org[];
  sites: SiteView[];
  needs: NeedView[];
  offers: OfferView[];
}
