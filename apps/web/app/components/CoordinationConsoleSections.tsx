"use client";

import { ArrowLeft, Boxes, Building2, MapPin, Package, Siren, X } from "lucide-react";
import { Term } from "@/app/components/Term";
import {
  AddOrgForm,
  AddSiteForm,
  CATEGORY_LABEL,
  NeedCard,
  OfferCard,
  PostNeedForm,
  PostOfferForm,
  SITE_CATEGORY_LABEL,
  SiteCard,
  SitesVencidosPanel,
} from "@/app/components/CoordinationParts";
import type { NeedCategory, Org, Site, SiteCategory } from "@/app/lib/domain/coordination";
import type { NeedView, OfferView, SiteView } from "@/app/lib/domain/coordinationViews";

export type CreateKind = "need" | "offer" | "site" | "org";

const CREATE_OPTIONS: Array<{
  kind: CreateKind;
  title: string;
  description: string;
  icon: typeof Siren;
  accent: string;
}> = [
  {
    kind: "need",
    title: "Publicar necesidad",
    description: "Algo que falta: rescate, agua, comida, medicinas…",
    icon: Siren,
    accent: "text-[var(--hos-red)]",
  },
  {
    kind: "offer",
    title: "Publicar suministro",
    description: "Algo que su organización puede aportar.",
    icon: Package,
    accent: "text-[var(--hos-green)]",
  },
  {
    kind: "site",
    title: "Agregar sitio",
    description: "Un punto físico: acopio, refugio, atención médica…",
    icon: MapPin,
    accent: "text-[var(--hos-blue)]",
  },
  {
    kind: "org",
    title: "Registrar organización",
    description: "El grupo responsable detrás de sitios y suministros.",
    icon: Building2,
    accent: "text-[var(--hos-text)]",
  },
];

const NEED_FILTERS = Object.keys(CATEGORY_LABEL) as NeedCategory[];
const SITE_FILTERS: SiteCategory[] = ["acopio", "refugio", "medico", "internet", "mascotas"];

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function Metric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white px-[16px] py-[12px]">
      <div className={`font-data text-[24px] font-bold leading-none ${color}`}>{value}</div>
      <div className="mt-[6px] text-[12px] font-bold text-[var(--hos-muted)]">{label}</div>
    </div>
  );
}

export function CoordinatorBrief({ metrics }: { metrics: { open: number; critical: number; beds: number; sites: number } }) {
  return (
    <>
      <section className="flex items-start gap-[12px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
        <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#EEF6F2]">
          <Boxes className="h-5 w-5 text-[var(--hos-green)]" strokeWidth={2.2} />
        </span>
        <p className="text-[12px] font-bold leading-[17px] text-[var(--hos-muted)]">
          Solo coordinadores · no es pública. Ubicaciones por <Term k="distrito">distrito</Term>. Un suministro
          se marca <span className="font-extrabold"><Term k="recibido">recibido</Term></span> solo cuando el sitio
          lo confirma, nunca automático. Las sugerencias son solo una guía: decide una persona.
        </p>
      </section>
      <div data-tour="metrics" className="grid grid-cols-4 gap-[12px] max-[760px]:grid-cols-2">
        <Metric value={metrics.open} label="necesidades abiertas" color="text-[var(--hos-warn)]" />
        <Metric value={metrics.critical} label="críticas" color="text-[var(--hos-red)]" />
        <Metric value={metrics.beds} label="camas libres" color="text-[var(--hos-green)]" />
        <Metric value={metrics.sites} label="sitios" color="text-[var(--hos-blue)]" />
      </div>
    </>
  );
}

export function BoardFilters({
  needCat,
  siteCat,
  criticalOnly,
  onResetNeeds,
  onToggleNeed,
  onToggleCritical,
  onResetSites,
  onToggleSite,
}: {
  needCat: NeedCategory | null;
  siteCat: SiteCategory | null;
  criticalOnly: boolean;
  onResetNeeds: () => void;
  onToggleNeed: (category: NeedCategory) => void;
  onToggleCritical: () => void;
  onResetSites: () => void;
  onToggleSite: (category: SiteCategory) => void;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex flex-wrap items-center gap-[6px]">
        <span className="w-[110px] shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-[var(--hos-red)]">Necesidades</span>
        <FilterChip label="Todas" active={needCat === null && !criticalOnly} onClick={onResetNeeds} />
        {NEED_FILTERS.map((c) => (
          <FilterChip key={c} label={CATEGORY_LABEL[c]} active={needCat === c} onClick={() => onToggleNeed(c)} />
        ))}
        <FilterChip label="Solo críticas" active={criticalOnly} onClick={onToggleCritical} />
      </div>
      <div className="flex flex-wrap items-center gap-[6px]">
        <span className="w-[110px] shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-[var(--hos-green)]">Puntos de ayuda</span>
        <FilterChip label="Todos" active={siteCat === null} onClick={onResetSites} />
        {SITE_FILTERS.map((c) => (
          <FilterChip key={c} label={SITE_CATEGORY_LABEL[c]} active={siteCat === c} onClick={() => onToggleSite(c)} />
        ))}
      </div>
    </div>
  );
}

export function CreateRecordFlow({
  createKind,
  setCreateKind,
  orgs,
  activeSites,
  onCreated,
  onClose,
}: {
  createKind: "menu" | CreateKind;
  setCreateKind: (kind: "menu" | CreateKind) => void;
  orgs: Org[];
  activeSites: Site[];
  onCreated: () => void;
  /** Leave the create flow entirely, back to the board. */
  onClose: () => void;
}) {
  if (createKind === "menu") {
    return (
      <section className="mx-auto w-full max-w-[760px]">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-[6px] text-[12px] font-extrabold text-[var(--hos-muted)] hover:text-[var(--hos-text)]"
        >
          <ArrowLeft className="h-[13px] w-[13px]" strokeWidth={2.6} /> Volver al panel
        </button>
        <h3 className="mt-[10px] text-[15px] font-extrabold text-[var(--hos-text)]">¿Qué quiere registrar?</h3>
        <div className="mt-[12px] grid grid-cols-2 gap-[12px] max-[640px]:grid-cols-1">
          {CREATE_OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.kind}
                type="button"
                onClick={() => setCreateKind(o.kind)}
                className="flex items-start gap-[12px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px] text-left transition hover:border-[var(--hos-dark)]"
              >
                <Icon className={`mt-[2px] h-[22px] w-[22px] shrink-0 ${o.accent}`} strokeWidth={2.2} />
                <span>
                  <span className="block text-[14px] font-extrabold text-[var(--hos-text)]">{o.title}</span>
                  <span className="mt-[2px] block text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">{o.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const opt = CREATE_OPTIONS.find((o) => o.kind === createKind);
  if (!opt) return null;
  const Icon = opt.icon;
  return (
    <section className="mx-auto w-full max-w-[760px]">
      <div className="flex items-center gap-[14px]">
        <button
          type="button"
          onClick={() => setCreateKind("menu")}
          className="inline-flex items-center gap-[6px] text-[12px] font-extrabold text-[var(--hos-muted)] hover:text-[var(--hos-text)]"
        >
          <ArrowLeft className="h-[13px] w-[13px]" strokeWidth={2.6} /> Elegir otro tipo
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-[6px] text-[12px] font-extrabold text-[var(--hos-muted)] hover:text-[var(--hos-text)]"
        >
          <X className="h-[13px] w-[13px]" strokeWidth={2.6} /> Cerrar
        </button>
      </div>
      <div className="mt-[10px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
        <div className="mb-[12px] flex items-center gap-[10px]">
          <Icon className={`h-[20px] w-[20px] ${opt.accent}`} strokeWidth={2.2} />
          <span className="text-[15px] font-extrabold text-[var(--hos-text)]">{opt.title}</span>
        </div>
        {createKind === "need" ? (
          <PostNeedForm orgs={orgs} sites={activeSites} onChanged={onCreated} />
        ) : createKind === "offer" ? (
          <PostOfferForm orgs={orgs} sites={activeSites} onChanged={onCreated} />
        ) : createKind === "site" ? (
          <AddSiteForm orgs={orgs} onChanged={onCreated} />
        ) : (
          <AddOrgForm onChanged={onCreated} />
        )}
      </div>
    </section>
  );
}

export function DistrictFilterPill({
  district,
  visibleNeedsCount,
  visibleSitesCount,
  onClear,
}: {
  district: string | null;
  visibleNeedsCount: number;
  visibleSitesCount: number;
  onClear: () => void;
}) {
  if (!district) return null;
  return (
    <div className="flex flex-wrap items-center gap-[8px]">
      <span className="inline-flex items-center gap-[8px] rounded-full bg-[#EEF2EF] px-[12px] py-[6px] text-[12px] font-extrabold text-[var(--hos-text)]">
        Distrito: {district} · {visibleNeedsCount} nec. · {visibleSitesCount} {visibleSitesCount === 1 ? "sitio" : "sitios"}
        <button type="button" onClick={onClear} aria-label="Quitar filtro de distrito">
          <X className="h-[13px] w-[13px]" strokeWidth={2.6} />
        </button>
      </span>
      <span className="text-[11px] font-bold text-[var(--hos-muted)]">Filtrado desde el mapa · la X muestra todo de nuevo</span>
    </div>
  );
}

export function BoardList({
  visibleNeeds,
  visibleSites,
  visibleOffers,
  pagedNeeds,
  pagedSites,
  orgs,
  onReload,
  onShowMore,
  onShowMoreSites,
}: {
  visibleNeeds: NeedView[];
  visibleSites: SiteView[];
  visibleOffers: OfferView[];
  pagedNeeds: NeedView[];
  pagedSites: SiteView[];
  orgs: Org[];
  onReload: () => void;
  onShowMore: () => void;
  onShowMoreSites: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[18px] max-[1100px]:grid-cols-1">
      <section data-tour="needs">
        <div className="mb-[10px] flex items-center justify-between">
          <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Necesidades</h3>
          <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{visibleNeeds.length}</span>
        </div>
        <div className="flex flex-col gap-[12px]">
          {visibleNeeds.length === 0 ? (
            <p className="text-[13px] font-bold text-[var(--hos-muted)]">No hay necesidades registradas.</p>
          ) : (
            pagedNeeds.map((v) => <NeedCard key={v.need.id} view={v} orgs={orgs} onChanged={onReload} />)
          )}
          {visibleNeeds.length > pagedNeeds.length ? (
            <button
              type="button"
              onClick={onShowMore}
              className="h-[38px] rounded-[6px] border border-[var(--hos-border)] bg-white text-[13px] font-extrabold text-[var(--hos-blue)] transition hover:bg-[#F4F8F5]"
            >
              Mostrar más ({visibleNeeds.length - pagedNeeds.length} restantes)
            </button>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col gap-[18px]">
        <section>
          <div className="mb-[10px] flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Sitios y capacidad</h3>
            <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{visibleSites.length}</span>
          </div>
          <div className="flex flex-col gap-[12px]">
            <SitesVencidosPanel sites={visibleSites} onChanged={onReload} />
            {pagedSites.map((v) => <SiteCard key={v.site.id} view={v} onChanged={onReload} />)}
            {visibleSites.length > pagedSites.length ? (
              <button
                type="button"
                onClick={onShowMoreSites}
                className="h-[38px] rounded-[6px] border border-[var(--hos-border)] bg-white text-[13px] font-extrabold text-[var(--hos-blue)] transition hover:bg-[#F4F8F5]"
              >
                Mostrar más ({visibleSites.length - pagedSites.length} restantes)
              </button>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mb-[10px] flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold text-[var(--hos-text)]">Suministros ofrecidos</h3>
            <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{visibleOffers.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-[10px] max-[520px]:grid-cols-1">
            {visibleOffers.map((v) => <OfferCard key={v.offer.id} view={v} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
