import {
  AMBER,
  AMBER_TEXT,
  AmbientParticles,
  CRITICAL,
  DELIVERED,
  H,
  INK,
  LEFT_X,
  LINE,
  MAX_PULSE_DOTS,
  MUTED,
  RESTING,
  RIGHT_X,
  VIOLET,
  W,
  type DemoPulse,
  type PulseModel,
  plural,
} from "@/app/components/CoordinationPulseBits";
import { SITE_CATEGORY_LABEL, SITE_PIN } from "@/app/components/CoordinationParts";

export function PulseCanvas({
  demo,
  demoFlows,
  demoPulses,
  focus,
  model,
  onFocusChange,
}: {
  demo: boolean;
  demoFlows: Map<string, { count: number; critical: boolean }>;
  demoPulses: DemoPulse[];
  focus: string | null;
  model: PulseModel;
  onFocusChange: (district: string | null) => void;
}) {
  const leftY = (i: number) => 92 + i * 64;
  const equiposY = leftY(model.cats.length) + 14;
  const rightY = (i: number) => 74 + i * 48;
  const dimmed = (district: string) => (focus !== null && district !== focus ? 0.12 : 1);
  const flowPath = (y: number) =>
    `M${LEFT_X + 20},${equiposY} C 420,${equiposY} 470,${y} ${RIGHT_X - 26},${y}`;

  return (
    <div className="relative">
      {demo ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="-rotate-[18deg] text-[64px] font-normal tracking-[0.2em] opacity-[0.08]" style={{ color: AMBER_TEXT }}>
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
        <AmbientParticles />

        <text x={LEFT_X - 58} y={38} fontSize={12} fontWeight={600} fill={MUTED} letterSpacing={1.4}>
          AYUDA DISPONIBLE
        </text>
        <text x={RIGHT_X + 62} y={38} fontSize={12} fontWeight={600} fill={MUTED} letterSpacing={1.4} textAnchor="end">
          NECESIDADES POR DISTRITO
        </text>

        {model.ranked.map(([district, v], i) => {
          const y = rightY(i);
          const dm = demoFlows.get(district);
          return (
            <g key={`f-${district}`} opacity={dimmed(district)}>
              {v.assigned > 0 ? (
                <path d={flowPath(y)} fill="none" stroke={LINE} strokeWidth={Math.min(3.6, 1.2 + v.assigned * 0.4)} />
              ) : null}
              {demo && dm ? (
                <path d={flowPath(y)} fill="none" stroke={AMBER} strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="5 7" />
              ) : null}
              {v.assigned > 1 ? (
                <text x={RIGHT_X - 38} y={y - 9} fontSize={11} fontWeight={600} fill={MUTED} textAnchor="end">
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
              <circle r={5} fill={isCrit ? CRITICAL : VIOLET}>
                <animateMotion dur={`${4.2 + ((k * 3) % 5) * 0.5}s`} begin={`${(k * 1.1).toFixed(1)}s`} repeatCount="indefinite" path={flowPath(rightY(i))} />
              </circle>
              <circle r={3} fill={isCrit ? CRITICAL : VIOLET} opacity={0.4}>
                <animateMotion dur={`${4.2 + ((k * 3) % 5) * 0.5}s`} begin={`${(k * 1.1 + 0.28).toFixed(1)}s`} repeatCount="indefinite" path={flowPath(rightY(i))} />
              </circle>
            </g>
          ))}

        {demo
          ? demoPulses.map((p) => {
              const idx = model.ranked.findIndex(([name]) => name === p.district);
              if (idx < 0) return null;
              return (
                <circle key={`dp-${p.id}`} r={4.5} fill={p.critical ? CRITICAL : AMBER} opacity={dimmed(p.district)}>
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
              <circle cx={LEFT_X} cy={y} r={18} fill="#fff" stroke={pin.color} strokeWidth={1.6} />
              <text x={LEFT_X} y={y + 4} fontSize={12} fontWeight={600} fill={pin.color} textAnchor="middle">
                {pin.glyph}
              </text>
              <text x={LEFT_X + 30} y={y} fontSize={15} fontWeight={400} fill={INK}>
                {SITE_CATEGORY_LABEL[cat]}
              </text>
              <text x={LEFT_X + 30} y={y + 18} fontSize={12} fontWeight={400} fill={MUTED}>
                {v.count} {plural(v.count, "sitio", "sitios")}
                {cat === "refugio" ? ` · ${v.beds} ${plural(v.beds, "cama libre", "camas libres")}` : ""}
              </text>
            </g>
          );
        })}

        <g>
          <title>{`Equipos y organizaciones con asignaciones activas: ${model.teams}`}</title>
          <circle cx={LEFT_X} cy={equiposY} r={19} fill="#fff" stroke={VIOLET} strokeWidth={1.6} />
          <text x={LEFT_X} y={equiposY + 4} fontSize={11} fontWeight={600} fill={VIOLET} textAnchor="middle">
            EQ
          </text>
          <text x={LEFT_X + 30} y={equiposY} fontSize={15} fontWeight={400} fill={INK}>
            Equipos y organizaciones
          </text>
          <text x={LEFT_X + 30} y={equiposY + 18} fontSize={12} fontWeight={400} fill={MUTED}>
            {model.teams} con asignaciones · {model.assignments} en curso
          </text>
        </g>

        {model.ranked.map(([district, v], i) => {
          const y = rightY(i);
          const active = focus === district;
          const r = 16 + Math.min(8, Math.log2(v.open + 1) * 1.7);
          return (
            <g key={district} opacity={dimmed(district)} onClick={() => onFocusChange(active ? null : district)} style={{ cursor: "pointer" }}>
              <title>{`${district}: ${v.open} abiertas · ${v.critical} críticas · ${v.assigned} asignadas${v.delivered ? ` · ${v.delivered} entregadas (7 d)` : ""} — clic para enfocar`}</title>
              {v.critical > 0 ? (
                <circle cx={RIGHT_X} cy={y} r={r + 2} fill="none" stroke={CRITICAL} strokeWidth={1}>
                  <animate attributeName="r" values={`${r + 2};${r + 9}`} dur="3.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.45;0" dur="3.2s" repeatCount="indefinite" />
                </circle>
              ) : null}
              <circle cx={RIGHT_X} cy={y} r={r} fill="#fff" stroke={active ? VIOLET : v.critical > 0 ? CRITICAL : RESTING} strokeWidth={active ? 2.4 : 1.4} />
              <text x={RIGHT_X} y={y + 4} fontSize={13} fontWeight={400} fill={INK} textAnchor="middle" className="font-data">
                {v.open}
              </text>
              {v.delivered > 0 ? (
                <circle cx={RIGHT_X + r + 7} cy={y - r + 2} r={4.5} fill={DELIVERED}>
                  <title>{`${v.delivered} ${plural(v.delivered, "entrega confirmada", "entregas confirmadas")} en 7 días`}</title>
                </circle>
              ) : null}
              <text x={RIGHT_X - r - 12} y={y} fontSize={15} fontWeight={400} fill={INK} textAnchor="end">
                {district}
              </text>
              <text x={RIGHT_X - r - 12} y={y + 17} fontSize={11.5} fontWeight={400} textAnchor="end" fill={v.critical > 0 ? CRITICAL : MUTED}>
                {v.critical > 0 ? `${v.critical} ${plural(v.critical, "crítica", "críticas")}` : "sin críticas"}
              </text>
            </g>
          );
        })}
        {model.hiddenDistricts > 0 ? (
          <text x={RIGHT_X + 62} y={H - 16} fontSize={12} fontWeight={400} fill={MUTED} textAnchor="end">
            +{model.hiddenDistricts} distritos más · {model.hiddenOpen} necesidades abiertas
          </text>
        ) : null}
      </svg>
    </div>
  );
}
