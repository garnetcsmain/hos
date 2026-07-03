import { useEffect, useRef, useState } from "react";
import { Play, RefreshCw, Square, X } from "lucide-react";
import type { SiteCategory } from "@/app/lib/domain/coordination";

export const W = 920;
export const H = 520;
export const LEFT_X = 116;
export const RIGHT_X = 792;
export const MAX_DISTRICTS = 9;
export const MAX_PULSE_DOTS = 18;

export const INK = "#101812";
export const SOFT = "#37423B";
export const MUTED = "#6E7C74";
export const LINE = "rgba(16,24,18,0.15)";
export const VIOLET = "#8052FF";
export const CRITICAL = "#C13B2A";
export const DELIVERED = "#178A5F";
export const AMBER = "#E09112";
export const AMBER_TEXT = "#955E06";
export const RESTING = "#A7B1AA";

const PARTICLE_COLORS = [VIOLET, AMBER, "#1D9E75", "#D4537E", "#378ADD"];

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function agoLabel(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "hace un momento";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export function agoShort(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `hace ${s} s`;
  return `hace ${Math.round(s / 60)} min`;
}

export interface TickerRow {
  key: string;
  color: string;
  text: string;
  at: string;
  district: string;
  demo?: boolean;
}

export interface DemoPulse {
  id: number;
  district: string;
  critical: boolean;
}

export interface PulseDistrict {
  open: number;
  critical: number;
  assigned: number;
  assignedCritical: number;
  delivered: number;
}

export interface PulseSiteSummary {
  count: number;
  beds: number;
  fresh: number;
}

export interface PulseModel {
  cats: [SiteCategory, PulseSiteSummary][];
  ranked: [string, PulseDistrict][];
  hiddenDistricts: number;
  hiddenOpen: number;
  open: number;
  critical: number;
  beds: number;
  sitesActive: number;
  assignments: number;
  teams: number;
  delivered7d: number;
  freshSites: number;
  ticker: TickerRow[];
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

function Metric({ value, label, color }: { value: number; label: string; color: string }) {
  const shown = useCountUp(value);
  return (
    <div>
      <div className="font-data text-[38px] font-normal leading-none tracking-tight max-[640px]:text-[30px]" style={{ color }}>
        {shown}
      </div>
      <div className="mt-[8px] text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
        {label}
      </div>
    </div>
  );
}

export function PulseMetrics({ model }: { model: PulseModel }) {
  return (
    <div className="grid grid-cols-6 gap-[20px] max-[1100px]:grid-cols-3 max-[640px]:grid-cols-2">
      <Metric value={model.open} label="necesidades abiertas" color={INK} />
      <Metric value={model.critical} label="críticas" color={CRITICAL} />
      <Metric value={model.assignments} label="asignadas ahora" color={VIOLET} />
      <Metric value={model.delivered7d} label="entregadas (7 d)" color={DELIVERED} />
      <Metric value={model.beds} label="camas libres" color={INK} />
      <Metric value={model.sitesActive} label="sitios activos" color={INK} />
    </div>
  );
}

/** Deterministic ambient particle field (no Math.random: stable across
 *  server/client renders). Slow drift only — clearly texture, not data. */
export function AmbientParticles() {
  const particles = Array.from({ length: 34 }, (_, i) => {
    const x = 24 + ((i * 211) % (W - 48));
    const y = 24 + ((i * 367) % (H - 48));
    const size = 3 + ((i * 5) % 4);
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const dur = 16 + (i % 7) * 4;
    const dx = ((i * 97) % 13) - 6;
    const dy = ((i * 53) % 11) - 5;
    const opacity = 0.14 + ((i * 7) % 3) * 0.05;
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

export function PulseHeader({
  demo,
  focus,
  lastUpdated,
  nowTick,
  refreshing,
  onDemoToggle,
  onFocusClear,
  onReload,
}: {
  demo: boolean;
  focus: string | null;
  lastUpdated: number | null;
  nowTick: number;
  refreshing: boolean;
  onDemoToggle: () => void;
  onFocusClear: () => void;
  onReload: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-[12px]">
      <div className="flex flex-wrap items-center gap-[16px]">
        <span className="inline-flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: demo ? AMBER_TEXT : INK }}>
          <span className="hos-blink h-[8px] w-[8px] rounded-full" style={{ background: AMBER }} />
          {demo ? "Demostración · datos de muestra" : "En vivo · datos reales"}
        </span>
        {lastUpdated ? (
          <span className="text-[12px] font-normal" style={{ color: MUTED }}>
            actualizado {agoShort(lastUpdated, nowTick)}
          </span>
        ) : null}
        {focus ? (
          <button
            type="button"
            onClick={onFocusClear}
            className="inline-flex items-center gap-[6px] text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: SOFT }}
          >
            Foco: {focus} <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-[18px]">
        <button
          type="button"
          onClick={onReload}
          disabled={refreshing}
          aria-label="Actualizar"
          className="inline-flex items-center gap-[7px] text-[12px] font-semibold uppercase tracking-[0.08em] transition hover:text-[#101812] disabled:opacity-50"
          style={{ color: MUTED }}
        >
          <RefreshCw className={`h-[13px] w-[13px] ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.2} />
          Actualizar
        </button>
        <button
          type="button"
          onClick={onDemoToggle}
          className="inline-flex h-[40px] items-center gap-[8px] rounded-full px-[20px] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition hover:opacity-90"
          style={{ background: VIOLET }}
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
  );
}

export function PulseSpotlight({
  focus,
  nowTick,
  spot,
  visibleTicker,
}: {
  focus: string | null;
  nowTick: number;
  spot: number;
  visibleTicker: TickerRow[];
}) {
  const spotRow = visibleTicker.length > 0 ? visibleTicker[spot % visibleTicker.length] : null;
  return (
    <div className="min-h-[76px]">
      {spotRow ? (
        <div key={`${spotRow.key}-${spot}`} className="hos-rise">
          <div className="flex items-baseline gap-[14px]">
            <span className="h-[11px] w-[11px] shrink-0 self-center rounded-full" style={{ background: spotRow.color }} />
            <span className="min-w-0 flex-1 truncate text-[27px] font-normal leading-[1.15] tracking-[-0.02em]" style={{ color: INK }}>
              {spotRow.text}
            </span>
          </div>
          <div className="mt-[6px] flex items-center gap-[12px] pl-[25px] text-[12px] font-normal" style={{ color: MUTED }}>
            <span>{agoLabel(spotRow.at, nowTick)}</span>
            {spotRow.demo ? (
              <span className="font-semibold uppercase tracking-[0.08em]" style={{ color: AMBER_TEXT }}>
                demo
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-[20px] font-normal leading-[1.3]" style={{ color: MUTED }}>
          Sin actividad reciente registrada{focus ? ` en ${focus}` : ""}. El tablero está quieto — y lo dice.
        </div>
      )}
    </div>
  );
}

export function PulseLegend({ demo }: { demo: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[6px]">
      {[
        { color: VIOLET, label: "Pulso: asignación en curso" },
        { color: CRITICAL, label: "Rojo: necesidad crítica" },
        { color: DELIVERED, label: "Verde: entrega confirmada (7 d)" },
        { color: AMBER, label: demo ? "Ámbar discontinuo: flujo de demostración" : "Anillo: sitio confirmado en 24 h" },
      ].map((l) => (
        <span key={l.label} className="flex items-center gap-[7px] text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: MUTED }}>
          <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
      <span className="text-[11px] font-normal" style={{ color: MUTED }}>
        · el número del distrito = necesidades abiertas · clic en un distrito para enfocar
      </span>
    </div>
  );
}

export function PulseActivity({
  focus,
  nowTick,
  visibleTicker,
}: {
  focus: string | null;
  nowTick: number;
  visibleTicker: TickerRow[];
}) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
        Última actividad{focus ? ` · ${focus}` : ""}
      </div>
      {visibleTicker.length === 0 ? (
        <p className="mt-[14px] text-[15px] font-normal" style={{ color: SOFT }}>
          Sin actividad registrada{focus ? ` en ${focus}` : ""} por ahora.
        </p>
      ) : (
        <div className="mt-[10px] flex flex-col gap-[13px]">
          {visibleTicker.map((t) => (
            <div key={t.key} className="flex items-center gap-[12px] text-[15px] font-normal" style={{ color: SOFT }}>
              <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: t.color }} />
              <span className="min-w-0 flex-1 truncate">{t.text}</span>
              {t.demo ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: AMBER_TEXT }}>
                  demo
                </span>
              ) : null}
              <span className="shrink-0 text-[12px]" style={{ color: MUTED }}>
                {agoLabel(t.at, nowTick)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
