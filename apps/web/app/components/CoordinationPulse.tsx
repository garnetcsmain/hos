"use client";

// Pulso (/pulso, HOS-2026-013-00) — the standalone live pulse board ("Brain
// Board"), coordinator-gated. A presentation-grade view of the SAME real board
// the console operates on: every counter, node, flow and ticker row binds to
// recorded state. Direction reads supply -> demand (human direction
// 2026-07-03): help on the left ships to district needs on the right.
//
// Visual language (human direction 2026-07-03, Dala reference; round 4 moved
// the canvas to WHITE so the page is continuous with the app chrome): a clean
// void with no panels/borders/cards — elements float and hierarchy comes from
// SCALE, not weight; one violet accent for the single primary action; amber
// for attention (dark amber for amber TEXT — yellow text on white fails
// legibility). Background triangle particles are explicitly decorative
// ambience; only the pulses on the flow lines are data. Legibility first:
// near-black ink for content, gray for labels only, nothing under 11px.
//
// Honesty rules (HOS-2026-002-D4 lineage): real mode never animates a data
// claim that didn't happen — a quiet board says it is quiet. Demo mode is
// loudly labeled (badge, watermark, per-row tags) and never fakes counters.
//
// The PUBLIC variant is NOT this component: it stays behind the HOS-2026-007
// public-feed gate re-review and a PII-free aggregate feed.

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_LABEL, SITE_PIN } from "@/app/components/CoordinationParts";
import { PulseCanvas } from "@/app/components/CoordinationPulseCanvas";
import {
  AMBER,
  AMBER_TEXT,
  CRITICAL,
  DELIVERED,
  MAX_DISTRICTS,
  MUTED,
  PulseActivity,
  PulseHeader,
  PulseLegend,
  PulseMetrics,
  PulseSpotlight,
  VIOLET,
  type DemoPulse,
  type PulseDistrict,
  type PulseModel,
  type PulseSiteSummary,
  type TickerRow,
} from "@/app/components/CoordinationPulseBits";
import type { SiteCategory } from "@/app/lib/domain/coordination";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";

function usePulseModel(board: CoordinationView, nowTick: number): PulseModel {
  return useMemo(() => {
    const cats = new Map<SiteCategory, PulseSiteSummary>();
    let beds = 0;
    let sitesActive = 0;
    for (const { site } of board.sites) {
      if (site.status !== "active") continue;
      sitesActive += 1;
      beds += site.bedsFree;
      const c = cats.get(site.category) ?? { count: 0, beds: 0, fresh: 0 };
      c.count += 1;
      c.beds += site.bedsFree;
      if (nowTick - Date.parse(site.updatedAt) < 24 * 3600_000) c.fresh += 1;
      cats.set(site.category, c);
    }

    const districts = new Map<string, PulseDistrict>();
    const d = (name: string) => {
      const v =
        districts.get(name) ??
        { open: 0, critical: 0, assigned: 0, assignedCritical: 0, delivered: 0 };
      districts.set(name, v);
      return v;
    };
    let open = 0;
    let critical = 0;
    let assignments = 0;
    let delivered7d = 0;
    const orgsWithClaims = new Set<string>();
    for (const { need } of board.needs) {
      if (need.status === "open") {
        open += 1;
        const v = d(need.district);
        v.open += 1;
        if (need.urgency === "critical") {
          critical += 1;
          v.critical += 1;
        }
      } else if (need.status === "claimed") {
        assignments += 1;
        const v = d(need.district);
        v.assigned += 1;
        if (need.urgency === "critical") v.assignedCritical += 1;
        if (need.claimedByOrgId) orgsWithClaims.add(need.claimedByOrgId);
      } else if (
        need.status === "received" &&
        nowTick - Date.parse(need.updatedAt) < 7 * 24 * 3600_000
      ) {
        d(need.district).delivered += 1;
        delivered7d += 1;
      }
    }

    const withFlows = [...districts.entries()].filter(([, v]) => v.assigned > 0);
    const rest = [...districts.entries()]
      .filter(([, v]) => v.assigned === 0)
      .sort((a, b) => b[1].open - a[1].open);
    const ranked = [...withFlows, ...rest]
      .slice(0, MAX_DISTRICTS)
      .sort((a, b) => b[1].open - a[1].open);
    const hiddenOpen = [...districts.entries()]
      .filter(([name]) => !ranked.some(([r]) => r === name))
      .reduce((s, [, v]) => s + v.open, 0);

    const ticker: TickerRow[] = [];
    for (const { need, claimedByOrg } of board.needs) {
      if (need.status === "claimed") {
        ticker.push({
          key: `n-${need.id}`,
          color: need.urgency === "critical" ? CRITICAL : VIOLET,
          text: `${CATEGORY_LABEL[need.category]} asignado a ${claimedByOrg?.name ?? "un equipo"} — ${need.district}`,
          at: need.updatedAt,
          district: need.district,
        });
      } else if (need.status === "received") {
        ticker.push({
          key: `n-${need.id}`,
          color: DELIVERED,
          text: `${need.quantity} ${need.unit} de ${CATEGORY_LABEL[need.category].toLowerCase()} recibido y confirmado por el sitio — ${need.district}`,
          at: need.updatedAt,
          district: need.district,
        });
      }
    }
    for (const { site } of board.sites) {
      if (site.status === "active" && nowTick - Date.parse(site.updatedAt) < 24 * 3600_000) {
        ticker.push({
          key: `s-${site.id}`,
          color: SITE_PIN[site.category].color,
          text: `Sitio confirmado operativo: ${site.name} — ${site.district}`,
          at: site.updatedAt,
          district: site.district,
        });
      }
    }
    ticker.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    return {
      cats: [...cats.entries()].sort((a, b) => b[1].count - a[1].count),
      ranked,
      hiddenDistricts: districts.size - ranked.length,
      hiddenOpen,
      open,
      critical,
      beds,
      sitesActive,
      assignments,
      teams: orgsWithClaims.size,
      delivered7d,
      freshSites: [...cats.values()].reduce((s, c) => s + c.fresh, 0),
      ticker: ticker.slice(0, 6),
    };
  }, [board, nowTick]);
}

export function CoordinationPulse({
  board,
  lastUpdated,
  refreshing,
  onReload,
}: {
  board: CoordinationView;
  lastUpdated: number | null;
  refreshing: boolean;
  onReload: () => void;
}) {
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [focus, setFocus] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [demoPulses, setDemoPulses] = useState<DemoPulse[]>([]);
  const [demoTicker, setDemoTicker] = useState<TickerRow[]>([]);
  const [spot, setSpot] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const model = usePulseModel(board, nowTick);
  const rankedNamesRef = useRef<string[]>([]);

  useEffect(() => {
    rankedNamesRef.current = model.ranked.map(([name]) => name);
  }, [model.ranked]);

  useEffect(() => {
    if (!demo) return;
    let n = 0;
    const t = setInterval(() => {
      const names = rankedNamesRef.current;
      if (names.length === 0) return;
      n += 1;
      const district = names[(n * 7) % names.length];
      const kind = n % 4;
      const row: TickerRow =
        kind === 0
          ? { key: `d-${n}`, color: CRITICAL, text: `Rescate crítico asignado a un equipo — ${district}`, at: new Date().toISOString(), district, demo: true }
          : kind === 1
            ? { key: `d-${n}`, color: VIOLET, text: `Agua asignada a una organización — ${district}`, at: new Date().toISOString(), district, demo: true }
            : kind === 2
              ? { key: `d-${n}`, color: DELIVERED, text: `Entrega recibida y confirmada por el sitio — ${district}`, at: new Date().toISOString(), district, demo: true }
              : { key: `d-${n}`, color: AMBER, text: `Sitio confirmado operativo — ${district}`, at: new Date().toISOString(), district, demo: true };
      setDemoPulses((prev) => [...prev, { id: n, district, critical: kind === 0 }].slice(-12));
      setDemoTicker((prev) => [row, ...prev].slice(0, 6));
    }, 1700);
    return () => clearInterval(t);
  }, [demo]);

  useEffect(() => {
    const t = setInterval(() => setSpot((s) => s + 1), 4500);
    return () => clearInterval(t);
  }, []);

  const demoFlows = useMemo(() => {
    const g = new Map<string, { count: number; critical: boolean }>();
    for (const p of demoPulses) {
      const v = g.get(p.district) ?? { count: 0, critical: false };
      v.count += 1;
      v.critical = v.critical || p.critical;
      g.set(p.district, v);
    }
    return g;
  }, [demoPulses]);

  const allTicker = demo ? [...demoTicker, ...model.ticker].slice(0, 7) : model.ticker;
  const visibleTicker = focus ? allTicker.filter((r) => r.district === focus) : allTicker;
  const toggleDemo = () => {
    if (!demo) {
      setDemo(true);
      return;
    }
    setDemo(false);
    setDemoPulses([]);
    setDemoTicker([]);
  };

  return (
    <div className="flex flex-1 flex-col gap-[26px] bg-white px-[36px] py-[30px] max-[900px]:px-[16px]">
      <PulseHeader
        demo={demo}
        focus={focus}
        lastUpdated={lastUpdated}
        nowTick={nowTick}
        refreshing={refreshing}
        onDemoToggle={toggleDemo}
        onFocusClear={() => setFocus(null)}
        onReload={onReload}
      />
      <PulseMetrics model={model} />
      <PulseSpotlight focus={focus} nowTick={nowTick} spot={spot} visibleTicker={visibleTicker} />
      <PulseCanvas
        demo={demo}
        demoFlows={demoFlows}
        demoPulses={demoPulses}
        focus={focus}
        model={model}
        onFocusChange={setFocus}
      />
      <PulseLegend demo={demo} />
      <PulseActivity focus={focus} nowTick={nowTick} visibleTicker={visibleTicker} />
      <p className="max-w-[860px] text-[13px] font-normal leading-[20px]" style={{ color: MUTED }}>
        {demo
          ? "Modo demostración: los pulsos y la actividad marcados «demo» son datos de muestra sobre distritos reales, para mostrar cómo se ve el tablero en plena operación. Nada marcado «demo» es un evento real."
          : "Cada pulso sobre las líneas es una asignación real registrada en el sistema; las partículas del fondo son solo textura. Tablero quieto = respuesta quieta. Las decisiones las toma una persona, siempre."}
      </p>
    </div>
  );
}
