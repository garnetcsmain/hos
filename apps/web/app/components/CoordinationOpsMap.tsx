"use client";

// Full-screen operations map (HOS-2026-007-11) — the "wall monitor" view for an
// operations center. Replaces the old "Ver mapa completo" Google Maps link,
// which showed none of HOS's data (human direction 2026-07-03). Desktop-only:
// on small screens it points back to the console, whose embedded map is the
// field experience. Same coordinator gate and live-refresh cadence as the
// console; the view belongs to the operator (no re-fit after user interaction).

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getCoordinationBoard } from "@/app/lib/client/coordination";
import { ApiError } from "@/app/lib/client/api";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  SUPABASE_TOKEN_KEY,
} from "@/app/lib/client/supabase";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

const LeafletMap = dynamic(() => import("@/app/components/CoordinationMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#EEF2EF] text-[13px] font-bold text-[var(--hos-muted)]">
      Cargando mapa…
    </div>
  ),
});

const AUTO_REFRESH_MS = 45_000;

/** Same session-mirror refresh as the console (see CoordinationConsole.tsx):
 *  an ops screen stays open for hours, so the Bearer token must track the
 *  supabase-js session refresh or the wall monitor 401s mid-shift. */
async function refreshCoordinatorSession(): Promise<void> {
  if (!isSupabaseConfiguredClient() || typeof window === "undefined") return;
  const supabase = getBrowserSupabase();
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (token) window.localStorage.setItem(SUPABASE_TOKEN_KEY, token);
}

function formatAgo(from: number, now: number): string {
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 5) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

function HeaderMetric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-[6px]">
      <span className="font-data text-[22px] font-bold leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-[12px] font-bold text-white/70">{label}</span>
    </div>
  );
}

export function CoordinationOpsMap() {
  const [board, setBoard] = useState<CoordinationView | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [district, setDistrict] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        await refreshCoordinatorSession();
        const view = await getCoordinationBoard();
        if (!alive) return;
        setBoard(view);
        setError("");
        setDenied(false);
        setLastUpdated(Date.now());
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setDenied(true);
        else setError("No se pudo cargar el panel. Verifique su conexión.");
      }
    };
    void load();
    const timer = setInterval(() => void load(), AUTO_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const metrics = useMemo(() => {
    if (!board) return null;
    const open = board.needs.filter((n) => n.need.status === "open");
    const activeSites = board.sites.filter((s) => s.site.status === "active");
    return {
      open: open.length,
      critical: open.filter((n) => n.need.urgency === "critical").length,
      bedsFree: activeSites.reduce((sum, s) => sum + s.site.bedsFree, 0),
      sites: activeSites.length,
    };
  }, [board]);

  return (
    <>
      {/* Small screens: the console IS the field experience. */}
      <div className="flex min-h-dvh flex-col items-center justify-center gap-[12px] p-[24px] text-center min-[1000px]:hidden">
        <p className="text-[14px] font-bold text-[var(--hos-text)]">
          El mapa de operaciones está pensado para pantallas grandes (centro de operaciones).
        </p>
        <Link
          href="/coordination"
          className="inline-flex h-[38px] items-center gap-[6px] rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[13px] font-extrabold text-white"
        >
          <ArrowLeft className="h-[14px] w-[14px]" /> Ir al panel de coordinación
        </Link>
      </div>

      <div className="hidden h-dvh flex-col min-[1000px]:flex">
        <header className="flex items-center justify-between gap-[18px] bg-[var(--hos-dark)] px-[18px] py-[10px]">
          <div className="flex items-center gap-[14px]">
            <Link
              href="/coordination"
              aria-label="Volver al panel de coordinación"
              className="inline-flex h-[30px] items-center gap-[6px] rounded-[6px] border border-white/25 px-[10px] text-[12px] font-extrabold text-white/85 hover:text-white"
            >
              <ArrowLeft className="h-[13px] w-[13px]" /> Panel
            </Link>
            <h1 className="text-[15px] font-extrabold text-white">Mapa de operaciones</h1>
          </div>
          {metrics ? (
            <div className="flex items-center gap-[22px]">
              <HeaderMetric value={metrics.critical} label="críticas" color="#F08A7D" />
              <HeaderMetric value={metrics.open} label="necesidades abiertas" color="#F0B451" />
              <HeaderMetric value={metrics.bedsFree} label="camas libres" color="#7DD3A0" />
              <HeaderMetric value={metrics.sites} label="puntos activos" color="#9CC7E8" />
            </div>
          ) : null}
          <div className="flex items-center gap-[6px] text-[12px] font-bold text-white/70">
            <RefreshCw className="h-[13px] w-[13px]" />
            {lastUpdated ? `Actualizado ${formatAgo(lastUpdated, nowTick)}` : "Cargando…"}
          </div>
        </header>

        <main className="min-h-0 flex-1">
          {denied ? (
            <div className="flex h-full flex-col items-center justify-center gap-[12px] p-[24px] text-center">
              <p className="text-[14px] font-bold text-[var(--hos-text)]">
                Necesita una sesión de coordinación activa para ver este mapa.
              </p>
              <Link
                href="/coordination"
                className="inline-flex h-[38px] items-center rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[13px] font-extrabold text-white"
              >
                Iniciar sesión en el panel
              </Link>
            </div>
          ) : error && !board ? (
            <div className="flex h-full items-center justify-center p-[24px] text-[13px] font-bold text-[var(--hos-muted)]">
              {error}
            </div>
          ) : board ? (
            <LeafletMap board={board} activeDistrict={district} onSelect={setDistrict} height="100%" />
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] font-bold text-[var(--hos-muted)]">
              Cargando mapa…
            </div>
          )}
        </main>
      </div>
    </>
  );
}
