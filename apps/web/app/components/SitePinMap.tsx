"use client";

// Mini pin-picker map for the site form (HOS-2026-007-13): shows the chosen
// position and lets the coordinator fine-tune it by dragging the pin or
// clicking the map — the Google-Maps-style "make sure the point is exactly
// right" step. SSR-unsafe (Leaflet), so always dynamic-imported.

import { useEffect } from "react";
import { Circle, MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_CENTER, type LatLng } from "@/app/lib/geo/districts";

const pinIcon = L.divIcon({
  className: "hos-map-pin",
  html: `<div style="width:22px;height:22px;border-radius:999px 999px 999px 0;transform:rotate(-45deg);
    background:#1D6FA8;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function ClickToPlace({ onChange }: { onChange: (pos: LatLng) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function FollowPosition({ pos }: { pos: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 15));
    // A search result can land anywhere in the country; always re-center.
  }, [map, pos]);
  return null;
}

export default function SitePinMap({
  pos,
  radiusM = 0,
  onChange,
}: {
  pos: LatLng | null;
  /** Coverage radius in meters, drawn as a circle around the pin. 0 = a point. */
  radiusM?: number;
  onChange: (pos: LatLng) => void;
}) {
  return (
    <MapContainer
      center={[pos?.lat ?? REGION_CENTER.lat, pos?.lng ?? REGION_CENTER.lng]}
      zoom={pos ? 15 : 10}
      scrollWheelZoom
      style={{ height: 220, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {pos && radiusM > 0 ? (
        <Circle center={[pos.lat, pos.lng]} radius={radiusM} pathOptions={{ color: "#1D6FA8", weight: 1.5, fillOpacity: 0.12 }} />
      ) : null}
      {pos ? (
        <Marker
          position={[pos.lat, pos.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onChange({ lat: p.lat, lng: p.lng });
            },
          }}
        />
      ) : null}
      <ClickToPlace onChange={onChange} />
      <FollowPosition pos={pos} />
    </MapContainer>
  );
}
