/// <reference types="google.maps" />
"use client";

// Interactive Google map for the coordination board. One marker per DISTRICT at
// its centroid (never a precise shelter pin — targeting risk, Board
// HOS-2026-007), colored by urgency, with the district's live rollup in a popup.
// Tapping "Ver en la lista" filters the board to that district. Falls back to a
// compact district list if the Maps key isn't available, so the view always
// works.

import { useEffect, useMemo, useState } from "react";
import { APIProvider, InfoWindow, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { ExternalLink, MapPin } from "lucide-react";
import { Term } from "@/app/components/Term";
import { getMapsConfig } from "@/app/lib/client/coordination";
import {
  pointForDistrict,
  REGION_CENTER,
  REGION_MAPS_LINK,
  REGION_ZOOM,
} from "@/app/lib/geo/districts";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

interface Rollup {
  sites: number;
  needs: number;
  critical: number;
  beds: number;
}

type KeyState = { status: "loading" | "ready" | "absent"; apiKey: string };

const COLORS = { critical: "#B4392E", needs: "#D98A1F", clear: "#2E7D5B" } as const;

// A calm, muted map: hide business POIs/transit clutter and soften land + water
// so the district markers are what stands out (no mapId needed for these).
const MAP_STYLES = [
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#E4EFE4" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F3F5F2" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#CFE0EC" }] },
] as const;

function colorFor(r: Rollup): string {
  if (r.critical > 0) return COLORS.critical;
  if (r.needs > 0) return COLORS.needs;
  return COLORS.clear;
}

/** A teardrop pin (SVG data-URI) with the open-needs count — no google.maps
 *  object needed, so it renders the moment the marker mounts. */
function pinIcon(color: string, count: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 1C10 1 2 9 2 19c0 12.5 18 31 18 31s18-18.5 18-31C38 9 30 1 20 1z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="20" cy="19" r="12" fill="white"/><text x="20" y="24" font-family="system-ui,sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${color}">${count}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function useRollups(board: CoordinationView) {
  return useMemo(() => {
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
}

function RollupLine({ r }: { r: Rollup }) {
  return (
    <span className="flex flex-wrap gap-x-[10px] gap-y-[2px] text-[11px] font-bold text-[var(--hos-muted)]">
      <span>{r.sites} sitios</span>
      <span>{r.needs} necesidades</span>
      {r.critical > 0 ? <span className="text-[var(--hos-red)]">{r.critical} críticas</span> : null}
      <span>{r.beds} camas</span>
    </span>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-[12px] text-[11px] font-bold text-[var(--hos-muted)]">
      {[
        { c: COLORS.critical, t: "Crítica" },
        { c: COLORS.needs, t: "Con necesidades" },
        { c: COLORS.clear, t: "Al día" },
      ].map((x) => (
        <span key={x.t} className="inline-flex items-center gap-[5px]">
          <span className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: x.c }} />
          {x.t}
        </span>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <p className="text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
        Por <Term k="distrito">distrito</Term>, sin ubicaciones exactas (por seguridad).
      </p>
      <a
        href={REGION_MAPS_LINK}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center gap-[4px] text-[11px] font-extrabold text-[var(--hos-blue)] hover:underline"
      >
        Abrir en Google Maps <ExternalLink className="h-[12px] w-[12px]" />
      </a>
    </div>
  );
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
  const rollups = useRollups(board);
  const districts = [...rollups.keys()];
  const [key, setKey] = useState<KeyState>({ status: "loading", apiKey: "" });
  const [openDistrict, setOpenDistrict] = useState<string | null>(activeDistrict);

  useEffect(() => {
    let active = true;
    getMapsConfig()
      .then((c) => active && setKey(c.apiKey ? { status: "ready", apiKey: c.apiKey } : { status: "absent", apiKey: "" }))
      .catch(() => active && setKey({ status: "absent", apiKey: "" }));
    return () => {
      active = false;
    };
  }, []);

  // Real interactive map when the key is available.
  if (key.status === "ready") {
    return (
      <section className="flex flex-col gap-[10px]">
        <div className="h-[440px] w-full overflow-hidden rounded-[8px] border border-[var(--hos-border)]">
          <APIProvider apiKey={key.apiKey}>
            <GoogleMap
              defaultCenter={REGION_CENTER}
              defaultZoom={REGION_ZOOM}
              gestureHandling="cooperative"
              disableDefaultUI
              zoomControl
              clickableIcons={false}
              styles={MAP_STYLES as unknown as google.maps.MapTypeStyle[]}
              className="h-full w-full"
            >
              {districts.map((d, i) => {
                const r = rollups.get(d)!;
                return (
                  <Marker
                    key={d}
                    position={pointForDistrict(d, i)}
                    title={`${d}: ${r.needs} necesidades, ${r.sites} sitios`}
                    icon={pinIcon(colorFor(r), r.needs)}
                    onClick={() => setOpenDistrict(d)}
                  />
                );
              })}
              {openDistrict && rollups.has(openDistrict) ? (
                <InfoWindow
                  position={pointForDistrict(openDistrict, districts.indexOf(openDistrict))}
                  onCloseClick={() => setOpenDistrict(null)}
                  pixelOffset={[0, -46]}
                >
                  <div className="min-w-[180px] px-[2px] py-[2px]">
                    <div className="flex items-center gap-[5px] text-[13px] font-extrabold text-[var(--hos-text)]">
                      <MapPin className="h-[13px] w-[13px]" strokeWidth={2.4} /> {openDistrict}
                    </div>
                    <div className="mt-[6px]">
                      <RollupLine r={rollups.get(openDistrict)!} />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect(openDistrict)}
                      className="mt-[10px] h-[32px] w-full rounded-[6px] bg-[var(--hos-dark)] text-[12px] font-extrabold text-white"
                    >
                      Ver en la lista
                    </button>
                  </div>
                </InfoWindow>
              ) : null}
            </GoogleMap>
          </APIProvider>
        </div>
        <div className="flex items-center justify-between gap-[10px] max-[620px]:flex-col max-[620px]:items-start">
          <Legend />
          <Footer />
        </div>
      </section>
    );
  }

  // Fallback (key loading or absent): compact, tappable district list. The board
  // still works without a map.
  return (
    <section className="flex flex-col gap-[10px]">
      {key.status === "loading" ? (
        <p className="text-[13px] font-bold text-[var(--hos-muted)]">Cargando mapa…</p>
      ) : (
        <>
          {districts.length === 0 ? (
            <p className="rounded-[8px] border border-[var(--hos-border)] bg-white px-[16px] py-[14px] text-[13px] font-bold text-[var(--hos-muted)]">
              Sin datos por distrito todavía.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-[10px] max-[760px]:grid-cols-1">
              {districts.map((d) => {
                const r = rollups.get(d)!;
                const active = activeDistrict === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onSelect(active ? null : d)}
                    aria-pressed={active}
                    className={`flex flex-col rounded-[10px] border-2 p-[14px] text-left transition hover:shadow-sm ${
                      active
                        ? "border-[var(--hos-dark)] bg-white"
                        : r.critical > 0
                          ? "border-[#E5B4AB] bg-[#FCF1EF]"
                          : "border-[var(--hos-border)] bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-[6px] text-[13px] font-extrabold text-[var(--hos-text)]">
                      <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ backgroundColor: colorFor(r) }} />
                      {d}
                    </span>
                    <span className="mt-[8px]">
                      <RollupLine r={r} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <Footer />
        </>
      )}
    </section>
  );
}
