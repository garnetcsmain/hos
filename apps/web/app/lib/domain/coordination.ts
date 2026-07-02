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

/** What kind of public aid point a site is. Spanish values on purpose — they are
 *  shown verbatim in the UI and match the vocabulary of the field data
 *  (caracasayuda.com import, HOS-2026-007). */
export type SiteCategory =
  | "acopio"
  | "refugio"
  | "medico"
  | "internet"
  | "mascotas"
  | "otro";

/** A public aid point (collection center, shelter, medical point…) and its live
 *  capacity. `district` stays coarse for rollups; `lat`/`lng` are only set for
 *  points that are ALREADY published on a public map (e.g. caracasayuda.com), so
 *  showing them precisely adds no targeting risk beyond the public source
 *  (Board condition HOS-2026-007 refined). Needs never carry coordinates. */
export interface Site {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  orgId: string;
  district: string;
  category: SiteCategory;
  /** Precise position, only for publicly-listed aid points; null otherwise. */
  lat: number | null;
  lng: number | null;
  bedsTotal: number;
  bedsFree: number;
  status: SiteStatus;
  notes: string;
}

export type NeedCategory =
  | "rescue"
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
