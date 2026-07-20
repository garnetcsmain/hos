// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site, SiteTrustTier } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { Freshness } from "../coordination/freshness.ts";

/** A site's "operativo" liveness confirmation, decayed to a freshness signal
 *  (HOS-2026-014-01). Its own freshness, independent of bed-count freshness, so
 *  the two decay separately and a confirm can't launder a stale bed number.
 *  COORDINATOR-ONLY on the board: a precise steward-presence cadence is a
 *  targeting signal (Judge HOS-2026-014-D5), so public/contributor surfaces get
 *  null here and a coarsened band elsewhere. */
export interface SiteConfirmationView {
  freshness: Freshness;
  /** ISO timestamp of the last confirmation (coordinator-only). */
  at: string;
  /** 'honor' under interim auth — attributed by trust, identity unverified. */
  tier: SiteTrustTier;
}

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Bed-count / last-edit freshness (from updatedAt). */
  freshness: Freshness;
  /** Operativo-liveness confirmation, or null when never confirmed OR when the
   *  reader is not a coordinator (steward cadence is coordinator-only, D5). */
  confirmed: SiteConfirmationView | null;
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
