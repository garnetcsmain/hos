"use client";

// Interactive district map for the coordination board (Leaflet + OpenStreetMap,
// no API key). One marker per DISTRICT at its centroid — never a precise site
// (targeting risk, Board HOS-2026-007). Marker color = urgency, the number = open
// needs; hover shows the district, click opens a rollup with a filter action.
// SSR-unsafe (Leaflet touches window), so it is always dynamic-imported.

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { centroidFor, REGION_CENTER, REGION_ZOOM, type LatLng } from "@/app/lib/geo/districts";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

interface Rollup {
  district: string;
  sites: number;
  needs: number;
  critical: number;
  beds: number;
}

const COLORS = { critical: "#B4392E", needs: "#D98A1F", clear: "#2E7D5B" } as const;

function colorFor(r: Rollup): string {
  if (r.critical > 0) return COLORS.critical;
  if (r.needs > 0) return COLORS.needs;
  return COLORS.clear;
}

function badgeIcon(r: Rollup, active: boolean): L.DivIcon {
  const color = colorFor(r);
  const size = active ? 38 : 30;
  return L.divIcon({
    className: "hos-map-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;font:800 13px system-ui,sans-serif;
      box-shadow:0 1px 6px rgba(0,0,0,.4);border:${active ? 3 : 2}px solid #fff;">${r.needs}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapController({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      // The map often mounts before its flex container has its final width, so
      // Leaflet loads only the center tiles; invalidateSize() recomputes the
      // size and fills the rest before we frame the markers.
      map.invalidateSize();
      if (points.length === 0) return;
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    };
    fit();
    const t = setTimeout(fit, 300);
    // Any later container resize (window resize, phone rotation, layout shift)
    // must re-tile too, or the map greys out; keep the current view, just resize.
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(map.getContainer());
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map, points]);
  return null;
}

export default function CoordinationMapLeaflet({
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
        r = { district: d, sites: 0, needs: 0, critical: 0, beds: 0 };
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
    return [...m.values()];
  }, [board]);

  const markers = rollups.map((r, i) => ({ r, pos: centroidFor(r.district, i) }));
  const points = markers.map((m) => m.pos);

  return (
    <MapContainer
      center={[REGION_CENTER.lat, REGION_CENTER.lng]}
      zoom={REGION_ZOOM}
      scrollWheelZoom={false}
      style={{ height: 440, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {markers.map(({ r, pos }) => (
        <Marker
          key={r.district}
          position={[pos.lat, pos.lng]}
          icon={badgeIcon(r, activeDistrict === r.district)}
          eventHandlers={{ click: () => onSelect(activeDistrict === r.district ? null : r.district) }}
        >
          <Tooltip direction="top" offset={[0, -16]} opacity={1} permanent>
            <span style={{ fontWeight: 800 }}>
              {r.district}
              {r.needs > 0 ? ` · ${r.needs} nec.` : ""}
              {r.critical > 0 ? ` · ${r.critical} críticas` : ""}
            </span>
          </Tooltip>
        </Marker>
      ))}
      <MapController points={points} />
    </MapContainer>
  );
}
