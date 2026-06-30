"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Lang } from "../LocaleProvider";
import { C, VIDEO_H, VIDEO_W, pick } from "./theme";

// "Aid Journey" — the Aid Accountability story. A supply box leaves a warehouse,
// travels toward a waiting community, is blocked/diverted at a checkpoint; a
// person files a "did not arrive" report (photo + place) that lands on the map
// and is verified by people; the blockage becomes visible so help re-routes and
// arrives. Calm and hopeful — muted red, no flashing, no flags/politics.

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// --- Route geometry ---------------------------------------------------------
// Warehouse at lower-left, community cluster on the far right, checkpoint at the
// midpoint. Coordinates are in canvas space (960 x 540).
const WAREHOUSE = { x: 150, y: 360 };
const COMMUNITY = { x: 800, y: 360 };
const CHECKPOINT = { x: 475, y: 360 };
const ROUTE_Y = 360;
const DIVERT_END = { x: 560, y: 480 }; // where the red diversion curves to

// Color blends slate -> red over a window (smooth, never flashing).
function blendToRed(frame: number, a: number, b: number) {
  const t = fade(frame, a, b);
  return t < 0.5 ? C.textSoft : C.red;
}

function Warehouse({ frame }: { frame: number }) {
  const o = fade(frame, 0, 12);
  return (
    <svg
      width={88}
      height={80}
      viewBox="0 0 88 80"
      style={{ position: "absolute", left: WAREHOUSE.x - 44, top: WAREHOUSE.y - 64, opacity: o }}
    >
      {/* flat-roof house body */}
      <rect x={14} y={28} width={60} height={44} rx={4} fill="none" stroke={C.teal} strokeWidth={2.5} />
      {/* flat roof overhang */}
      <rect x={8} y={20} width={72} height={12} rx={3} fill={C.tealSoft} stroke={C.teal} strokeWidth={2.5} />
      {/* roller door */}
      <rect x={32} y={44} width={24} height={28} rx={2} fill="none" stroke={C.teal} strokeWidth={2} opacity={0.8} />
      <line x1={32} y1={52} x2={56} y2={52} stroke={C.teal} strokeWidth={1.4} opacity={0.6} />
      <line x1={32} y1={60} x2={56} y2={60} stroke={C.teal} strokeWidth={1.4} opacity={0.6} />
    </svg>
  );
}

function House({ x, y, scale, color, glow }: { x: number; y: number; scale: number; color: string; glow: number }) {
  const w = 36 * scale;
  const h = 34 * scale;
  return (
    <svg
      width={w + 8}
      height={h + 8}
      viewBox="0 0 44 42"
      style={{
        position: "absolute",
        left: x - (w + 8) / 2,
        top: y - (h + 8) / 2,
        filter: glow > 0 ? `drop-shadow(0 0 ${glow * 10}px ${C.amber})` : "none",
      }}
    >
      <path d="M22 6 L38 20 L34 20 L34 36 L10 36 L10 20 L6 20 Z" fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
      <rect x={18} y={26} width={8} height={10} fill={color} opacity={0.6} />
    </svg>
  );
}

function Community({ frame, brighten }: { frame: number; brighten: number }) {
  const o = fade(frame, 24, 36);
  // Slate base brightening toward a soft warm amber as help arrives.
  const color = brighten < 0.5 ? C.textSoft : C.amber;
  return (
    <div style={{ opacity: o }}>
      <House x={COMMUNITY.x - 30} y={COMMUNITY.y - 6} scale={0.9} color={color} glow={brighten} />
      <House x={COMMUNITY.x + 6} y={COMMUNITY.y - 14} scale={1.05} color={color} glow={brighten} />
      <House x={COMMUNITY.x + 42} y={COMMUNITY.y - 4} scale={0.85} color={color} glow={brighten} />
    </div>
  );
}

function RouteLine({ frame }: { frame: number }) {
  // Dashed slate route drawn left-to-right (18-36). Beyond the checkpoint it
  // dims to faint once the blockage is revealed.
  const draw = interpolate(frame, [18, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const fullLen = COMMUNITY.x - WAREHOUSE.x;
  const drawnX = WAREHOUSE.x + fullLen * draw;

  const beyondDim = fade(frame, 96, 120); // route past checkpoint fades to faint after blockage
  const beyondColor = beyondDim < 0.5 ? C.textSoft : C.textFaint;
  const beyondOpacity = lerp(beyondDim, 0.55, 0.22);

  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0 }}>
      {/* segment warehouse -> checkpoint (stays visible) */}
      <line
        x1={WAREHOUSE.x}
        y1={ROUTE_Y}
        x2={Math.min(drawnX, CHECKPOINT.x)}
        y2={ROUTE_Y}
        stroke={C.textSoft}
        strokeWidth={2}
        strokeDasharray="6 7"
        opacity={0.55}
      />
      {/* segment checkpoint -> community (dims once blocked) */}
      {drawnX > CHECKPOINT.x ? (
        <line
          x1={CHECKPOINT.x}
          y1={ROUTE_Y}
          x2={drawnX}
          y2={ROUTE_Y}
          stroke={beyondColor}
          strokeWidth={2}
          strokeDasharray="6 7"
          opacity={beyondOpacity}
        />
      ) : null}
    </svg>
  );
}

function Checkpoint({ frame }: { frame: number }) {
  const o = fade(frame, 60, 72);
  const color = blendToRed(frame, 96, 114);
  return (
    <svg
      width={40}
      height={84}
      viewBox="0 0 40 84"
      style={{ position: "absolute", left: CHECKPOINT.x - 20, top: ROUTE_Y - 58, opacity: o }}
    >
      {/* posts */}
      <line x1={8} y1={10} x2={8} y2={74} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={32} y1={10} x2={32} y2={74} stroke={color} strokeWidth={3} strokeLinecap="round" />
      {/* gate barrier */}
      <rect x={4} y={26} width={32} height={9} rx={2} fill="none" stroke={color} strokeWidth={2.4} />
      <line x1={9} y1={26} x2={31} y2={35} stroke={color} strokeWidth={1.4} opacity={0.6} />
      <line x1={9} y1={35} x2={31} y2={26} stroke={color} strokeWidth={1.4} opacity={0.6} />
    </svg>
  );
}

function DiversionLine({ frame }: { frame: number }) {
  // Red dashed diversion branching off the checkpoint, curving downward away
  // from the community (drawn 114-132).
  const draw = interpolate(frame, [114, 132], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (draw <= 0) return null;
  const cx = lerp(0.5, CHECKPOINT.x, DIVERT_END.x) + 40;
  const cy = lerp(0.5, ROUTE_Y, DIVERT_END.y) - 10;
  const ex = lerp(draw, CHECKPOINT.x, DIVERT_END.x);
  const ey = lerp(draw, ROUTE_Y, DIVERT_END.y);
  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0 }}>
      <path
        d={`M ${CHECKPOINT.x} ${ROUTE_Y} Q ${cx} ${cy} ${ex} ${ey}`}
        fill="none"
        stroke={C.red}
        strokeWidth={2}
        strokeDasharray="6 7"
        opacity={0.7}
      />
    </svg>
  );
}

function SupplyBox({ frame }: { frame: number }) {
  // Appears at the warehouse and scales in (12-24); travels along the route
  // (36-96), slowing as it nears the checkpoint; STOPS at the checkpoint and
  // turns red (96-114); nudges onto the diversion (114-132).
  const appear = interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (appear <= 0) return null;

  // Travel progress along warehouse -> checkpoint, easing out so it slows near
  // the gate and arrives by frame 96.
  const travel = interpolate(frame, [36, 96], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  let x = lerp(travel, WAREHOUSE.x, CHECKPOINT.x - 30);
  let y = ROUTE_Y;

  // Nudge onto the diversion after the block (114-132).
  const nudge = interpolate(frame, [114, 132], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  if (nudge > 0) {
    x = lerp(nudge, CHECKPOINT.x - 30, lerp(0.45, CHECKPOINT.x, DIVERT_END.x));
    y = lerp(nudge, ROUTE_Y, lerp(0.45, ROUTE_Y, DIVERT_END.y));
  }

  const color = blendToRed(frame, 96, 114);
  const blocked = fade(frame, 96, 114);
  const size = 36 * appear;
  // De-emphasize the blocked box later so focus can move to the report.
  const dim = fade(frame, 150, 170);
  const opacity = lerp(dim, 1, 0.55) * appear;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity,
        borderRadius: 8,
        background: blocked > 0.5 ? C.redSoft : C.tealSoft,
        border: `2.5px solid ${color}`,
        boxShadow: `0 6px 16px rgba(0,0,0,0.28)`,
      }}
    >
      {/* tape cross — a parcel */}
      <div style={{ position: "absolute", left: "50%", top: 4, bottom: 4, width: 2, marginLeft: -1, background: color, opacity: 0.55 }} />
      <div style={{ position: "absolute", top: "50%", left: 4, right: 4, height: 2, marginTop: -1, background: color, opacity: 0.55 }} />
    </div>
  );
}

function Person({ frame }: { frame: number }) {
  // Neutral slate person near the community, fades/scales in (132-144).
  const t = interpolate(frame, [132, 144], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (t <= 0) return null;
  const px = COMMUNITY.x - 80;
  const py = COMMUNITY.y + 70;
  const s = lerp(t, 0.8, 1);
  return (
    <svg
      width={48}
      height={64}
      viewBox="0 0 48 64"
      style={{ position: "absolute", left: px - 24, top: py - 32, opacity: t, transform: `scale(${s})`, transformOrigin: "center" }}
    >
      {/* head */}
      <circle cx={24} cy={16} r={9} fill="none" stroke={C.textSoft} strokeWidth={2.4} />
      {/* body */}
      <path d="M10 56 C10 38 38 38 38 56 Z" fill="none" stroke={C.textSoft} strokeWidth={2.4} strokeLinejoin="round" />
    </svg>
  );
}

function ReportFlag({ frame }: { frame: number }) {
  // Green report flag rises on a short pole (144-162) above the person,
  // carrying a tiny camera glyph + a small location pin (photo + place).
  const rise = interpolate(frame, [144, 162], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (rise <= 0) return null;
  // The flag detaches and travels up to the map as a pin (168-186).
  const travel = interpolate(frame, [168, 186], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });

  const baseX = COMMUNITY.x - 80;
  const baseY = COMMUNITY.y + 36;
  const poleTop = lerp(rise, baseY, baseY - 46);

  // When travelling, fade the flag out as the map pin takes over.
  const opacity = lerp(travel, 1, 0);
  if (opacity <= 0) return null;

  const flagY = lerp(travel, poleTop, poleTop - 30);

  return (
    <svg width={120} height={120} viewBox="0 0 120 120" style={{ position: "absolute", left: baseX - 24, top: baseY - 96, opacity }}>
      {/* pole */}
      <line x1={24} y1={96 - (baseY - poleTop)} x2={24} y2={96} stroke={C.green} strokeWidth={2.2} strokeLinecap="round" />
      {/* flag banner */}
      <g transform={`translate(24 ${96 - (baseY - flagY)})`}>
        <rect x={2} y={-2} width={56} height={30} rx={5} fill={C.greenSoft} stroke={C.green} strokeWidth={2} />
        {/* tiny white camera glyph */}
        <rect x={9} y={5} width={18} height={13} rx={2.5} fill="none" stroke={C.white} strokeWidth={1.6} />
        <circle cx={18} cy={11.5} r={3.4} fill="none" stroke={C.white} strokeWidth={1.6} />
        <rect x={12} y={3} width={6} height={3} rx={1} fill={C.white} />
        {/* small location pin */}
        <path d="M44 4 C40 4 37 7 37 11 C37 16 44 23 44 23 C44 23 51 16 51 11 C51 7 48 4 44 4 Z" fill="none" stroke={C.green} strokeWidth={1.6} />
        <circle cx={44} cy={11} r={2.4} fill={C.green} />
      </g>
    </svg>
  );
}

function MapFrame({ frame }: { frame: number }) {
  // Simple map frame with faint slate grid lines around the whole route.
  const o = fade(frame, 168, 188);
  if (o <= 0) return null;
  const x = 70;
  const y = 150;
  const w = VIDEO_W - 140;
  const h = 300;
  const cols = [0.25, 0.5, 0.75];
  const rows = [0.33, 0.66];
  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, opacity: o }}>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="#10231b" stroke={C.lineSoft} strokeWidth={1.5} />
      {cols.map((c) => (
        <line key={`c${c}`} x1={x + w * c} y1={y} x2={x + w * c} y2={y + h} stroke={C.lineSoft} strokeWidth={1} />
      ))}
      {rows.map((r) => (
        <line key={`r${r}`} x1={x} y1={y + h * r} x2={x + w} y2={y + h * r} stroke={C.lineSoft} strokeWidth={1} />
      ))}
    </svg>
  );
}

function MapPin({ frame }: { frame: number }) {
  // Green pin travels up and lands on the map at the blockage location (168-186).
  const t = interpolate(frame, [168, 186], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (t <= 0) return null;
  const fromX = COMMUNITY.x - 80;
  const fromY = COMMUNITY.y - 10;
  const x = lerp(t, fromX, CHECKPOINT.x);
  const y = lerp(t, fromY, ROUTE_Y - 30);
  const drop = interpolate(frame, [182, 186], [-6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  return (
    <svg width={36} height={48} viewBox="0 0 36 48" style={{ position: "absolute", left: x - 18, top: y - 40 + drop }}>
      <path d="M18 4 C10 4 4 10 4 18 C4 30 18 44 18 44 C18 44 32 30 32 18 C32 10 26 4 18 4 Z" fill={C.greenSoft} stroke={C.green} strokeWidth={2.2} />
      <circle cx={18} cy={18} r={5} fill={C.green} />
    </svg>
  );
}

function VerifyBadge({ frame }: { frame: number }) {
  // Green verification badge (circle + check) scales in beside the pin (186-204)
  // with a thin green ring drawing around it.
  const t = interpolate(frame, [186, 204], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (t <= 0) return null;
  const bx = CHECKPOINT.x + 30;
  const by = ROUTE_Y - 36;
  const s = lerp(t, 0.4, 1);
  const ringLen = 2 * Math.PI * 18;
  const ringDraw = interpolate(frame, [186, 204], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 48 48"
      style={{ position: "absolute", left: bx - 24, top: by - 24, opacity: t, transform: `scale(${s})`, transformOrigin: "center" }}
    >
      <circle cx={24} cy={24} r={13} fill={C.greenSoft} stroke={C.green} strokeWidth={2} />
      <path d="M18 24 L22.5 28.5 L31 19" fill="none" stroke={C.green} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* drawing ring — "verified by people" */}
      <circle
        cx={24}
        cy={24}
        r={18}
        fill="none"
        stroke={C.green}
        strokeWidth={1.6}
        strokeDasharray={ringLen}
        strokeDashoffset={ringLen * (1 - ringDraw)}
        transform="rotate(-90 24 24)"
        opacity={0.7}
      />
    </svg>
  );
}

function TrustChips({ frame, lang }: { frame: number; lang: Lang }) {
  // Tiny who/when/where chips fade in near the pin (192-204).
  const o = fade(frame, 192, 204);
  if (o <= 0) return null;
  const chips = [
    pick("who", "quién", lang),
    pick("when", "cuándo", lang),
    pick("where", "dónde", lang),
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: CHECKPOINT.x - 8,
        top: ROUTE_Y + 18,
        display: "flex",
        gap: 6,
        opacity: o,
      }}
    >
      {chips.map((c) => (
        <div
          key={c}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.green,
            background: C.greenSoft,
            border: `1px solid ${C.green}`,
            borderRadius: 6,
            padding: "2px 7px",
            whiteSpace: "nowrap",
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function BlockageMarker({ frame }: { frame: number }) {
  // Final: the blockage as a clear (but muted) red marker on the map, with the
  // verified green pin anchored to it.
  const o = fade(frame, 204, 218);
  if (o <= 0) return null;
  const glow = interpolate(frame, [204, 224], [4, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, opacity: o }}>
      <circle cx={CHECKPOINT.x} cy={ROUTE_Y} r={9} fill={C.red} opacity={0.85} />
      <circle cx={CHECKPOINT.x} cy={ROUTE_Y} r={glow} fill="none" stroke={C.red} strokeWidth={1.6} opacity={0.4} />
    </svg>
  );
}

// Cubic Bezier point sampler — lets us "draw" a curved route progressively by
// sampling points up to t (deterministic, no path-length tricks).
function cubic(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function RerouteLine({ frame }: { frame: number }) {
  // NEW teal re-routed dashed line drawn from the warehouse AROUND the blockage
  // into the community (204-228). Arcs up and over the checkpoint, then back
  // down into the community.
  const draw = interpolate(frame, [204, 228], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (draw <= 0) return null;

  // Two cubic segments: warehouse -> apex above checkpoint -> community.
  const segs = [
    { p0x: WAREHOUSE.x, p0y: ROUTE_Y, p1x: WAREHOUSE.x + 120, p1y: ROUTE_Y - 20, p2x: CHECKPOINT.x - 70, p2y: ROUTE_Y - 150, p3x: CHECKPOINT.x, p3y: ROUTE_Y - 160 },
    { p0x: CHECKPOINT.x, p0y: ROUTE_Y - 160, p1x: CHECKPOINT.x + 90, p1y: ROUTE_Y - 170, p2x: COMMUNITY.x - 80, p2y: ROUTE_Y - 120, p3x: COMMUNITY.x, p3y: ROUTE_Y - 20 },
  ];

  // Sample both segments into a single polyline, revealing up to `draw`.
  const STEPS = 48;
  const pts: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const g = i / STEPS;
    if (g > draw) break;
    const which = g < 0.5 ? 0 : 1;
    const local = which === 0 ? g / 0.5 : (g - 0.5) / 0.5;
    const s = segs[which];
    const x = cubic(s.p0x, s.p1x, s.p2x, s.p3x, local);
    const y = cubic(s.p0y, s.p1y, s.p2y, s.p3y, local);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  if (pts.length < 2) return null;

  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0 }}>
      <polyline points={pts.join(" ")} fill="none" stroke={C.teal} strokeWidth={2.4} strokeDasharray="6 7" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
}

export const AidJourney: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();

  // How brightly the community "receives" help (only after the reroute lands).
  const brighten = fade(frame, 210, 228);

  // Title (top-center) and the per-beat captions / closing line.
  const titleOpacity = interpolate(frame, [8, 36, 90, 104], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cap2 = interpolate(frame, [40, 56, 90, 102], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cap3 = interpolate(frame, [100, 114, 128, 138], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cap4 = interpolate(frame, [136, 150, 162, 172], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cap5 = interpolate(frame, [172, 186, 200, 210], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const closeOpacity = interpolate(frame, [216, 236], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const closeRise = interpolate(frame, [216, 240], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });

  const captionText =
    cap2 > 0.02
      ? pick("It travels toward the families who are waiting.", "Viaja hacia las familias que la esperan.", lang)
      : cap3 > 0.02
        ? pick("Sometimes help is blocked, held back, or sent somewhere else.", "A veces la ayuda se bloquea, se retiene o se envía a otro lugar.", lang)
        : cap4 > 0.02
          ? pick("Anyone can report when help did not arrive — with a photo and a place.", "Cualquier persona puede reportar cuando la ayuda no llegó, con una foto y un lugar.", lang)
          : cap5 > 0.02
            ? pick("People check the report — the evidence, the who, the when, the where.", "Las personas revisan el reporte: la evidencia, el quién, el cuándo y el dónde.", lang)
            : "";
  const captionOpacity = Math.max(cap2, cap3, cap4, cap5);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${C.bg2} 0%, ${C.bg} 70%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <MapFrame frame={frame} />
      <RouteLine frame={frame} />
      <DiversionLine frame={frame} />
      <RerouteLine frame={frame} />

      <Warehouse frame={frame} />
      <Community frame={frame} brighten={brighten} />

      <BlockageMarker frame={frame} />
      <Checkpoint frame={frame} />
      <SupplyBox frame={frame} />

      <Person frame={frame} />
      <ReportFlag frame={frame} />
      <MapPin frame={frame} />
      <VerifyBadge frame={frame} />
      <TrustChips frame={frame} lang={lang} />

      {/* Title — top center */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          color: C.text,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {pick("Every box of help begins a journey.", "Cada caja de ayuda comienza un viaje.", lang)}
      </div>

      {/* Per-beat captions — bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: captionOpacity,
          color: C.textSoft,
          fontSize: 19,
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        {captionText}
      </div>

      {/* Closing line — bottom center, resolved */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: closeOpacity,
          transform: `translateY(${closeRise}px)`,
          color: C.white,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}
      >
        {pick("Now the blockage is visible — so help can find another way through.", "Ahora el bloqueo se ve, para que la ayuda encuentre otro camino.", lang)}
      </div>
    </AbsoluteFill>
  );
};
