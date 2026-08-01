// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { ConfirmFreshness, Freshness } from "../coordination/freshness.ts";

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Freshness of any edit to the site (bumped by a bed-count change too). */
  freshness: Freshness;
  /** Freshness of the last one-tap "confirmar operativo" (site.confirmed event),
   *  a SEPARATE liveness clock from `freshness` so a bed-count tweak cannot
   *  masquerade as a re-confirmation. "unconfirmed" = never confirmed through
   *  HOS (HOS-2026-014-01, Judge D1). */
  confirmFreshness: ConfirmFreshness;
  /** ISO timestamp of the last `site.confirmed` event, or null if never. */
  lastConfirmedAt: string | null;
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
