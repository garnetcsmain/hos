import type { ReactNode } from "react";

/** Compact "updated N ago" label so a coordinator can trust how live the board
 *  is — stale needs/capacity in an active incident are a real operational risk. */
export function formatAgo(from: number, now: number): string {
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 5) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return `hace ${h} h`;
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-[28px] rounded-full border px-[10px] text-[12px] font-extrabold transition ${
        active
          ? "border-[var(--hos-dark)] bg-[var(--hos-dark)] text-white"
          : "border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:text-[var(--hos-text)]"
      }`}
    >
      {label}
    </button>
  );
}

export function Metric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white px-[16px] py-[12px]">
      <div className={`font-data text-[24px] font-bold leading-none ${color}`}>{value}</div>
      <div className="mt-[6px] text-[12px] font-bold text-[var(--hos-muted)]">{label}</div>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
      <div className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--hos-muted)]">{title}</div>
      <div className="mt-[10px]">{children}</div>
    </div>
  );
}
