"use client";

// Interactive map for the coordination board (Leaflet + OpenStreetMap, no API
// key). Three layers:
//  - NEEDS roll up into one badge per DISTRICT at its centroid. Badge color =
//    urgency, number = open needs; click filters the board by that district.
//  - Zoomed in (>= NEED_DOT_MIN_ZOOM), needs that carry a trusted precise
//    position ALSO render as individual urgency-colored dots — coordinator-
//    gated per the human D1 answer (2026-07-03): responders need the exact
//    spot, and this console is behind the auth gate. Needs without a trusted
//    pin stay district-only.
//  - SITES with coordinates render as individual category pins with a detail
//    popup.
// Scroll/pinch/double-click zoom are enabled so a coordinator can zoom from the
// corridor overview down to street level (tiles go to zoom 19).
// SSR-unsafe (Leaflet touches window), so it is always dynamic-imported.

import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { centroidFor, inCorridor, REGION_CENTER, REGION_ZOOM, type LatLng } from "@/app/lib/geo/districts";
import { CATEGORY_LABEL, SITE_CATEGORY_LABEL, SITE_PIN } from "@/app/components/CoordinationParts";
import { activeAnnouncement } from "@/app/lib/domain/coordination";
import type { CoordinationView, NeedView, SiteView } from "@/app/lib/domain/coordinationViews";
import type { NeedCategory, SiteCategory } from "@/app/lib/domain/coordination";

interface Rollup {
  district: string;
  needs: number;
  critical: number;
  /** Open-need count per category, for the district popup breakdown. */
  byCategory: Map<NeedCategory, number>;
  /** Active aid points in the district. */
  sites: number;
}

/** Directions to a point — the coordinator-facing "cómo llegar". A
 *  destination-only maps link; no HOS data leaves the console. */
function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}`;
}

const popupFont = { font: "600 12px system-ui,sans-serif", maxWidth: 250 } as const;
const popupTitle = { font: "800 13px system-ui,sans-serif" } as const;

function DirectionsLink({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={directionsUrl(lat, lng)}
      target="_blank"
      rel="noreferrer"
      style={{ display: "inline-block", marginTop: 6, font: "800 12px system-ui,sans-serif", color: "#2f7fb8" }}
    >
      Cómo llegar →
    </a>
  );
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

// Always visible at every zoom (human direction 2026-07-03: exactness first).
// Rendered on canvas (preferCanvas) so ~1000 dots stay cheap; district badges
// and site pins live in the marker pane, which stacks above this layer.
function NeedDots({ needs }: { needs: NeedView[] }) {
  return (
    <>
      {needs.map((v) => (
        <CircleMarker
          key={v.need.id}
          center={[v.need.lat as number, v.need.lng as number]}
          radius={6}
          pathOptions={{
            color: "#fff",
            weight: 1.5,
            fillColor: v.need.urgency === "critical" ? COLORS.critical : v.need.urgency === "high" ? COLORS.needs : COLORS.clear,
            fillOpacity: 0.9,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
            <span style={{ fontWeight: 800 }}>
              {CATEGORY_LABEL[v.need.category]} · {v.need.district}
            </span>
          </Tooltip>
          <Popup>
            <div style={popupFont}>
              <div style={popupTitle}>
                {CATEGORY_LABEL[v.need.category]} · {v.need.district}
              </div>
              {v.need.notes ? (
                <div style={{ marginTop: 4, lineHeight: "16px" }}>
                  {v.need.notes.length > 220 ? `${v.need.notes.slice(0, 220)}…` : v.need.notes}
                </div>
              ) : null}
              {v.org ? <div style={{ color: "#5B6660", marginTop: 4 }}>Fuente: {v.org.name}</div> : null}
              <DirectionsLink lat={v.need.lat as number} lng={v.need.lng as number} />
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

// The sync composes site notes as " · "-separated segments where structured
// parts carry a label ("Dirección: …", "Horario: …", "Tel: …") and the free
// text describes what the point receives/offers. Split them back into labeled
// lines so the popup answers the field questions (what do they take? where?
// when? whom do I call?) without reading a wall of text.
const NOTE_LABELS = ["Dirección", "Horario", "Tel"] as const;

function splitSiteNotes(notes: string): { offers: string[]; labeled: Array<{ label: string; value: string }> } {
  const offers: string[] = [];
  const labeled: Array<{ label: string; value: string }> = [];
  for (const raw of notes.split(" · ")) {
    const seg = raw.trim();
    if (!seg) continue;
    const label = NOTE_LABELS.find((l) => seg.startsWith(`${l}:`));
    if (label) labeled.push({ label, value: seg.slice(label.length + 1).trim() });
    else if (seg !== "Sin verificar en el origen") offers.push(seg);
  }
  return { offers, labeled };
}

function SitePopup({ view, rollup }: { view: SiteView; rollup: Rollup | null }) {
  const { site, org } = view;
  const { offers, labeled } = splitSiteNotes(site.notes);
  const aviso = activeAnnouncement(site, new Date().toISOString());
  return (
    <div style={popupFont}>
      <div style={popupTitle}>{site.name}</div>
      <div style={{ color: "#5B6660", marginTop: 2 }}>
        {SITE_CATEGORY_LABEL[site.category]} · {site.district}
      </div>
      {aviso ? (
        <div
          style={{
            marginTop: 6,
            padding: "6px 8px",
            borderRadius: 6,
            background: "#FDF3D7",
            color: "#7A5200",
            font: "800 12px system-ui,sans-serif",
            lineHeight: "16px",
          }}
        >
          AVISO: {aviso}
        </div>
      ) : null}
      {site.category === "refugio" || site.bedsTotal > 0 ? (
        <div style={{ marginTop: 6, fontWeight: 800 }}>
          {site.bedsFree} / {site.bedsTotal} camas libres
        </div>
      ) : null}
      {offers.length > 0 ? (
        <div style={{ marginTop: 6, lineHeight: "16px" }}>
          <span style={{ fontWeight: 800 }}>Ofrece: </span>
          {offers.join(" · ")}
        </div>
      ) : null}
      {labeled.map((l) => (
        <div key={l.label} style={{ marginTop: 4, lineHeight: "16px" }}>
          <span style={{ fontWeight: 800 }}>{l.label}: </span>
          {l.value}
        </div>
      ))}
      {rollup && rollup.needs > 0 ? (
        <div style={{ marginTop: 6, color: "#8A2A1E", lineHeight: "16px" }}>
          En este distrito: {rollup.needs} necesidades abiertas
          {rollup.critical > 0 ? ` (${rollup.critical} críticas)` : ""}
        </div>
      ) : null}
      {org ? <div style={{ color: "#5B6660", marginTop: 6 }}>Fuente: {org.name}</div> : null}
      {site.lat !== null && site.lng !== null ? <DirectionsLink lat={site.lat} lng={site.lng} /> : null}
    </div>
  );
}

// District badge popup: a summary + explicit actions, instead of the old
// behavior of instantly yanking the coordinator to the filtered list with no
// explanation (human feedback 2026-07-03).
function DistrictPopup({
  rollup,
  pos,
  onShowList,
}: {
  rollup: Rollup;
  pos: LatLng;
  onShowList?: (district: string) => void;
}) {
  const map = useMap();
  const top = [...rollup.byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const buttonStyle = {
    font: "800 12px system-ui,sans-serif",
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #c9d6d0",
    background: "#fff",
    color: "#17211e",
    cursor: "pointer",
  } as const;
  return (
    <div style={popupFont}>
      <div style={popupTitle}>{rollup.district}</div>
      <div style={{ marginTop: 4, lineHeight: "16px" }}>
        <span style={{ fontWeight: 800, color: "#8A2A1E" }}>{rollup.needs}</span> necesidades abiertas
        {rollup.critical > 0 ? (
          <>
            {" · "}
            <span style={{ fontWeight: 800, color: "#B4392E" }}>{rollup.critical} críticas</span>
          </>
        ) : null}
      </div>
      {top.length > 0 ? (
        <div style={{ marginTop: 2, color: "#5B6660", lineHeight: "16px" }}>
          {top.map(([cat, n]) => `${CATEGORY_LABEL[cat]} ${n}`).join(" · ")}
        </div>
      ) : null}
      <div style={{ marginTop: 2, color: "#5B6660" }}>
        {rollup.sites} {rollup.sites === 1 ? "punto de ayuda activo" : "puntos de ayuda activos"}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            map.closePopup();
            map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 14));
          }}
        >
          Acercar
        </button>
        {onShowList ? (
          <button
            type="button"
            style={{ ...buttonStyle, background: "#0e1713", color: "#fff", border: "1px solid #0e1713" }}
            onClick={() => onShowList(rollup.district)}
          >
            Ver en lista
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function CoordinationMapLeaflet({
  board,
  activeDistrict,
  onShowList,
  height = 440,
}: {
  board: CoordinationView;
  activeDistrict: string | null;
  /** "Ver en lista" action in the district popup — the console passes a
   *  handler that filters the list; views without a list (ops map) omit it. */
  onShowList?: (district: string) => void;
  /** Fixed panel height in the console; "100%" in the full-screen ops view. */
  height?: number | string;
}) {
  // District rollups are needs-only for color/count: sites draw their own
  // pins, and a district with sites but nothing needed shouldn't shout for
  // attention. Site counts ride along for the district popup summary.
  const rollups = useMemo(() => {
    const m = new Map<string, Rollup>();
    const districtRollup = (district: string): Rollup => {
      let r = m.get(district);
      if (!r) {
        r = { district, needs: 0, critical: 0, byCategory: new Map(), sites: 0 };
        m.set(district, r);
      }
      return r;
    };
    for (const n of board.needs) {
      if (n.need.status !== "open") continue;
      const r = districtRollup(n.need.district);
      r.needs += 1;
      if (n.need.urgency === "critical") r.critical += 1;
      r.byCategory.set(n.need.category, (r.byCategory.get(n.need.category) ?? 0) + 1);
    }
    for (const s of board.sites) {
      if (s.site.status !== "active") continue;
      // Only count sites into existing need districts or create a quiet entry
      // for the popup lookup — badge rendering below filters to needs > 0.
      districtRollup(s.site.district).sites += 1;
    }
    return m;
  }, [board]);

  const siteMarkers = useMemo(
    () =>
      board.sites.filter(
        (v): v is SiteView & { site: { lat: number; lng: number } } =>
          v.site.status === "active" && v.site.lat !== null && v.site.lng !== null,
      ),
    [board],
  );

  // Open needs with a trusted precise position (pin agreed with text at
  // import/sync time); the rest stay represented by their district badge.
  const needDots = useMemo(
    () => board.needs.filter((v) => v.need.status === "open" && v.need.lat !== null && v.need.lng !== null),
    [board],
  );

  // Badges only for districts with open needs; site-only districts stay quiet.
  const markers = [...rollups.values()]
    .filter((r) => r.needs > 0)
    .map((r, i) => ({ r, pos: centroidFor(r.district, i) }));
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
      preferCanvas
      style={{ height, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <NeedDots needs={needDots} />
      {siteMarkers.map((v) => (
        <Marker
          key={v.site.id}
          position={[v.site.lat as number, v.site.lng as number]}
          icon={siteIcon(v.site.category)}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <span style={{ fontWeight: 800 }}>
              {v.site.name}
              {activeAnnouncement(v.site, new Date().toISOString()) ? " · AVISO" : ""}
              {v.site.category === "refugio" ? ` · ${v.site.bedsFree}/${v.site.bedsTotal} camas` : ""}
            </span>
          </Tooltip>
          <Popup>
            <SitePopup view={v} rollup={rollups.get(v.site.district) ?? null} />
          </Popup>
        </Marker>
      ))}
      {markers.map(({ r, pos }) => (
        <Marker
          key={r.district}
          position={[pos.lat, pos.lng]}
          icon={badgeIcon(r, activeDistrict === r.district)}
          zIndexOffset={1000}
        >
          <Tooltip direction="top" offset={[0, -16]} opacity={1}>
            <span style={{ fontWeight: 800 }}>
              {r.district}
              {r.needs > 0 ? ` · ${r.needs} nec.` : ""}
              {r.critical > 0 ? ` · ${r.critical} críticas` : ""}
            </span>
          </Tooltip>
          <Popup>
            <DistrictPopup rollup={r} pos={pos} onShowList={onShowList} />
          </Popup>
        </Marker>
      ))}
      <MapController points={points} />
    </MapContainer>
  );
}
