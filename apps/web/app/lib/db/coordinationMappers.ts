// Row -> domain mappers for the coordination epic (HOS-2026-007). Kept separate
// from mappers.ts so the coordination slice stays isolated and pausable.

import type {
  NeedCategory,
  Need,
  NeedStatus,
  Offer,
  OfferStatus,
  Org,
  OrgKind,
  Site,
  SiteCategory,
  SiteStatus,
  Urgency,
} from "@/app/lib/domain/coordination";
import type { Row } from "./mappers.ts";

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));
const strOrNull = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);
const num = (v: unknown): number => Number(v ?? 0);
const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

export function mapOrg(row: Row): Org {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    name: str(row.name),
    kind: str(row.kind) as OrgKind,
  };
}

export function mapSite(row: Row): Site {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    name: str(row.name),
    orgId: str(row.org_id),
    district: str(row.district),
    category: (str(row.category) || "otro") as SiteCategory,
    lat: numOrNull(row.lat),
    lng: numOrNull(row.lng),
    bedsTotal: num(row.beds_total),
    bedsFree: num(row.beds_free),
    status: str(row.status) as SiteStatus,
    notes: str(row.notes),
  };
}

export function mapNeed(row: Row): Need {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    orgId: str(row.org_id),
    siteId: strOrNull(row.site_id),
    district: str(row.district),
    category: str(row.category) as NeedCategory,
    quantity: num(row.quantity),
    unit: str(row.unit),
    urgency: str(row.urgency) as Urgency,
    status: str(row.status) as NeedStatus,
    claimedByOrgId: strOrNull(row.claimed_by_org_id),
    notes: str(row.notes),
  };
}

export function mapOffer(row: Row): Offer {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    orgId: str(row.org_id),
    district: str(row.district),
    category: str(row.category) as NeedCategory,
    quantity: num(row.quantity),
    unit: str(row.unit),
    status: str(row.status) as OfferStatus,
    notes: str(row.notes),
  };
}
