// Coordination domain model (HOS-2026-007, Judge-approved thin slice).
//
// Kept in its own module so the whole coordination epic is structurally
// isolated and PAUSABLE — nothing in the Phase 0 reunification matcher imports
// this. Only coordination sites, needs, and supplies are modeled here: people
// (volunteers, beneficiaries) are deliberately OUT of scope this cycle.
//
// Board conditions baked into the types, as amended by the human D1 answer
// (docs/decision-log/2026-07-01-HOS-008-threat-model-operating-posture/
// human_answer_D1.yaml, 2026-07-03):
//  - `district` stays the coarse rollup key on every record;
//  - precise lat/lng IS allowed on needs and sites INSIDE the coordinator-gated
//    console (responders need the exact spot; the protection boundary is the
//    auth gate, not coordinate coarsening). Public surfaces stay coarse.
//  - org/actor is a first-class entity NOW, so multi-org accountability is not a
//    later retrofit.

export type OrgKind =
  | "shelter"
  | "responder"
  | "ngo"
  | "government"
  | "hospital"
  // Expanded 2026-07-03 (human direction: "una lista más grande") — the real
  // actors showing up in the field data: churches run acopios, neighborhood
  // groups run zones, companies donate logistics.
  | "church"
  | "community"
  | "volunteers"
  | "school"
  | "business"
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

/** Trust tier of a stewardship write (HOS-2026-014-01). Under interim shared-token
 *  auth every confirmation is 'honor' — attributed by trust, identity NOT verified.
 *  'verified' is reserved for when a real per-user identity substrate exists
 *  (HOS-2026-010/011); until then the UI must never render an honor-tier
 *  confirmation as verified accountability (Judge D2). The flag is stamped on every
 *  write because append-only auditability makes the era impossible to reconstruct
 *  later (Judge D1, prevent-now-or-never). */
export type SiteTrustTier = "honor" | "verified";

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
 *  capacity. `district` stays coarse for rollups; `lat`/`lng` are shown only
 *  inside the coordinator-gated console (human D1 answer 2026-07-03). */
export interface Site {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  orgId: string;
  district: string;
  category: SiteCategory;
  /** Precise position when known; null otherwise. */
  lat: number | null;
  lng: number | null;
  bedsTotal: number;
  bedsFree: number;
  status: SiteStatus;
  notes: string;
  /** caracasayuda.com record id when this row was imported/synced from the
   *  public map; null for records created directly in HOS. Direct records are
   *  NEVER touched by the sync (human precedence rule, 2026-07-03). */
  sourceId: string | null;
  /** Last time the sync reconciled this row with its source. A local edit after
   *  this instant (updatedAt > syncedAt) protects the row from being
   *  overwritten by later syncs. Null for records created directly in HOS. */
  syncedAt: string | null;
  /** Broadcast from the site's responsible party ("hoy entregan comida
   *  2-5pm"). Shown on the map/console only while unexpired; set by a
   *  coordinator today, by the site:<id> capability scope once HOS-2026-011
   *  lands. Empty string = no announcement. */
  announcement: string;
  announcementUntil: string | null;
  /** Coverage radius in meters. A site is a POINT (null) or an AREA a group
   *  covers — several groups may legitimately share one address/district by
   *  covering different zones (human direction 2026-07-03). */
  radiusM: number | null;
  /** The responsable: whoever created the site owns it and may manage or
   *  delegate it (human direction 2026-07-03). Null for imported/legacy rows
   *  (those are coordinator-managed). */
  createdByUserId: string | null;
  createdByEmail: string | null;
  /** When someone last confirmed this site is operativo (one-tap liveness),
   *  or null if never. Kept SEPARATE from updatedAt/bed-count freshness so an
   *  easy confirm can never launder a stale bed number (Judge HOS-2026-014-D3). */
  lastConfirmedAt: string | null;
  /** Trust tier of that confirmation ('honor' under interim auth). Null when
   *  never confirmed. Rendered honestly — an honor confirmation is NOT verified
   *  accountability (Judge HOS-2026-014-D2). */
  lastConfirmedTier: SiteTrustTier | null;
}

/** The announcement to display right now, or null if none/expired. Expiry is
 *  a display rule (the record keeps its history in the event log). */
export function activeAnnouncement(site: Site, nowIso: string): string | null {
  if (!site.announcement) return null;
  if (site.announcementUntil && Date.parse(site.announcementUntil) < Date.parse(nowIso)) return null;
  return site.announcement;
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
  /** Precise position when the report carries a trustworthy one (its pin agrees
   *  with its text-derived district) — coordinator-gated display only (human D1
   *  answer 2026-07-03: responders need the exact spot). Null → the need shows
   *  at its district centroid. */
  lat: number | null;
  lng: number | null;
  category: NeedCategory;
  quantity: number;
  unit: string;
  urgency: Urgency;
  status: NeedStatus;
  /** Org that claimed the need (committed to serve it), if any. */
  claimedByOrgId: string | null;
  notes: string;
  /** See Site.sourceId — same provenance/precedence semantics. */
  sourceId: string | null;
  syncedAt: string | null;
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
