"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, HelpCircle, List, Map as MapIcon, Plus, RefreshCw, X } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { Term } from "@/app/components/Term";
import { CoordinationMap } from "@/app/components/CoordinationMap";
import {
  startCoordinationTour,
  useCoordinationTourFirstRun,
} from "@/app/components/CoordinationTour";
import {
  AddOrgForm,
  AddSiteForm,
  NeedCard,
  OfferCard,
  PostNeedForm,
  PostOfferForm,
  SiteCard,
} from "@/app/components/CoordinationParts";
import { getCoordinationBoard } from "@/app/lib/client/coordination";
import { ApiError, COORDINATOR_TOKEN_KEY } from "@/app/lib/client/api";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  SUPABASE_TOKEN_KEY,
} from "@/app/lib/client/supabase";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";
import type { Urgency } from "@/app/lib/domain/coordination";

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

const URGENCY_RANK: Record<Urgency, number> = { critical: 0, high: 1, normal: 2, low: 3 };

function Metric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white px-[16px] py-[12px]">
      <div className={`font-data text-[24px] font-bold leading-none ${color}`}>{value}</div>
      <div className="mt-[6px] text-[12px] font-bold text-[var(--hos-muted)]">{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
      <div className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--hos-muted)]">{title}</div>
      <div className="mt-[10px]">{children}</div>
    </div>
  );
}

export function CoordinationConsole() {
  const router = useRouter();
  const [board, setBoard] = useState<CoordinationView | null>(null);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [view, setView] = useState<"list" | "map">("list");
  const [district, setDistrict] = useState<string | null>(null);

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

  const sortedNeeds = useMemo(() => {
    if (!board) return [];
    const openFirst = (s: string) => (s === "open" ? 0 : s === "claimed" ? 1 : 2);
    return [...board.needs].sort((a, b) => {
      const byStatus = openFirst(a.need.status) - openFirst(b.need.status);
      if (byStatus !== 0) return byStatus;
      return URGENCY_RANK[a.need.urgency] - URGENCY_RANK[b.need.urgency];
    });
  }, [board]);

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
  const allSites = board?.sites ?? [];
  const allOffers = board?.offers ?? [];
  const visibleNeeds = district ? sortedNeeds.filter((v) => v.need.district === district) : sortedNeeds;
  const visibleSites = district ? allSites.filter((v) => v.site.district === district) : allSites;
  const visibleOffers = district ? allOffers.filter((v) => v.offer.district === district) : allOffers;

  const openCreate = () => {
    setView("list");
    setCreating((v) => !v);
  };

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
            <section className="flex items-start gap-[12px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
              <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#EEF6F2]">
                <Boxes className="h-5 w-5 text-[var(--hos-green)]" strokeWidth={2.2} />
              </span>
              <p className="text-[12px] font-bold leading-[17px] text-[var(--hos-muted)]">
                Solo coordinadores · no es pública. Ubicaciones por <Term k="distrito">distrito</Term>. Un suministro
                se marca <span className="font-extrabold"><Term k="recibido">recibido</Term></span> solo cuando el sitio
                lo confirma, nunca automático. Las sugerencias son solo una guía: decide una persona.
              </p>
            </section>

            <div data-tour="metrics" className="grid grid-cols-4 gap-[12px] max-[760px]:grid-cols-2">
              <Metric value={metrics.open} label="necesidades abiertas" color="text-[var(--hos-warn)]" />
              <Metric value={metrics.critical} label="críticas" color="text-[var(--hos-red)]" />
              <Metric value={metrics.beds} label="camas libres" color="text-[var(--hos-green)]" />
              <Metric value={metrics.sites} label="sitios" color="text-[var(--hos-blue)]" />
            </div>

            <div className="flex items-center justify-between gap-[12px] max-[620px]:flex-col max-[620px]:items-stretch">
              <div className="flex items-center gap-[14px]">
                <h2 className="text-[16px] font-extrabold text-[var(--hos-text)]">Panel de coordinación</h2>
                <div data-tour="view-toggle" className="flex items-center gap-[2px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[3px]">
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
                  className="inline-flex h-[30px] items-center gap-[5px] rounded-[6px] px-[8px] text-[12px] font-extrabold text-[var(--hos-muted)] transition hover:text-[var(--hos-text)]"
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

            {view === "map" ? (
              <CoordinationMap
                board={board}
                activeDistrict={district}
                onSelect={(d) => {
                  setDistrict(d);
                  if (d) setView("list");
                }}
              />
            ) : (
              <>
                {creating ? (
                  <div className="grid grid-cols-2 gap-[12px] max-[900px]:grid-cols-1">
                    <Panel title="Publicar necesidad"><PostNeedForm orgs={orgs} onChanged={reload} /></Panel>
                    <Panel title="Publicar suministro"><PostOfferForm orgs={orgs} onChanged={reload} /></Panel>
                    <Panel title="Agregar sitio"><AddSiteForm orgs={orgs} onChanged={reload} /></Panel>
                    <Panel title="Registrar organización"><AddOrgForm onChanged={reload} /></Panel>
                  </div>
                ) : null}

                {district ? (
                  <div>
                    <span className="inline-flex items-center gap-[8px] rounded-full bg-[#EEF2EF] px-[12px] py-[6px] text-[12px] font-extrabold text-[var(--hos-text)]">
                      Distrito: {district}
                      <button type="button" onClick={() => setDistrict(null)} aria-label="Quitar filtro de distrito">
                        <X className="h-[13px] w-[13px]" strokeWidth={2.6} />
                      </button>
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[18px] max-[1100px]:grid-cols-1">
                  <section data-tour="needs">
                    <div className="mb-[10px] flex items-center justify-between">
                      <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Necesidades</h3>
                      <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{visibleNeeds.length}</span>
                    </div>
                    <div className="flex flex-col gap-[12px]">
                      {visibleNeeds.length === 0 ? (
                        <p className="text-[13px] font-bold text-[var(--hos-muted)]">No hay necesidades registradas.</p>
                      ) : (
                        visibleNeeds.map((v) => <NeedCard key={v.need.id} view={v} orgs={orgs} onChanged={reload} />)
                      )}
                    </div>
                  </section>

                  <div className="flex flex-col gap-[18px]">
                    <section>
                      <div className="mb-[10px] flex items-center justify-between">
                        <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Sitios y capacidad</h3>
                        <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{visibleSites.length}</span>
                      </div>
                      <div className="flex flex-col gap-[12px]">
                        {visibleSites.map((v) => <SiteCard key={v.site.id} view={v} onChanged={reload} />)}
                      </div>
                    </section>

                    <section>
                      <div className="mb-[10px] flex items-center justify-between">
                        <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Suministros ofrecidos</h3>
                        <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{visibleOffers.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-[10px] max-[520px]:grid-cols-1">
                        {visibleOffers.map((v) => <OfferCard key={v.offer.id} view={v} />)}
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
