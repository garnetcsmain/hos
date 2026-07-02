"use client";

import { useState } from "react";
import { BedDouble, Check, Clock, Truck, X } from "lucide-react";
import { Term } from "@/app/components/Term";
import {
  createNeed,
  createOffer,
  createOrg,
  createSite,
  transitionNeed,
  updateSiteCapacity,
} from "@/app/lib/client/coordination";
import type { Freshness } from "@/app/lib/coordination/freshness";
import type { NeedCategory, Org, OrgKind, SiteCategory, Urgency } from "@/app/lib/domain/coordination";
import type { NeedView, OfferView, SiteView } from "@/app/lib/domain/coordinationViews";

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
const ORG_KINDS: OrgKind[] = ["shelter", "responder", "ngo", "government", "hospital", "other"];

const ORG_KIND_LABEL: Record<OrgKind, string> = {
  shelter: "Refugio",
  responder: "Equipo de rescate",
  ngo: "ONG",
  government: "Gobierno",
  hospital: "Hospital",
  other: "Otro",
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
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
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

export function PostNeedForm({ orgs, onChanged }: { orgs: Org[]; onChanged: () => void }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState<NeedCategory>("water");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const { busy, error, run } = useSubmit(onChanged);

  return (
    <form
      className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => createNeed({ orgId, district, category, quantity: Number(quantity) || 1, unit, urgency }),
          () => { setDistrict(""); setQuantity("1"); setUnit(""); },
        );
      }}
    >
      <select className={fieldBase} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <input className={fieldBase} placeholder="Distrito" value={district} onChange={(e) => setDistrict(e.target.value)} />
      <select className={fieldBase} value={category} onChange={(e) => setCategory(e.target.value as NeedCategory)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
      </select>
      <select className={fieldBase} value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
        {URGENCIES.map((u) => <option key={u} value={u}>{URGENCY[u].label}</option>)}
      </select>
      <input type="number" min={1} className={fieldBase} placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <input className={fieldBase} placeholder="Unidad (L, latas…)" value={unit} onChange={(e) => setUnit(e.target.value)} />
      <div className="col-span-2 flex items-center gap-[10px] max-[640px]:col-span-1">
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
      className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => createOffer({ orgId, district, category, quantity: Number(quantity) || 1, unit }),
          () => { setDistrict(""); setQuantity("1"); setUnit(""); },
        );
      }}
    >
      <select className={fieldBase} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <input className={fieldBase} placeholder="Distrito" value={district} onChange={(e) => setDistrict(e.target.value)} />
      <select className={fieldBase} value={category} onChange={(e) => setCategory(e.target.value as NeedCategory)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
      </select>
      <input type="number" min={1} className={fieldBase} placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <input className={fieldBase} placeholder="Unidad" value={unit} onChange={(e) => setUnit(e.target.value)} />
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-green)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">
          Publicar suministro
        </button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}

export function AddSiteForm({ orgs, onChanged }: { orgs: Org[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [bedsTotal, setBedsTotal] = useState("0");
  const [bedsFree, setBedsFree] = useState("0");
  const { busy, error, run } = useSubmit(onChanged);

  return (
    <form
      className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => createSite({ name, orgId, district, bedsTotal: Number(bedsTotal) || 0, bedsFree: Number(bedsFree) || 0 }),
          () => { setName(""); setDistrict(""); setBedsTotal("0"); setBedsFree("0"); },
        );
      }}
    >
      <input className={fieldBase} placeholder="Nombre del sitio" value={name} onChange={(e) => setName(e.target.value)} />
      <select className={fieldBase} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <input className={fieldBase} placeholder="Distrito" value={district} onChange={(e) => setDistrict(e.target.value)} />
      <div className="grid grid-cols-2 gap-[8px]">
        <input type="number" min={0} className={fieldBase} placeholder="Libres" value={bedsFree} onChange={(e) => setBedsFree(e.target.value)} />
        <input type="number" min={0} className={fieldBase} placeholder="Totales" value={bedsTotal} onChange={(e) => setBedsTotal(e.target.value)} />
      </div>
      <div className="col-span-2 flex items-center gap-[10px] max-[640px]:col-span-1">
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
      className="flex flex-wrap items-center gap-[8px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => createOrg({ name, kind }), () => setName(""));
      }}
    >
      <input className={`${fieldBase} w-auto`} placeholder="Nombre de la organización" value={name} onChange={(e) => setName(e.target.value)} />
      <select className={`${fieldBase} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as OrgKind)}>
        {ORG_KINDS.map((k) => <option key={k} value={k}>{ORG_KIND_LABEL[k]}</option>)}
      </select>
      <button type="submit" disabled={busy || !name} className="h-[38px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[14px] text-[13px] font-extrabold text-[var(--hos-text)] disabled:opacity-60">
        Registrar organización
      </button>
      {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
    </form>
  );
}
