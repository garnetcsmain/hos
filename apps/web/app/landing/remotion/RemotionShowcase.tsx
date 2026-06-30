"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Play, Sparkles } from "lucide-react";
import { useLocale } from "../LocaleProvider";
import { VIDEO_H, VIDEO_W } from "./theme";

export type CompId =
  | "chaos-to-clarity"
  | "match-pulse"
  | "signals-to-structure"
  | "timeline-reconstruct"
  | "aid-journey";

// A still placeholder shown before the player mounts and while its chunk loads.
function Placeholder() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="m-grid-dots absolute inset-0 opacity-40" />
      <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15">
        <Play className="h-5 w-5" />
      </div>
    </div>
  );
}

// The player runtime (@remotion/player + the compositions) is loaded only when a
// slot needs it, so it stays out of the landing page's initial JS.
const RemotionPlayer = dynamic(() => import("./RemotionPlayer"), {
  ssr: false,
  loading: () => <Placeholder />,
});

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A scroll-aware slot for a Remotion animation. It mounts (and downloads) the
 * player only when it scrolls near the viewport; the player itself plays while
 * visible and pauses when it leaves. Honors reduced-motion with a still frame.
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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // matchMedia is browser-only; read the reduced-motion preference once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser media query
    setReduced(prefersReducedMotion());
  }, []);

  // Mount the player when it gets close to the viewport (head start to download).
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
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

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

      {mounted ? <RemotionPlayer id={id} lang={lang} reduced={reduced} /> : <Placeholder />}
    </div>
  );
}
