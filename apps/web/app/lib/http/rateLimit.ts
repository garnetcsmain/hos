// Minimal in-memory fixed-window rate limiter. Public report-submission and
// lookup endpoints are abuse targets (AGENTS.md §3), so every one is capped.
// In-process only — fine for a single-node MVP; a real deployment would back
// this with Redis or the platform edge.

import { tooManyRequests } from "../errors.ts";

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

function clientKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${route}:${ip}`;
}

/** Throws HttpError(429) when the caller exceeds `limit` requests per `windowMs`. */
export function enforceRateLimit(request: Request, route: string, limit: number, windowMs: number): void {
  const key = clientKey(request, route);
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    existing.count += 1;
    if (existing.count > limit) {
      throw tooManyRequests("rate limit exceeded, slow down");
    }
  }

  // Opportunistic pruning so the map doesn't grow unbounded.
  if (windows.size > 5000) {
    for (const [mapKey, window] of windows) {
      if (window.resetAt <= now) windows.delete(mapKey);
    }
  }
}
