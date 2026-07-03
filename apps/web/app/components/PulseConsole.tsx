"use client";

// /pulso page shell: same coordinator gate + live-refresh behavior as the
// coordination console, wrapping the standalone pulse board. Kept thin — all
// visualization logic lives in CoordinationPulse.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/HosDashboard";
import { CoordinationPulse } from "@/app/components/CoordinationPulse";
import { getCoordinationBoard } from "@/app/lib/client/coordination";
import { ApiError, COORDINATOR_TOKEN_KEY } from "@/app/lib/client/api";
import {
  hasAnyCredential,
  refreshCoordinatorSession,
} from "@/app/lib/client/coordinatorSession";
import { SUPABASE_TOKEN_KEY } from "@/app/lib/client/supabase";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

const AUTO_REFRESH_MS = 45_000;

export function PulseConsole() {
  const router = useRouter();
  const [board, setBoard] = useState<CoordinationView | null>(null);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

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
          if (!hasAnyCredential()) {
            router.replace("/login");
            return;
          }
          setDenied(true);
          setError("");
          return;
        }
        setError(e instanceof Error ? e.message : "No se pudo cargar el pulso.");
      } finally {
        if (active) setRefreshing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  useEffect(() => {
    const t = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setReloadKey((k) => k + 1);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell
      title="Pulso de la respuesta"
      subtitle="Las conexiones entre ayuda y necesidades, en casi tiempo real · solo coordinadores"
    >
      {board === null && !error && !denied ? (
        <div className="flex flex-1 items-start bg-white px-[36px] py-[30px]">
          <p className="text-[14px] font-normal text-[var(--hos-muted)]">Cargando el pulso…</p>
        </div>
      ) : denied ? (
        <div className="flex-1 px-[28px] py-[28px]">
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
        </div>
      ) : error ? (
        <div className="flex-1 px-[28px] py-[28px]">
          <div className="rounded-[8px] border border-[#F1D8D2] bg-[#FCF1EF] px-[16px] py-[14px] text-[14px] font-bold text-[#8A2C20]">
            {error}
          </div>
        </div>
      ) : board ? (
        <CoordinationPulse
          board={board}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onReload={() => setReloadKey((k) => k + 1)}
        />
      ) : null}
    </AppShell>
  );
}
