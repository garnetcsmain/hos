"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Lang } from "../LocaleProvider";
import { C, VIDEO_H, VIDEO_W, pick } from "./theme";

// Day-one explainer. On the left, four messy social-post bubbles drop and stack;
// on the right, an empty structured card fades in. As the AI "parses", teal
// arrows travel one at a time from a bubble to its matching field, filling
// Person / Location / Time / Description with clean facts — messy signals become
// tidy structure.

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

// Left column: bubble layout (x is the left edge; bubbles stack downward).
const BUBBLE_X = 40;
const BUBBLE_W = 360;
const BUBBLE_H = 78;
const BUBBLE_GAP = 18;
const BUBBLE_TOP = 78;

// Right column: structured card + rows.
const CARD_X = 540;
const CARD_W = 380;
const CARD_Y = 96;
const CARD_H = 348;
const ROW_GAP = 78;
const ROW_TOP = CARD_Y + 50;

type Bubble = {
  tag: string;
  text: string;
  rot: number;
  delay: number;
};

type FieldKey = "person" | "location" | "time" | "description";

type Field = {
  key: FieldKey;
  bubble: number; // which bubble feeds this field
  arriveAt: number; // frame the field value lands
};

function bubbleTop(i: number): number {
  return BUBBLE_TOP + i * (BUBBLE_H + BUBBLE_GAP);
}

function rowTop(i: number): number {
  return ROW_TOP + i * ROW_GAP;
}

// Center point of a bubble (right edge anchor for the arrow start).
function bubbleAnchor(i: number): { x: number; y: number } {
  return { x: BUBBLE_X + BUBBLE_W - 12, y: bubbleTop(i) + BUBBLE_H / 2 };
}

// Anchor on the left edge of a row's value line (arrow end).
function rowAnchor(i: number): { x: number; y: number } {
  return { x: CARD_X + 18, y: rowTop(i) + 30 };
}

function MessyBubble({ bubble, index, frame }: { bubble: Bubble; index: number; frame: number }) {
  const t = interpolate(frame - bubble.delay, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const drop = lerp(t, -26, 0);
  const appear = interpolate(frame - bubble.delay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Bubbles dim once the card appears, and fade low while fields fill / glow.
  const dim = interpolate(frame, [60, 92, 150, 184], [1, 0.78, 0.78, 0.32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = appear * dim;

  return (
    <div
      style={{
        position: "absolute",
        left: BUBBLE_X,
        top: bubbleTop(index),
        width: BUBBLE_W,
        height: BUBBLE_H,
        transform: `translateY(${drop}px) rotate(${bubble.rot}deg)`,
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 8px 22px rgba(0,0,0,0.30)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          padding: "0 16px",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: C.textSoft, textTransform: "uppercase" }}>
          {bubble.tag}
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text, lineHeight: 1.25 }}>{bubble.text}</div>
      </div>
    </div>
  );
}

function highlightOpacity(frame: number, start: number): number {
  // A brief teal pulse over the source bubble's key words.
  return interpolate(frame, [start, start + 6, start + 18, start + 24], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function ParseArrow({ field, frame }: { field: Field; frame: number }) {
  const from = bubbleAnchor(field.bubble);
  const to = rowAnchor(field.key === "person" ? 0 : field.key === "location" ? 1 : field.key === "time" ? 2 : 3);
  const travelStart = field.arriveAt - 18;
  const draw = interpolate(frame, [travelStart, field.arriveAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const o = interpolate(frame, [travelStart, travelStart + 6, field.arriveAt + 6, field.arriveAt + 16], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (o <= 0) return null;

  const hx = lerp(draw, from.x, to.x);
  const hy = lerp(draw, from.y, to.y);
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

  return (
    <svg width={VIDEO_W} height={VIDEO_H} style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      <line x1={from.x} y1={from.y} x2={hx} y2={hy} stroke={C.teal} strokeWidth={2} strokeLinecap="round" />
      <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
        <path d="M0,0 L-9,-4 L-9,4 Z" fill={C.teal} />
      </g>
    </svg>
  );
}

function CardRow({ field, label, value, frame }: { field: FieldKey; label: string; value: string; frame: number }) {
  const i = field === "person" ? 0 : field === "location" ? 1 : field === "time" ? 2 : 3;
  const meta = FIELDS.find((f) => f.key === field);
  const arriveAt = meta ? meta.arriveAt : 0;
  const fill = interpolate(frame, [arriveAt, arriveAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const rise = lerp(fill, 4, 0);

  return (
    <div style={{ position: "absolute", left: CARD_X + 18, top: rowTop(i), width: CARD_W - 36 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: C.textSoft, textTransform: "uppercase", marginBottom: 9 }}>
        {label}
      </div>
      {/* empty value line (fades out as the clean value fills in) */}
      <div
        style={{
          height: 2,
          width: "100%",
          borderRadius: 2,
          background: C.line,
          opacity: 1 - fill,
        }}
      />
      {/* clean structured value */}
      <div
        style={{
          position: "absolute",
          top: 27,
          left: 0,
          fontSize: 17,
          fontWeight: 600,
          color: C.text,
          opacity: fill,
          transform: `translateY(${rise}px)`,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Bubbles are defined per-language inside the component (texts use pick); the
// static geometry (rotation, drop delay, tag) lives here.
const BUBBLE_META: { rot: number; delay: number }[] = [
  { rot: -6, delay: 0 },
  { rot: 4, delay: 12 },
  { rot: -3, delay: 24 },
  { rot: 6, delay: 36 },
];

// Field parse order + arrival frames (staggered across the 95-150 window).
const FIELDS: Field[] = [
  { key: "person", bubble: 1, arriveAt: 108 },
  { key: "location", bubble: 0, arriveAt: 121 },
  { key: "time", bubble: 3, arriveAt: 134 },
  { key: "description", bubble: 3, arriveAt: 147 },
];

export const SignalsToStructure: React.FC<{ lang: Lang }> = ({ lang }) => {
  const frame = useCurrentFrame();

  const bubbles: Bubble[] = [
    {
      tag: pick("Telegram", "Telegram", lang),
      text: pick("we found an elderly woman near Maiquetia", "encontramos a una señora mayor cerca de Maiquetía", lang),
      rot: BUBBLE_META[0].rot,
      delay: BUBBLE_META[0].delay,
    },
    {
      tag: pick("Facebook", "Facebook", lang),
      text: pick("she doesn't remember her name", "no recuerda su nombre", lang),
      rot: BUBBLE_META[1].rot,
      delay: BUBBLE_META[1].delay,
    },
    {
      tag: pick("X", "X", lang),
      text: pick("looks about 70, near the plaza", "como de 70 años, cerca de la plaza", lang),
      rot: BUBBLE_META[2].rot,
      delay: BUBBLE_META[2].delay,
    },
    {
      tag: pick("News", "Noticias", lang),
      text: pick("today, needs medical care", "hoy, necesita atención médica", lang),
      rot: BUBBLE_META[3].rot,
      delay: BUBBLE_META[3].delay,
    },
  ];

  const fieldValues: Record<FieldKey, string> = {
    person: pick("elderly woman", "señora mayor", lang),
    location: "Maiquetia",
    time: pick("today", "hoy", lang),
    description: pick("found, needs care", "encontrada, necesita atención", lang),
  };

  // Card fade-in (beat 2) and border glow pulse (beat 4).
  const cardOpacity = interpolate(frame, [50, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const cardRise = interpolate(frame, [50, 95], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const glow = interpolate(frame, [150, 164, 180, 190], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Beat 5 captions.
  const capOpacity = interpolate(frame, [190, 204], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capRise = interpolate(frame, [190, 206], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const noteOpacity = interpolate(frame, [196, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${C.bg2} 0%, ${C.bg} 70%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* LEFT: messy social-post bubbles */}
      {bubbles.map((b, i) => (
        <MessyBubble key={i} bubble={b} index={i} frame={frame} />
      ))}

      {/* teal highlight pulses over the source bubbles as the AI parses */}
      {FIELDS.map((f, i) => {
        const o = highlightOpacity(frame, f.arriveAt - 22);
        if (o <= 0) return null;
        return (
          <div
            key={`hl-${i}`}
            style={{
              position: "absolute",
              left: BUBBLE_X + 6,
              top: bubbleTop(f.bubble) + 6,
              width: BUBBLE_W - 12,
              height: BUBBLE_H - 12,
              borderRadius: 14,
              background: C.tealSoft,
              border: `1px solid ${C.teal}`,
              opacity: o,
              transform: `rotate(${BUBBLE_META[f.bubble].rot}deg)`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* RIGHT: structured card */}
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 20,
          background: C.panel,
          border: `1px solid ${C.line}`,
          opacity: cardOpacity,
          transform: `translateY(${cardRise}px)`,
          boxShadow: `0 14px 36px rgba(0,0,0,0.32), 0 0 0 ${6 * glow}px ${C.tealSoft}, 0 0 ${22 * glow}px ${glow > 0 ? C.teal : "transparent"}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: C.textSoft,
            textTransform: "uppercase",
          }}
        >
          {pick("Structured record", "Registro estructurado", lang)}
        </div>
      </div>

      {/* rows render only after the card has begun to appear */}
      {frame >= 50 ? (
        <div style={{ opacity: cardOpacity, transform: `translateY(${cardRise}px)` }}>
          <CardRow field="person" label={pick("Person", "Persona", lang)} value={fieldValues.person} frame={frame} />
          <CardRow field="location" label={pick("Location", "Lugar", lang)} value={fieldValues.location} frame={frame} />
          <CardRow field="time" label={pick("Time", "Hora", lang)} value={fieldValues.time} frame={frame} />
          <CardRow field="description" label={pick("Description", "Descripción", lang)} value={fieldValues.description} frame={frame} />
        </div>
      ) : null}

      {/* parse arrows: one at a time from bubble to matching field */}
      {FIELDS.map((f, i) => (
        <ParseArrow key={`arrow-${i}`} field={f} frame={frame} />
      ))}

      {/* beat 5: caption + persistent guardrail note */}
      <div
        style={{
          position: "absolute",
          bottom: 58,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: capOpacity,
          transform: `translateY(${capRise}px)`,
          color: C.white,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        {pick("Messy words turn into clear facts.", "Las palabras sueltas se vuelven datos claros.", lang)}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: noteOpacity,
          color: C.textSoft,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {pick("The AI suggests; people decide.", "La IA sugiere; las personas deciden.", lang)}
      </div>
    </AbsoluteFill>
  );
};
