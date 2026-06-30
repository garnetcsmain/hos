// Shared palette + helpers for the Remotion explainer compositions. Colors are
// the marketing brand tokens expressed as hex (Remotion renders to canvas/DOM,
// so it needs literal values, not CSS vars). Keep these in sync with the
// "--m-*" tokens in globals.css.

import type { Lang } from "../LocaleProvider";

export const FPS = 30;
export const VIDEO_W = 960;
export const VIDEO_H = 540;

export const C = {
  bg: "#0b1512",
  bg2: "#0e1c16",
  panel: "#13241d",
  panel2: "#18302593",
  line: "rgba(150, 190, 170, 0.18)",
  lineSoft: "rgba(150, 190, 170, 0.1)",
  text: "#eaf3ee",
  textSoft: "#9fb7ac",
  textFaint: "#6f8a7e",
  red: "#ef7a68",
  redSoft: "rgba(239, 122, 104, 0.16)",
  green: "#3ccf8e",
  greenSoft: "rgba(60, 207, 142, 0.16)",
  teal: "#2dd4bf",
  tealSoft: "rgba(45, 212, 191, 0.16)",
  blue: "#6cb0ec",
  amber: "#f0b451",
  violet: "#a78bfa",
  white: "#ffffff",
} as const;

/** Deterministic pseudo-random in [0,1) from a seed — stable across frames so
 *  Remotion renders are reproducible (never use Math.random inside a frame). */
export function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** rand mapped to [min,max]. */
export function randRange(seed: number, min: number, max: number): number {
  return min + rand(seed) * (max - min);
}

export function pick<T>(en: T, es: T, lang: Lang): T {
  return lang === "es" ? es : en;
}
