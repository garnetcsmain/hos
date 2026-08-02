"use client";

import { useState } from "react";
import { BedDouble, Check, Clock, Megaphone, ShieldCheck, ShieldQuestion, Truck, X } from "lucide-react";
import { Term } from "@/app/components/Term";
import { setSiteAnnouncement, transitionNeed, updateSiteCapacity } from "@/app/lib/client/coordination";
import type { ConfirmationFreshness, Freshness } from "@/app/lib/coordination/freshness";
import { activeAnnouncement } from "@/app/lib/domain/coordination";
import type { Org } from "@/app/lib/domain/coordination";
import type { NeedView, OfferView, SiteView } from "@/app/lib/domain/coordinationViews";
import {
  CATEGORY_LABEL,
  NEED_STATUS,
  SITE_CATEGORY_LABEL,
  SITE_CATEGORY_STYLE,
  URGENCY,
} from "@/app/components/CoordinationLabels";

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

/** Liveness-confirmation badge (HOS-2026-014-01, Judge D1/D2): shows how long
 *  ago the site was explicitly confirmed operative, decaying INDEPENDENTLY of the
 *  data-freshness badge above — so a bed-count edit no longer makes a site read
 *  as freshly confirmed. "Sin confirmar operativo" is the honest state for a site
 *  (incl. every imported one) that no steward has confirmed. It never asserts the
 *  identity of who confirmed — the honor-system caveat below the actions covers
 *  that (attribution != trustworthiness). */
export function ConfirmationBadge({
  status,
  confirmedAt,
}: {
  status: ConfirmationFreshness;
  confirmedAt: string | null;
}) {
  const map = {
    fresh: { label: "Operativo confirmado", className: "text-[var(--hos-green)]", Icon: ShieldCheck },
    aging: { label: "Confirmar operativo de nuevo", className: "text-[#7A3D00]", Icon: ShieldQuestion },
    stale: { label: "Sin confirmar +24h", className: "text-[var(--hos-red)]", Icon: ShieldQuestion },
    unconfirmed: { label: "Sin confirmar operativo", className: "text-[var(--hos-muted)]", Icon: ShieldQuestion },
  } as const;
  const c = map[status];
  const when = confirmedAt
    ? new Date(confirmedAt).toLocaleString("es-VE", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
    : null;
  return (
    <span className={`inline-flex items-center gap-[4px] text-[11px] font-bold ${c.className}`}>
      <c.Icon className="h-[12px] w-[12px]" strokeWidth={2.4} />
      {c.label}
      {when ? <span className="font-semibold text-[var(--hos-muted)]">· {when}</span> : null}
    </span>
  );
}

function orgName(orgs: Org[], id: string | null): string {
  if (!id) return "—";
  return orgs.find((o) => o.id === id)?.name ?? id;
}

export function SiteCard({ view, onChanged }: { view: SiteView; onChanged: () => void }) {
  const { site, org, freshness } = view;
  const [editing, setEditing] = useState(false);
  const [total, setTotal] = useState(String(site.bedsTotal));
  const [free, setFree] = useState(String(site.bedsFree));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
      await updateSiteCapacity({ siteId: site.id, bedsTotal: Number(total), bedsFree: Number(free), status: site.status, notes: site.notes });
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "active" | "closed", intent: "confirm" | "capacity" = "capacity") {
    setBusy(true);
    setError("");
    try {
      await updateSiteCapacity({ siteId: site.id, bedsTotal: site.bedsTotal, bedsFree: site.bedsFree, status, notes: site.notes, intent });
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
            {site.status === "closed" ? <Chip label="Cerrado" className="bg-[#F6DAD5] text-[#8A2A1E]" /> : null}
          </div>
        </div>
        <FreshnessBadge freshness={freshness} />
      </div>
      {site.category === "refugio" || site.bedsTotal > 0 ? (
        <div className="mt-[12px] flex items-center gap-[8px]">
          <BedDouble className={`h-[18px] w-[18px] ${full ? "text-[var(--hos-red)]" : "text-[var(--hos-green)]"}`} strokeWidth={2.2} />
          <span className={`font-data text-[20px] font-bold leading-none ${full ? "text-[var(--hos-red)]" : "text-[var(--hos-text)]"}`}>{site.bedsFree}</span>
          <span className="text-[12px] font-bold text-[var(--hos-muted)]">/ {site.bedsTotal} camas libres</span>
          <button type="button" onClick={() => setEditing((v) => !v)} className="ml-auto text-[12px] font-extrabold text-[var(--hos-blue)] hover:underline">
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
      {view.confirmationFreshness ? (
        <div className="mt-[8px]">
          <ConfirmationBadge status={view.confirmationFreshness} confirmedAt={view.confirmedAt ?? null} />
        </div>
      ) : null}
      <div className="mt-[10px] flex flex-wrap items-center gap-[12px] border-t border-[#E2E8E4] pt-[8px]">
        {site.status === "active" ? (
          <>
            <button type="button" disabled={busy} onClick={() => void setStatus("active", "confirm")} className="text-[12px] font-extrabold text-[var(--hos-green)] hover:underline disabled:opacity-60">Confirmar operativo</button>
            <button type="button" disabled={busy} onClick={() => void setStatus("closed")} className="text-[12px] font-extrabold text-[var(--hos-muted)] hover:underline disabled:opacity-60">Marcar cerrado</button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => void setStatus("active")} className="text-[12px] font-extrabold text-[var(--hos-blue)] hover:underline disabled:opacity-60">Reabrir</button>
        )}
        {site.status === "active" ? (
          <button type="button" disabled={busy} onClick={() => setAnnouncing((v) => !v)} className="text-[12px] font-extrabold text-[#7A5200] hover:underline disabled:opacity-60">
            {announcing ? "Cerrar aviso" : aviso ? "Cambiar aviso" : "Publicar aviso"}
          </button>
        ) : null}
        {aviso && !announcing ? (
          <button type="button" disabled={busy} onClick={() => void publishAviso("")} className="text-[12px] font-extrabold text-[var(--hos-muted)] hover:underline disabled:opacity-60">Quitar aviso</button>
        ) : null}
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
      {/* HOS-2026-014-01 (Judge D2): a confirmation is honor-system, not verified
          accountability. Render the caveat at EQUAL weight to the confirm control
          so a coordinator never reads "operativo" as a vouched-for identity. */}
      <p className="mt-[6px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">
        Confirmaciones por buena fe: la identidad de quien confirma no está verificada.
      </p>
      {announcing ? (
        <div className="mt-[10px] flex flex-wrap items-end gap-[8px] border-t border-[#E2E8E4] pt-[10px]">
          <label className="min-w-[220px] flex-1 text-[11px] font-extrabold text-[var(--hos-muted)]">
            Aviso (ej. &quot;Hoy entregan comida 2-5pm&quot;)
            <input type="text" maxLength={200} className={`${fieldBase} mt-[4px] w-full`} value={avisoText} onChange={(e) => setAvisoText(e.target.value)} />
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
          <button type="button" disabled={busy || !avisoText.trim()} onClick={() => void publishAviso(avisoText.trim())} className="h-[36px] rounded-[6px] bg-[#7A5200] px-[14px] text-[12px] font-extrabold text-white disabled:opacity-60">Publicar</button>
        </div>
      ) : null}
      {editing ? (
        <div className="mt-[10px] flex flex-wrap items-end gap-[8px] border-t border-[#E2E8E4] pt-[10px]">
          <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">Libres<input type="number" min={0} className={`${fieldBase} mt-[4px] w-[90px]`} value={free} onChange={(e) => setFree(e.target.value)} /></label>
          <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">Totales<input type="number" min={0} className={`${fieldBase} mt-[4px] w-[90px]`} value={total} onChange={(e) => setTotal(e.target.value)} /></label>
          <button type="button" disabled={busy} onClick={() => void save()} className="h-[36px] rounded-[6px] bg-[var(--hos-green)] px-[14px] text-[12px] font-extrabold text-white disabled:opacity-60">Guardar</button>
          {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function NeedCard({ view, orgs, onChanged }: { view: NeedView; orgs: Org[]; onChanged: () => void }) {
  const { need, org, claimedByOrg, freshness, matches } = view;
  const [claimer, setClaimer] = useState(orgs[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Assign/receive/cancel controls stay collapsed by default so a long column of
  // open needs reads as a scannable list, not a wall of dropdowns
  // (HOS-2026-013-01 console density).
  const [managing, setManaging] = useState(false);

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
          <span className="font-data text-[16px] font-bold text-[var(--hos-text)]">{need.quantity} {need.unit}</span>
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
        <div className="mt-[12px] border-t border-[#E2E8E4] pt-[10px]">
          {!managing ? (
            <button
              type="button"
              onClick={() => setManaging(true)}
              className="inline-flex h-[30px] items-center gap-[5px] text-[12px] font-extrabold text-[var(--hos-blue)] hover:underline"
            >
              <Truck className="h-[13px] w-[13px]" strokeWidth={2.4} />
              {need.status === "open" ? "Asignar" : "Gestionar"}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-[8px]">
              {need.status === "open" ? (
                <>
                  <select className={`${fieldBase} w-auto`} value={claimer} onChange={(e) => setClaimer(e.target.value)}>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
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
              <button type="button" onClick={() => setManaging(false)} className="text-[12px] font-extrabold text-[var(--hos-muted)] hover:underline">
                Cerrar
              </button>
              {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
            </div>
          )}
        </div>
      ) : null}
      {need.status === "open" && matches.length > 0 ? (
        <div className="mt-[12px] rounded-[6px] border border-[#CFE3F2] bg-[#F1F8FC] p-[10px]">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#0B4F76]">Sugerencias de <Term k="suministro">suministro</Term> (solo como guía)</div>
          <div className="mt-[8px] flex flex-col gap-[6px]">
            {matches.slice(0, 3).map((m) => (
              <div key={m.offer.id} className="flex items-start justify-between gap-[8px] text-[12px]">
                <span className="font-bold text-[var(--hos-text)]">{orgName(orgs, m.offer.orgId)} — {m.offer.quantity} {m.offer.unit} · {m.offer.district}</span>
                <span className="font-data font-bold text-[#0B4F76]">{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
