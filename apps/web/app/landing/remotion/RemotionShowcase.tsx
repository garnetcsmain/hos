"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { Play, Sparkles } from "lucide-react";
import type { Lang } from "../LocaleProvider";
import { useLocale } from "../LocaleProvider";
import { FPS, VIDEO_H, VIDEO_W } from "./theme";
import { ChaosToClarity } from "./ChaosToClarity";
import { MatchPulse } from "./MatchPulse";
import { SignalsToStructure } from "./SignalsToStructure";
import { TimelineReconstruct } from "./TimelineReconstruct";
import { AidJourney } from "./AidJourney";

export type CompId =
  | "chaos-to-clarity"
  | "match-pulse"
  | "signals-to-structure"
  | "timeline-reconstruct"
  | "aid-journey";

type Entry = {
  component: React.FC<{ lang: Lang }>;
  durationInFrames: number;
};

const REGISTRY: Record<CompId, Entry> = {
  "chaos-to-clarity": { component: ChaosToClarity, durationInFrames: 240 },
  "match-pulse": { component: MatchPulse, durationInFrames: 210 },
  "signals-to-structure": { component: SignalsToStructure, durationInFrames: 210 },
  "timeline-reconstruct": { component: TimelineReconstruct, durationInFrames: 230 },
  "aid-journey": { component: AidJourney, durationInFrames: 240 },
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A Remotion <Player> that mounts only when it scrolls near the viewport,
 * auto-plays while visible, and pauses when it leaves — so several animations
 * can live on one page without all rendering at once. Honors reduced-motion by
 * showing a single still frame with a manual play control.
 */
export function LazyPlayer({
  id,
  className = "",
  badge,
}: {
  id: CompId;
  className?: string;
  badge?: string;
}) {
  const { lang } = useLocale();
  const entry = REGISTRY[id];
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // matchMedia is browser-only; read the reduced-motion preference once on
    // mount (it can't be read during SSR or in a state initializer).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser media query
    setReduced(prefersReducedMotion());
  }, []);

  // Mount the player when it gets close to the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mounted) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setMounted(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  // Play while visible, pause while off-screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !mounted || reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const p = playerRef.current;
          if (!p) continue;
          if (e.isIntersecting) p.play();
          else p.pause();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, reduced]);

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden rounded-[16px] bg-[var(--m-bg)] shadow-[var(--m-shadow-lg)] ring-1 ring-black/10 ${className}`}
      style={{ aspectRatio: `${VIDEO_W} / ${VIDEO_H}` }}
    >
      {badge ? (
        <div className="pointer-events-none absolute right-[12px] top-[12px] z-10 inline-flex items-center gap-[6px] rounded-full bg-black/35 px-[10px] py-[5px] text-[11px] font-bold uppercase tracking-wide text-white/90 backdrop-blur">
          <Sparkles className="h-[13px] w-[13px]" />
          {badge}
        </div>
      ) : null}

      {mounted ? (
        <Player
          ref={playerRef}
          component={entry.component}
          durationInFrames={entry.durationInFrames}
          fps={FPS}
          compositionWidth={VIDEO_W}
          compositionHeight={VIDEO_H}
          inputProps={{ lang }}
          autoPlay={!reduced}
          loop
          acknowledgeRemotionLicense
          controls={reduced}
          initialFrame={reduced ? Math.round(entry.durationInFrames * 0.92) : 0}
          style={{ width: "100%", height: "100%" }}
          className="block"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <div className="m-grid-dots absolute inset-0 opacity-40" />
          <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15">
            <Play className="h-5 w-5" />
          </div>
        </div>
      )}
    </div>
  );
}
