"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  List,
  Map as MapIcon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { CoordinationMap } from "@/app/components/CoordinationMap";
import {
  startCoordinationTour,
  useCoordinationTourFirstRun,
} from "@/app/components/CoordinationTour";
import {
  BoardFilters,
  BoardList,
  CoordinatorBrief,
  CreateRecordFlow,
  DistrictFilterPill,
  type CreateKind,
} from "@/app/components/CoordinationConsoleSections";
import { getCoordinationBoard } from "@/app/lib/client/coordination";
import { matchesQuery } from "@/app/lib/coordination/consoleFilter";
import {
  CATEGORY_LABEL,
  NEED_STATUS,
  SITE_CATEGORY_LABEL,
  URGENCY,
} from "@/app/components/CoordinationLabels";
import { ApiError, COORDINATOR_TOKEN_KEY } from "@/app/lib/client/api";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  SUPABASE_TOKEN_KEY,
} from "@/app/lib/client/supabase";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";
import type { NeedCategory, SiteCategory, Urgency } from "@/app/lib/domain/coordination";

/** Refresh the mirrored Supabase access token before a request so a coordinator
 *  isn't 401'd after ~1h just because a tab stayed open (supabase-js refreshes
 *  the session under the hood; we mirror the fresh token for the Bearer header). */
async function refreshCoordinatorSession(): Promise<void> {
  if (!isSupabaseConfiguredClient() || typeof window === "undefined") return;
  const supabase = getBrowserSupabase();
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (token) window.localStorage.setItem(SUPABASE_TOKEN_KEY, token);
}

function hasAnyCredential(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!window.localStorage.getItem(SUPABASE_TOKEN_KEY) ||
    !!window.localStorage.getItem(COORDINATOR_TOKEN_KEY)
  );
}

/** Compact "updated N ago" label so a coordinator can trust how live the board
 *  is — stale needs/capacity in an active incident are a real operational risk. */
function formatAgo(from: number, now: number): string {
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 5) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return `hace ${h} h`;
}

// Live board: refetch on this cadence so an open console tracks the incident
// without a manual reload. Paused while a create form is open or the tab is
// hidden, so it never yanks the board out from under someone mid-entry.
const AUTO_REFRESH_MS = 45_000;

// How many cards to render per "Mostrar más" page. Both columns page: the
// imported board carries ~1000 needs and ~150 sites, and one unpaged column is
// enough to make the whole page scroll effectively forever (HOS-2026-007-09).
const NEEDS_PAGE = 60;
const SITES_PAGE = 30;

const URGENCY_RANK: Record<Urgency, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export function CoordinationConsole() {
  const router = useRouter();
  const [board, setBoard] = useState<CoordinationView | null>(null);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // null = board; "menu" = pick a record type; a CreateKind = that form only.
  const [createKind, setCreateKind] = useState<"menu" | CreateKind | null>(null);
  const creating = createKind !== null;
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [view, setView] = useState<"list" | "map">("list");
  const [district, setDistrict] = useState<string | null>(null);
  // The imported board carries ~1000 real need reports; render them in pages so
  // the list stays responsive. Resets when any filter changes.
  const [needsShown, setNeedsShown] = useState(NEEDS_PAGE);
  const [sitesShown, setSitesShown] = useState(SITES_PAGE);
  // Preset filters (apply to list AND map): one need category, one site
  // category, and a critical-only toggle. null = todos. Every setter goes
  // through pickFilter so the pagination window resets with the filter.
  const [needCat, setNeedCat] = useState<NeedCategory | null>(null);
  const [siteCat, setSiteCat] = useState<SiteCategory | null>(null);
  const [criticalOnly, setCriticalOnly] = useState(false);
  // Free-text search over both columns, and a staleness triage preset that
  // isolates sites unconfirmed for 24h+ so a coordinator can find and re-confirm
  // them (HOS-2026-013-01 / HOS-2026-014 staleness accountability — surfaced
  // for a human, never an automatic lapse).
  const [query, setQuery] = useState("");
  const [siteStale, setSiteStale] = useState(false);

  const pickFilter = (apply: () => void) => {
    apply();
    setNeedsShown(NEEDS_PAGE);
    setSitesShown(SITES_PAGE);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (reloadKey > 0) setRefreshing(true);
      await refreshCoordinatorSession();
      try {
        const res = await getCoordinationBoard();
        if (!active) return;
        setBoard(res);
        setError("");
        setDenied(false);
        setLastUpdated(Date.now());
      } catch (e: unknown) {
        if (!active) return;
        const status = e instanceof ApiError ? e.status : 0;
        if (status === 401 || status === 403) {
          // No credential at all -> truly logged out, send to sign-in. A present
          // but rejected session (expired / not on the allowlist) must NOT bounce
          // to /login (that loops); show an actionable message instead.
          if (!hasAnyCredential()) {
            router.replace("/login");
            return;
          }
          setDenied(true);
          setError("");
          return;
        }
        setError(e instanceof Error ? e.message : "No se pudo cargar la coordinación.");
      } finally {
        if (active) setRefreshing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  const reload = () => setReloadKey((k) => k + 1);

  // Keep the board live without a manual reload, and keep the "updated N ago"
  // label ticking. Auto-refresh pauses while a form is open or the tab is hidden.
  useEffect(() => {
    const refresh = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (creating) return;
      setReloadKey((k) => k + 1);
    }, AUTO_REFRESH_MS);
    const tick = setInterval(() => setNowTick(Date.now()), 1_000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [creating]);

  // First-time coordinators get a short guided walkthrough once the board loads.
  useCoordinationTourFirstRun(board !== null && !denied && !error);

  const openHelp = () => {
    setView("list"); // tour anchors live in the list view
    startCoordinationTour();
  };

  // Category/urgency presets applied BEFORE the district filter, and fed to the
  // map too, so the badges/pins show exactly what the list shows.
  const filteredBoard = useMemo(() => {
    if (!board) return null;
    return {
      ...board,
      needs: board.needs.filter(
        (v) =>
          (!needCat || v.need.category === needCat) &&
          (!criticalOnly || v.need.urgency === "critical") &&
          matchesQuery(
            [
              v.need.quantity,
              v.need.unit,
              CATEGORY_LABEL[v.need.category],
              v.need.district,
              v.org?.name,
              v.claimedByOrg?.name,
              v.need.notes,
              URGENCY[v.need.urgency].label,
              NEED_STATUS[v.need.status]?.label,
            ],
            query,
          ),
      ),
      sites: board.sites.filter(
        (v) =>
          (!siteCat || v.site.category === siteCat) &&
          // "Vencidos" triages by OPERATIONAL confirmation, not any edit: a site
          // whose beds were touched an hour ago but that nobody has confirmed
          // operativo in 24h+ still belongs on the re-confirm list (HOS-2026-014 D2).
          (!siteStale || v.confirmationFreshness === "stale") &&
          matchesQuery(
            [
              v.site.name,
              v.org?.name,
              v.site.district,
              SITE_CATEGORY_LABEL[v.site.category],
              v.site.notes,
            ],
            query,
          ),
      ),
    };
  }, [board, needCat, siteCat, criticalOnly, siteStale, query]);

  const sortedNeeds = useMemo(() => {
    if (!filteredBoard) return [];
    const openFirst = (s: string) => (s === "open" ? 0 : s === "claimed" ? 1 : 2);
    return [...filteredBoard.needs].sort((a, b) => {
      const byStatus = openFirst(a.need.status) - openFirst(b.need.status);
      if (byStatus !== 0) return byStatus;
      return URGENCY_RANK[a.need.urgency] - URGENCY_RANK[b.need.urgency];
    });
  }, [filteredBoard]);

  const metrics = useMemo(() => {
    if (!board) return { open: 0, critical: 0, beds: 0, sites: 0 };
    const open = board.needs.filter((n) => n.need.status === "open");
    return {
      open: open.length,
      critical: open.filter((n) => n.need.urgency === "critical").length,
      beds: board.sites.reduce((s, v) => s + v.site.bedsFree, 0),
      sites: board.sites.length,
    };
  }, [board]);

  const orgs = board?.orgs ?? [];
  const allSites = filteredBoard?.sites ?? [];
  const allOffers = board?.offers ?? [];
  const visibleNeeds = district ? sortedNeeds.filter((v) => v.need.district === district) : sortedNeeds;
  const pagedNeeds = visibleNeeds.slice(0, needsShown);
  const visibleSites = district ? allSites.filter((v) => v.site.district === district) : allSites;
  const pagedSites = visibleSites.slice(0, sitesShown);
  const visibleOffers = district ? allOffers.filter((v) => v.offer.district === district) : allOffers;

  const openCreate = () => {
    setView("list");
    setCreateKind((k) => (k ? null : "menu"));
  };

  // After a successful create, return to the board so the new record is
  // immediately visible in context.
  const onCreated = () => {
    reload();
    setCreateKind(null);
  };

  const activeSites = useMemo(
    () =>
      (board?.sites ?? [])
        .filter((v) => v.site.status === "active")
        .map((v) => v.site)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [board],
  );

  return (
    <AppShell
      title="Coordinación de respuesta"
      subtitle="Sitios, necesidades y suministros · solo coordinadores"
    >
      <div className="flex flex-1 flex-col gap-[18px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        {board === null && !error && !denied ? (
          <p className="text-[14px] font-bold text-[var(--hos-muted)]">Cargando coordinación…</p>
        ) : denied ? (
          <div className="rounded-[8px] border border-[#F1D8D2] bg-[#FCF1EF] px-[18px] py-[16px]">
            <div className="text-[14px] font-extrabold text-[#8A2C20]">Acceso no autorizado</div>
            <p className="mt-[6px] text-[13px] font-bold leading-[18px] text-[#8A2C20]">
              Su sesión expiró o no tiene acceso. Inicie sesión con una cuenta autorizada.
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(SUPABASE_TOKEN_KEY);
                  window.localStorage.removeItem(COORDINATOR_TOKEN_KEY);
                }
                router.replace("/login");
              }}
              className="mt-[14px] inline-flex h-[38px] items-center rounded-[6px] bg-[var(--hos-dark)] px-[16px] text-[13px] font-extrabold text-white transition hover:opacity-90"
            >
              Iniciar sesión
            </button>
          </div>
        ) : error ? (
          <div className="rounded-[8px] border border-[#F1D8D2] bg-[#FCF1EF] px-[16px] py-[14px] text-[14px] font-bold text-[#8A2C20]">
            {error}
          </div>
        ) : board ? (
          <>
            {!creating ? <CoordinatorBrief metrics={metrics} /> : null}

            <div className="flex items-center justify-between gap-[12px] max-[620px]:flex-col max-[620px]:items-stretch">
              <div className="flex items-center gap-[14px]">
                <h2 className="text-[16px] font-extrabold text-[var(--hos-text)]">
                  {creating ? "Nuevo registro" : "Panel de coordinación"}
                </h2>
                <div
                  data-tour="view-toggle"
                  className={`flex items-center gap-[2px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[3px] ${creating ? "hidden" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-pressed={view === "list"}
                    className={`inline-flex h-[30px] items-center gap-[5px] rounded-[6px] px-[10px] text-[12px] font-extrabold transition ${view === "list" ? "bg-[var(--hos-dark)] text-white" : "text-[var(--hos-muted)] hover:text-[var(--hos-text)]"}`}
                  >
                    <List className="h-[13px] w-[13px]" strokeWidth={2.4} /> Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("map")}
                    aria-pressed={view === "map"}
                    className={`inline-flex h-[30px] items-center gap-[5px] rounded-[6px] px-[10px] text-[12px] font-extrabold transition ${view === "map" ? "bg-[var(--hos-dark)] text-white" : "text-[var(--hos-muted)] hover:text-[var(--hos-text)]"}`}
                  >
                    <MapIcon className="h-[13px] w-[13px]" strokeWidth={2.4} /> Mapa
                  </button>
                </div>
                <button
                  type="button"
                  onClick={openHelp}
                  className={`inline-flex h-[30px] items-center gap-[5px] rounded-[6px] px-[8px] text-[12px] font-extrabold text-[var(--hos-muted)] transition hover:text-[var(--hos-text)] ${creating ? "hidden" : ""}`}
                >
                  <HelpCircle className="h-[15px] w-[15px]" strokeWidth={2.2} />
                  <span className="max-[620px]:hidden">¿Cómo funciona?</span>
                </button>
              </div>
              <div className="flex items-center gap-[10px]">
                <button
                  type="button"
                  onClick={reload}
                  disabled={refreshing}
                  data-tour="refresh"
                  aria-label="Actualizar el panel"
                  className="inline-flex h-[38px] items-center gap-[6px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[12px] text-[12px] font-extrabold text-[var(--hos-muted)] transition hover:text-[var(--hos-text)] disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-[14px] w-[14px] ${refreshing ? "animate-spin" : ""}`}
                    strokeWidth={2.4}
                  />
                  {lastUpdated ? (
                    <span className="max-[520px]:hidden">{formatAgo(lastUpdated, nowTick)}</span>
                  ) : (
                    <span className="max-[520px]:hidden">Actualizar</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={openCreate}
                  data-tour="new-record"
                  className="inline-flex h-[38px] items-center gap-[6px] rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[13px] font-extrabold text-white"
                >
                  <Plus className="h-[15px] w-[15px]" strokeWidth={2.6} /> {creating ? "Cerrar" : "Nuevo registro"}
                </button>
              </div>
            </div>

            {!creating ? (
              <BoardFilters
                needCat={needCat}
                siteCat={siteCat}
                criticalOnly={criticalOnly}
                siteStale={siteStale}
                query={query}
                onQueryChange={(q) => pickFilter(() => setQuery(q))}
                onResetNeeds={() =>
                  pickFilter(() => {
                    setNeedCat(null);
                    setCriticalOnly(false);
                  })
                }
                onToggleNeed={(c) => pickFilter(() => setNeedCat(needCat === c ? null : c))}
                onToggleCritical={() => pickFilter(() => setCriticalOnly((v) => !v))}
                onResetSites={() => pickFilter(() => setSiteCat(null))}
                onToggleSite={(c) => pickFilter(() => setSiteCat(siteCat === c ? null : c))}
                onToggleStale={() => pickFilter(() => setSiteStale((v) => !v))}
              />
            ) : null}

            {creating && createKind ? (
              <CreateRecordFlow
                createKind={createKind}
                setCreateKind={setCreateKind}
                orgs={orgs}
                activeSites={activeSites}
                onCreated={onCreated}
                onClose={() => setCreateKind(null)}
              />
            ) : view === "map" && filteredBoard ? (
              <CoordinationMap
                board={filteredBoard}
                activeDistrict={district}
                onSelect={(d) => {
                  setDistrict(d);
                  setNeedsShown(NEEDS_PAGE);
                  setSitesShown(SITES_PAGE);
                  if (d) setView("list");
                }}
              />
            ) : (
              <>
                <DistrictFilterPill
                  district={district}
                  visibleNeedsCount={visibleNeeds.length}
                  visibleSitesCount={visibleSites.length}
                  onClear={() => {
                    setDistrict(null);
                    setNeedsShown(NEEDS_PAGE);
                    setSitesShown(SITES_PAGE);
                  }}
                />
                <BoardList
                  visibleNeeds={visibleNeeds}
                  visibleSites={visibleSites}
                  visibleOffers={visibleOffers}
                  pagedNeeds={pagedNeeds}
                  pagedSites={pagedSites}
                  orgs={orgs}
                  onReload={reload}
                  onShowMore={() => setNeedsShown((n) => n + NEEDS_PAGE)}
                  onShowMoreSites={() => setSitesShown((n) => n + SITES_PAGE)}
                />
              </>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
