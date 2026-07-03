"use client";

// Map chrome for the coordination board. The interactive map itself (Leaflet)
// is dynamic-imported with ssr:false because Leaflet touches window; this wrapper
// keeps the SSR-safe chrome (frame, legend, grain note, region link).

import dynamic from "next/dynamic";
import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { Term } from "@/app/components/Term";
import { SITE_CATEGORY_LABEL, SITE_PIN } from "@/app/components/CoordinationParts";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";
import type { SiteCategory } from "@/app/lib/domain/coordination";

const LeafletMap = dynamic(() => import("@/app/components/CoordinationMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] items-center justify-center bg-[#EEF2EF] text-[13px] font-bold text-[var(--hos-muted)]">
      Cargando mapa…
    </div>
  ),
});

const NEED_LEGEND = [
  { color: "#B4392E", label: "Distrito con necesidad crítica" },
  { color: "#D98A1F", label: "Distrito con necesidades" },
] as const;

// Site pin legend — every category except the "otro" catch-all.
const SITE_LEGEND = (["acopio", "refugio", "medico", "internet", "mascotas"] as SiteCategory[]).map(
  (c) => ({ ...SITE_PIN[c], label: SITE_CATEGORY_LABEL[c] }),
);

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
          {NEED_LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-[6px] text-[11px] font-bold text-[var(--hos-muted)]">
              <span className="h-[10px] w-[10px] rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
          <span className="text-[11px] font-bold text-[var(--hos-muted)]">· el número = necesidades abiertas</span>
        </div>
        {/* Full-screen ops view (desktop only) — replaced the old Google Maps
            region link, which showed none of our data (human direction 2026-07-03). */}
        <Link
          href="/coordination/mapa"
          className="inline-flex shrink-0 items-center gap-[4px] text-[11px] font-extrabold text-[var(--hos-blue)] hover:underline max-[900px]:hidden"
        >
          Pantalla completa <Maximize2 className="h-[12px] w-[12px]" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[4px]">
        {SITE_LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-[6px] text-[11px] font-bold text-[var(--hos-muted)]">
            <span
              className="flex h-[14px] w-[14px] items-center justify-center rounded-[4px] text-[10px] font-extrabold text-white"
              style={{ background: l.color }}
            >
              {l.glyph}
            </span>
            {l.label}
          </span>
        ))}
      </div>

      <p className="text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
        Los círculos numerados agrupan las necesidades por <Term k="distrito">distrito</Term>; los
        puntos pequeños son reportes con ubicación exacta (los que no la traen quedan en su distrito).
        Los puntos de ayuda provienen inicialmente de mapas públicos (caracasayuda.com); pronto se
        registrarán directamente en HOS. Toque un marcador para ver el detalle.
      </p>
    </section>
  );
}
