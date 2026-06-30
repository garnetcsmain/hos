import { ALL_ZONES, type GeoTag } from "@/app/lib/geotag";

export type EntityKind =
  | "missing"
  | "found"
  | "shelter"
  | "need"
  | "volunteer"
  | "resource";

export interface GeoEntity {
  id: string;
  kind: EntityKind;
  label: string;
  geotag: string;      // e.g. "VE-CCS-001"
  lat: number;
  lng: number;
  meta?: Record<string, string | number>;
}

export interface SectorStatus {
  zone: GeoTag;
  missing: number;
  found: number;
  shelters: number;
  needs: number;
  volunteers: number;
  alertLevel: "ok" | "warn" | "critical";
}

// Seed data representing Phase 0 active entities.
// When the real DB layer is wired, replace this with a repository query.
const SEED_ENTITIES: GeoEntity[] = [
  // Missing clusters
  { id: "m-001", kind: "missing",   label: "47 missing reports",   geotag: "VE-LGU-001", lat: 10.604,  lng: -66.932, meta: { count: 47 } },
  { id: "m-002", kind: "missing",   label: "31 missing reports",   geotag: "VE-MAI-001", lat: 10.598,  lng: -66.960, meta: { count: 31 } },
  { id: "m-003", kind: "missing",   label: "112 missing reports",  geotag: "VE-CCS-002", lat: 10.488,  lng: -66.862, meta: { count: 112 } },
  { id: "m-004", kind: "missing",   label: "89 missing reports",   geotag: "VE-CCS-003", lat: 10.476,  lng: -66.948, meta: { count: 89 } },

  // Found / sheltered
  { id: "f-001", kind: "found",     label: "Shelter 17 — 203 persons", geotag: "VE-MAI-001", lat: 10.596, lng: -66.957, meta: { capacity: 250, occupancy: 203 } },
  { id: "f-002", kind: "found",     label: "Hospital Vargas — 58",     geotag: "VE-CCS-001", lat: 10.483, lng: -66.906, meta: { capacity: 120, occupancy: 58 } },
  { id: "f-003", kind: "found",     label: "Escuela Simón Bolívar",    geotag: "VE-CCS-003", lat: 10.478, lng: -66.950, meta: { capacity: 80, occupancy: 62 } },

  // Shelters
  { id: "s-001", kind: "shelter",   label: "Refugio La Guaira A",      geotag: "VE-LGU-001", lat: 10.606, lng: -66.930, meta: { capacity: 150, available: 47 } },
  { id: "s-002", kind: "shelter",   label: "Refugio Maiquetia B",      geotag: "VE-MAI-002", lat: 10.588, lng: -67.021, meta: { capacity: 200, available: 0 } },
  { id: "s-003", kind: "shelter",   label: "CCCT Emergency Center",    geotag: "VE-CCS-002", lat: 10.490, lng: -66.854, meta: { capacity: 300, available: 88 } },

  // Active needs
  { id: "n-001", kind: "need",      label: "Water — critical, LGU",    geotag: "VE-LGU-001", lat: 10.603, lng: -66.935, meta: { urgency: "critical", category: "water" } },
  { id: "n-002", kind: "need",      label: "Medicine — MAI shelter",   geotag: "VE-MAI-001", lat: 10.599, lng: -66.962, meta: { urgency: "high", category: "medicine" } },
  { id: "n-003", kind: "need",      label: "Search teams — CCS Norte", geotag: "VE-CCS-004", lat: 10.521, lng: -66.900, meta: { urgency: "high", category: "personnel" } },

  // Volunteer stations
  { id: "v-001", kind: "volunteer", label: "Cruz Roja — Zona Norte",   geotag: "VE-CCS-004", lat: 10.518, lng: -66.898, meta: { team_size: 24 } },
  { id: "v-002", kind: "volunteer", label: "Bomberos La Guaira",       geotag: "VE-LGU-001", lat: 10.602, lng: -66.929, meta: { team_size: 18 } },
  { id: "v-003", kind: "volunteer", label: "Protección Civil MAI",     geotag: "VE-MAI-001", lat: 10.597, lng: -66.958, meta: { team_size: 31 } },

  // Resources
  { id: "r-001", kind: "resource",  label: "Supply truck convoy",      geotag: "VE-CCS-001", lat: 10.481, lng: -66.904, meta: { units: 4, status: "en route" } },
];

export function getCoordinationEntities(): GeoEntity[] {
  return SEED_ENTITIES;
}

export function getSectorStatus(): SectorStatus[] {
  const entities = SEED_ENTITIES;
  return ALL_ZONES.filter((z) => z.country === "VE").map((zone) => {
    const zoneEntities = entities.filter((e) => e.geotag === zone.code);
    const missing = zoneEntities.filter((e) => e.kind === "missing").reduce((s, e) => s + ((e.meta?.count as number) ?? 1), 0);
    const found = zoneEntities.filter((e) => e.kind === "found").reduce((s, e) => s + ((e.meta?.occupancy as number) ?? 1), 0);
    const shelters = zoneEntities.filter((e) => e.kind === "shelter").length;
    const needs = zoneEntities.filter((e) => e.kind === "need").length;
    const volunteers = zoneEntities.filter((e) => e.kind === "volunteer").reduce((s, e) => s + ((e.meta?.team_size as number) ?? 0), 0);
    const hasWater = zoneEntities.some((e) => e.kind === "need" && e.meta?.category === "water" && e.meta?.urgency === "critical");
    const alertLevel: SectorStatus["alertLevel"] = hasWater ? "critical" : missing > 50 ? "warn" : "ok";
    return { zone, missing, found, shelters, needs, volunteers, alertLevel };
  }).filter((s) => s.missing + s.found + s.shelters + s.needs + s.volunteers > 0);
}

export function getCoordinationSummary() {
  const entities = SEED_ENTITIES;
  return {
    totalMissing: entities.filter((e) => e.kind === "missing").reduce((s, e) => s + ((e.meta?.count as number) ?? 1), 0),
    totalFound: entities.filter((e) => e.kind === "found").reduce((s, e) => s + ((e.meta?.occupancy as number) ?? 1), 0),
    activeShelters: entities.filter((e) => e.kind === "shelter").length,
    openNeeds: entities.filter((e) => e.kind === "need").length,
    volunteerCount: entities.filter((e) => e.kind === "volunteer").reduce((s, e) => s + ((e.meta?.team_size as number) ?? 0), 0),
    criticalZones: getSectorStatus().filter((s) => s.alertLevel === "critical").map((s) => s.zone.name),
  };
}
