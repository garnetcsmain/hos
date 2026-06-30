"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Lang } from "../LocaleProvider";
import { C, VIDEO_H, VIDEO_W, pick } from "./theme";

// "Match Pulse" — the AI Matching Engine explained. Two ID cards slide in, a
// teal scan sweep crosses each, shared attributes connect and light up, a
// confidence ring counts to 94%, and a verify badge appears. The
// human-decides guardrail stays visible to the end.

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

// Card geometry. Each card is ~300px wide; the left sits at x=70, the right at
// x=590 (right edge ~890). Both are vertically centered around CY.
const CARD_W = 300;
const CARD_H = 280;
const CARD_TOP = (VIDEO_H - CARD_H) / 2; // 130
const LEFT_X = 70;
const RIGHT_X = 590;

const HEADER_H = 40;
const PHOTO_TOP = HEADER_H + 16;
const PHOTO_SIZE = 56;

// Three attribute rows, stacked below the photo. Row index 0=Name, 1=Age, 2=Neighborhood.
const ROW_TOP = PHOTO_TOP + PHOTO_SIZE + 20; // first row top, relative to card
const ROW_H = 46;
const ROW_GAP = 8;
const rowTop = (i: number) => ROW_TOP + i * (ROW_H + ROW_GAP);
// Vertical center of a row, in absolute canvas coordinates.
const rowCenterY = (i: number) => CARD_TOP + rowTop(i) + ROW_H / 2;

type Attr = { label: string; value: string };

function leftAttrs(lang: Lang): Attr[] {
  return [
    { label: pick("Name", "Nombre", lang), value: "Carlos Perez" },
    { label: pick("Age", "Edad", lang), value: "34" },
    { label: pick("Neighborhood", "Barrio", lang), value: pick("Petare", "Petare", lang) },
  ];
}

function rightAttrs(lang: Lang): Attr[] {
  return [
    { label: pick("Name", "Nombre", lang), value: "C. Perez" },
    { label: pick("Age", "Edad", lang), value: "~30s" },
    { label: pick("Neighborhood", "Barrio", lang), value: "Petare" },
  ];
}

// Each row's connect line draws in sequence: Name (95-110), Age (113-128),
// Neighborhood (131-146). Highlight/pill follows just after the draw lands.
const CONNECT_START = [95, 113, 131];
const CONNECT_END = [110, 128, 146];

function Header({ side, label }: { side: "left" | "right"; label: string }) {
  const color = side === "left" ? C.red : C.green;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: HEADER_H,
        background: color,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        color: C.bg,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </div>
  );
}

function AttrRow({
  attr,
  rowIndex,
  matched,
  scanGlow,
}: {
  attr: Attr;
  rowIndex: number;
  matched: number; // 0..1 — pill + check reveal
  scanGlow: number; // 0..1 — transient teal underline as the scan crosses
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        top: rowTop(rowIndex),
        height: ROW_H,
        borderRadius: 10,
        background: matched > 0 ? C.tealSoft : "transparent",
        border: `1px solid ${matched > 0 ? C.teal : "transparent"}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingLeft: 12,
        paddingRight: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: C.textSoft, textTransform: "uppercase" }}>
          {attr.label}
        </div>
        {matched > 0 ? (
          <div style={{ opacity: matched, display: "flex", alignItems: "center" }}>
            <svg width={16} height={16} viewBox="0 0 16 16">
              <circle cx={8} cy={8} r={7} fill={C.tealSoft} stroke={C.teal} strokeWidth={1} />
              <path d="M4.5 8.2 L7 10.5 L11.5 5.5" fill="none" stroke={C.teal} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : null}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 2 }}>{attr.value}</div>
      {/* transient scan underline */}
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 6,
          height: 2,
          borderRadius: 2,
          background: C.teal,
          opacity: scanGlow * 0.9,
          transform: `scaleX(${scanGlow})`,
          transformOrigin: "left center",
          boxShadow: scanGlow > 0 ? `0 0 8px ${C.teal}` : "none",
        }}
      />
    </div>
  );
}

function Card({
  side,
  x,
  frame,
  attrs,
  headerLabel,
  scanStart,
  lang,
}: {
  side: "left" | "right";
  x: number;
  frame: number;
  attrs: Attr[];
  headerLabel: string;
  scanStart: number;
  lang: Lang;
}) {
  // Slide-in: from off-screen edge to resting x, settling by frame 40.
  const offset = side === "left" ? -(CARD_W + 90) : VIDEO_W + 90;
  const enterX = interpolate(frame, [0, 40], [offset, x], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const opacity = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Scan sweep: a 3px teal line moves top-to-bottom across the card over ~30 frames.
  const SCAN_DUR = 30;
  const scanProgress = interpolate(frame, [scanStart, scanStart + SCAN_DUR], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanActive = frame >= scanStart && frame <= scanStart + SCAN_DUR + 4;
  const scanY = scanProgress * CARD_H;
  const scanOpacity = interpolate(frame, [scanStart, scanStart + 4, scanStart + SCAN_DUR - 4, scanStart + SCAN_DUR], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Per-row transient glow: peaks as the scan line crosses that row's center.
  const rowGlow = (i: number) => {
    if (!scanActive) return 0;
    const rc = rowTop(i) + ROW_H / 2;
    return interpolate(scanY, [rc - 22, rc, rc + 22], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };

  // Matched reveal per row (driven by the connect sequence).
  const rowMatched = (i: number) =>
    interpolate(frame, [CONNECT_END[i] - 4, CONNECT_END[i] + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: enterX,
        top: CARD_TOP,
        width: CARD_W,
        height: CARD_H,
        opacity,
        borderRadius: 16,
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      <Header side={side} label={headerLabel} />

      {/* photo placeholder */}
      <div
        style={{
          position: "absolute",
          left: 16,
          top: PHOTO_TOP,
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          borderRadius: 12,
          background: C.bg2,
          border: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={28} height={28} viewBox="0 0 24 24">
          <circle cx={12} cy={9} r={4} fill="none" stroke={C.textFaint} strokeWidth={1.6} />
          <path d="M5 20 C5 15.6 8.1 13.5 12 13.5 C15.9 13.5 19 15.6 19 20" fill="none" stroke={C.textFaint} strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 16 + PHOTO_SIZE + 14,
          top: PHOTO_TOP + 10,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: C.textSoft,
          textTransform: "uppercase",
        }}
      >
        {pick("ID record", "Registro", lang)}
      </div>

      {attrs.map((a, i) => (
        <AttrRow key={i} attr={a} rowIndex={i} matched={rowMatched(i)} scanGlow={rowGlow(i)} />
      ))}

      {/* scan line */}
      {scanActive ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: scanY,
            height: 3,
            background: C.teal,
            opacity: scanOpacity,
            boxShadow: `0 0 14px 2px ${C.teal}`,
          }}
        />
      ) : null}
    </div>
  );
}

function ConnectLines({ frame }: { frame: number }) {
  // Right edge of left card / left edge of right card, in absolute coordinates.
  const xL = LEFT_X + CARD_W - 14;
  const xR = RIGHT_X + 14;
  const o = interpolate(frame, [92, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, opacity: o }}>
      {[0, 1, 2].map((i) => {
        const draw = interpolate(frame, [CONNECT_START[i], CONNECT_END[i]], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        });
        const y = rowCenterY(i);
        const x2 = xL + (xR - xL) * draw;
        return <line key={i} x1={xL} y1={y} x2={x2} y2={y} stroke={C.teal} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />;
      })}
    </svg>
  );
}

function ConfidenceMeter({ frame }: { frame: number }) {
  const appear = interpolate(frame, [140, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(frame, [140, 152], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });

  const value = Math.round(interpolate(frame, [140, 180], [0, 94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const R = 46;
  const circ = 2 * Math.PI * R;
  const fill = interpolate(frame, [140, 180], [0, 0.94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dashOffset = circ * (1 - fill);

  // Centered between the cards horizontally; placed in the gap, mid-canvas.
  const CMX = VIDEO_W / 2;
  const CMY = VIDEO_H / 2 - 6;
  const BOX = 120;

  return (
    <div
      style={{
        position: "absolute",
        left: CMX - BOX / 2,
        top: CMY - BOX / 2 + rise,
        width: BOX,
        height: BOX,
        opacity: appear,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={BOX / 2} cy={BOX / 2} r={R} fill={C.bg} stroke={C.line} strokeWidth={6} />
        <circle
          cx={BOX / 2}
          cy={BOX / 2}
          r={R}
          fill="none"
          stroke={C.teal}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`}
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.teal, letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginTop: 2 }}>%</div>
      </div>
    </div>
  );
}

function VerifyBadge({ frame, lang }: { frame: number; lang: Lang }) {
  const appear = interpolate(frame, [180, 192], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(frame, [180, 196], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });

  const guardOpacity = interpolate(frame, [188, 202], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 46,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          opacity: appear,
          transform: `translateY(${rise}px)`,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: C.panel,
          border: `1px solid ${C.teal}`,
          borderRadius: 999,
          padding: "10px 18px",
          boxShadow: `0 8px 24px rgba(0,0,0,0.32)`,
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24">
          <path d="M12 3 L20 7 V12 C20 16.5 16.6 19.8 12 21 C7.4 19.8 4 16.5 4 12 V7 Z" fill="none" stroke={C.teal} strokeWidth={1.7} strokeLinejoin="round" />
          <path d="M9 12 L11.2 14.2 L15.4 9.4" fill="none" stroke={C.teal} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
          {pick("Possible match - please check it", "Posible coincidencia - por favor verifícala", lang)}
        </span>
      </div>

      <div style={{ opacity: guardOpacity, fontSize: 13, fontWeight: 600, color: C.textSoft, letterSpacing: "0.01em" }}>
        {pick("AI suggests. A person decides.", "La IA sugiere. Una persona decide.", lang)}
      </div>
    </div>
  );
}

export const MatchPulse: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${C.bg2} 0%, ${C.bg} 70%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* connect lines sit behind the cards so the pills/checks read on top */}
      {frame >= 92 ? <ConnectLines frame={frame} /> : null}

      <Card
        side="left"
        x={LEFT_X}
        frame={frame}
        attrs={leftAttrs(lang)}
        headerLabel={pick("MISSING", "DESAPARECIDO", lang)}
        scanStart={42}
        lang={lang}
      />
      <Card
        side="right"
        x={RIGHT_X}
        frame={frame}
        attrs={rightAttrs(lang)}
        headerLabel={pick("FOUND", "ENCONTRADO", lang)}
        scanStart={58}
        lang={lang}
      />

      {frame >= 140 ? <ConfidenceMeter frame={frame} /> : null}
      {frame >= 180 ? <VerifyBadge frame={frame} lang={lang} /> : null}
    </AbsoluteFill>
  );
};
