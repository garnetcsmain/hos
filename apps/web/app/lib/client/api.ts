// Client-side API helpers. Only imports pure type modules so no server code is
// pulled into the browser bundle. Coordinator calls attach a token from
// localStorage when present (dev: the server gate is open when unset).

import type {
  FoundReport,
  HosEvent,
  MatchCandidate,
  MissingReport,
  Notification,
  Verification,
} from "@/app/lib/domain/types";
import type { PublicFound, PublicMissing } from "@/app/lib/domain/projections";

export interface DashboardData {
  missing: number;
  found: number;
  candidates: number;
  pending: number;
  confirmed: number;
  notifications: number;
  recentEvents: HosEvent[];
  aiEnabled: boolean;
}

export interface CreateResult {
  id: string;
  status: string;
  candidates: number;
}

export interface SearchResult {
  missing: PublicMissing[];
  found: PublicFound[];
}

export interface CandidateView {
  candidate: MatchCandidate;
  missing: MissingReport;
  found: FoundReport;
  /** How many other open reports share this candidate's name (Board D1
   *  base-rate signal). High values mean a strong name match is less
   *  conclusive — a common name, not necessarily the same person. */
  nameBaseRate: number;
}

export interface CandidateDetail extends CandidateView {
  verifications: Verification[];
  timeline: HosEvent[];
}

export interface VerifyResult {
  verificationId: string;
  decision: string;
  resolved: boolean;
  notificationId: string | null;
}

const COORDINATOR_TOKEN_KEY = "hos_coordinator_token";

function coordinatorHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(COORDINATOR_TOKEN_KEY);
  return token ? { "x-hos-coordinator-token": token } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `request failed (${response.status})`);
  }
  return data as T;
}

// --- Public ---------------------------------------------------------------

export const getDashboard = () => request<DashboardData>("/api/dashboard");

export const listMissing = () => request<{ reports: PublicMissing[] }>("/api/missing");

export const listFound = () => request<{ reports: PublicFound[] }>("/api/found");

export const searchPublic = (query: string) =>
  request<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`);

export const createMissing = (payload: unknown) =>
  request<CreateResult>("/api/missing", { method: "POST", body: JSON.stringify(payload) });

export const createFound = (payload: unknown) =>
  request<CreateResult>("/api/found", { method: "POST", body: JSON.stringify(payload) });

// --- Coordinator ----------------------------------------------------------

export const listMatches = (status?: string) =>
  request<{ candidates: CandidateView[] }>(
    `/api/matches${status ? `?status=${status}` : ""}`,
    { headers: coordinatorHeaders() },
  );

export const getCandidate = (id: string) =>
  request<CandidateDetail>(`/api/matches/${id}`, { headers: coordinatorHeaders() });

export const verifyCandidate = (payload: unknown) =>
  request<VerifyResult>("/api/verify", {
    method: "POST",
    headers: coordinatorHeaders(),
    body: JSON.stringify(payload),
  });

export const listNotifications = () =>
  request<{ notifications: Notification[] }>("/api/notifications", { headers: coordinatorHeaders() });

export const recomputeMatches = () =>
  request<{ missing: number; newCandidates: number }>("/api/matches/recompute", {
    method: "POST",
    headers: coordinatorHeaders(),
  });
