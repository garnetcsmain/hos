// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { Freshness } from "../coordination/freshness.ts";
import type { SiteConfirmation } from "../coordination/siteConfirmation.ts";

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Freshness of the site's CAPACITY/state row (updatedAt-derived): "when did
   *  anything about this site last change". */
  freshness: Freshness;
  /** Freshness of the last explicit "confirmar operativo", on its OWN timeline
   *  (HOS-2026-014-01, Judge D1). Optional: the coordinator board computes it;
   *  the contributor read omits it (per-site history is coordinator-only). */
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
