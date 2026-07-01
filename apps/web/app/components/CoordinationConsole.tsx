"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { type ModalKind } from "@/app/components/IntakeForms";
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
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [board, setBoard] = useState<CoordinationView | null>(null);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      await refreshCoordinatorSession();
      try {
        const res = await getCoordinationBoard();
        if (!active) return;
        setBoard(res);
        setError("");
        setDenied(false);
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
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  const reload = () => setReloadKey((k) => k + 1);

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

  return (
    <AppShell
      title="Response Coordination"
      subtitle="Sitios, necesidades y suministros · vista de coordinación (acceso restringido)"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((v) => !v)}
      onOpenFamily={() => setModalKind("family")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="flex flex-1 flex-col gap-[18px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        {board === null && !error && !denied ? (
          <p className="text-[14px] font-bold text-[var(--hos-muted)]">Cargando coordinación…</p>
        ) : denied ? (
          <div className="rounded-[8px] border border-[#F1D8D2] bg-[#FCF1EF] px-[18px] py-[16px]">
            <div className="text-[14px] font-extrabold text-[#8A2C20]">Acceso no autorizado</div>
            <p className="mt-[6px] text-[13px] font-bold leading-[18px] text-[#8A2C20]">
              Tu sesión expiró o tu cuenta no está autorizada para coordinación. Inicia sesión con una
              cuenta invitada por un administrador.
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
                Ubicaciones a nivel de distrito y solo para coordinadores: esta vista no es pública. Un suministro
                se marca <span className="font-extrabold">recibido</span> únicamente cuando el sitio solicitante
                confirma la entrega real — nunca de forma automática. Las sugerencias de suministro son orientativas;
                una persona siempre decide.
              </p>
            </section>

            <div className="grid grid-cols-4 gap-[12px] max-[760px]:grid-cols-2">
              <Metric value={metrics.open} label="necesidades abiertas" color="text-[var(--hos-warn)]" />
              <Metric value={metrics.critical} label="críticas" color="text-[var(--hos-red)]" />
              <Metric value={metrics.beds} label="camas libres" color="text-[var(--hos-green)]" />
              <Metric value={metrics.sites} label="sitios" color="text-[var(--hos-blue)]" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-[var(--hos-text)]">Panel de coordinación</h2>
              <button
                type="button"
                onClick={() => setCreating((v) => !v)}
                className="inline-flex h-[38px] items-center gap-[6px] rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[13px] font-extrabold text-white"
              >
                <Plus className="h-[15px] w-[15px]" strokeWidth={2.6} /> {creating ? "Cerrar" : "Nuevo registro"}
              </button>
            </div>

            {creating ? (
              <div className="grid grid-cols-2 gap-[12px] max-[900px]:grid-cols-1">
                <Panel title="Publicar necesidad"><PostNeedForm orgs={orgs} onChanged={reload} /></Panel>
                <Panel title="Publicar suministro"><PostOfferForm orgs={orgs} onChanged={reload} /></Panel>
                <Panel title="Agregar sitio"><AddSiteForm orgs={orgs} onChanged={reload} /></Panel>
                <Panel title="Registrar organización"><AddOrgForm onChanged={reload} /></Panel>
              </div>
            ) : null}

            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[18px] max-[1100px]:grid-cols-1">
              <section>
                <div className="mb-[10px] flex items-center justify-between">
                  <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Necesidades</h3>
                  <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{sortedNeeds.length}</span>
                </div>
                <div className="flex flex-col gap-[12px]">
                  {sortedNeeds.length === 0 ? (
                    <p className="text-[13px] font-bold text-[var(--hos-muted)]">No hay necesidades registradas.</p>
                  ) : (
                    sortedNeeds.map((v) => <NeedCard key={v.need.id} view={v} orgs={orgs} onChanged={reload} />)
                  )}
                </div>
              </section>

              <div className="flex flex-col gap-[18px]">
                <section>
                  <div className="mb-[10px] flex items-center justify-between">
                    <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Sitios y capacidad</h3>
                    <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{board.sites.length}</span>
                  </div>
                  <div className="flex flex-col gap-[12px]">
                    {board.sites.map((v) => <SiteCard key={v.site.id} view={v} onChanged={reload} />)}
                  </div>
                </section>

                <section>
                  <div className="mb-[10px] flex items-center justify-between">
                    <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Suministros ofrecidos</h3>
                    <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{board.offers.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-[10px] max-[520px]:grid-cols-1">
                    {board.offers.map((v) => <OfferCard key={v.offer.id} view={v} />)}
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
