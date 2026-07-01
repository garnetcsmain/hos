// Coordination domain model (HOS-2026-007, Judge-approved thin slice).
//
// Kept in its own module so the whole coordination epic is structurally
// isolated and PAUSABLE — nothing in the Phase 0 reunification matcher imports
// this. Only coordination sites, needs, and supplies are modeled here: people
// (volunteers, beneficiaries) are deliberately OUT of scope this cycle.
//
// Two board conditions are baked into the types:
//  - location is a coarse `district`, never a precise address (targeting risk);
//  - org/actor is a first-class entity NOW, so multi-org accountability is not a
//    later retrofit.

export type OrgKind =
  | "shelter"
  | "responder"
  | "ngo"
  | "government"
  | "hospital"
  | "other";

/** A participating organization — the accountable actor behind every site,
 *  need, and offer. Modeled now while the data is small (Board condition). */
export interface Org {
  id: string;
  createdAt: string;
  name: string;
  kind: OrgKind;
}

export type SiteStatus = "active" | "closed";

/** A shelter / coordination site and its live capacity. `district` is coarse on
 *  purpose — a precise map of where displaced people concentrate is a targeting
 *  risk (Board condition), and there is no public endpoint for this data. */
export interface Site {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  orgId: string;
  district: string;
  bedsTotal: number;
  bedsFree: number;
  status: SiteStatus;
  notes: string;
}

export type NeedCategory =
  | "water"
  | "food"
  | "formula"
  | "medical"
  | "shelter"
  | "hygiene"
  | "clothing"
  | "other";

export type Urgency = "low" | "normal" | "high" | "critical";

/** Honest lifecycle (Board condition): a need is open, then CLAIMED by an org
 *  that commits to serve it, then RECEIVED — and "received" may only be recorded
 *  by the requesting site, never optimistically by the claimer. "cancelled"
 *  retires a need without pretending it was met. */
export type NeedStatus = "open" | "claimed" | "received" | "cancelled";

export interface Need {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Requesting org. */
  orgId: string;
  /** Optional site this need is for. */
  siteId: string | null;
  district: string;
  category: NeedCategory;
  quantity: number;
  unit: string;
  urgency: Urgency;
  status: NeedStatus;
  /** Org that claimed the need (committed to serve it), if any. */
  claimedByOrgId: string | null;
  notes: string;
}

export type OfferStatus = "available" | "committed" | "depleted";

/** A supply an org can provide. Matched to needs only as an ADVISORY suggestion;
 *  a human always claims — nothing auto-fulfills (Board condition). */
export interface Offer {
  id: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  district: string;
  category: NeedCategory;
  quantity: number;
  unit: string;
  status: OfferStatus;
  notes: string;
}
