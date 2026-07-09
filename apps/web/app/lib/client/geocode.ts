// Keyless address search for the site form (HOS-2026-007-13): Nominatim
// (OpenStreetMap), the same geocoder the caracasayuda.com source site uses.
// Fair-use service: low volume (one search per button press), Venezuela-
// scoped, no key, CORS-enabled. If it is down the form still works — the
// coordinator drops the pin by hand on the mini map instead.

export interface GeocodeHit {
  label: string;
  lat: number;
  lng: number;
}

export async function searchAddress(query: string): Promise<GeocodeHit[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ve&limit=5&q=" +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error("No se pudo buscar la dirección. Puede fijar el punto en el mapa.");
  const rows = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}
