"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Baby,
  BedDouble,
  Check,
  Clock,
  Droplets,
  HelpCircle,
  Home,
  Megaphone,
  Search,
  Shirt,
  Siren,
  Sparkles,
  Stethoscope,
  Truck,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Term } from "@/app/components/Term";
import {
  createNeed,
  createOffer,
  createOrg,
  createSite,
  setSiteAnnouncement,
  transitionNeed,
  updateSiteCapacity,
} from "@/app/lib/client/coordination";
import { searchAddress, type GeocodeHit } from "@/app/lib/client/geocode";
import { districtFromText, nearestDistrict } from "@/app/lib/coordination/classify";
import { DISTRICT_OPTIONS, type LatLng } from "@/app/lib/geo/districts";
import type { Freshness } from "@/app/lib/coordination/freshness";
import { activeAnnouncement } from "@/app/lib/domain/coordination";
import type { NeedCategory, Org, OrgKind, Site, SiteCategory, Urgency } from "@/app/lib/domain/coordination";
import type { NeedView, OfferView, SiteView } from "@/app/lib/domain/coordinationViews";

// Pin-picker map is Leaflet (SSR-unsafe) — loaded only when the site form opens.
const SitePinMap = dynamic(() => import("@/app/components/SitePinMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-[6px] bg-[#EEF2EF] text-[12px] font-bold text-[var(--hos-muted)]">
      Cargando mapa…
    </div>
  ),
});

export const CATEGORY_LABEL: Record<NeedCategory, string> = {
  rescue: "Rescate",
  water: "Agua",
  food: "Comida",
  formula: "Fórmula",
  medical: "Médico",
  shelter: "Refugio",
  hygiene: "Higiene",
  clothing: "Ropa",
  other: "Otro",
};

export const SITE_CATEGORY_LABEL: Record<SiteCategory, string> = {
  acopio: "Acopio",
  refugio: "Refugio",
  medico: "Atención médica",
  internet: "Internet / carga",
  mascotas: "Mascotas",
  otro: "Otro",
};

// Pin color + glyph per site category on the map. Lives here (not in the
// Leaflet component) so the SSR-rendered legend can import it without pulling
// Leaflet into SSR.
export const SITE_PIN: Record<SiteCategory, { color: string; glyph: string }> = {
  acopio: { color: "#2E7D5B", glyph: "A" },
  refugio: { color: "#1D6FA8", glyph: "R" },
  medico: { color: "#B4392E", glyph: "+" },
  internet: { color: "#6C4BC8", glyph: "i" },
  mascotas: { color: "#C77E1E", glyph: "M" },
  otro: { color: "#6B7280", glyph: "·" },
};

const SITE_CATEGORY_STYLE: Record<SiteCategory, string> = {
  acopio: "bg-[#DDEFE8] text-[#16613F]",
  refugio: "bg-[#DCEEF8] text-[#0B4F76]",
  medico: "bg-[#F6DAD5] text-[#8A2A1E]",
  internet: "bg-[#E8E4F4] text-[#4B3D8F]",
  mascotas: "bg-[#FFF1D6] text-[#7A3D00]",
  otro: "bg-[#EEF2EF] text-[var(--hos-muted)]",
};

const URGENCY: Record<Urgency, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-[#EEF2EF] text-[var(--hos-muted)]" },
  normal: { label: "Normal", className: "bg-[#DCEEF8] text-[#0B4F76]" },
  high: { label: "Alta", className: "bg-[#FFF1D6] text-[#7A3D00]" },
  critical: { label: "Crítica", className: "bg-[#F6DAD5] text-[#8A2A1E]" },
};

const NEED_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: "Abierta", className: "bg-[#FDF1D8] text-[var(--hos-warn)]" },
  claimed: { label: "Asignada", className: "bg-[#DCEEF8] text-[#0B4F76]" },
  received: { label: "Recibida", className: "bg-[#DDEFE8] text-[#16613F]" },
  cancelled: { label: "Cancelada", className: "bg-[#EEF2EF] text-[var(--hos-muted)]" },
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as NeedCategory[];
const URGENCIES: Urgency[] = ["low", "normal", "high", "critical"];
const ORG_KINDS: OrgKind[] = [
  "shelter",
  "responder",
  "ngo",
  "church",
  "community",
  "volunteers",
  "government",
  "hospital",
  "school",
  "business",
  "other",
];

const ORG_KIND_LABEL: Record<OrgKind, string> = {
  shelter: "Refugio",
  responder: "Equipo de rescate",
  ngo: "ONG",
  church: "Iglesia / comunidad de fe",
  community: "Grupo comunitario / vecinal",
  volunteers: "Grupo de voluntarios",
  government: "Gobierno",
  hospital: "Hospital / clínica",
  school: "Escuela / universidad",
  business: "Empresa privada",
  other: "Otro",
};

// One icon per need category so the pickers read at a glance (human feedback
// 2026-07-03: "add some icon so it is easier to recognize").
export const CATEGORY_ICON: Record<NeedCategory, LucideIcon> = {
  rescue: Siren,
  water: Droplets,
  food: UtensilsCrossed,
  formula: Baby,
  medical: Stethoscope,
  shelter: Home,
  hygiene: Sparkles,
  clothing: Shirt,
  other: HelpCircle,
};

const fieldBase =
  "w-full rounded-[6px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[10px] py-[8px] text-[13px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";

export function Chip({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded-full px-[9px] text-[11px] font-extrabold ${className}`}>
      {label}
    </span>
  );
}

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const map = {
    fresh: { label: "Actualizado", className: "text-[var(--hos-green)]" },
    aging: { label: "Hace horas", className: "text-[#7A3D00]" },
    stale: { label: "Sin actualizar +24h", className: "text-[var(--hos-red)]" },
  } as const;
  const f = map[freshness];
  return (
    <span className={`inline-flex items-center gap-[4px] text-[11px] font-bold ${f.className}`}>
      <Clock className="h-[12px] w-[12px]" strokeWidth={2.4} />
      {f.label}
    </span>
  );
}

function orgName(orgs: Org[], id: string | null): string {
  if (!id) return "—";
  return orgs.find((o) => o.id === id)?.name ?? id;
}

// --- Site card (capacity + inline edit) -----------------------------------

export function SiteCard({ view, onChanged }: { view: SiteView; onChanged: () => void }) {
  const { site, org, freshness } = view;
  const [editing, setEditing] = useState(false);
  const [total, setTotal] = useState(String(site.bedsTotal));
  const [free, setFree] = useState(String(site.bedsFree));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Site broadcast ("hoy entregan comida 2-5pm") — set by whoever is
  // responsible for the point (a coordinator today; the site:<id> capability
  // scope when HOS-2026-011 lands). Auto-hides at expiry.
  const aviso = activeAnnouncement(site, new Date().toISOString());
  const [announcing, setAnnouncing] = useState(false);
  const [avisoText, setAvisoText] = useState("");
  const [avisoHours, setAvisoHours] = useState("24");

  async function publishAviso(message: string) {
    setBusy(true);
    setError("");
    try {
      await setSiteAnnouncement({ siteId: site.id, message, hoursValid: Number(avisoHours) });
      setAnnouncing(false);
      setAvisoText("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar el aviso.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await updateSiteCapacity({
        siteId: site.id,
        bedsTotal: Number(total),
        bedsFree: Number(free),
        status: site.status,
        notes: site.notes,
      });
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  // Liveness loop: "confirmar" re-saves the site as-is, which bumps updated_at
  // (and appends an audit event) so the freshness badge reads honest again;
  // "cerrado" retires the point without deleting it. Both matter for imported
  // sites nobody on our side has walked past yet.
  async function setStatus(status: "active" | "closed") {
    setBusy(true);
    setError("");
    try {
      await updateSiteCapacity({
        siteId: site.id,
        bedsTotal: site.bedsTotal,
        bedsFree: site.bedsFree,
        status,
        notes: site.notes,
      });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  const full = site.bedsFree === 0;
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
      <div className="flex items-start justify-between gap-[10px]">
        <div>
          <div className="text-[14px] font-extrabold text-[var(--hos-text)]">{site.name}</div>
          <div className="mt-[2px] flex flex-wrap items-center gap-[6px] text-[12px] font-bold text-[var(--hos-muted)]">
            <span>{org?.name ?? "—"} · {site.district}</span>
            <Chip label={SITE_CATEGORY_LABEL[site.category]} className={SITE_CATEGORY_STYLE[site.category]} />
            {site.status === "closed" ? (
              <Chip label="Cerrado" className="bg-[#F6DAD5] text-[#8A2A1E]" />
            ) : null}
          </div>
        </div>
        <FreshnessBadge freshness={freshness} />
      </div>
      {/* Bed capacity only means something for shelters; an acopio with "0/0
          camas" would just read as noise. */}
      {site.category === "refugio" || site.bedsTotal > 0 ? (
      <div className="mt-[12px] flex items-center gap-[8px]">
        <BedDouble className={`h-[18px] w-[18px] ${full ? "text-[var(--hos-red)]" : "text-[var(--hos-green)]"}`} strokeWidth={2.2} />
        <span className={`font-data text-[20px] font-bold leading-none ${full ? "text-[var(--hos-red)]" : "text-[var(--hos-text)]"}`}>
          {site.bedsFree}
        </span>
        <span className="text-[12px] font-bold text-[var(--hos-muted)]">/ {site.bedsTotal} camas libres</span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="ml-auto text-[12px] font-extrabold text-[var(--hos-blue)] hover:underline"
        >
          {editing ? "Cerrar" : "Actualizar"}
        </button>
      </div>
      ) : null}
      {aviso ? (
        <div className="mt-[10px] flex items-start gap-[8px] rounded-[6px] bg-[#FDF3D7] px-[10px] py-[8px]">
          <Megaphone className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[#7A5200]" strokeWidth={2.4} />
          <div className="text-[12px] font-extrabold leading-[16px] text-[#7A5200]">
            {aviso}
            {site.announcementUntil ? (
              <span className="ml-[6px] font-bold text-[#A98A3A]">
                (vence {new Date(site.announcementUntil).toLocaleString("es-VE", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })})
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      {site.notes ? <p className="mt-[8px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">{site.notes}</p> : null}
      <div className="mt-[10px] flex flex-wrap items-center gap-[12px] border-t border-[#E2E8E4] pt-[8px]">
        {site.status === "active" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void setStatus("active")}
              className="text-[12px] font-extrabold text-[var(--hos-green)] hover:underline disabled:opacity-60"
            >
              Confirmar operativo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void setStatus("closed")}
              className="text-[12px] font-extrabold text-[var(--hos-muted)] hover:underline disabled:opacity-60"
            >
              Marcar cerrado
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStatus("active")}
            className="text-[12px] font-extrabold text-[var(--hos-blue)] hover:underline disabled:opacity-60"
          >
            Reabrir
          </button>
        )}
        {site.status === "active" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setAnnouncing((v) => !v)}
            className="text-[12px] font-extrabold text-[#7A5200] hover:underline disabled:opacity-60"
          >
            {announcing ? "Cerrar aviso" : aviso ? "Cambiar aviso" : "Publicar aviso"}
          </button>
        ) : null}
        {aviso && !announcing ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void publishAviso("")}
            className="text-[12px] font-extrabold text-[var(--hos-muted)] hover:underline disabled:opacity-60"
          >
            Quitar aviso
          </button>
        ) : null}
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
      {announcing ? (
        <div className="mt-[10px] flex flex-wrap items-end gap-[8px] border-t border-[#E2E8E4] pt-[10px]">
          <label className="min-w-[220px] flex-1 text-[11px] font-extrabold text-[var(--hos-muted)]">
            Aviso (ej. &quot;Hoy entregan comida 2-5pm&quot;)
            <input
              type="text"
              maxLength={200}
              className={`${fieldBase} mt-[4px] w-full`}
              value={avisoText}
              onChange={(e) => setAvisoText(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">
            Visible por
            <select className={`${fieldBase} mt-[4px] w-[110px]`} value={avisoHours} onChange={(e) => setAvisoHours(e.target.value)}>
              <option value="6">6 horas</option>
              <option value="12">12 horas</option>
              <option value="24">24 horas</option>
              <option value="48">48 horas</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy || !avisoText.trim()}
            onClick={() => void publishAviso(avisoText.trim())}
            className="h-[36px] rounded-[6px] bg-[#7A5200] px-[14px] text-[12px] font-extrabold text-white disabled:opacity-60"
          >
            Publicar
          </button>
        </div>
      ) : null}
      {editing ? (
        <div className="mt-[10px] flex flex-wrap items-end gap-[8px] border-t border-[#E2E8E4] pt-[10px]">
          <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">
            Libres
            <input type="number" min={0} className={`${fieldBase} mt-[4px] w-[90px]`} value={free} onChange={(e) => setFree(e.target.value)} />
          </label>
          <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">
            Totales
            <input type="number" min={0} className={`${fieldBase} mt-[4px] w-[90px]`} value={total} onChange={(e) => setTotal(e.target.value)} />
          </label>
          <button type="button" disabled={busy} onClick={() => void save()} className="h-[36px] rounded-[6px] bg-[var(--hos-green)] px-[14px] text-[12px] font-extrabold text-white disabled:opacity-60">
            Guardar
          </button>
          {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

// --- Need card (honest lifecycle + advisory matches) ----------------------

export function NeedCard({ view, orgs, onChanged }: { view: NeedView; orgs: Org[]; onChanged: () => void }) {
  const { need, org, claimedByOrg, freshness, matches } = view;
  const [claimer, setClaimer] = useState(orgs[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: "claim" | "receive" | "cancel") {
    setBusy(true);
    setError("");
    try {
      await transitionNeed({ needId: need.id, action, byOrgId: action === "claim" ? claimer : undefined });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
      setBusy(false);
    }
  }

  const status = NEED_STATUS[need.status] ?? { label: need.status, className: "bg-[#EEF2EF] text-[var(--hos-muted)]" };
  const terminal = need.status === "received" || need.status === "cancelled";
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
      <div className="flex items-start justify-between gap-[10px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <span className="font-data text-[16px] font-bold text-[var(--hos-text)]">
            {need.quantity} {need.unit}
          </span>
          <span className="text-[13px] font-extrabold text-[var(--hos-text)]">{CATEGORY_LABEL[need.category]}</span>
          <Chip label={URGENCY[need.urgency].label} className={URGENCY[need.urgency].className} />
          <Chip label={status.label} className={status.className} />
        </div>
        <FreshnessBadge freshness={freshness} />
      </div>
      <div className="mt-[6px] text-[12px] font-bold text-[var(--hos-muted)]">
        {org?.name ?? "—"} · {need.district}
        {claimedByOrg ? <> · asignada a <span className="text-[var(--hos-blue)]">{claimedByOrg.name}</span></> : null}
      </div>
      {need.notes ? <p className="mt-[6px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">{need.notes}</p> : null}

      {!terminal ? (
        <div className="mt-[12px] flex flex-wrap items-center gap-[8px] border-t border-[#E2E8E4] pt-[10px]">
          {need.status === "open" ? (
            <>
              <select className={`${fieldBase} w-auto`} value={claimer} onChange={(e) => setClaimer(e.target.value)}>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <button type="button" disabled={busy || !claimer} onClick={() => void act("claim")} className="inline-flex h-[34px] items-center gap-[5px] rounded-[6px] bg-[var(--hos-blue)] px-[12px] text-[12px] font-extrabold text-white disabled:opacity-60">
                <Truck className="h-[13px] w-[13px]" strokeWidth={2.4} /> Asignar
              </button>
            </>
          ) : (
            <button type="button" disabled={busy} onClick={() => void act("receive")} className="inline-flex h-[34px] items-center gap-[5px] rounded-[6px] bg-[var(--hos-green)] px-[12px] text-[12px] font-extrabold text-white disabled:opacity-60">
              <Check className="h-[13px] w-[13px]" strokeWidth={2.6} /> Confirmar recepción
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => void act("cancel")} className="inline-flex h-[34px] items-center gap-[5px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[12px] text-[12px] font-extrabold text-[var(--hos-text)] hover:bg-[#F8FAF8] disabled:opacity-60">
            <X className="h-[13px] w-[13px]" strokeWidth={2.4} /> Cancelar
          </button>
          {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
        </div>
      ) : null}

      {need.status === "open" && matches.length > 0 ? (
        <div className="mt-[12px] rounded-[6px] border border-[#CFE3F2] bg-[#F1F8FC] p-[10px]">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#0B4F76]">
            Sugerencias de <Term k="suministro">suministro</Term> (solo como guía)
          </div>
          <div className="mt-[8px] flex flex-col gap-[6px]">
            {matches.slice(0, 3).map((m) => (
              <div key={m.offer.id} className="flex items-start justify-between gap-[8px] text-[12px]">
                <span className="font-bold text-[var(--hos-text)]">
                  {orgName(orgs, m.offer.orgId)} — {m.offer.quantity} {m.offer.unit} · {m.offer.district}
                </span>
                <span className="font-data font-bold text-[#0B4F76]">{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// --- Offer card -----------------------------------------------------------

export function OfferCard({ view }: { view: OfferView }) {
  const { offer, org } = view;
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[12px]">
      <div className="flex items-center justify-between gap-[8px]">
        <span className="text-[13px] font-extrabold text-[var(--hos-text)]">{CATEGORY_LABEL[offer.category]}</span>
        <span className="font-data text-[13px] font-bold text-[var(--hos-text)]">{offer.quantity} {offer.unit}</span>
      </div>
      <div className="mt-[4px] text-[12px] font-bold text-[var(--hos-muted)]">{org?.name ?? "—"} · {offer.district}</div>
    </div>
  );
}

// --- Forms ----------------------------------------------------------------

function useSubmit(onChanged: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(fn: () => Promise<unknown>, reset: () => void) {
    setBusy(true);
    setError("");
    try {
      await fn();
      reset();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

/** Labeled field — every form input gets a visible label (human feedback
 *  2026-07-03: bare "0 0" inputs were unreadable). */
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-[11px] font-extrabold text-[var(--hos-muted)] ${className}`}>
      {label}
      <div className="mt-[4px] font-normal">{children}</div>
    </label>
  );
}

function DistrictSelect({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  return (
    <select className={fieldBase} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        Elija el distrito…
      </option>
      {DISTRICT_OPTIONS.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}

/** Icon-grid category picker — recognition over recall. */
function CategoryPicker({ value, onChange }: { value: NeedCategory; onChange: (c: NeedCategory) => void }) {
  return (
    <div className="grid grid-cols-3 gap-[6px] max-[520px]:grid-cols-2">
      {CATEGORIES.map((c) => {
        const Icon = CATEGORY_ICON[c];
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c)}
            className={`flex h-[38px] items-center gap-[7px] rounded-[6px] border px-[10px] text-[12px] font-extrabold transition ${
              active
                ? "border-[var(--hos-dark)] bg-[var(--hos-dark)] text-white"
                : "border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:text-[var(--hos-text)]"
            }`}
          >
            <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2.4} />
            {CATEGORY_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}

const SITE_CATEGORIES: SiteCategory[] = ["acopio", "refugio", "medico", "internet", "mascotas", "otro"];

function SiteCategoryPicker({ value, onChange }: { value: SiteCategory; onChange: (c: SiteCategory) => void }) {
  return (
    <div className="grid grid-cols-3 gap-[6px] max-[520px]:grid-cols-2">
      {SITE_CATEGORIES.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c)}
            className={`flex h-[38px] items-center gap-[7px] rounded-[6px] border px-[10px] text-[12px] font-extrabold transition ${
              active
                ? "border-[var(--hos-dark)] bg-[var(--hos-dark)] text-white"
                : "border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:text-[var(--hos-text)]"
            }`}
          >
            <span
              className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-extrabold text-white"
              style={{ background: SITE_PIN[c].color }}
            >
              {SITE_PIN[c].glyph}
            </span>
            {SITE_CATEGORY_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}

/** When only the caracasayuda community org exists, a coordinator publishing
 *  "as" it is usually a mistake — nudge them to register the real org first. */
function OrgSelectHint({ orgs }: { orgs: Org[] }) {
  if (orgs.length > 1) return null;
  return (
    <p className="mt-[4px] text-[11px] font-bold text-[var(--hos-muted)]">
      ¿Publica en nombre de una organización? Regístrela primero con &quot;Registrar organización&quot;.
    </p>
  );
}

export function PostNeedForm({
  orgs,
  sites = [],
  onChanged,
}: {
  orgs: Org[];
  /** Active sites, so a need can point at a concrete place (human feedback
   *  2026-07-03: "specific to a site so people know where to go"). */
  sites?: Site[];
  onChanged: () => void;
}) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [siteId, setSiteId] = useState("");
  const [category, setCategory] = useState<NeedCategory>("water");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [notes, setNotes] = useState("");
  const { busy, error, run } = useSubmit(onChanged);

  const siteOptions = district ? sites.filter((s) => s.district === district) : sites;

  return (
    <form
      className="flex flex-col gap-[10px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            createNeed({
              orgId,
              siteId: siteId || undefined,
              district,
              category,
              quantity: Number(quantity) || 1,
              unit,
              urgency,
              notes,
            }),
          () => { setDistrict(""); setSiteId(""); setQuantity("1"); setUnit(""); setNotes(""); },
        );
      }}
    >
      <Field label="¿Qué se necesita?">
        <CategoryPicker value={category} onChange={setCategory} />
      </Field>
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Organización que lo pide">
          <select className={fieldBase} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <OrgSelectHint orgs={orgs} />
        </Field>
        <Field label="Urgencia">
          <select className={fieldBase} value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
            {URGENCIES.map((u) => <option key={u} value={u}>{URGENCY[u].label}</option>)}
          </select>
        </Field>
        <Field label="Distrito">
          <DistrictSelect
            value={district}
            onChange={(d) => {
              setDistrict(d);
              setSiteId("");
            }}
          />
        </Field>
        <Field label="Sitio (opcional — para saber a dónde llegar)">
          <select
            className={fieldBase}
            value={siteId}
            onChange={(e) => {
              const id = e.target.value;
              setSiteId(id);
              const site = sites.find((s) => s.id === id);
              if (site) setDistrict(site.district);
            }}
          >
            <option value="">Sin sitio específico</option>
            {siteOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cantidad">
          <input type="number" min={1} className={fieldBase} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Unidad (L, latas…)">
          <input className={fieldBase} value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>
      </div>
      <Field label="Detalle o punto de referencia (opcional)">
        <input className={fieldBase} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">
          Publicar necesidad
        </button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}

export function PostOfferForm({ orgs, onChanged }: { orgs: Org[]; onChanged: () => void }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState<NeedCategory>("water");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const { busy, error, run } = useSubmit(onChanged);

  return (
    <form
      className="flex flex-col gap-[10px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => createOffer({ orgId, district, category, quantity: Number(quantity) || 1, unit }),
          () => { setDistrict(""); setQuantity("1"); setUnit(""); },
        );
      }}
    >
      <Field label="¿Qué se ofrece?">
        <CategoryPicker value={category} onChange={setCategory} />
      </Field>
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Organización que lo ofrece">
          <select className={fieldBase} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <OrgSelectHint orgs={orgs} />
        </Field>
        <Field label="Distrito donde está">
          <DistrictSelect value={district} onChange={setDistrict} />
        </Field>
        <Field label="Cantidad">
          <input type="number" min={1} className={fieldBase} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Unidad (L, latas…)">
          <input className={fieldBase} value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-green)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">
          Publicar suministro
        </button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}

/** If the pin sits near a known district centroid, pre-fill the district;
 *  address text wins when it names one (same text-first rule as the sync). */
function districtForPick(label: string, pos: LatLng): string {
  const fromText = districtFromText(label);
  if (fromText) return fromText;
  const near = nearestDistrict(pos);
  return near.km <= 12 ? near.district : "Otra región";
}

export function AddSiteForm({ orgs, onChanged }: { orgs: Org[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [category, setCategory] = useState<SiteCategory>("acopio");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [bedsTotal, setBedsTotal] = useState("0");
  const [bedsFree, setBedsFree] = useState("0");
  const { busy, error, run } = useSubmit(onChanged);

  async function search() {
    if (!address.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const results = await searchAddress(address.trim());
      setHits(results);
      if (results.length === 0) setSearchError("Sin resultados — puede fijar el punto directamente en el mapa.");
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "No se pudo buscar.");
    } finally {
      setSearching(false);
    }
  }

  function pick(hit: GeocodeHit) {
    const p = { lat: hit.lat, lng: hit.lng };
    setPos(p);
    setHits([]);
    setAddress(hit.label);
    if (!district) setDistrict(districtForPick(hit.label, p));
  }

  return (
    <form
      className="flex flex-col gap-[10px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            createSite({
              name,
              orgId,
              category,
              district,
              lat: pos?.lat ?? null,
              lng: pos?.lng ?? null,
              bedsTotal: Number(bedsTotal) || 0,
              bedsFree: Number(bedsFree) || 0,
              notes: address.trim() ? `Dirección: ${address.trim()}` : "",
            }),
          () => {
            setName(""); setDistrict(""); setAddress(""); setPos(null); setHits([]);
            setBedsTotal("0"); setBedsFree("0");
          },
        );
      }}
    >
      <Field label="Tipo de punto">
        <SiteCategoryPicker value={category} onChange={setCategory} />
      </Field>
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Nombre del sitio">
          <input className={fieldBase} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Organización responsable">
          <select className={fieldBase} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <OrgSelectHint orgs={orgs} />
        </Field>
      </div>
      <Field label="Dirección — busque y luego ajuste el punto en el mapa">
        <div className="flex gap-[8px]">
          <input
            className={fieldBase}
            placeholder="Av. / calle, sector, ciudad…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
          />
          <button
            type="button"
            disabled={searching || !address.trim()}
            onClick={() => void search()}
            className="inline-flex h-[38px] shrink-0 items-center gap-[6px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[12px] text-[12px] font-extrabold text-[var(--hos-text)] disabled:opacity-60"
          >
            <Search className="h-[14px] w-[14px]" strokeWidth={2.4} /> {searching ? "Buscando…" : "Buscar"}
          </button>
        </div>
        {searchError ? <p className="mt-[4px] text-[11px] font-bold text-[var(--hos-warn)]">{searchError}</p> : null}
        {hits.length > 0 ? (
          <ul className="mt-[6px] flex flex-col gap-[4px]">
            {hits.map((h) => (
              <li key={`${h.lat},${h.lng}`}>
                <button
                  type="button"
                  onClick={() => pick(h)}
                  className="w-full rounded-[6px] border border-[var(--hos-border)] bg-white px-[10px] py-[7px] text-left text-[12px] font-bold text-[var(--hos-text)] hover:border-[var(--hos-dark)]"
                >
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Field>
      <Field label={pos ? "Punto fijado — arrástrelo o toque el mapa para ajustarlo" : "Toque el mapa para fijar el punto exacto"}>
        <div className="overflow-hidden rounded-[6px] border border-[var(--hos-border)]">
          <SitePinMap
            pos={pos}
            onChange={(p) => {
              setPos(p);
              if (!district) setDistrict(districtForPick(address, p));
            }}
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Distrito">
          <DistrictSelect value={district} onChange={setDistrict} />
        </Field>
        {category === "refugio" ? (
          <div className="grid grid-cols-2 gap-[8px]">
            <Field label="Camas libres">
              <input type="number" min={0} className={fieldBase} value={bedsFree} onChange={(e) => setBedsFree(e.target.value)} />
            </Field>
            <Field label="Camas totales">
              <input type="number" min={0} className={fieldBase} value={bedsTotal} onChange={(e) => setBedsTotal(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !name || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-blue)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">
          Agregar sitio
        </button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}

export function AddOrgForm({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<OrgKind>("responder");
  const { busy, error, run } = useSubmit(onChanged);

  return (
    <form
      className="flex flex-col gap-[10px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => createOrg({ name, kind }), () => setName(""));
      }}
    >
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Nombre de la organización">
          <input className={fieldBase} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <select className={fieldBase} value={kind} onChange={(e) => setKind(e.target.value as OrgKind)}>
            {ORG_KINDS.map((k) => <option key={k} value={k}>{ORG_KIND_LABEL[k]}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !name} className="h-[38px] rounded-[6px] bg-[var(--hos-dark)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">
          Registrar organización
        </button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}
