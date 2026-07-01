// District-level geography for the coordination map. The coordination board is
// deliberately district-only — NEVER precise addresses (targeting risk, Board
// HOS-2026-007: a live needs/site board must not become a targeting map). These
// are the CENTROID of each district, so a marker sits over the district as a
// whole, never over an individual shelter.

export interface DistrictPoint {
  lat: number;
  lng: number;
}

// Approximate district centroids around the La Guaira coast and Caracas.
export const DISTRICT_POINTS: Record<string, DistrictPoint> = {
  "La Guaira": { lat: 10.6009, lng: -66.933 },
  "Maiquetía": { lat: 10.5985, lng: -66.98 },
  Caracas: { lat: 10.488, lng: -66.8792 },
};

// Where the map opens, framing the whole affected region.
export const REGION_CENTER: DistrictPoint = { lat: 10.54, lng: -66.93 };
export const REGION_ZOOM = 11;

// For a district with no known centroid, drop it near the region center with a
// small deterministic offset so several unknowns don't stack exactly.
export function pointForDistrict(district: string, index: number): DistrictPoint {
  const known = DISTRICT_POINTS[district];
  if (known) return known;
  const ring = 0.03;
  const angle = (index * 2 * Math.PI) / 6;
  return { lat: REGION_CENTER.lat + ring * Math.sin(angle), lng: REGION_CENTER.lng + ring * Math.cos(angle) };
}

// A generic geographic reference the coordinator can open — the region, not any
// specific site.
export const REGION_MAPS_LINK =
  "https://www.google.com/maps/place/La+Guaira,+Venezuela/@10.56,-66.95,11z";
