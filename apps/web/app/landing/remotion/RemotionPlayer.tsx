"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import type { Lang } from "../LocaleProvider";
import { FPS, VIDEO_H, VIDEO_W } from "./theme";
import type { CompId } from "./RemotionShowcase";

// The heavy half of the player, loaded on demand. This module pulls in
// @remotion/player, and each composition is split into its OWN chunk via
// Remotion's `lazyComponent` — so the landing page's initial bundle ships none
// of it. The first player to mount downloads @remotion/player once (shared);
// every animation after that only fetches its small composition chunk.

type Entry = {
  load: () => Promise<{ default: React.FC<{ lang: Lang }> }>;
  durationInFrames: number;
};

const LAZY: Record<CompId, Entry> = {
  "chaos-to-clarity": {
    load: () => import("./ChaosToClarity").then((m) => ({ default: m.ChaosToClarity })),
    durationInFrames: 240,
  },
  "match-pulse": {
    load: () => import("./MatchPulse").then((m) => ({ default: m.MatchPulse })),
    durationInFrames: 210,
  },
  "signals-to-structure": {
    load: () => import("./SignalsToStructure").then((m) => ({ default: m.SignalsToStructure })),
    durationInFrames: 210,
  },
  "timeline-reconstruct": {
    load: () => import("./TimelineReconstruct").then((m) => ({ default: m.TimelineReconstruct })),
    durationInFrames: 230,
  },
  "aid-journey": {
    load: () => import("./AidJourney").then((m) => ({ default: m.AidJourney })),
    durationInFrames: 240,
  },
};

export default function RemotionPlayer({
  id,
  lang,
  reduced,
}: {
  id: CompId;
  lang: Lang;
  reduced: boolean;
}) {
  const entry = LAZY[id];
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<PlayerRef | null>(null);

  // Play while on screen, pause while off — so multiple animations never burn
  // CPU at once.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;
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
  }, [reduced]);

  return (
    <div ref={rootRef} className="absolute inset-0">
      <Player
        ref={playerRef}
        lazyComponent={entry.load}
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
    </div>
  );
}
