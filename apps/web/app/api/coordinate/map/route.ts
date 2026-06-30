import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for Google Maps Static API.
// Keeps GOOGLE_MAPS_API_KEY out of the client bundle entirely.
// Caches tile images for 5 minutes in-process (simple map; no per-user state).

const TILE_CACHE = new Map<string, { buf: ArrayBuffer; ct: string; ts: number }>();
const TILE_TTL_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new NextResponse("GOOGLE_MAPS_API_KEY not configured", { status: 503 });
  }

  const sp = req.nextUrl.searchParams;
  const center = sp.get("center") ?? "10.4806,-66.9036";
  const zoom = sp.get("zoom") ?? "11";
  const size = sp.get("size") ?? "640x360";
  const markers = sp.getAll("m");

  let markerParams = "";
  for (const m of markers) {
    markerParams += `&markers=${encodeURIComponent(m)}`;
  }

  const cacheKey = `${center}|${zoom}|${size}|${markerParams}`;
  const cached = TILE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TILE_TTL_MS) {
    return new NextResponse(cached.buf, {
      headers: { "Content-Type": cached.ct, "Cache-Control": "public, max-age=300" },
    });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", center);
  url.searchParams.set("zoom", zoom);
  url.searchParams.set("size", size);
  url.searchParams.set("scale", "2");
  url.searchParams.set("maptype", "roadmap");
  url.searchParams.set("style", "element:geometry|color:0x1a2e1f");
  url.searchParams.set("key", apiKey);

  for (const m of markers) {
    url.searchParams.append("markers", m);
  }

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Maps API ${res.status}`);
    const ct = res.headers.get("content-type") ?? "image/png";
    const buf = await res.arrayBuffer();
    TILE_CACHE.set(cacheKey, { buf, ct, ts: Date.now() });
    return new NextResponse(buf, {
      headers: { "Content-Type": ct, "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    console.error("Maps proxy error:", err);
    return new NextResponse("Map unavailable", { status: 502 });
  }
}
