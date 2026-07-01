"use client";

// Inline glossary tooltip. Wrap an uncommon or technical word so a non-technical
// user can see a short, plain-Spanish explanation on hover, focus, or tap:
//
//   Una <Term k="coincidencia">coincidencia</Term> siempre se verifica.
//
// `k` looks the explanation up in the shared glossary; `def` can pass one
// inline. If neither resolves, the children render as plain text (so a wrong or
// missing key never breaks the copy). Works on touch (tap toggles) and keyboard
// (focus opens), not just mouse hover — the audience is mobile-first.

import { useId, useState } from "react";
import { GLOSSARY } from "@/app/lib/i18n/glossary";

export function Term({
  k,
  def,
  children,
}: {
  k?: string;
  def?: string;
  children: React.ReactNode;
}) {
  const text = def ?? (k ? GLOSSARY[k] : undefined);
  const tipId = useId();
  const [open, setOpen] = useState(false);

  if (!text) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={open ? tipId : undefined}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-[color:var(--hos-muted)] font-[inherit] text-[color:inherit]"
      >
        {children}
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-[6px] w-[220px] max-w-[70vw] -translate-x-1/2 rounded-[8px] bg-[var(--hos-dark)] px-[10px] py-[8px] text-[11px] font-semibold leading-[15px] text-white shadow-lg"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
