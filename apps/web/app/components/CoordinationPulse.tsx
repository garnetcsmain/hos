"use client";

// Pulso (/pulso, HOS-2026-013-00) — the standalone live pulse board ("Brain
// Board"), coordinator-gated. A presentation-grade view of the SAME real board
// the console operates on: every counter, node, flow and ticker row binds to
// recorded state. Direction reads supply -> demand (human direction
// 2026-07-03): help on the left ships to district needs on the right.
//
// Visual language (human direction 2026-07-03, Dala reference): a clean void
// with no panels/borders/cards — elements float and hierarchy comes from
// SCALE, not weight; one violet accent for the single primary action; amber
// for attention. LIGHT or DARK is the user's choice, persisted per user
// (usePulseTheme); each theme swaps a full palette so text stays legible on
// its canvas (yellow text on white fails, so amber TEXT darkens in light).
// Background triangle particles are explicitly decorative ambience; only the
// pulses on the flow lines are data.
//
// Honesty rules (HOS-2026-002-D4 lineage): real mode never animates a data
// claim that didn't happen — a quiet board says it is quiet. Demo mode is
// loudly labeled (badge, watermark, per-row tags) and never fakes counters.
//
// The PUBLIC variant is NOT this component: it stays behind the HOS-2026-007
// public-feed gate re-review and a PII-free aggregate feed.

import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Play, RefreshCw, Square, Sun, X } from "lucide-react";
import {
  CATEGORY_LABEL,
  SITE_CATEGORY_LABEL,
  SITE_PIN,
} from "@/app/components/CoordinationParts";
import type { PulseTheme } from "@/app/lib/client/pulseTheme";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";
import type { SiteCategory } from "@/app/lib/domain/coordination";

const W = 920;
const H = 520;
const LEFT_X = 116;
const RIGHT_X = 792;
const MAX_DISTRICTS = 9;
const MAX_PULSE_DOTS = 18;

// Two palettes, one per theme. Violet is the single interactive/brand accent
// (same in both); red and green keep their operational meaning (critical /
// confirmed delivery). `amber` is for marks (dots, rings, dashes); `amberText`
// is its readable-on-canvas counterpart for text.
interface Palette {
  canvas: string;
  node: string;
  ink: string;
  soft: string;
  muted: string;
  line: string;
  violet: string;
  critical: string;
  delivered: string;
  amber: string;
  amberText: string;
  resting: string;
  particles: string[];
  particleBase: number;
}

const LIGHT: Palette = {
  canvas: "#FFFFFF",
  node: "#FFFFFF",
  ink: "#101812",
  soft: "#37423B",
  muted: "#6E7C74",
  line: "rgba(16,24,18,0.15)",
  violet: "#8052FF",
  critical: "#C13B2A",
  delivered: "#178A5F",
  amber: "#E09112",
  amberText: "#955E06",
  resting: "#A7B1AA",
  particles: ["#8052FF", "#E09112", "#1D9E75", "#D4537E", "#378ADD"],
  particleBase: 0.14,
};

const DARK: Palette = {
  canvas: "#000000",
  node: "#000000",
  ink: "#FFFFFF",
  soft: "#BDBDBD",
  muted: "#9A9A9A",
  line: "rgba(255,255,255,0.13)",
  violet: "#8052FF",
  critical: "#FF6D52",
  delivered: "#3EDC9B",
  amber: "#FFB829",
  amberText: "#FFB829",
  resting: "#6F6F6F",
  particles: ["#8052FF", "#FFB829", "#3EDC9B", "#F0729A", "#5CB2FF"],
  particleBase: 0.12,
};

type Tone = "critical" | "assigned" | "delivered" | "amber" | "site";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function agoLabel(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "hace un momento";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

function agoShort(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `hace ${s} s`;
  return `hace ${Math.round(s / 60)} min`;
}

/** Animate a metric toward its real value so refreshes read as movement. The
 *  displayed number is always converging on the true one, never invented. */
function useCountUp(value: number): number {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (from === value) {
      setShown(value);
      return;
    }
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

interface TickerRow {
  key: string;
  tone: Tone;
  color?: string;
  text: string;
  at: string;
  district: string;
  demo?: boolean;
}

interface DemoPulse {
  id: number;
  district: string;
  critical: boolean;
}

// Ticker/spotlight dot colors are resolved at RENDER time from the active
// palette, so the model memo can stay theme-independent and a theme switch
// recolors everything instantly.
function toneColor(row: TickerRow, pal: Palette): string {
  switch (row.tone) {
    case "critical":
      return pal.critical;
    case "assigned":
      return pal.violet;
    case "delivered":
      return pal.delivered;
    case "amber":
      return pal.amber;
    default:
      return row.color ?? pal.violet;
  }
}

function Metric({ value, label, color, muted }: { value: number; label: string; color: string; muted: string }) {
  const shown = useCountUp(value);
  return (
    <div>
      <div className="font-data text-[38px] font-normal leading-none tracking-tight max-[640px]:text-[30px]" style={{ color }}>
        {shown}
      </div>
      <div className="mt-[8px] text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: muted }}>
        {label}
      </div>
    </div>
  );
}

/** Deterministic ambient particle field (no Math.random: stable across
 *  server/client renders). Slow drift only — clearly texture, not data. */
function AmbientParticles({ pal }: { pal: Palette }) {
  const particles = Array.from({ length: 34 }, (_, i) => {
    const x = 24 + ((i * 211) % (W - 48));
    const y = 24 + ((i * 367) % (H - 48));
    const size = 3 + ((i * 5) % 4);
    const color = pal.particles[i % pal.particles.length];
    const dur = 16 + (i % 7) * 4;
    const dx = ((i * 97) % 13) - 6;
    const dy = ((i * 53) % 11) - 5;
    const opacity = pal.particleBase + ((i * 7) % 3) * 0.05;
    return { x, y, size, color, dur, dx, dy, opacity, key: i };
  });
  return (
    <g aria-hidden="true">
      {particles.map((p) => (
        <g key={p.key} opacity={p.opacity}>
          <polygon
            points={`${p.x},${p.y - p.size} ${p.x - p.size},${p.y + p.size} ${p.x + p.size},${p.y + p.size}`}
            fill="none"
            stroke={p.color}
            strokeWidth={1}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,0; ${p.dx},${p.dy}; 0,0`}
              dur={`${p.dur}s`}
              repeatCount="indefinite"
            />
          </polygon>
        </g>
      ))}
    </g>
  );
}

export function CoordinationPulse({
  board,
  lastUpdated,
  refreshing,
  onReload,
  theme,
  onToggleTheme,
}: {
  board: CoordinationView;
  lastUpdated: number | null;
  refreshing: boolean;
  onReload: () => void;
  theme: PulseTheme;
  onToggleTheme: () => void;
}) {
  const pal = theme === "dark" ? DARK : LIGHT;
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

  const model = useMemo(() => {
    const now = nowTick;
    const cats = new Map<SiteCategory, { count: number; beds: number; fresh: number }>();
    let beds = 0;
    let sitesActive = 0;
    for (const { site } of board.sites) {
      if (site.status !== "active") continue;
      sitesActive += 1;
      beds += site.bedsFree;
      const c = cats.get(site.category) ?? { count: 0, beds: 0, fresh: 0 };
      c.count += 1;
      c.beds += site.bedsFree;
      if (now - Date.parse(site.updatedAt) < 24 * 3600_000) c.fresh += 1;
      cats.set(site.category, c);
    }

    const districts = new Map<
      string,
      { open: number; critical: number; assigned: number; assignedCritical: number; delivered: number }
    >();
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
        now - Date.parse(need.updatedAt) < 7 * 24 * 3600_000
      ) {
        d(need.district).delivered += 1;
        delivered7d += 1;
      }
    }

    // Districts with active assignments are always selected (a flow must never
    // point off-screen); remaining slots go to the largest open counts. The
    // DISPLAY order is by open needs, so the column reads as a ranking.
    const withFlows = [...districts.entries()].filter(([, v]) => v.assigned > 0);
    const rest = [...districts.entries()]
      .filter(([, v]) => v.assigned === 0)
      .sort((a, b) => b[1].open - a[1].open);
    const ranked = [...withFlows, ...rest]
      .slice(0, MAX_DISTRICTS)
      .sort((a, b) => b[1].open - a[1].open);
    const hiddenDistricts = districts.size - ranked.length;
    const hiddenOpen =
      [...districts.entries()]
        .filter(([name]) => !ranked.some(([r]) => r === name))
        .reduce((s, [, v]) => s + v.open, 0);

    const ticker: TickerRow[] = [];
    for (const { need, claimedByOrg } of board.needs) {
      if (need.status === "claimed") {
        ticker.push({
          key: `n-${need.id}`,
          tone: need.urgency === "critical" ? "critical" : "assigned",
          text: `${CATEGORY_LABEL[need.category]} asignado a ${claimedByOrg?.name ?? "un equipo"} — ${need.district}`,
          at: need.updatedAt,
          district: need.district,
        });
      } else if (need.status === "received") {
        ticker.push({
          key: `n-${need.id}`,
          tone: "delivered",
          text: `${need.quantity} ${need.unit} de ${CATEGORY_LABEL[need.category].toLowerCase()} recibido y confirmado por el sitio — ${need.district}`,
          at: need.updatedAt,
          district: need.district,
        });
      }
    }
    for (const { site } of board.sites) {
      if (site.status === "active" && now - Date.parse(site.updatedAt) < 24 * 3600_000) {
        ticker.push({
          key: `s-${site.id}`,
          tone: "site",
          color: SITE_PIN[site.category].color,
          text: `Sitio confirmado operativo: ${site.name} — ${site.district}`,
          at: site.updatedAt,
          district: site.district,
        });
      }
    }
    ticker.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    const freshSites = [...cats.values()].reduce((s, c) => s + c.fresh, 0);
    return {
      cats: [...cats.entries()].sort((a, b) => b[1].count - a[1].count),
      ranked,
      hiddenDistricts,
      hiddenOpen,
      open,
      critical,
      beds,
      sitesActive,
      assignments,
      teams: orgsWithClaims.size,
      delivered7d,
      freshSites,
      ticker: ticker.slice(0, 6),
    };
  }, [board, nowTick]);

  // Latest ranked district names, kept in a ref (updated after render, never
  // during it) so the demo interval below can read the current list without
  // re-subscribing every time the board refreshes.
  const rankedNamesRef = useRef<string[]>([]);
  useEffect(() => {
    rankedNamesRef.current = model.ranked.map(([name]) => name);
  });

  // Demo generator: deterministic counter-based sampling over the REAL
  // district list; produces labeled sample flows/rows only while demo is on.
  // The sample state is cleared in cleanup (when demo turns off / unmount), so
  // the effect body itself never sets state synchronously.
  useEffect(() => {
    if (!demo) return;
    let n = 0;
    const t = setInterval(() => {
      const names = rankedNamesRef.current;
      if (names.length === 0) return;
      n += 1;
      const district = names[(n * 7) % names.length];
      const kind = n % 4;
      const isCritical = kind === 0;
      setDemoPulses((prev) => [...prev, { id: n, district, critical: isCritical }].slice(-12));
      const base = { key: `d-${n}`, at: new Date().toISOString(), district, demo: true };
      const row: TickerRow =
        kind === 0
          ? { ...base, tone: "critical", text: `Rescate crítico asignado a un equipo — ${district}` }
          : kind === 1
            ? { ...base, tone: "assigned", text: `Agua asignada a una organización — ${district}` }
            : kind === 2
              ? { ...base, tone: "delivered", text: `Entrega recibida y confirmada por el sitio — ${district}` }
              : { ...base, tone: "amber", text: `Sitio confirmado operativo — ${district}` };
      setDemoTicker((prev) => [row, ...prev].slice(0, 6));
    }, 1700);
    return () => {
      clearInterval(t);
      setDemoPulses([]);
      setDemoTicker([]);
    };
  }, [demo]);

  // Spotlight: rotate the newest activity in large type.
  useEffect(() => {
    const t = setInterval(() => setSpot((s) => s + 1), 4500);
    return () => clearInterval(t);
  }, []);

  const allTicker = demo ? [...demoTicker, ...model.ticker].slice(0, 7) : model.ticker;
  const visibleTicker = focus ? allTicker.filter((r) => r.district === focus) : allTicker;
  const spotRow = visibleTicker.length > 0 ? visibleTicker[spot % visibleTicker.length] : null;

  const leftY = (i: number) => 92 + i * 64;
  const equiposY = leftY(model.cats.length) + 14;
  const rightY = (i: number) => 74 + i * 48;
  const dimmed = (district: string) => (focus !== null && district !== focus ? 0.12 : 1);

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

  const flowPath = (y: number) =>
    `M${LEFT_X + 20},${equiposY} C 420,${equiposY} 470,${y} ${RIGHT_X - 26},${y}`;

  return (
    <div className="flex flex-1 flex-col gap-[26px] px-[36px] py-[30px] max-[900px]:px-[16px]" style={{ background: pal.canvas }}>
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex flex-wrap items-center gap-[16px]">
          {demo ? (
            <span className="inline-flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: pal.amberText }}>
              <span className="hos-blink h-[8px] w-[8px] rounded-full" style={{ background: pal.amber }} />
              Demostración · datos de muestra
            </span>
          ) : (
            <span className="inline-flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: pal.ink }}>
              <span className="hos-blink h-[8px] w-[8px] rounded-full" style={{ background: pal.amber }} />
              En vivo · datos reales
            </span>
          )}
          {lastUpdated ? (
            <span className="text-[12px] font-normal" style={{ color: pal.muted }}>
              actualizado {agoShort(lastUpdated, nowTick)}
            </span>
          ) : null}
          {focus ? (
            <button
              type="button"
              onClick={() => setFocus(null)}
              className="inline-flex items-center gap-[6px] text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: pal.soft }}
            >
              Foco: {focus} <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-[18px]">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            className="inline-flex items-center gap-[7px] text-[12px] font-semibold uppercase tracking-[0.08em] transition hover:opacity-80"
            style={{ color: pal.muted }}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-[14px] w-[14px]" strokeWidth={2.2} /> Claro
              </>
            ) : (
              <>
                <Moon className="h-[14px] w-[14px]" strokeWidth={2.2} /> Oscuro
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onReload}
            disabled={refreshing}
            aria-label="Actualizar"
            className="inline-flex items-center gap-[7px] text-[12px] font-semibold uppercase tracking-[0.08em] transition hover:opacity-80 disabled:opacity-50"
            style={{ color: pal.muted }}
          >
            <RefreshCw className={`h-[13px] w-[13px] ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.2} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setDemo((v) => !v)}
            className="inline-flex h-[40px] items-center gap-[8px] rounded-full px-[20px] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition hover:opacity-90"
            style={{ background: pal.violet }}
          >
            {demo ? (
              <>
                <Square className="h-[11px] w-[11px]" strokeWidth={2.6} /> Salir de la demostración
              </>
            ) : (
              <>
                <Play className="h-[11px] w-[11px]" strokeWidth={2.6} /> Ver demostración
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-[20px] max-[1100px]:grid-cols-3 max-[640px]:grid-cols-2">
        <Metric value={model.open} label="necesidades abiertas" color={pal.ink} muted={pal.muted} />
        <Metric value={model.critical} label="críticas" color={pal.critical} muted={pal.muted} />
        <Metric value={model.assignments} label="asignadas ahora" color={pal.violet} muted={pal.muted} />
        <Metric value={model.delivered7d} label="entregadas (7 d)" color={pal.delivered} muted={pal.muted} />
        <Metric value={model.beds} label="camas libres" color={pal.ink} muted={pal.muted} />
        <Metric value={model.sitesActive} label="sitios activos" color={pal.ink} muted={pal.muted} />
      </div>

      <div className="min-h-[76px]">
        {spotRow ? (
          <div key={`${spotRow.key}-${spot}`} className="hos-rise">
            <div className="flex items-baseline gap-[14px]">
              <span className="h-[11px] w-[11px] shrink-0 self-center rounded-full" style={{ background: toneColor(spotRow, pal) }} />
              <span className="min-w-0 flex-1 truncate text-[27px] font-normal leading-[1.15] tracking-[-0.02em]" style={{ color: pal.ink }}>
                {spotRow.text}
              </span>
            </div>
            <div className="mt-[6px] flex items-center gap-[12px] pl-[25px] text-[12px] font-normal" style={{ color: pal.muted }}>
              <span>{agoLabel(spotRow.at, nowTick)}</span>
              {spotRow.demo ? (
                <span className="font-semibold uppercase tracking-[0.08em]" style={{ color: pal.amberText }}>
                  demo
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-[20px] font-normal leading-[1.3]" style={{ color: pal.muted }}>
            Sin actividad reciente registrada{focus ? ` en ${focus}` : ""}. El tablero está quieto — y lo dice.
          </div>
        )}
      </div>

      <div className="relative">
        {demo ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="-rotate-[18deg] text-[64px] font-normal tracking-[0.2em] opacity-[0.08]" style={{ color: pal.amberText }}>
              DEMOSTRACIÓN
            </span>
          </div>
        ) : null}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Flujo de ayuda: sitios y equipos a la izquierda envían pulsos hacia las necesidades por distrito a la derecha"
        >
          <AmbientParticles pal={pal} />

          <text x={LEFT_X - 58} y={38} fontSize={12} fontWeight={600} fill={pal.muted} letterSpacing={1.4}>
            AYUDA DISPONIBLE
          </text>
          <text x={RIGHT_X + 62} y={38} fontSize={12} fontWeight={600} fill={pal.muted} letterSpacing={1.4} textAnchor="end">
            NECESIDADES POR DISTRITO
          </text>

          {model.ranked.map(([district, v], i) => {
            const y = rightY(i);
            const dm = demoFlows.get(district);
            return (
              <g key={`f-${district}`} opacity={dimmed(district)}>
                {v.assigned > 0 ? (
                  <path d={flowPath(y)} fill="none" stroke={pal.line} strokeWidth={Math.min(3.6, 1.2 + v.assigned * 0.4)} />
                ) : null}
                {demo && dm ? (
                  <path d={flowPath(y)} fill="none" stroke={pal.amber} strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="5 7" />
                ) : null}
                {v.assigned > 1 ? (
                  <text x={RIGHT_X - 38} y={y - 9} fontSize={11} fontWeight={600} fill={pal.muted} textAnchor="end">
                    ×{v.assigned}
                  </text>
                ) : null}
              </g>
            );
          })}

          {model.ranked
            .flatMap(([district, v], i) =>
              Array.from({ length: Math.min(v.assigned, 3) }, (_, j) => ({
                district,
                critical: v.assignedCritical > j,
                i,
                j,
              })),
            )
            .slice(0, MAX_PULSE_DOTS)
            .map(({ district, critical: isCrit, i, j }, k) => (
              <g key={`p-${district}-${j}`} opacity={dimmed(district)}>
                <circle r={5} fill={isCrit ? pal.critical : pal.violet}>
                  <animateMotion dur={`${4.2 + ((k * 3) % 5) * 0.5}s`} begin={`${(k * 1.1).toFixed(1)}s`} repeatCount="indefinite" path={flowPath(rightY(i))} />
                </circle>
                <circle r={3} fill={isCrit ? pal.critical : pal.violet} opacity={0.4}>
                  <animateMotion dur={`${4.2 + ((k * 3) % 5) * 0.5}s`} begin={`${(k * 1.1 + 0.28).toFixed(1)}s`} repeatCount="indefinite" path={flowPath(rightY(i))} />
                </circle>
              </g>
            ))}

          {demo
            ? demoPulses.map((p) => {
                const idx = model.ranked.findIndex(([name]) => name === p.district);
                if (idx < 0) return null;
                return (
                  <circle key={`dp-${p.id}`} r={4.5} fill={p.critical ? pal.critical : pal.amber} opacity={dimmed(p.district)}>
                    <animateMotion dur={`${3.4 + (p.id % 4) * 0.5}s`} begin={`${(p.id % 3) * 0.35}s`} repeatCount="indefinite" path={flowPath(rightY(idx))} />
                  </circle>
                );
              })
            : null}

          {model.cats.map(([cat, v], i) => {
            const y = leftY(i);
            const pin = SITE_PIN[cat];
            return (
              <g key={cat}>
                <title>{`${SITE_CATEGORY_LABEL[cat]}: ${v.count} ${plural(v.count, "sitio activo", "sitios activos")}${cat === "refugio" ? ` · ${v.beds} ${plural(v.beds, "cama libre", "camas libres")}` : ""}${v.fresh ? ` · ${v.fresh} confirmados en 24 h` : ""}`}</title>
                {v.fresh > 0 ? (
                  <circle cx={LEFT_X} cy={y} r={19} fill="none" stroke={pin.color} strokeWidth={1.4}>
                    <animate attributeName="r" values="19;30" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                ) : null}
                <circle cx={LEFT_X} cy={y} r={18} fill={pal.node} stroke={pin.color} strokeWidth={1.6} />
                <text x={LEFT_X} y={y + 4} fontSize={12} fontWeight={600} fill={pin.color} textAnchor="middle">
                  {pin.glyph}
                </text>
                <text x={LEFT_X + 30} y={y} fontSize={15} fontWeight={400} fill={pal.ink}>
                  {SITE_CATEGORY_LABEL[cat]}
                </text>
                <text x={LEFT_X + 30} y={y + 18} fontSize={12} fontWeight={400} fill={pal.muted}>
                  {v.count} {plural(v.count, "sitio", "sitios")}
                  {cat === "refugio" ? ` · ${v.beds} ${plural(v.beds, "cama libre", "camas libres")}` : ""}
                </text>
              </g>
            );
          })}

          <g>
            <title>{`Equipos y organizaciones con asignaciones activas: ${model.teams}`}</title>
            <circle cx={LEFT_X} cy={equiposY} r={19} fill={pal.node} stroke={pal.violet} strokeWidth={1.6} />
            <text x={LEFT_X} y={equiposY + 4} fontSize={11} fontWeight={600} fill={pal.violet} textAnchor="middle">
              EQ
            </text>
            <text x={LEFT_X + 30} y={equiposY} fontSize={15} fontWeight={400} fill={pal.ink}>
              Equipos y organizaciones
            </text>
            <text x={LEFT_X + 30} y={equiposY + 18} fontSize={12} fontWeight={400} fill={pal.muted}>
              {model.teams} con asignaciones · {model.assignments} en curso
            </text>
          </g>

          {model.ranked.map(([district, v], i) => {
            const y = rightY(i);
            const active = focus === district;
            const r = 16 + Math.min(8, Math.log2(v.open + 1) * 1.7);
            return (
              <g key={district} opacity={dimmed(district)} onClick={() => setFocus(active ? null : district)} style={{ cursor: "pointer" }}>
                <title>{`${district}: ${v.open} abiertas · ${v.critical} críticas · ${v.assigned} asignadas${v.delivered ? ` · ${v.delivered} entregadas (7 d)` : ""} — clic para enfocar`}</title>
                {v.critical > 0 ? (
                  <circle cx={RIGHT_X} cy={y} r={r + 2} fill="none" stroke={pal.critical} strokeWidth={1}>
                    <animate attributeName="r" values={`${r + 2};${r + 9}`} dur="3.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.45;0" dur="3.2s" repeatCount="indefinite" />
                  </circle>
                ) : null}
                <circle cx={RIGHT_X} cy={y} r={r} fill={pal.node} stroke={active ? pal.violet : v.critical > 0 ? pal.critical : pal.resting} strokeWidth={active ? 2.4 : 1.4} />
                <text x={RIGHT_X} y={y + 4} fontSize={13} fontWeight={400} fill={pal.ink} textAnchor="middle" className="font-data">
                  {v.open}
                </text>
                {v.delivered > 0 ? (
                  <circle cx={RIGHT_X + r + 7} cy={y - r + 2} r={4.5} fill={pal.delivered}>
                    <title>{`${v.delivered} ${plural(v.delivered, "entrega confirmada", "entregas confirmadas")} en 7 días`}</title>
                  </circle>
                ) : null}
                <text x={RIGHT_X - r - 12} y={y} fontSize={15} fontWeight={400} fill={pal.ink} textAnchor="end">
                  {district}
                </text>
                <text x={RIGHT_X - r - 12} y={y + 17} fontSize={11.5} fontWeight={400} textAnchor="end" fill={v.critical > 0 ? pal.critical : pal.muted}>
                  {v.critical > 0 ? `${v.critical} ${plural(v.critical, "crítica", "críticas")}` : "sin críticas"}
                </text>
              </g>
            );
          })}
          {model.hiddenDistricts > 0 ? (
            <text x={RIGHT_X + 62} y={H - 16} fontSize={12} fontWeight={400} fill={pal.muted} textAnchor="end">
              +{model.hiddenDistricts} distritos más · {model.hiddenOpen} necesidades abiertas
            </text>
          ) : null}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[6px]">
        {[
          { color: pal.violet, label: "Pulso: asignación en curso" },
          { color: pal.critical, label: "Rojo: necesidad crítica" },
          { color: pal.delivered, label: "Verde: entrega confirmada (7 d)" },
          { color: pal.amber, label: demo ? "Ámbar discontinuo: flujo de demostración" : "Anillo: sitio confirmado en 24 h" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-[7px] text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: pal.muted }}>
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="text-[11px] font-normal" style={{ color: pal.muted }}>
          · el número del distrito = necesidades abiertas · clic en un distrito para enfocar
        </span>
      </div>

      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: pal.muted }}>
          Última actividad{focus ? ` · ${focus}` : ""}
        </div>
        {visibleTicker.length === 0 ? (
          <p className="mt-[14px] text-[15px] font-normal" style={{ color: pal.soft }}>
            Sin actividad registrada{focus ? ` en ${focus}` : ""} por ahora.
          </p>
        ) : (
          <div className="mt-[10px] flex flex-col gap-[13px]">
            {visibleTicker.map((t) => (
              <div key={t.key} className="flex items-center gap-[12px] text-[15px] font-normal" style={{ color: pal.soft }}>
                <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: toneColor(t, pal) }} />
                <span className="min-w-0 flex-1 truncate">{t.text}</span>
                {t.demo ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: pal.amberText }}>
                    demo
                  </span>
                ) : null}
                <span className="shrink-0 text-[12px]" style={{ color: pal.muted }}>
                  {agoLabel(t.at, nowTick)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="max-w-[860px] text-[13px] font-normal leading-[20px]" style={{ color: pal.muted }}>
        {demo
          ? "Modo demostración: los pulsos y la actividad marcados «demo» son datos de muestra sobre distritos reales, para mostrar cómo se ve el tablero en plena operación. Nada marcado «demo» es un evento real."
          : "Cada pulso sobre las líneas es una asignación real registrada en el sistema; las partículas del fondo son solo textura. Tablero quieto = respuesta quieta. Las decisiones las toma una persona, siempre."}
      </p>
    </div>
  );
}
