// Read-model shapes for the coordination board (HOS-2026-007). Pure types only
// (no server imports) so both the service layer and the browser client can share
// them without drift.

import type { Need, Offer, Org, Site } from "./coordination.ts";
import type { OfferMatch } from "../coordination/match.ts";
import type { ConfirmationFreshness, Freshness } from "../coordination/freshness.ts";

/** The site's operational-confirmation state: when it was last confirmed
 *  operativo (a `site.confirmed` event) and the decaying freshness of that
 *  confirmation — distinct from `site.updatedAt`, which a bed-count edit or aviso
 *  also bumps. This is COORDINATOR-ONLY accountability: it is populated on the
 *  coordinator board and deliberately absent from the contributor/public read,
 *  whose presence cadence must stay coarse (HOS-2026-014-02 treats a leak of a
 *  single keeper's confirmation routine as a security bug). */
export interface SiteConfirmation {
  lastConfirmedAt: string | null;
  freshness: ConfirmationFreshness;
}

export interface SiteView {
  site: Site;
  org: Org | null;
  /** Freshness of the row overall (updatedAt — any edit renews it). */
  freshness: Freshness;
  /** Operational-confirmation freshness, present only on the coordinator board
   *  (HOS-2026-014-01, Judge D1). Absent on the contributor read by construction,
   *  so the cadence never reaches a lower tier. */
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
