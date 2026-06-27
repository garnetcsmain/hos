"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  actions,
  Check,
  mapSignals,
  metrics,
  navItems,
  priorities,
  sources,
  trustMetadata,
} from "@/app/lib/bff/dashboard";
import { PwaRegistration } from "@/app/components/PwaRegistration";
import {
  ChevronRight,
  Layers,
  Search,
  UserRoundSearch,
  X,
} from "lucide-react";

type ModalKind = "missing" | "found" | "match" | "family" | null;

const actionKinds: Record<string, Exclude<ModalKind, null>> = {
  "Report missing person": "missing",
  "Report found person": "found",
  "Check a possible match": "match",
};

const mapAreas = [
  { name: "La Guaira", className: "left-[10%] top-[16%] h-[26%] w-[30%] bg-[#DDEFE8]" },
  { name: "Maiquetia", className: "left-[45%] top-[20%] h-[28%] w-[32%] bg-[#F5E8C9]" },
  { name: "Caracas West", className: "left-[18%] top-[58%] h-[28%] w-[33%] bg-[#E7EEF8]" },
  { name: "Caracas East", className: "left-[56%] top-[60%] h-[27%] w-[32%] bg-[#DDEFE8]" },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-[244px] shrink-0 flex-col bg-[var(--hos-dark)] px-[18px] py-[26px] text-[#B9CAC1] max-[900px]:min-h-0 max-[900px]:w-full max-[900px]:gap-[18px] max-[900px]:py-[18px]">
      <div className="px-[10px] max-[900px]:px-0">
        <div className="text-[25px] font-extrabold leading-none text-white">HOS</div>
        <div className="mt-[10px] text-[14px] font-bold leading-none">Response Kit</div>
      </div>

      <nav className="mt-[50px] flex flex-col gap-[12px] max-[900px]:mt-0 max-[900px]:flex-row max-[900px]:overflow-x-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              aria-pressed={active}
              href={href as Route}
              className={[
                "flex h-[46px] w-[208px] shrink-0 items-center gap-[12px] rounded-[6px] px-[14px] text-left text-[14px] font-semibold transition",
                "hover:bg-[#20352C] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#A7F3D0]",
                active ? "bg-[#20352C] font-bold text-white" : "text-[#B9CAC1]",
              ].join(" ")}
            >
              <Icon className={active ? "h-5 w-5 text-white" : "h-5 w-5 text-[#89A096]"} strokeWidth={2.4} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-[10px] pb-[54px] max-[900px]:hidden">
        <div className="text-[12px] font-bold text-[#B9CAC1]">Offline-ready sync</div>
        <Link
          href="/sources"
          className="mt-[18px] flex h-[29px] w-fit items-center rounded-full bg-[#244235] px-[12px] text-[12px] font-extrabold text-[#D9E7E0] transition hover:bg-[#2E5644]"
        >
          24 queued reports
        </Link>
      </div>
    </aside>
  );
}

export function Header({
  title = "Family Reunification Map",
  subtitle = "Venezuela earthquake response · active incident · 72 hour reunification mission",
  trustLayer,
  onToggleTrustLayer,
  onOpenFamily,
}: {
  title?: string;
  subtitle?: string;
  trustLayer: boolean;
  onToggleTrustLayer: () => void;
  onOpenFamily: () => void;
}) {
  return (
    <header className="flex min-h-[96px] shrink-0 items-center justify-between border-b border-[var(--hos-border)] bg-white px-[28px] max-[900px]:h-auto max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-[18px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
      <div>
        <h1 className="text-[28px] font-extrabold leading-none tracking-normal text-[var(--hos-text)] max-[900px]:text-[24px] max-[900px]:leading-[28px]">
          {title}
        </h1>
        <p className="mt-[12px] text-[14px] font-bold leading-none text-[var(--hos-muted)] max-[900px]:leading-[18px]">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-[14px] max-[900px]:w-full max-[900px]:flex-wrap">
        <button
          type="button"
          className="flex h-[29px] items-center rounded-full bg-[#FFEBD5] px-[12px] text-[12px] font-extrabold text-[#7A3D00] transition hover:bg-[#FFE1BF]"
        >
          LIVE INCIDENT
        </button>
        <button
          type="button"
          onClick={onToggleTrustLayer}
          aria-pressed={trustLayer}
          className={[
            "flex h-[29px] items-center rounded-full px-[12px] text-[12px] font-extrabold transition",
            trustLayer ? "bg-[#DDEFE8] text-[#16613F]" : "bg-[#EEF2EF] text-[var(--hos-muted)]",
          ].join(" ")}
        >
          Trust layer {trustLayer ? "on" : "off"}
        </button>
        <button
          type="button"
          onClick={onOpenFamily}
          className="flex h-[52px] items-center gap-[11px] rounded-[6px] bg-[var(--hos-red)] px-[15px] text-[13px] font-extrabold text-white shadow-sm transition hover:bg-[#B63F33] focus:outline-none focus:ring-2 focus:ring-[#F9B4A9]"
        >
          <UserRoundSearch className="h-5 w-5" strokeWidth={2.5} />
          I can&apos;t reach family
        </button>
      </div>
    </header>
  );
}

function GoogleMapPanel({
  trustLayer,
  activePriority,
  onSelectPriority,
}: {
  trustLayer: boolean;
  activePriority: string;
  onSelectPriority: (name: string) => void;
}) {
  const mapUrl =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ??
    "https://maps.google.com/maps?ll=10.545,-66.990&z=10&t=m&output=embed";

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-[8px] border border-[var(--hos-border)] bg-[#EAF0ED] max-[900px]:min-h-[420px]">
      <iframe
        title="Google Maps - HOS family reunification operations"
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0 grayscale-[20%] saturate-[85%]"
      />
      <div className="absolute inset-0 bg-[#EAF0ED]/35" />

      <div className="absolute left-[16px] top-[16px] flex items-center gap-[10px] rounded-full border border-[var(--hos-border)] bg-white/95 px-[12px] py-[9px] shadow-sm">
        <Search className="h-4 w-4 text-[var(--hos-muted)]" />
        <span className="text-[12px] font-extrabold text-[var(--hos-text)]">La Guaira · Caracas corridor</span>
      </div>

      {mapAreas.map((area) => (
        <button
          key={area.name}
          type="button"
          className={`absolute rounded-[18px] border border-[#B9D4C8] p-[18px] text-left shadow-sm transition hover:scale-[1.01] hover:shadow-md ${area.className}`}
        >
          <span className="text-[14px] font-extrabold text-[#31413A]">{area.name}</span>
        </button>
      ))}

      {mapSignals.map(({ x, y, color, icon: Icon }, index) => {
        const left = `${Math.min(88, Math.max(7, (x / 780) * 100))}%`;
        const top = `${Math.min(86, Math.max(8, (y / 600) * 100))}%`;
        return (
          <button
            key={`${x}-${y}`}
            type="button"
            onClick={() => onSelectPriority(priorities[index % priorities.length].name)}
            className={`absolute flex h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-white ${color} text-white shadow-sm transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white`}
            style={{ left, top }}
            aria-label={`Open signal ${index + 1}`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onSelectPriority("Carlos Perez")}
        className="absolute left-[52%] top-[36%] w-[min(320px,42vw)] rounded-[8px] border border-[var(--hos-border)] bg-white px-[12px] py-[10px] text-left shadow-md transition hover:-translate-y-0.5 max-[900px]:left-[28%] max-[900px]:top-[42%] max-[900px]:w-[250px]"
      >
        <div className="text-[15px] font-extrabold leading-none text-[var(--hos-text)]">Possible match near Maiquetia</div>
        <div className="mt-[8px] text-[12px] font-bold leading-[15px] text-[var(--hos-muted)]">
          Carlos Perez · 94% confidence · needs verification
        </div>
      </button>

      <div className="absolute bottom-[18px] left-[18px] flex max-w-[calc(100%-36px)] flex-wrap items-center gap-[14px] rounded-full border border-[var(--hos-border)] bg-white/95 px-[14px] py-[12px] shadow-sm">
        {[
          ["Missing", "bg-[var(--hos-red)]"],
          ["Found", "bg-[var(--hos-green)]"],
          ["Shelter", "bg-[var(--hos-yellow)]"],
          ["Hospital", "bg-[var(--hos-blue)]"],
          ["Need", "bg-[#8B5CF6]"],
        ].map(([label, color]) => (
          <button
            type="button"
            key={label}
            className="flex items-center gap-[6px] text-[12px] font-bold text-[var(--hos-muted)] transition hover:text-[var(--hos-text)]"
          >
            <span className={`h-[10px] w-[10px] rounded-full ${color}`} />
            {label}
          </button>
        ))}
      </div>

      {trustLayer ? (
        <div className="absolute right-[16px] top-[16px] flex items-center gap-[8px] rounded-full bg-[#DDEFE8] px-[12px] py-[8px] text-[12px] font-extrabold text-[#16613F] shadow-sm">
          <Layers className="h-4 w-4" />
          Trust metadata visible
        </div>
      ) : null}

      <div className="absolute right-[18px] bottom-[18px] rounded-full bg-[var(--hos-dark)] px-[12px] py-[8px] text-[12px] font-bold text-white shadow-sm">
        Selected: {activePriority}
      </div>
    </section>
  );
}

function Metrics() {
  return (
    <section className="grid grid-cols-4 gap-[16px] max-[1180px]:grid-cols-2">
      {metrics.map((metric) => (
        <button
          type="button"
          key={metric.label}
          className="h-[86px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[16px] py-[14px] text-left transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--hos-border)]"
        >
          <div className={`font-data text-[28px] font-bold leading-none ${metric.color}`}>{metric.value}</div>
          <div className="mt-[13px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">{metric.label}</div>
        </button>
      ))}
    </section>
  );
}

export function ActionPanel({ onOpen }: { onOpen: (kind: Exclude<ModalKind, null>) => void }) {
  return (
    <section className="grid grid-cols-3 gap-[16px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px] max-[1180px]:grid-cols-1">
      {actions.map(({ title, description, icon: Icon, color }) => (
        <button
          key={title}
          type="button"
          onClick={() => onOpen(actionKinds[title])}
          className="flex min-h-[82px] items-center gap-[18px] rounded-[6px] border border-[#D4DED9] bg-[#F8FAF8] px-[18px] text-left transition hover:border-[var(--hos-border)] hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--hos-border)]"
        >
          <Icon className={`h-[24px] w-[24px] shrink-0 ${color}`} strokeWidth={2.2} />
          <span className="min-w-0">
            <span className="block text-[14px] font-extrabold leading-[17px] text-[var(--hos-text)]">{title}</span>
            <span className="mt-[8px] block text-[12px] font-bold leading-[14px] text-[var(--hos-muted)]">{description}</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--hos-muted)]" />
        </button>
      ))}
    </section>
  );
}

function RightPanel({
  activePriority,
  onSelectPriority,
}: {
  activePriority: string;
  onSelectPriority: (name: string) => void;
}) {
  return (
    <aside className="min-h-[862px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px] max-[1180px]:min-h-0">
      <h2 className="text-[20px] font-extrabold leading-none text-[var(--hos-text)]">Highest priority</h2>
      <p className="mt-[20px] text-[13px] font-bold leading-[15px] text-[var(--hos-muted)]">
        AI creates candidates. Verified organizations decide.
      </p>

      <div className="mt-[18px] flex flex-col gap-[14px]">
        {priorities.map((priority) => {
          const active = activePriority === priority.name;
          return (
            <button
              key={priority.name}
              type="button"
              onClick={() => onSelectPriority(priority.name)}
              className={[
                "min-h-[97px] rounded-[6px] border bg-[#FBFCFB] p-[14px] text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                active ? "border-[var(--hos-green)] ring-2 ring-[#DDEFE8]" : "border-[#DDE5E1]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-[12px]">
                <h3 className="text-[16px] font-extrabold leading-none text-[var(--hos-text)]">{priority.name}</h3>
                <span className={`font-data text-[16px] font-bold leading-none ${priority.color}`}>{priority.confidence}</span>
              </div>
              {priority.lines.map((line) => (
                <div key={line} className="mt-[12px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">
                  {line}
                </div>
              ))}
            </button>
          );
        })}
      </div>

      <h2 className="mt-[38px] text-[18px] font-extrabold leading-none text-[var(--hos-text)]">Incoming sources</h2>
      <div className="mt-[16px]">
        {sources.map((source) => (
          <button
            type="button"
            key={source.label}
            className="flex h-[43px] w-full items-center justify-between border-b border-[#E2E8E4] text-left transition hover:bg-[#F8FAF8]"
          >
            <span className="text-[12px] font-bold text-[var(--hos-muted)]">{source.label}</span>
            <span className={`font-data text-[12px] font-bold ${source.color}`}>{source.rate}</span>
          </button>
        ))}
      </div>

      <div className="mt-[28px] rounded-[6px] bg-[var(--hos-dark)] p-[14px]">
        <h3 className="text-[14px] font-extrabold leading-[17px] text-white">Every report carries trust metadata</h3>
        <div className="mt-[14px] flex flex-col gap-[10px]">
          {trustMetadata.map((item) => (
            <div key={item} className="flex items-center gap-[8px] text-[12px] font-bold text-[#D9E7E0]">
              <Check className="h-[14px] w-[14px] text-[#A7F3D0]" strokeWidth={2.4} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function ActionModal({ kind, onClose }: { kind: ModalKind; onClose: () => void }) {
  const config = useMemo(() => {
    if (kind === "found") {
      return {
        title: "Report found person",
        description: "Shelters, hospitals, and volunteers can register a found-person report.",
        primary: "Create found report",
        fields: ["Name or description", "Current location", "Reporter organization"],
      };
    }
    if (kind === "match") {
      return {
        title: "Check a possible match",
        description: "Search by case number, phone, name, or location.",
        primary: "Search matches",
        fields: ["Case number or phone", "Person name", "Last known city"],
      };
    }
    return {
      title: "Report missing person",
      description: "No account required. Capture only the minimum data needed to start matching.",
      primary: "Create missing request",
      fields: ["Missing person name", "Last known city", "Family contact"],
    };
  }, [kind]);

  if (!kind) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1713]/45 p-[18px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-[520px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[20px] shadow-xl">
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <h2 className="text-[22px] font-extrabold leading-none text-[var(--hos-text)]">{config.title}</h2>
            <p className="mt-[12px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">{config.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-[6px] p-[6px] text-[var(--hos-muted)] transition hover:bg-[#F1F5F2] hover:text-[var(--hos-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-[18px] flex flex-col gap-[12px]" onSubmit={(event) => event.preventDefault()}>
          {config.fields.map((field) => (
            <label key={field} className="text-[12px] font-extrabold text-[var(--hos-muted)]">
              {field}
              <input
                className="mt-[6px] h-[42px] w-full rounded-[6px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] text-[14px] font-bold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]"
                placeholder={field}
              />
            </label>
          ))}
          <div className="mt-[8px] flex justify-end gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              className="h-[42px] rounded-[6px] border border-[var(--hos-border)] px-[14px] text-[13px] font-extrabold text-[var(--hos-muted)] transition hover:bg-[#F8FAF8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={onClose}
              className="h-[42px] rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[13px] font-extrabold text-white transition hover:bg-[#20352C]"
            >
              {config.primary}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HosDashboard() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [activePriority, setActivePriority] = useState(priorities[0].name);
  const [modalKind, setModalKind] = useState<ModalKind>(null);

  return (
    <AppShell
      title="Family Reunification Map"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((value) => !value)}
      onOpenFamily={() => setModalKind("family")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_328px] gap-[28px] px-[28px] py-[28px] max-[1180px]:grid-cols-1 max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <div className="flex min-w-0 flex-col gap-[28px]">
                <GoogleMapPanel
                  trustLayer={trustLayer}
                  activePriority={activePriority}
                  onSelectPriority={setActivePriority}
                />
                <Metrics />
                <ActionPanel onOpen={setModalKind} />
        </div>
        <RightPanel activePriority={activePriority} onSelectPriority={setActivePriority} />
      </div>
    </AppShell>
  );
}

export function AppShell({
  title,
  subtitle,
  trustLayer,
  onToggleTrustLayer,
  onOpenFamily,
  modalKind,
  onCloseModal,
  children,
}: {
  title: string;
  subtitle?: string;
  trustLayer: boolean;
  onToggleTrustLayer: () => void;
  onOpenFamily: () => void;
  modalKind: ModalKind;
  onCloseModal: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--hos-bg)]">
      <PwaRegistration />
      <div className="min-h-screen w-full border border-[#B9C7C0] bg-[var(--hos-bg)] max-[900px]:border-0">
        <div className="flex min-h-screen max-[900px]:flex-col">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header
              title={title}
              subtitle={subtitle}
              trustLayer={trustLayer}
              onToggleTrustLayer={onToggleTrustLayer}
              onOpenFamily={onOpenFamily}
            />
            {children}
          </div>
        </div>
      </div>
      <ActionModal kind={modalKind} onClose={onCloseModal} />
    </main>
  );
}
