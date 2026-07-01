"use client";

// District map for the coordination board. Shows each district as a zone with
// its live rollup (sites, open needs, criticals, free beds) on a schematic
// coast/inland backdrop — NOT precise pins. Location stays coarse on purpose
// (targeting risk, Board HOS-2026-007). Tapping a district filters the board.

import { useMemo } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Term } from "@/app/components/Term";
import { DISTRICT_ZONES, FALLBACK_BOXES, REGION_MAPS_LINK } from "@/app/lib/geo/districts";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

interface Rollup {
  sites: number;
  needs: number;
  critical: number;
  beds: number;
}

export function CoordinationMap({
  board,
  activeDistrict,
  onSelect,
}: {
  board: CoordinationView;
  activeDistrict: string | null;
  onSelect: (district: string | null) => void;
}) {
  const rollups = useMemo(() => {
    const m = new Map<string, Rollup>();
    const get = (d: string) => {
      let r = m.get(d);
      if (!r) {
        r = { sites: 0, needs: 0, critical: 0, beds: 0 };
        m.set(d, r);
      }
      return r;
    };
    for (const s of board.sites) {
      const r = get(s.site.district);
      r.sites += 1;
      r.beds += s.site.bedsFree;
    }
    for (const n of board.needs) {
      if (n.need.status !== "open") continue;
      const r = get(n.need.district);
      r.needs += 1;
      if (n.need.urgency === "critical") r.critical += 1;
    }
    return m;
  }, [board]);

  const districts = [...rollups.keys()];
  const boxFor = (d: string, i: number) =>
    DISTRICT_ZONES[d]?.box ?? FALLBACK_BOXES[i % FALLBACK_BOXES.length];

  return (
    <section className="flex flex-col gap-[10px]">
      <div className="relative min-h-[380px] overflow-hidden rounded-[8px] border border-[var(--hos-border)]">
        {/* Schematic backdrop: sea along the top, land below. */}
        <div className="absolute inset-0 bg-[#DCE9F2]" />
        <div className="absolute inset-x-0 bottom-0 top-[26%] bg-[#E9F0E8]" />
        <div className="absolute inset-x-0 top-[25%] h-[2px] bg-[#C6D8CB]" />
        <span className="absolute left-[12px] top-[10px] rounded-full bg-white/85 px-[10px] py-[5px] text-[11px] font-extrabold text-[var(--hos-muted)]">
          Mar Caribe
        </span>

        {districts.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[var(--hos-muted)]">
            Sin datos por distrito todavía.
          </p>
        ) : (
          districts.map((d, i) => {
            const r = rollups.get(d)!;
            const active = activeDistrict === d;
            const alarm = r.critical > 0;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelect(active ? null : d)}
                aria-pressed={active}
                className={`absolute flex flex-col rounded-[12px] border-2 p-[12px] text-left shadow-sm transition hover:shadow-md ${boxFor(d, i)} ${
                  active
                    ? "border-[var(--hos-dark)] bg-white"
                    : alarm
                      ? "border-[#E5B4AB] bg-[#FCF1EF]"
                      : "border-[#B9D4C8] bg-white/95"
                }`}
              >
                <span className="flex items-center gap-[6px] text-[13px] font-extrabold text-[var(--hos-text)]">
                  <MapPin className="h-[14px] w-[14px] shrink-0" strokeWidth={2.4} />
                  {d}
                </span>
                <span className="mt-[8px] flex flex-wrap gap-x-[10px] gap-y-[3px] text-[11px] font-bold text-[var(--hos-muted)]">
                  <span>{r.sites} sitios</span>
                  <span>{r.needs} necesidades</span>
                  {r.critical > 0 ? (
                    <span className="text-[var(--hos-red)]">{r.critical} críticas</span>
                  ) : null}
                  <span>{r.beds} camas</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-[10px]">
        <p className="text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
          Vista por <Term k="distrito">distrito</Term>, sin ubicaciones exactas (por seguridad). Toque un
          distrito para filtrar el panel.
        </p>
        <a
          href={REGION_MAPS_LINK}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-[4px] text-[11px] font-extrabold text-[var(--hos-blue)] hover:underline"
        >
          Ver mapa real <ExternalLink className="h-[12px] w-[12px]" />
        </a>
      </div>
    </section>
  );
}
