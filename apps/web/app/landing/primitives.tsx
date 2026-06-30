"use client";

import { useEffect, useRef, useState } from "react";

// Shared building blocks for the explainer landing page. Everything here is
// presentational and theme-aware (light "paper" sections vs. cinematic "dark"
// sections) so the page reads as one cohesive, Apple-grade document.

/** Reveal children with a soft upward fade the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

type SectionTheme = "paper" | "soft" | "dark" | "darker";

const SECTION_BG: Record<SectionTheme, string> = {
  paper: "bg-[var(--m-paper)] text-[var(--m-ink)]",
  soft: "bg-[var(--m-paper-2)] text-[var(--m-ink)]",
  dark: "bg-[var(--m-bg-2)] text-[var(--m-on-dark)]",
  darker: "bg-[var(--m-bg)] text-[var(--m-on-dark)]",
};

export function Section({
  id,
  theme = "paper",
  className = "",
  children,
}: {
  id?: string;
  theme?: SectionTheme;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-theme={theme}
      className={`relative scroll-mt-[76px] px-[24px] py-[88px] sm:px-[40px] sm:py-[112px] ${SECTION_BG[theme]} ${className}`}
    >
      <div className="mx-auto w-full max-w-[1120px]">{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "red" | "violet" | "amber" | "neutral";
}) {
  const colors: Record<string, string> = {
    green: "text-[var(--m-green-deep)] bg-[rgba(52,192,130,0.12)]",
    blue: "text-[#2f6fa0] bg-[rgba(90,166,224,0.14)]",
    red: "text-[#bb4a3a] bg-[rgba(236,111,94,0.14)]",
    violet: "text-[#7c5cd6] bg-[rgba(167,139,250,0.16)]",
    amber: "text-[#9a6a16] bg-[rgba(240,180,81,0.18)]",
    neutral: "text-[var(--m-ink-soft)] bg-[var(--m-paper-3)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-full px-[12px] py-[6px] text-[12px] font-bold uppercase tracking-[0.08em] ${colors[tone]}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  dark = false,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-[760px] text-center" : "max-w-[760px]"}>
      {eyebrow ? <Reveal>{eyebrow}</Reveal> : null}
      <Reveal delay={60}>
        <h2
          className={`mt-[18px] text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.06] tracking-[-0.02em] ${
            dark ? "text-white" : "text-[var(--m-ink)]"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {intro ? (
        <Reveal delay={120}>
          <p
            className={`mt-[20px] text-[clamp(16px,1.9vw,19px)] leading-[1.6] ${
              dark ? "text-[var(--m-on-dark-soft)]" : "text-[var(--m-ink-soft)]"
            } ${center ? "mx-auto" : ""}`}
          >
            {intro}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** A clean macOS-style browser window frame used to present web mockups. */
export function BrowserFrame({
  url = "hos.app",
  children,
  className = "",
  glow = false,
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] bg-white ring-1 ring-[var(--m-line)] ${
        glow ? "shadow-[var(--m-shadow-glow)]" : "shadow-[var(--m-shadow-lg)]"
      } ${className}`}
    >
      <div className="flex items-center gap-[8px] border-b border-[var(--m-paper-3)] bg-[var(--m-paper-2)] px-[14px] py-[11px]">
        <span className="h-[11px] w-[11px] rounded-full bg-[#ec6a5e]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#f4bf4f]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#61c554]" />
        <div className="ml-[10px] flex h-[24px] flex-1 items-center justify-center rounded-[7px] bg-white px-[12px] text-[11px] font-semibold text-[var(--m-ink-soft)] ring-1 ring-[var(--m-line)]">
          {url}
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

/** An iPhone-style frame for the family-facing mobile mockups. */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-[260px] shrink-0 rounded-[42px] bg-[#0c1712] p-[10px] shadow-[var(--m-shadow-lg)] ring-1 ring-black/20 ${className}`}
    >
      <div className="absolute left-1/2 top-[18px] z-10 h-[24px] w-[88px] -translate-x-1/2 rounded-full bg-[#0c1712]" />
      <div className="relative overflow-hidden rounded-[33px] bg-white">
        {children}
      </div>
    </div>
  );
}
