"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/HosDashboard";
import type { GeoEntity, SectorStatus } from "@/app/lib/bff/coordinate";
import {
  AlertTriangle,
  Layers,
  MapPin,
  Radio,
  RefreshCw,
  Truck,
  UserCheck,
  UserRoundSearch,
  Users,
  Warehouse,
} from "lucide-react";

const KIND_META: Record<
  GeoEntity["kind"],
  { label: string; color: string; icon: React.ElementType }
> = {
  missing:   { label: "Missing",   color: "var(--hos-red)",    icon: UserRoundSearch },
  found:     { label: "Found",     color: "var(--hos-green)",  icon: UserCheck },
  shelter:   { label: "Shelter",   color: "var(--hos-blue)",   icon: Warehouse },
  need:      { label: "Need",      color: "var(--hos-yellow)", icon: AlertTriangle },
  volunteer: { label: "Volunteer", color: "#8B5CF6",           icon: Users },
  resource:  { label: "Resource",  color: "var(--hos-ink)",    icon: Truck },
};

const ALERT_STYLE: Record<SectorStatus["alertLevel"], string> = {
  ok:       "border-[var(--hos-border)] bg-white",
  warn:     "border-[var(--hos-yellow)] bg-[#fffbf0]",
  critical: "border-[var(--hos-red)] bg-[#fff6f5]",
};

// Build marker strings for the map proxy
function buildMarkers(entities: GeoEntity[]): string[] {
  const colorMap: Record<GeoEntity["kind"], string> = {
    missing:   "red",
    found:     "green",
    shelter:   "blue",
    need:      "yellow",
    volunteer: "purple",
    resource:  "gray",
  };
  return entities.map(
    (e) => `color:${colorMap[e.kind]}|label:${e.kind[0].toUpperCase()}|${e.lat},${e.lng}`
  );
}

function buildMapSrc(entities: GeoEntity[]): string {
  const markers = buildMarkers(entities);
  const params = new URLSearchParams({ center: "10.52,-66.93", zoom: "11", size: "700x340" });
  for (const m of markers) params.append("m", m);
  return `/api/coordinate/map?${params}`;
}

export default function CoordinatePage() {
  const [entities, setEntities] = useState<GeoEntity[]>([]);
  const [sectors, setSectors] = useState<SectorStatus[]>([]);
  const [briefing, setBriefing] = useState<string>("");
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [filter, setFilter] = useState<GeoEntity["kind"] | "all">("all");

  useEffect(() => {
    fetch("/api/coordinate/geodata")
      .then((r) => r.json())
      .then((d) => { setEntities(d.entities); setSectors(d.sectors); })
      .catch(console.error);

    fetch("/api/coordinate/situation")
      .then((r) => r.json())
      .then((d) => { setBriefing(d.briefing); setBriefingLoading(false); })
      .catch(() => { setBriefing("Situation briefing unavailable."); setBriefingLoading(false); });
  }, []);

  const filtered = filter === "all" ? entities : entities.filter((e) => e.kind === filter);
  const mapSrc = entities.length > 0 ? buildMapSrc(entities) : null;

  const kinds: Array<GeoEntity["kind"]> = ["missing", "found", "shelter", "need", "volunteer", "resource"];

  return (
    <AppShell
      title="Response Coordination"
      subtitle="Coordinate the whole response, together"
      trustLayer={false}
      onToggleTrustLayer={() => {}}
      onOpenFamily={() => {}}
      modalKind={null}
      onCloseModal={() => {}}
    >
      <div className="flex flex-col gap-[24px] px-[28px] py-[28px] max-[900px]:px-[16px] max-[900px]:py-[20px]">
        {/* AI Situation Briefing */}
        <div className="rounded-[10px] border border-[var(--hos-border)] bg-white p-[18px]">
          <div className="mb-[10px] flex items-center gap-[8px]">
            <Layers size={14} className="text-[var(--hos-blue)]" />
            <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--hos-blue)]">
              AI Situation Briefing
            </span>
          </div>
          {briefingLoading ? (
            <div className="flex items-center gap-2 text-[13px] text-[var(--hos-muted)]">
              <RefreshCw size={13} className="animate-spin" /> Generating situation report…
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed text-[var(--hos-ink)]">{briefing}</p>
          )}
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-[10px] border border-[var(--hos-border)] bg-[var(--hos-dark)]">
          <div className="flex items-center justify-between px-[14px] py-[10px]">
            <div className="flex items-center gap-[6px] text-[12px] font-semibold text-[#8fa99a]">
              <MapPin size={13} /> Geotagged Response Map
            </div>
            <span className="text-[11px] text-[#5a7066]">
              {entities.length} entities · {sectors.length} active zones
            </span>
          </div>
          {mapSrc && !mapError ? (
            <div className="relative">
              {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--hos-dark)] text-[13px] text-[#8fa99a]">
                  <RefreshCw size={14} className="mr-2 animate-spin" /> Loading map…
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapSrc}
                alt="Response coordination map"
                className="block w-full"
                style={{ opacity: mapLoading ? 0 : 1, transition: "opacity 0.3s" }}
                onLoad={() => setMapLoading(false)}
                onError={() => { setMapLoading(false); setMapError(true); }}
              />
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-[#5a7066]">
              {mapError
                ? "Map unavailable — GOOGLE_MAPS_API_KEY not configured or Static Maps API not enabled."
                : "Loading entities…"}
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-x-[16px] gap-y-[6px] px-[14px] py-[10px]">
            {kinds.map((k) => {
              const m = KIND_META[k];
              return (
                <div key={k} className="flex items-center gap-[5px] text-[11px] text-[#8fa99a]">
                  <span
                    className="inline-block h-[8px] w-[8px] rounded-full"
                    style={{ background: m.color }}
                  />
                  {m.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter + Entity List */}
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-wrap gap-[8px]">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-[12px] py-[4px] text-[12px] font-semibold transition ${
                filter === "all"
                  ? "bg-[var(--hos-ink)] text-white"
                  : "border border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:bg-[var(--hos-bg)]"
              }`}
            >
              All ({entities.length})
            </button>
            {kinds.map((k) => {
              const count = entities.filter((e) => e.kind === k).length;
              if (count === 0) return null;
              const m = KIND_META[k];
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-full px-[12px] py-[4px] text-[12px] font-semibold transition ${
                    filter === k
                      ? "text-white"
                      : "border border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:bg-[var(--hos-bg)]"
                  }`}
                  style={filter === k ? { background: m.color } : {}}
                >
                  {m.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid gap-[8px] sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const m = KIND_META[e.kind];
              const Icon = m.icon;
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-[10px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[12px]"
                >
                  <span
                    className="mt-[1px] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[6px] text-white"
                    style={{ background: m.color }}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--hos-ink)]">
                      {e.label}
                    </p>
                    <p className="mt-[2px] font-mono text-[11px] text-[var(--hos-muted)]">
                      {e.geotag}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Sector Grid */}
        <div>
          <h2 className="mb-[10px] text-[14px] font-bold text-[var(--hos-ink)]">Active Sectors</h2>
          <div className="grid gap-[8px] sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s) => (
              <div
                key={s.zone.code}
                className={`rounded-[8px] border p-[12px] ${ALERT_STYLE[s.alertLevel]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[var(--hos-ink)]">
                    {s.zone.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--hos-muted)]">
                    {s.zone.code}
                  </span>
                </div>
                <div className="mt-[8px] grid grid-cols-3 gap-[4px] text-[11px]">
                  <div className="text-[var(--hos-red)]">
                    <div className="font-bold">{s.missing}</div>
                    <div className="text-[var(--hos-muted)]">missing</div>
                  </div>
                  <div className="text-[var(--hos-green)]">
                    <div className="font-bold">{s.found}</div>
                    <div className="text-[var(--hos-muted)]">found</div>
                  </div>
                  <div className="text-[#8B5CF6]">
                    <div className="font-bold">{s.volunteers}</div>
                    <div className="text-[var(--hos-muted)]">volunteers</div>
                  </div>
                </div>
                {s.alertLevel !== "ok" && (
                  <div
                    className={`mt-[8px] flex items-center gap-[5px] text-[11px] font-bold ${
                      s.alertLevel === "critical"
                        ? "text-[var(--hos-alert)]"
                        : "text-[var(--hos-warn)]"
                    }`}
                  >
                    <AlertTriangle size={11} />
                    {s.alertLevel === "critical" ? "CRITICAL" : "ELEVATED"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
