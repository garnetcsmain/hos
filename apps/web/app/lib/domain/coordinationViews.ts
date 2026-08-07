// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { Freshness } from "../coordination/freshness.ts";

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Data freshness from the site's last write of ANY kind (updatedAt). */
  freshness: Freshness;
  /** Freshness of the last OPERATIONAL confirmation ("confirmar operativo"),
   *  which a bed-count edit does not reset (HOS-2026-014-01 D2). "stale" also
   *  when the site was never confirmed in HOS (site.lastConfirmedAt === null);
   *  the raw lastConfirmedAt distinguishes never-confirmed from gone-stale. */
  confirmationFreshness: Freshness;
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
