// District-level geography for the coordination map. The coordination board is
// deliberately district-only — NEVER precise addresses (targeting risk, Board
// HOS-2026-007: a live needs/site board must not become a targeting map). These
// are approximate ZONES on a schematic regional map (the La Guaira coast with
// Caracas inland), not exact coordinates, so nothing here can pinpoint a site.

export interface DistrictZone {
  /** absolute-position Tailwind classes for the district's zone on the map */
  box: string;
}

// Approximate layout: the Caribbean coast runs along the top; La Guaira and
// Maiquetía are coastal (north), Caracas sits inland (south, behind the mountain).
export const DISTRICT_ZONES: Record<string, DistrictZone> = {
  "La Guaira": { box: "left-[5%] top-[14%] w-[30%] h-[28%]" },
  "Maiquetía": { box: "left-[40%] top-[10%] w-[31%] h-[30%]" },
  Caracas: { box: "left-[27%] top-[54%] w-[46%] h-[34%]" },
};

// Slots for any district not in the map above, laid out so they never overlap
// the known zones.
export const FALLBACK_BOXES = [
  "left-[73%] top-[52%] w-[24%] h-[28%]",
  "left-[6%] top-[64%] w-[18%] h-[24%]",
  "left-[76%] top-[12%] w-[20%] h-[26%]",
];

// A generic geographic reference the coordinator can open — the region, not any
// specific site.
export const REGION_MAPS_LINK =
  "https://www.google.com/maps/place/La+Guaira,+Venezuela/@10.56,-66.95,11z";
