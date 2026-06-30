"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Lang } from "../LocaleProvider";
import { C, VIDEO_H, VIDEO_W, pick, randRange } from "./theme";

// AI Timeline feature. Scattered dated event chips drift in over a calm question,
// then assemble top-to-bottom into one clean vertical timeline answering "What
// happened to Carlos?", finishing on an 87% confidence chip — a lead to verify.

const SPINE_X = 300;
const SPINE_TOP = 150;
const SPINE_BOTTOM = 470;
const NODE_COUNT = 5;
const NODE_GAP = (SPINE_BOTTOM - SPINE_TOP) / (NODE_COUNT - 1);

const CHIP_W = 296;
const CHIP_H = 50;
const CHIP_X = SPINE_X + 34; // chips lock to the right of the spine

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const nodeY = (i: number) => SPINE_TOP + i * NODE_GAP;

// The four floating events (the 5th node holds the confidence chip).
type Event = {
  color: string;
  date: (lang: Lang) => string;
  label: (lang: Lang) => string;
};

const EVENTS: Event[] = [
  {
    color: C.red,
    date: (lang) => pick("Jun 24", "24 jun", lang),
    label: (lang) => pick("Phone went silent", "El teléfono dejó de sonar", lang),
  },
  {
    color: C.textSoft,
    date: (lang) => pick("Jun 25", "25 jun", lang),
    label: (lang) => pick("Neighbor reported the building fell", "Un vecino avisó que el edificio se cayó", lang),
  },
  {
    color: C.green,
    date: (lang) => pick("Jun 25", "25 jun", lang),
    label: (lang) => pick("Firefighter reported a rescue", "Un bombero reportó un rescate", lang),
  },
  {
    color: C.green,
    date: (lang) => pick("Jun 26", "26 jun", lang),
    label: (lang) => pick("Hospital took in a man, no name yet", "Un hospital recibió a un hombre aún sin identificar", lang),
  },
];

// Scattered start position across the lower two-thirds, deterministic per chip.
function scatterStart(i: number) {
  const seed = i + 1;
  return {
    sx: randRange(seed * 4.7, 70, 560),
    sy: randRange(seed * 6.3, 230, 470),
    rot: randRange(seed * 2.9, -10, 10),
  };
}

const SCATTER = EVENTS.map((_, i) => scatterStart(i));

// Per-chip assembly window inside [80,160]: staggered ~18 frames apart.
function assemblyWindow(i: number) {
  const start = 80 + i * 18;
  return { start, end: start + 30 };
}

function EventChip({ i, lang, frame }: { i: number; lang: Lang; frame: number }) {
  const ev = EVENTS[i];
  const s = SCATTER[i];
  const targetX = CHIP_X;
  const targetY = nodeY(i) - CHIP_H / 2;

  // Beat 1: drift in from scatter with a slow float.
  const driftIn = interpolate(frame - i * 4, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const floatY = Math.sin(frame * 0.05 + i * 1.3) * 5;
  const floatX = Math.cos(frame * 0.04 + i * 0.9) * 4;

  // Beat 3: ease into chronological order beside its node.
  const { start, end } = assemblyWindow(i);
  const snap = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  const floatingX = lerp(driftIn, s.sx, s.sx + floatX);
  const floatingY = lerp(driftIn, s.sy, s.sy + floatY);
  const x = lerp(snap, floatingX, targetX);
  const y = lerp(snap, floatingY, targetY);
  const rot = lerp(snap, lerp(driftIn, s.rot, s.rot * 0.7), 0);
  const opacity = interpolate(frame - i * 4, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Teal connector to the node, drawn as the chip locks in.
  const connector = interpolate(frame, [start + 6, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <>
      {connector > 0 ? (
        <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <line
            x1={SPINE_X}
            y1={nodeY(i)}
            x2={SPINE_X + (CHIP_X - SPINE_X) * connector}
            y2={nodeY(i)}
            stroke={C.teal}
            strokeWidth={2}
            opacity={0.85}
          />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: CHIP_W,
          height: CHIP_H,
          opacity,
          transform: `rotate(${rot}deg)`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          borderRadius: 12,
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: ev.color,
            flexShrink: 0,
            boxShadow: `0 0 0 4px ${ev.color}22`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, letterSpacing: "0.02em" }}>{ev.date(lang)}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ev.label(lang)}
          </div>
        </div>
      </div>
    </>
  );
}

function Spine({ frame }: { frame: number }) {
  // Beat 2: the spine draws itself top-to-bottom.
  const grow = interpolate(frame, [35, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const y2 = SPINE_TOP + (SPINE_BOTTOM - SPINE_TOP) * grow;

  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <line x1={SPINE_X} y1={SPINE_TOP} x2={SPINE_X} y2={y2} stroke={C.line} strokeWidth={2} />
      {Array.from({ length: NODE_COUNT }, (_, i) => {
        const ny = nodeY(i);
        const appearAt = 38 + i * 7;
        const appear = interpolate(frame, [appearAt, appearAt + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        });
        // Single pulse just after the node appears.
        const pulse = interpolate(frame, [appearAt + 8, appearAt + 16, appearAt + 26], [1, 1.5, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeInOut,
        });
        const r = 4 * appear * pulse;
        return (
          <g key={i}>
            <circle cx={SPINE_X} cy={ny} r={r + 3} fill="none" stroke={C.tealSoft} strokeWidth={2} opacity={appear} />
            <circle cx={SPINE_X} cy={ny} r={r} fill={C.teal} opacity={appear} />
          </g>
        );
      })}
    </svg>
  );
}

function ConfidenceChip({ lang, frame }: { lang: Lang; frame: number }) {
  // Beat 4: final teal confidence chip at the 5th node.
  const ny = nodeY(4);
  const appear = interpolate(frame, [160, 184], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const rise = interpolate(frame, [160, 184], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const pulse = interpolate(frame, [184, 192, 202], [1, 1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  const count = Math.round(
    interpolate(frame, [164, 198], [0, 87], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut }),
  );

  // Connector from node to the chip.
  const connector = interpolate(frame, [166, 184], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const ringR = 16;
  const circumference = 2 * Math.PI * ringR;
  const filled = (count / 100) * circumference;

  const chipW = 230;
  const chipH = 62;
  const chipX = CHIP_X;
  const chipY = ny - chipH / 2;

  return (
    <>
      {connector > 0 ? (
        <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <line
            x1={SPINE_X}
            y1={ny}
            x2={SPINE_X + (CHIP_X - SPINE_X) * connector}
            y2={ny}
            stroke={C.teal}
            strokeWidth={2}
            opacity={0.85}
          />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: chipX,
          top: chipY,
          width: chipW,
          height: chipH,
          opacity: appear,
          transform: `translateY(${rise}px) scale(${pulse})`,
          transformOrigin: "left center",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 16px",
          borderRadius: 14,
          background: C.panel,
          border: `1px solid ${C.teal}`,
          boxShadow: `0 8px 24px rgba(0,0,0,0.34), 0 0 0 4px ${C.tealSoft}`,
          boxSizing: "border-box",
        }}
      >
        <svg width={44} height={44} viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
          <circle cx={22} cy={22} r={ringR} fill="none" stroke={C.lineSoft} strokeWidth={4} />
          <circle
            cx={22}
            cy={22}
            r={ringR}
            fill="none"
            stroke={C.teal}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            transform="rotate(-90 22 22)"
          />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSoft }}>
            {pick("AI confidence", "Confianza de la IA", lang)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.teal, letterSpacing: "-0.01em" }}>{count}%</div>
        </div>
      </div>
    </>
  );
}

export const TimelineReconstruct: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();

  // Beat 1: question headline fades in near the top.
  const headOpacity = interpolate(frame, [0, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const headRise = interpolate(frame, [0, 35], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  // Beat 5: persistent guardrail line, stays to the end.
  const guardOpacity = interpolate(frame, [200, 224], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${C.bg2} 0%, ${C.bg} 70%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headOpacity,
          transform: `translateY(${headRise}px)`,
          color: C.white,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {pick("What happened to Carlos?", "¿Qué le pasó a Carlos?", lang)}
      </div>

      <Spine frame={frame} />

      {EVENTS.map((_, i) => (
        <EventChip key={i} i={i} lang={lang} frame={frame} />
      ))}

      <ConfidenceChip lang={lang} frame={frame} />

      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: guardOpacity,
          color: C.textSoft,
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        {pick("A lead to check, not a sure answer.", "Una pista para verificar, no una respuesta segura.", lang)}
      </div>
    </AbsoluteFill>
  );
};
