"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Lang } from "../LocaleProvider";
import { C, VIDEO_H, VIDEO_W, pick, randRange } from "./theme";

// Hero animation. Dozens of message/photo chips fly in from the edges, swirl in
// an overwhelming cloud, then snap into a tidy grid that resolves into one calm
// map of labeled dots — the core HOS promise in 8 seconds.

const CX = VIDEO_W / 2;
const CY = VIDEO_H / 2;
const N = 26;
const CHIP_W = 104;
const CHIP_H = 34;

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

type Role = "red" | "green" | "neutral";
function roleOf(i: number): Role {
  const m = i % 3;
  return m === 0 ? "red" : m === 1 ? "green" : "neutral";
}
const roleColor: Record<Role, string> = { red: C.red, green: C.green, neutral: C.textSoft };

function chipGeometry(i: number) {
  const seed = i + 1;
  const side = i % 4;
  const off = randRange(seed * 3.1, 0.08, 0.92);
  let sx = 0;
  let sy = 0;
  if (side === 0) (sx = -180), (sy = VIDEO_H * off);
  else if (side === 1) (sx = VIDEO_W + 180), (sy = VIDEO_H * off);
  else if (side === 2) (sx = VIDEO_W * off), (sy = -140);
  else (sx = VIDEO_W * off), (sy = VIDEO_H + 140);

  const ang = (i / N) * Math.PI * 2;
  const rad = randRange(seed * 5.3, 60, 190);
  const cvx = Math.cos(ang) * rad;
  const cvy = Math.sin(ang) * rad * 0.66;

  const col = i % 6;
  const row = Math.floor(i / 6);
  const gx = CX - 350 + col * 117 + CHIP_W / 2;
  const gy = CY - 150 + row * 58 + CHIP_H / 2;

  const dotX = randRange(seed * 7.7, 190, 800);
  const dotY = randRange(seed * 9.1, 150, 455);

  return { sx, sy, cvx, cvy, gx, gy, dotX, dotY, startRot: randRange(seed * 2.2, -16, 16) };
}

function rotate(vx: number, vy: number, a: number) {
  return { x: Math.cos(a) * vx - Math.sin(a) * vy, y: Math.sin(a) * vx + Math.cos(a) * vy };
}

const GEOM = Array.from({ length: N }, (_, i) => chipGeometry(i));

function Chip({ i, frame }: { i: number; frame: number }) {
  const g = GEOM[i];
  const role = roleOf(i);
  const color = roleColor[role];
  const delay = i * 1.0;

  // Orbit position at an arbitrary frame (used for the swirl + as the P3 anchor).
  const orbitAt = (f: number) => {
    const extra = interpolate(f, [60, 110], [0, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const r = rotate(g.cvx, g.cvy, extra);
    const jit = Math.sin(f * 0.32 + i) * 4;
    return { x: CX + r.x + jit, y: CY + r.y + jit * 0.5 };
  };

  let x: number;
  let y: number;
  let rot = 0;
  let morph = 0; // 0 = chip, 1 = dot
  let opacity = 1;

  if (frame < 60) {
    const t = interpolate(frame - delay, [0, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
    const o = orbitAt(60);
    x = lerp(t, g.sx, o.x);
    y = lerp(t, g.sy, o.y);
    rot = lerp(t, g.startRot, g.startRot * 0.5);
    opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (frame < 110) {
    const o = orbitAt(frame);
    x = o.x;
    y = o.y;
    rot = Math.sin(frame * 0.1 + i) * 6;
  } else if (frame < 165) {
    const t = interpolate(frame, [110, 162], [0, 1], { extrapolateRight: "clamp", easing: easeInOut });
    const o = orbitAt(110);
    x = lerp(t, o.x, g.gx);
    y = lerp(t, o.y, g.gy);
    rot = lerp(t, Math.sin(110 * 0.1 + i) * 6, 0);
  } else if (frame < 205) {
    const t = interpolate(frame, [168, 204], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
    x = lerp(t, g.gx, g.dotX);
    y = lerp(t, g.gy, g.dotY);
    morph = t;
  } else {
    x = g.dotX;
    y = g.dotY;
    morph = 1;
  }

  const w = lerp(morph, CHIP_W, 13);
  const h = lerp(morph, CHIP_H, 13);
  const radius = lerp(morph, 8, 7);
  const chipOpacity = 1 - morph;

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity,
        transform: `rotate(${rot}deg)`,
        transition: "none",
      }}
    >
      {/* the message chip */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: chipOpacity,
          borderRadius: radius,
          background: C.panel,
          border: `1px solid ${color}`,
          boxShadow: `0 6px 16px rgba(0,0,0,0.28)`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 8px",
          overflow: "hidden",
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 4, background: color, flexShrink: 0, opacity: 0.9 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <div style={{ height: 4, width: "70%", borderRadius: 3, background: "rgba(255,255,255,0.32)" }} />
          <div style={{ height: 4, width: "44%", borderRadius: 3, background: "rgba(255,255,255,0.16)" }} />
        </div>
      </div>
      {/* the resolved map dot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: morph,
          borderRadius: "50%",
          background: color,
          border: "2px solid rgba(255,255,255,0.85)",
          boxShadow: `0 0 0 4px ${role === "red" ? C.redSoft : role === "green" ? C.greenSoft : "rgba(150,190,170,0.16)"}`,
        }}
      />
    </div>
  );
}

function MapBackdrop({ frame }: { frame: number }) {
  const o = interpolate(frame, [165, 202], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, opacity: o }}>
      <path
        d="M120,150 C200,90 360,110 470,150 C600,120 760,150 850,230 C900,300 840,400 720,440 C560,490 320,470 220,420 C110,370 60,230 120,150 Z"
        fill="#10231b"
        stroke={C.lineSoft}
        strokeWidth={1.5}
      />
      <path d="M170,250 C300,240 430,300 560,280 C660,265 760,300 820,330" fill="none" stroke={C.lineSoft} strokeWidth={1.4} />
      <path d="M260,180 C300,260 280,360 330,430" fill="none" stroke={C.lineSoft} strokeWidth={1.2} />
      <path d="M520,170 C560,260 600,330 690,420" fill="none" stroke={C.lineSoft} strokeWidth={1.2} />
    </svg>
  );
}

function MatchLine({ frame }: { frame: number }) {
  const a = GEOM[0];
  const b = GEOM[1];
  const draw = interpolate(frame, [210, 232], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const x2 = lerp(draw, a.dotX, b.dotX);
  const y2 = lerp(draw, a.dotY, b.dotY);
  const o = interpolate(frame, [208, 218], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, opacity: o }}>
      <line x1={a.dotX} y1={a.dotY} x2={x2} y2={y2} stroke={C.teal} strokeWidth={2} strokeDasharray="5 5" />
    </svg>
  );
}

function DotLabel({ i, text, frame }: { i: number; text: string; frame: number }) {
  const g = GEOM[i];
  const o = interpolate(frame, [206, 224], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: g.dotX + 12,
        top: g.dotY - 9,
        opacity: o,
        fontSize: 12,
        fontWeight: 700,
        color: C.text,
        background: "rgba(11,21,18,0.7)",
        padding: "2px 7px",
        borderRadius: 6,
        whiteSpace: "nowrap",
        border: `1px solid ${C.line}`,
      }}
    >
      {text}
    </div>
  );
}

export const ChaosToClarity: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();

  const capOpacity = interpolate(frame, [68, 84, 104, 116], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headOpacity = interpolate(frame, [210, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headRise = interpolate(frame, [210, 234], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 0%, ${C.bg2} 0%, ${C.bg} 70%)`, fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <MapBackdrop frame={frame} />
      {GEOM.map((_, i) => (
        <Chip key={i} i={i} frame={frame} />
      ))}
      {frame >= 205 ? <MatchLine frame={frame} /> : null}
      {frame >= 205 ? (
        <>
          <DotLabel i={0} text={pick("Missing", "Desaparecido", lang)} frame={frame} />
          <DotLabel i={1} text={pick("Shelter 17", "Refugio 17", lang)} frame={frame} />
          <DotLabel i={2} text={pick("Hospital", "Hospital", lang)} frame={frame} />
        </>
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: capOpacity,
          color: C.text,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {pick("So many messages, all at once.", "Tantos mensajes, todos al mismo tiempo.", lang)}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headOpacity,
          transform: `translateY(${headRise}px)`,
          color: C.white,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {pick("One shared, calm picture.", "Una sola imagen, clara y tranquila.", lang)}
      </div>
    </AbsoluteFill>
  );
};
