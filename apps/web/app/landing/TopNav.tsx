"use client";

import { useEffect, useState } from "react";
import { content } from "./content";
import { LocaleToggle, useLocale } from "./LocaleProvider";

// Apple-style adaptive top bar: transparent over the dark hero, then frosts to
// light as you scroll. Anchor links jump to each explainer section.
export function TopNav() {
  const { tr } = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--m-line)] bg-white/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between gap-[14px] px-[20px] sm:px-[28px]">
        <a href="#top" className="flex items-baseline gap-[8px]">
          <span className={`text-[19px] font-extrabold tracking-tight ${scrolled ? "text-[var(--m-ink)]" : "text-white"}`}>HOS</span>
          <span className={`hidden text-[12px] font-bold sm:inline ${scrolled ? "text-[var(--m-ink-soft)]" : "text-white/70"}`}>
            {tr({ en: "Response Kit", es: "Kit de Respuesta" })}
          </span>
        </a>

        <nav className="hidden items-center gap-[2px] lg:flex">
          {content.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={[
                "rounded-full px-[12px] py-[7px] text-[13px] font-semibold transition-colors",
                scrolled
                  ? "text-[var(--m-ink-soft)] hover:bg-[var(--m-paper-3)] hover:text-[var(--m-ink)]"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {tr(item.label)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-[10px]">
          <LocaleToggle variant={scrolled ? "light" : "dark"} />
        </div>
      </div>
    </header>
  );
}
