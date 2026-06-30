// Zone-grid geolocation tagging for HOS field operations.
//
// Inspiration: clock-position sector grids used in radio/field ops to give
// every location a short, unambiguous code communicable over voice or SMS.
// Format: {country}-{city}-{sector}  e.g. VE-CCS-001 (Venezuela, Caracas, Sector 1)
//
// Each zone carries a center lat/lng and a human name so the code resolves
// to both a map pin and a readable label.

export interface GeoTag {
  code: string;       // e.g. "VE-CCS-001"
  name: string;       // e.g. "Caracas Centro"
  city: string;       // e.g. "CCS"
  country: string;    // e.g. "VE"
  lat: number;
  lng: number;
  radiusKm: number;   // coverage radius for the zone
}

// Zones for the Venezuela Phase 0 deployment.
// Sector numbering: clock-position grid from city center, nearest ring first.
// 001-006 = Caracas metro; 007-008 = La Guaira / Maiquetia coastal; 009+ = expansion
const ZONES_VE: GeoTag[] = [
  { code: "VE-CCS-001", name: "Caracas Centro",     city: "CCS", country: "VE", lat: 10.4806,  lng: -66.9036, radiusKm: 3.0 },
  { code: "VE-CCS-002", name: "Caracas Este",        city: "CCS", country: "VE", lat: 10.4878,  lng: -66.8620, radiusKm: 4.5 },
  { code: "VE-CCS-003", name: "Caracas Oeste",       city: "CCS", country: "VE", lat: 10.4755,  lng: -66.9480, radiusKm: 4.5 },
  { code: "VE-CCS-004", name: "Caracas Norte",       city: "CCS", country: "VE", lat: 10.5200,  lng: -66.9000, radiusKm: 4.0 },
  { code: "VE-CCS-005", name: "Caracas Sur",         city: "CCS", country: "VE", lat: 10.4400,  lng: -66.9100, radiusKm: 4.0 },
  { code: "VE-CCS-006", name: "Petare / Guarenas",   city: "CCS", country: "VE", lat: 10.4723,  lng: -66.8027, radiusKm: 6.0 },
  { code: "VE-LGU-001", name: "La Guaira",           city: "LGU", country: "VE", lat: 10.6041,  lng: -66.9320, radiusKm: 3.5 },
  { code: "VE-MAI-001", name: "Maiquetia",           city: "MAI", country: "VE", lat: 10.5982,  lng: -66.9597, radiusKm: 3.0 },
  { code: "VE-MAI-002", name: "Catia La Mar",        city: "MAI", country: "VE", lat: 10.5880,  lng: -67.0200, radiusKm: 3.0 },
];

const ALL_ZONES: GeoTag[] = ZONES_VE;

/** Resolve a geotag code to its full descriptor. */
export function resolveGeoTag(code: string): GeoTag | undefined {
  return ALL_ZONES.find((z) => z.code === code);
}

/** Return all zones for a given country. */
export function getZonesByCountry(country: string): GeoTag[] {
  return ALL_ZONES.filter((z) => z.country === country);
}

/** Return all zones for a given city code. */
export function getZonesByCity(city: string): GeoTag[] {
  return ALL_ZONES.filter((z) => z.city === city.toUpperCase());
}

/** Assign the nearest zone code to a lat/lng pair. */
export function tagLocation(lat: number, lng: number, country = "VE"): GeoTag | undefined {
  const candidates = ALL_ZONES.filter((z) => z.country === country);
  let nearest: GeoTag | undefined;
  let minDist = Infinity;
  for (const zone of candidates) {
    const d = haversineKm(lat, lng, zone.lat, zone.lng);
    if (d < minDist) { minDist = d; nearest = zone; }
  }
  return minDist <= (nearest?.radiusKm ?? 0) * 1.5 ? nearest : nearest; // always return nearest
}

/** Great-circle distance in km (Haversine). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number { return (deg * Math.PI) / 180; }

export { ALL_ZONES };
