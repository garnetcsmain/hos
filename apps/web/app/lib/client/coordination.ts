// Browser client for the coordination board (HOS-2026-007). Reuses the shared
// request helper + coordinator token headers from api.ts. Every call is
// coordinator-gated server-side.

import { coordinatorHeaders, request } from "./api.ts";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";
import type { NeedCategory, Org, OrgKind, Urgency } from "@/app/lib/domain/coordination";

const write = <T>(path: string, body: unknown, method = "POST") =>
  request<T>(path, {
    method,
    headers: coordinatorHeaders(),
    body: JSON.stringify(body),
  });

export const getCoordinationBoard = () =>
  request<CoordinationView>("/api/coordination", { headers: coordinatorHeaders() });

export const createOrg = (payload: { name: string; kind: OrgKind }) =>
  write<{ org: Org }>("/api/coordination/orgs", payload);

export const createSite = (payload: {
  name: string;
  orgId: string;
  district: string;
  bedsTotal: number;
  bedsFree: number;
  notes?: string;
}) => write("/api/coordination/sites", payload);

export const updateSiteCapacity = (payload: {
  siteId: string;
  bedsTotal: number;
  bedsFree: number;
  status: "active" | "closed";
  notes?: string;
}) => write("/api/coordination/sites", payload, "PATCH");

export const createNeed = (payload: {
  orgId: string;
  siteId?: string;
  district: string;
  category: NeedCategory;
  quantity: number;
  unit?: string;
  urgency: Urgency;
  notes?: string;
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
}) => write("/api/coordination/offers", payload);
