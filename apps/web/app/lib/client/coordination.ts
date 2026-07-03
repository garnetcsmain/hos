// Browser client for the coordination board (HOS-2026-007). Reuses the shared
// request helper + coordinator token headers from api.ts. Every call is
// coordinator-gated server-side.

import { coordinatorHeaders, request } from "./api.ts";
import type { CoordinationView, SiteView } from "@/app/lib/domain/coordinationViews";
import type { NeedCategory, Org, OrgKind, SiteCategory, Urgency } from "@/app/lib/domain/coordination";

const write = <T>(path: string, body: unknown, method = "POST") =>
  request<T>(path, {
    method,
    headers: coordinatorHeaders(),
    body: JSON.stringify(body),
  });

export const getCoordinationBoard = () =>
  request<CoordinationView>("/api/coordination", { headers: coordinatorHeaders() });

// Who am I? Branches the console between coordinator and contributor.
export interface Me {
  authenticated: boolean;
  isCoordinator: boolean;
  email: string | null;
  userId: string | null;
}
export const getMe = () => request<Me>("/api/me", { headers: coordinatorHeaders() });

// Contributor read: public aid points + which ones I may manage. No needs board.
export interface ContributorBoard {
  orgs: Org[];
  sites: SiteView[];
  managedSiteIds: string[];
}
export const getMyBoard = () =>
  request<ContributorBoard>("/api/coordination/mine", { headers: coordinatorHeaders() });

// Peer site-coordinator delegation (responsable-only, enforced server-side).
export interface SiteGrant {
  siteId: string;
  email: string;
  grantedBy: string;
  createdAt: string;
  expiresAt: string | null;
}
export const listSiteAccess = (siteId: string) =>
  request<{ grants: SiteGrant[] }>(`/api/coordination/sites/access?siteId=${encodeURIComponent(siteId)}`, {
    headers: coordinatorHeaders(),
  });
export const grantSiteAccess = (payload: { siteId: string; email: string; hoursValid?: number | null }) =>
  write("/api/coordination/sites/access", payload);
export const revokeSiteAccess = (payload: { siteId: string; email: string }) =>
  write("/api/coordination/sites/access", payload, "DELETE");

export const createOrg = (payload: { name: string; kind: OrgKind }) =>
  write<{ org: Org }>("/api/coordination/orgs", payload);

export const createSite = (payload: {
  name: string;
  orgId: string;
  category?: SiteCategory;
  district: string;
  lat?: number | null;
  lng?: number | null;
  radiusM?: number | null;
  bedsTotal: number;
  bedsFree: number;
  notes?: string;
  otherLabel?: string;
}) => write("/api/coordination/sites", payload);

export const updateSiteCapacity = (payload: {
  siteId: string;
  bedsTotal: number;
  bedsFree: number;
  status: "active" | "closed";
  notes?: string;
}) => write("/api/coordination/sites", payload, "PATCH");

// Empty message clears the broadcast.
export const setSiteAnnouncement = (payload: {
  siteId: string;
  message: string;
  hoursValid?: number;
}) => write("/api/coordination/sites/announcement", payload);

export const createNeed = (payload: {
  orgId: string;
  siteId?: string;
  district: string;
  category: NeedCategory;
  quantity: number;
  unit?: string;
  urgency: Urgency;
  notes?: string;
  otherLabel?: string;
}) => write("/api/coordination/needs", payload);

export const transitionNeed = (payload: {
  needId: string;
  action: "claim" | "receive" | "cancel";
  byOrgId?: string;
  note?: string;
}) => write("/api/coordination/needs", payload, "PATCH");

export const createOffer = (payload: {
  orgId: string;
  district: string;
  category: NeedCategory;
  quantity: number;
  unit?: string;
  notes?: string;
  otherLabel?: string;
}) => write("/api/coordination/offers", payload);
