// Text-first classification for caracasayuda.com records (HOS-2026-007-07/-10).
//
// The source's own `categoria` field is unreliable — most "comida"/"agua"
// tagged reports are really trapped-people rescue reports, and pins are often
// mis-geocoded (a Caracas rescue pinned in Porlamar). So, per the human
// direction of 2026-07-02: EVERYTHING derives from the record's TEXT first;
// the map pin is only trusted when it does not contradict the text.
//
// This module is deterministic and dependency-free on purpose: it is the
// permanent, testable successor of the one-off import script (which never got
// checked in), and it is the seam the AI intake gate (HOS-2026-007-08) will
// extend — an AI classifier can wrap these rules, but the rules keep working
// with no key configured (pluggable-AI philosophy, HOS-2026-001).

import { DISTRICT_CENTROIDS, inCorridor, type LatLng } from "../geo/districts.ts";
import type { NeedCategory, SiteCategory, Urgency } from "../domain/coordination.ts";

/** Lowercase + strip accents/diacritics so "Maiquetía" matches "maiquetia". */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// --- Need category ----------------------------------------------------------

// Ordered: the first matching rule wins. Rescue MUST be first — a report that
// says "personas atrapadas, llevar agua" is a rescue report, not a water need.
const NEED_RULES: ReadonlyArray<{ category: NeedCategory; pattern: RegExp }> = [
  {
    category: "rescue",
    pattern:
      /atrapad|rescat|escombro|derrumb|deslav|colaps|sepultad|bajo tierra|con vida|se escuchan|desaparecid|no puede[n]? salir|auxilio|socorro|maquinaria|remocion|cuadrilla|vivos|vivas|senales de vida|zona sin atender|no ha llegado|buscan a|buscando a|piso \d|quedaron .{0,30}personas/,
  },
  { category: "water", pattern: /\bagua\b|potable|hidratacion/ },
  { category: "formula", pattern: /formula|leche de bebe|panal|pañal|lactante|tetero|bebes?\b/ },
  {
    category: "medical",
    pattern: /medic|insulina|oxigeno|primeros auxilios|herid|hospital|farmacia|tension|diabetes|sangre|suero|gasas?\b/,
  },
  { category: "food", pattern: /comida|aliment|enlatad|no perecedero|arroz|harina|proteina/ },
  { category: "shelter", pattern: /refugio|albergue|techo|colchon|colchonet|cobija|manta|frazada|carpa/ },
  { category: "hygiene", pattern: /higiene|jabon|toallas sanitarias|papel higienico|aseo|desinfectante|cloro/ },
  { category: "clothing", pattern: /\bropa\b|calzado|zapatos|abrigo|vestimenta/ },
];

export function needCategoryFromText(text: string): NeedCategory {
  const t = normalizeText(text);
  for (const rule of NEED_RULES) {
    if (rule.pattern.test(t)) return rule.category;
  }
  return "other";
}

// --- Urgency ----------------------------------------------------------------

/** The source prefixes many descriptions with "Urgencia: alta — …". Rescue is
 *  critical by default: a trapped-person report is never "normal". */
export function urgencyFromText(text: string, category: NeedCategory): Urgency {
  const t = normalizeText(text);
  if (category === "rescue") return "critical";
  if (/urgencia:\s*alta|urgente|critic|emergencia/.test(t)) return "critical";
  if (/urgencia:\s*media/.test(t)) return "high";
  if (/urgencia:\s*baja/.test(t)) return "low";
  return "normal";
}

// --- Site category ----------------------------------------------------------

// Source `categoria` values seen live (2026-07-03): acopio, donaciones, agua,
// comida, refugio, medico, medicamentos, carga, mascotas, combustible,
// transporte, higiene, alimentos, sangre, rescate, herramientas, iluminacion,
// bebes, voluntarios. Only physical aid points map to our five site
// categories (import scope, 2026-07-01); the rest return null (not a site).
const SITE_CATEGORY_BY_SOURCE: Readonly<Record<string, SiteCategory>> = {
  acopio: "acopio",
  donaciones: "acopio",
  alimentos: "acopio",
  comida: "acopio",
  agua: "acopio",
  refugio: "refugio",
  medico: "medico",
  medicamentos: "medico",
  sangre: "medico",
  carga: "internet", // "Internet / carga" — phone charging + connectivity points
  internet: "internet",
  iluminacion: "internet",
  mascotas: "mascotas",
};

export function siteCategoryFromSource(categoria: string, text: string): SiteCategory | null {
  const direct = SITE_CATEGORY_BY_SOURCE[normalizeText(categoria).trim()];
  if (direct) return direct;
  const t = normalizeText(text);
  if (/centro de acopio|punto de acopio|recibe donaciones|recolecta/.test(t)) return "acopio";
  if (/albergue|refugio/.test(t)) return "refugio";
  if (/atencion medica|jornada medica|ambulatorio|hospital de campana/.test(t)) return "medico";
  if (/carga de telefonos|internet|wifi|senal/.test(t)) return "internet";
  if (/mascota|animales/.test(t)) return "mascotas";
  return null;
}

// --- District from text (never from the pin) --------------------------------

// Longest names first so "Catia La Mar" wins over "Catia" and the generic
// "Caracas" fallback only fires when nothing more specific matched.
const DISTRICT_MATCHERS: ReadonlyArray<{ district: string; needle: string }> =
  Object.keys(DISTRICT_CENTROIDS)
    .map((district) => ({ district, needle: normalizeText(district) }))
    .sort((a, b) => b.needle.length - a.needle.length);

export function districtFromText(text: string): string | null {
  const t = normalizeText(text);
  for (const { district, needle } of DISTRICT_MATCHERS) {
    if (t.includes(needle)) return district;
  }
  return null;
}

// --- Pin trust ---------------------------------------------------------------

/** Roughly-flat-earth distance in km — fine at corridor scale. */
export function approxKm(a: LatLng, b: LatLng): number {
  const dLat = (a.lat - b.lat) * 111;
  const dLng = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** How far a pin may sit from its text-derived district centroid before the
 *  text wins and the pin is discarded. Caracas districts are 2–5 km apart;
 *   10 km tolerates imprecise pins without accepting Porlamar-style errors. */
const PIN_TOLERANCE_KM = 10;

export interface LocatedNeed {
  district: string;
  /** Pin kept only when it does not contradict the text (text-first rule). */
  lat: number | null;
  lng: number | null;
}

/** Closest known district centroid to a point, with its distance — used by
 *  the sync's pin fallback and by the site form's address picker. */
export function nearestDistrict(p: LatLng): { district: string; km: number } {
  let best: { district: string; km: number } | null = null;
  for (const [district, centroid] of Object.entries(DISTRICT_CENTROIDS)) {
    const km = approxKm(p, centroid);
    if (!best || km < best.km) best = { district, km };
  }
  return best as { district: string; km: number };
}

/** Resolve a need's location text-first:
 *  - text names a district → that district; keep the pin only if it agrees;
 *  - no district in text → fall back to the pin IF it is inside the affected
 *    corridor (nearest centroid becomes the district);
 *  - neither → null (out of scope for the coordination board; person-reports
 *    from anywhere belong to reunification, not here — HOS-2026-007-08). */
export function locateNeed(text: string, pin: LatLng | null): LocatedNeed | null {
  const fromText = districtFromText(text);
  if (fromText) {
    const centroid = DISTRICT_CENTROIDS[fromText];
    const pinAgrees = pin !== null && approxKm(pin, centroid) <= PIN_TOLERANCE_KM;
    return { district: fromText, lat: pinAgrees ? pin.lat : null, lng: pinAgrees ? pin.lng : null };
  }
  if (pin && inCorridor(pin)) {
    const best = nearestDistrict(pin);
    return { district: best.district, lat: pin.lat, lng: pin.lng };
  }
  return null;
}

// --- Venezuela bounds (site scope) -------------------------------------------

// Same bounding box the source site uses to sanity-check its own pins.
export function inVenezuela(p: LatLng): boolean {
  return p.lat >= 0.5 && p.lat <= 12.9 && p.lng >= -73.4 && p.lng <= -59.5;
}
