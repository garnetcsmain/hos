"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronRight,
  Layers,
  Search,
  UserRoundSearch,
} from "lucide-react";
import { actions, mapSignals, navItems, trustMetadata } from "@/app/lib/bff/dashboard";
import { PwaRegistration } from "@/app/components/PwaRegistration";
import { ActionModal, type ModalKind } from "@/app/components/IntakeForms";
import { getDashboard, type DashboardData } from "@/app/lib/client/api";
import type { HosEvent } from "@/app/lib/domain/types";

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
        <p className="mt-[12px] text-[14px] font-bold leading-none text-[var(--hos-muted)] max-[900px]:leading-[18px]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-[14px] max-[900px]:w-full max-[900px]:flex-wrap">
        <button type="button" className="flex h-[29px] items-center rounded-full bg-[#FFEBD5] px-[12px] text-[12px] font-extrabold text-[#7A3D00]">
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

function MapPanel({ trustLayer }: { trustLayer: boolean }) {
  const mapUrl =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ??
    "https://maps.google.com/maps?ll=10.545,-66.990&z=10&t=m&output=embed";
  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-[var(--hos-border)] bg-[#EAF0ED]">
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
        <div key={area.name} className={`absolute rounded-[18px] border border-[#B9D4C8] p-[18px] text-left shadow-sm ${area.className}`}>
          <span className="text-[14px] font-extrabold text-[#31413A]">{area.name}</span>
        </div>
      ))}
      {mapSignals.map(({ x, y, color, icon: Icon }, index) => {
        const left = `${Math.min(88, Math.max(7, (x / 780) * 100))}%`;
        const top = `${Math.min(86, Math.max(8, (y / 600) * 100))}%`;
        return (
          <span
            key={`${x}-${y}`}
            className={`absolute flex h-[34px] w-[34px] items-center justify-center rounded-full border-[3px] border-white ${color} text-white shadow-sm`}
            style={{ left, top }}
            aria-hidden
          >
            <Icon className="h-[16px] w-[16px]" strokeWidth={2.4} />
          </span>
        );
      })}
      {trustLayer ? (
        <div className="absolute right-[16px] top-[16px] flex items-center gap-[8px] rounded-full bg-[#DDEFE8] px-[12px] py-[8px] text-[12px] font-extrabold text-[#16613F] shadow-sm">
          <Layers className="h-4 w-4" />
          Trust metadata visible
        </div>
      ) : null}
    </section>
  );
}

const METRIC_TILES: Array<{ key: keyof DashboardData; label: string; color: string }> = [
  { key: "missing", label: "solicitudes de búsqueda", color: "text-[var(--hos-red)]" },
  { key: "found", label: "reportes de encontrados", color: "text-[var(--hos-green)]" },
  { key: "pending", label: "coincidencias por revisar", color: "text-[var(--hos-blue)]" },
  { key: "notifications", label: "familias notificadas", color: "text-[#111827]" },
];

function Metrics({ data }: { data: DashboardData | null }) {
  return (
    <section className="grid grid-cols-4 gap-[16px] max-[1180px]:grid-cols-2">
      {METRIC_TILES.map((tile) => (
        <div key={tile.label} className="h-[86px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[16px] py-[14px]">
          <div className={`font-data text-[28px] font-bold leading-none ${tile.color}`}>
            {data ? Number(data[tile.key]).toLocaleString("es") : "—"}
          </div>
          <div className="mt-[13px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">{tile.label}</div>
        </div>
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

const EVENT_LABELS: Record<string, string> = {
  "match.suggested": "IA sugirió una coincidencia",
  "verification.recorded": "Verificación registrada",
  "match.confirmed": "Coincidencia confirmada",
  "match.rejected": "Coincidencia descartada",
  "report.resolved": "Caso resuelto",
  "family.notified": "Familia notificada",
};

function eventLabel(event: HosEvent): string {
  if (event.type === "report.created") {
    return event.actor.startsWith("org:") ? "Nuevo reporte de encontrado" : "Nuevo reporte de desaparecido";
  }
  return EVENT_LABELS[event.type] ?? event.type;
}

function ActivityFeed({ events }: { events: HosEvent[] }) {
  const shown = events.filter((e) => e.type === "report.created" || e.type in EVENT_LABELS).slice(0, 10);
  return (
    <aside className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <h2 className="text-[20px] font-extrabold leading-none text-[var(--hos-text)]">Actividad reciente</h2>
      <p className="mt-[14px] text-[13px] font-bold leading-[16px] text-[var(--hos-muted)]">
        La IA crea candidatos. Las organizaciones verificadas deciden.
      </p>
      <div className="mt-[16px] flex flex-col">
        {shown.length === 0 ? (
          <p className="text-[13px] font-bold text-[var(--hos-muted)]">Sin actividad todavía.</p>
        ) : (
          shown.map((event) => (
            <div key={event.id} className="flex items-center justify-between border-b border-[#E2E8E4] py-[12px] last:border-b-0">
              <span className="text-[13px] font-bold text-[var(--hos-text)]">{eventLabel(event)}</span>
              <span className="font-data text-[11px] font-bold text-[var(--hos-muted)]">{event.occurredAt.slice(11, 16)}</span>
            </div>
          ))
        )}
      </div>
      <div className="mt-[24px] rounded-[6px] bg-[var(--hos-dark)] p-[14px]">
        <h3 className="text-[14px] font-extrabold leading-[17px] text-white">Cada reporte lleva metadatos de confianza</h3>
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

export function HosDashboard() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((d) => active && setData(d))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [modalKind]);

  return (
    <AppShell
      title="Family Reunification Map"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((v) => !v)}
      onOpenFamily={() => setModalKind("family")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_328px] gap-[28px] px-[28px] py-[28px] max-[1180px]:grid-cols-1 max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <div className="flex min-w-0 flex-col gap-[28px]">
          <MapPanel trustLayer={trustLayer} />
          <Metrics data={data} />
          <ActionPanel onOpen={setModalKind} />
        </div>
        <ActivityFeed events={data?.recentEvents ?? []} />
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
            <Header title={title} subtitle={subtitle} trustLayer={trustLayer} onToggleTrustLayer={onToggleTrustLayer} onOpenFamily={onOpenFamily} />
            {children}
          </div>
        </div>
      </div>
      <ActionModal kind={modalKind} onClose={onCloseModal} />
    </main>
  );
}
