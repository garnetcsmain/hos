// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { Freshness } from "../coordination/freshness.ts";
import type { TrustTier } from "../coordination/trustTier.ts";

/** When a site was last CONFIRMED still operativo, as its own liveness signal
 *  (HOS-2026-014-01, Judge D1/D2). Deliberately separate from `freshness`: a
 *  bed-count edit bumps `updated_at` (so `freshness` reads fresh) but is NOT a
 *  confirmation, so it must not make the site look freshly attested. Derived
 *  from `site.confirmed` events, never from `updated_at`. */
export interface SiteConfirmation {
  /** occurredAt of the most recent `site.confirmed` event; null = the site has
   *  never been explicitly confirmed operativo (only created/edited). */
  confirmedAt: string | null;
  /** Freshness band of that confirmation; null when never confirmed. */
  freshness: Freshness | null;
  /** Trust tier stamped on that confirmation (honor|verified); null when never
   *  confirmed or when a legacy write carried no tier. */
  trust: TrustTier | null;
}

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Data freshness of the site row (capacity/status/notes), from `updated_at`. */
  freshness: Freshness;
  /** Independent operatividad-confirmation signal. Present on the coordinator
   *  board; intentionally OMITTED from the contributor tier, whose confirmation
   *  cadence must be coarsened to a staleness band before it is exposed
   *  (HOS-2026-014-02). */
  confirmation?: SiteConfirmation;
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
