// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { Freshness } from "../coordination/freshness.ts";

export interface SiteView {
  site: Site;
  org: Org | null;
  freshness: Freshness;
  /** Freshness of the site's last OPERATIONAL confirmation (site.created or
   *  site.confirmed) — distinct from `freshness`, which any edit refreshes.
   *  `null` = no confirmation on record (e.g. an unconfirmed feed import).
   *  Populated only on the coordinator board; the contributor read omits it
   *  (contributors must not read per-site history). */
  confirmedFreshness?: Freshness | null;
  /** ISO timestamp of that last confirmation, or null if never confirmed. */
  lastConfirmedAt?: string | null;
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
