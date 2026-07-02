"use client";

// Interactive map for the coordination board (Leaflet + OpenStreetMap, no API
// key). Two layers with different location grain, on purpose:
//  - NEEDS render one badge per DISTRICT at its centroid — never a precise spot
//    (targeting risk, Board HOS-2026-007). Badge color = urgency, number = open
//    needs; click filters the board by that district.
//  - SITES that carry public coordinates (imported from caracasayuda.com) render
//    as individual category pins with a detail popup; they are already published
//    on a public map, so precision adds no new risk.
// Scroll/pinch/double-click zoom are enabled so a coordinator can zoom from the
// corridor overview down to street level (tiles go to zoom 19).
// SSR-unsafe (Leaflet touches window), so it is always dynamic-imported.

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { centroidFor, inCorridor, REGION_CENTER, REGION_ZOOM, type LatLng } from "@/app/lib/geo/districts";
import { SITE_CATEGORY_LABEL, SITE_PIN } from "@/app/components/CoordinationParts";
import type { CoordinationView, SiteView } from "@/app/lib/domain/coordinationViews";
import type { SiteCategory } from "@/app/lib/domain/coordination";

interface Rollup {
  district: string;
  needs: number;
  critical: number;
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

function siteIcon(category: SiteCategory): L.DivIcon {
  const { color, glyph } = SITE_PIN[category] ?? SITE_PIN.otro;
  const size = 20;
  return L.divIcon({
    className: "hos-map-site",
    html: `<div style="width:${size}px;height:${size}px;border-radius:6px;background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;font:800 12px system-ui,sans-serif;
      box-shadow:0 1px 4px rgba(0,0,0,.35);border:1.5px solid #fff;">${glyph}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapController({ points }: { points: LatLng[] }) {
  const map = useMap();
  // Once the coordinator touches the map (drag, wheel, pinch, +/- buttons) the
  // view is THEIRS: the board auto-refreshes every ~45s, and re-fitting bounds
  // on each refresh would yank them back to the overview mid-zoom.
  const userMoved = useRef(false);
  // Refit only when the marker geometry actually changes, not on every render
  // (the arrays are rebuilt each render, so identity is meaningless).
  const sig = useMemo(
    () => JSON.stringify(points.map((p) => [Math.round(p.lat * 1e3), Math.round(p.lng * 1e3)])),
    [points],
  );

  useEffect(() => {
    const container = map.getContainer();
    const markMoved = () => {
      userMoved.current = true;
    };
    container.addEventListener("pointerdown", markMoved, { capture: true });
    container.addEventListener("wheel", markMoved, { capture: true });
    // Any later container resize (window resize, phone rotation, layout shift)
    // must re-tile too, or the map greys out; keep the current view, just resize.
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(container);
    return () => {
      container.removeEventListener("pointerdown", markMoved, { capture: true });
      container.removeEventListener("wheel", markMoved, { capture: true });
      ro.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (userMoved.current) return;
    const fit = () => {
      if (userMoved.current) return;
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
    return () => clearTimeout(t);
    // `sig` stands in for `points`: same geometry -> no refit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sig]);
  return null;
}

function SitePopup({ view }: { view: SiteView }) {
  const { site, org } = view;
  return (
    <div style={{ font: "600 12px system-ui,sans-serif", maxWidth: 240 }}>
      <div style={{ font: "800 13px system-ui,sans-serif" }}>{site.name}</div>
      <div style={{ color: "#5B6660", marginTop: 2 }}>
        {SITE_CATEGORY_LABEL[site.category]} · {site.district}
      </div>
      {site.category === "refugio" || site.bedsTotal > 0 ? (
        <div style={{ marginTop: 4 }}>{site.bedsFree} / {site.bedsTotal} camas libres</div>
      ) : null}
      {site.notes ? <div style={{ marginTop: 4, lineHeight: "16px" }}>{site.notes}</div> : null}
      {org ? <div style={{ color: "#5B6660", marginTop: 4 }}>Fuente: {org.name}</div> : null}
    </div>
  );
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
  // District rollups are needs-only: sites draw their own pins now, and a
  // district with sites but nothing needed shouldn't shout for attention.
  const rollups = useMemo(() => {
    const m = new Map<string, Rollup>();
    for (const n of board.needs) {
      if (n.need.status !== "open") continue;
      let r = m.get(n.need.district);
      if (!r) {
        r = { district: n.need.district, needs: 0, critical: 0 };
        m.set(n.need.district, r);
      }
      r.needs += 1;
      if (n.need.urgency === "critical") r.critical += 1;
    }
    return [...m.values()];
  }, [board]);

  const siteMarkers = useMemo(
    () =>
      board.sites.filter(
        (v): v is SiteView & { site: { lat: number; lng: number } } =>
          v.site.status === "active" && v.site.lat !== null && v.site.lng !== null,
      ),
    [board],
  );

  const markers = rollups.map((r, i) => ({ r, pos: centroidFor(r.district, i) }));
  // Frame the affected corridor: need districts plus corridor sites. Sites
  // elsewhere in the country must not drag the initial view out to all of
  // Venezuela — they stay reachable by zooming out.
  const points = [
    ...markers.map((m) => m.pos),
    ...siteMarkers
      .map((v) => ({ lat: v.site.lat as number, lng: v.site.lng as number }))
      .filter(inCorridor),
  ];

  return (
    <MapContainer
      center={[REGION_CENTER.lat, REGION_CENTER.lng]}
      zoom={REGION_ZOOM}
      scrollWheelZoom
      style={{ height: 440, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {siteMarkers.map((v) => (
        <Marker
          key={v.site.id}
          position={[v.site.lat as number, v.site.lng as number]}
          icon={siteIcon(v.site.category)}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <span style={{ fontWeight: 800 }}>{v.site.name}</span>
          </Tooltip>
          <Popup>
            <SitePopup view={v} />
          </Popup>
        </Marker>
      ))}
      {markers.map(({ r, pos }) => (
        <Marker
          key={r.district}
          position={[pos.lat, pos.lng]}
          icon={badgeIcon(r, activeDistrict === r.district)}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onSelect(activeDistrict === r.district ? null : r.district) }}
        >
          <Tooltip direction="top" offset={[0, -16]} opacity={1}>
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
