// District-level geography for the coordination map. NEEDS are deliberately
// district-only — never precise addresses (targeting risk, Board HOS-2026-007: a
// live needs board must not become a targeting map). These are approximate
// district CENTROIDS, so a need marker points at the district, not any exact
// spot. Sites imported from public maps (caracasayuda.com) may carry their own
// public lat/lng and don't use this table.

export interface LatLng {
  lat: number;
  lng: number;
}

// Approximate centroids for the affected region: the La Guaira coast, Caracas
// (Libertador + metro Miranda) and the near valleys. Used both by the map and
// by the caracasayuda import (scripts/), which assigns each report to its
// nearest centroid — keep names and coordinates in sync with that script.
export const DISTRICT_CENTROIDS: Record<string, LatLng> = {
  // La Guaira (Vargas) coast, west to east
  Carayaca: { lat: 10.539, lng: -67.121 },
  "Catia La Mar": { lat: 10.6, lng: -67.03 },
  Maiquetía: { lat: 10.598, lng: -66.978 },
  Maiquetia: { lat: 10.598, lng: -66.978 },
  "La Guaira": { lat: 10.601, lng: -66.931 },
  Macuto: { lat: 10.606, lng: -66.9 },
  Caraballeda: { lat: 10.612, lng: -66.852 },
  Naiguatá: { lat: 10.622, lng: -66.735 },
  // Caracas — Libertador
  Catia: { lat: 10.516, lng: -66.95 },
  "23 de Enero": { lat: 10.508, lng: -66.932 },
  "El Junquito": { lat: 10.465, lng: -67.078 },
  Antímano: { lat: 10.472, lng: -66.982 },
  Caricuao: { lat: 10.443, lng: -66.978 },
  "La Vega": { lat: 10.47, lng: -66.95 },
  "El Paraíso": { lat: 10.488, lng: -66.937 },
  "El Valle": { lat: 10.458, lng: -66.903 },
  Coche: { lat: 10.443, lng: -66.916 },
  "Caracas Centro": { lat: 10.506, lng: -66.91 },
  "Sabana Grande": { lat: 10.495, lng: -66.879 },
  // Caracas — metro Miranda
  Chacao: { lat: 10.496, lng: -66.853 },
  Baruta: { lat: 10.432, lng: -66.875 },
  "El Hatillo": { lat: 10.425, lng: -66.825 },
  Petare: { lat: 10.481, lng: -66.807 },
  "La Dolorita": { lat: 10.455, lng: -66.76 },
  Caucagüita: { lat: 10.472, lng: -66.735 },
  Guarenas: { lat: 10.464, lng: -66.607 },
  Guatire: { lat: 10.474, lng: -66.54 },
  "Los Teques": { lat: 10.345, lng: -67.043 },
  "San Antonio de los Altos": { lat: 10.377, lng: -66.965 },
  Charallave: { lat: 10.243, lng: -66.856 },
  "Santa Teresa del Tuy": { lat: 10.234, lng: -66.663 },
  // Generic fallbacks kept for older records/seeds
  Caracas: { lat: 10.4806, lng: -66.9036 },
  "Caracas Oeste": { lat: 10.505, lng: -66.945 },
  "Caracas Este": { lat: 10.492, lng: -66.835 },
};

// Where to frame the map when there are no known districts to fit to.
export const REGION_CENTER: LatLng = { lat: 10.53, lng: -66.93 };
export const REGION_ZOOM = 11;

// The affected Caracas–La Guaira corridor; used to decide what the initial map
// view should frame (sites elsewhere in Venezuela stay reachable by zooming out).
export const CORRIDOR_BOUNDS = {
  minLat: 10.15,
  maxLat: 10.75,
  minLng: -67.3,
  maxLng: -66.4,
} as const;

export function inCorridor(p: LatLng): boolean {
  return (
    p.lat >= CORRIDOR_BOUNDS.minLat &&
    p.lat <= CORRIDOR_BOUNDS.maxLat &&
    p.lng >= CORRIDOR_BOUNDS.minLng &&
    p.lng <= CORRIDOR_BOUNDS.maxLng
  );
}

/** Centroid for a district, or a deterministic spot near the region center for
 *  an unknown district (so its marker still shows without pretending to a real
 *  location). Index keeps unknowns from stacking on the same point. */
export function centroidFor(district: string, index = 0): LatLng {
  const known = DISTRICT_CENTROIDS[district];
  if (known) return known;
  const ring = 0.03;
  const angle = (index * 2 * Math.PI) / 6;
  return {
    lat: REGION_CENTER.lat + ring * Math.cos(angle),
    lng: REGION_CENTER.lng + ring * Math.sin(angle),
  };
}

// A generic geographic reference the coordinator can open — the region, not any
// specific site.
export const REGION_MAPS_LINK =
  "https://www.google.com/maps/place/La+Guaira,+Venezuela/@10.56,-66.95,11z";
