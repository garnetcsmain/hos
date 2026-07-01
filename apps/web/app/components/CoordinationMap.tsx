"use client";

// District map for the coordination board. The interactive map itself (Leaflet)
// is dynamic-imported with ssr:false because Leaflet touches window; this wrapper
// keeps the SSR-safe chrome (frame, legend, district note, region link).

import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import { Term } from "@/app/components/Term";
import { REGION_MAPS_LINK } from "@/app/lib/geo/districts";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

const LeafletMap = dynamic(() => import("@/app/components/CoordinationMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] items-center justify-center bg-[#EEF2EF] text-[13px] font-bold text-[var(--hos-muted)]">
      Cargando mapa…
    </div>
  ),
});

const LEGEND = [
  { color: "#B4392E", label: "Necesidad crítica" },
  { color: "#D98A1F", label: "Necesidades abiertas" },
  { color: "#2E7D5B", label: "Sin necesidades" },
] as const;

export function CoordinationMap({
  board,
  activeDistrict,
  onSelect,
}: {
  board: CoordinationView;
  activeDistrict: string | null;
  onSelect: (district: string | null) => void;
}) {
  return (
    <section className="flex flex-col gap-[10px]">
      <div className="overflow-hidden rounded-[8px] border border-[var(--hos-border)]">
        <LeafletMap board={board} activeDistrict={activeDistrict} onSelect={onSelect} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[4px]">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-[6px] text-[11px] font-bold text-[var(--hos-muted)]">
              <span className="h-[10px] w-[10px] rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
          <span className="text-[11px] font-bold text-[var(--hos-muted)]">· el número = necesidades abiertas</span>
        </div>
        <a
          href={REGION_MAPS_LINK}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-[4px] text-[11px] font-extrabold text-[var(--hos-blue)] hover:underline"
        >
          Ver mapa completo <ExternalLink className="h-[12px] w-[12px]" />
        </a>
      </div>

      <p className="text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
        Vista por <Term k="distrito">distrito</Term>, sin ubicaciones exactas (por seguridad). Toque un marcador
        para ver el resumen y filtrar el panel.
      </p>
    </section>
  );
}
