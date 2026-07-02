// District-level geography for the coordination map. The board is deliberately
// district-only — NEVER precise addresses (targeting risk, Board HOS-2026-007: a
// live needs/site board must not become a targeting map). These are approximate
// district CENTROIDS, so a marker points at the district, not any exact site.

export interface LatLng {
  lat: number;
  lng: number;
}

// Approximate centroids for the pilot region (La Guaira coast + Caracas inland).
export const DISTRICT_CENTROIDS: Record<string, LatLng> = {
  "La Guaira": { lat: 10.601, lng: -66.931 },
  Maiquetía: { lat: 10.598, lng: -66.978 },
  Maiquetia: { lat: 10.598, lng: -66.978 },
  Caracas: { lat: 10.4806, lng: -66.9036 },
  "Caracas Oeste": { lat: 10.505, lng: -66.945 },
  "Caracas Este": { lat: 10.492, lng: -66.835 },
};

// Where to frame the map when there are no known districts to fit to.
export const REGION_CENTER: LatLng = { lat: 10.53, lng: -66.93 };
export const REGION_ZOOM = 11;

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
