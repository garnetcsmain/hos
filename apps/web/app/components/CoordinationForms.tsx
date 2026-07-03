"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Check, LocateFixed, Search, Sparkles } from "lucide-react";
import { createNeed, createOffer, createOrg, createSite } from "@/app/lib/client/coordination";
import { searchAddress, type GeocodeHit } from "@/app/lib/client/geocode";
import { districtFromText, nearestDistrict } from "@/app/lib/coordination/classify";
import { draftFromText } from "@/app/lib/coordination/draft";
import { DISTRICT_OPTIONS, type LatLng } from "@/app/lib/geo/districts";
import type { NeedCategory, Org, OrgKind, Site, SiteCategory, Urgency } from "@/app/lib/domain/coordination";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  ORG_KIND_LABEL,
  SITE_CATEGORY_LABEL,
  SITE_PIN,
  URGENCY,
} from "@/app/components/CoordinationLabels";

const SitePinMap = dynamic(() => import("@/app/components/SitePinMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-[6px] bg-[#EEF2EF] text-[12px] font-bold text-[var(--hos-muted)]">
      Cargando mapa…
    </div>
  ),
});

const fieldBase =
  "w-full rounded-[6px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[10px] py-[8px] text-[13px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as NeedCategory[];
const SITE_CATEGORIES: SiteCategory[] = ["acopio", "refugio", "medico", "internet", "mascotas", "otro"];
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
      <option value="" disabled>Elija el distrito…</option>
      {DISTRICT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  );
}

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
            className={`flex h-[38px] items-center gap-[7px] rounded-[6px] border px-[10px] text-[12px] font-extrabold transition ${active ? "border-[var(--hos-dark)] bg-[var(--hos-dark)] text-white" : "border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:text-[var(--hos-text)]"}`}
          >
            <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2.4} />
            {CATEGORY_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}

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
            className={`flex h-[38px] items-center gap-[7px] rounded-[6px] border px-[10px] text-[12px] font-extrabold transition ${active ? "border-[var(--hos-dark)] bg-[var(--hos-dark)] text-white" : "border-[var(--hos-border)] bg-white text-[var(--hos-muted)] hover:text-[var(--hos-text)]"}`}
          >
            <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-extrabold text-white" style={{ background: SITE_PIN[c].color }}>
              {SITE_PIN[c].glyph}
            </span>
            {SITE_CATEGORY_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}

function OrgSelectHint({ orgs }: { orgs: Org[] }) {
  if (orgs.length > 1) return null;
  return (
    <p className="mt-[4px] text-[11px] font-bold text-[var(--hos-muted)]">
      ¿Publica en nombre de una organización? Regístrela primero con &quot;Registrar organización&quot;.
    </p>
  );
}

// Unit hint per category so "Cantidad/Unidad" adapts to what is being offered
// (human feedback 2026-07-03: the form should change with the category).
const UNIT_HINT: Record<NeedCategory, string> = {
  rescue: "personas, cuadrillas…",
  water: "L, botellones…",
  food: "cajas, raciones…",
  formula: "latas, pañales…",
  medical: "cajas, kits…",
  shelter: "colchonetas, cobijas…",
  hygiene: "kits, unidades…",
  clothing: "piezas, bolsas…",
  other: "unidad…",
};

// Coverage radius choices for a site (meters). 0 = a single point.
const RADIUS_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: "Solo el punto exacto" },
  { value: 150, label: "≈ 1 cuadra (150 m)" },
  { value: 500, label: "Vecindario (500 m)" },
  { value: 1500, label: "Sector (1.5 km)" },
  { value: 5000, label: "Zona amplia (5 km)" },
];

/** Searchable org selector — there will be many orgs, so a plain <select> won't
 *  scale (human feedback 2026-07-03). Filters by name; onPick fires with the
 *  chosen org so callers can pre-fill the district from that org's site. */
function OrgCombobox({
  orgs,
  value,
  onPick,
  placeholder = "Buscar organización…",
}: {
  orgs: Org[];
  value: string;
  onPick: (org: Org) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = orgs.find((o) => o.id === value) ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? orgs.filter((o) => o.name.toLowerCase().includes(q)) : orgs;
    return list.slice(0, 30);
  }, [orgs, query]);

  return (
    <div className="relative">
      <input
        className={fieldBase}
        value={open ? query : selected?.name ?? ""}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <ul className="absolute z-[1000] mt-[4px] max-h-[220px] w-full overflow-auto rounded-[6px] border border-[var(--hos-border)] bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-[10px] py-[8px] text-[12px] font-bold text-[var(--hos-muted)]">Sin coincidencias</li>
          ) : (
            filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPick(o);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-[8px] px-[10px] py-[8px] text-left text-[12px] font-bold text-[var(--hos-text)] hover:bg-[#F4F8F5]"
                >
                  {o.name}
                  {o.id === value ? <Check className="h-[13px] w-[13px] text-[var(--hos-green)]" strokeWidth={2.6} /> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

/** Free-text draft box: type a sentence, the deterministic classifier fills the
 *  form as a DRAFT to review. Never submits (human direction 2026-07-03). */
function FreeTextDraft({ verb, onDraft }: { verb: string; onDraft: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-[6px] border border-dashed border-[var(--hos-border)] bg-[#F8FAF8] p-[10px]">
      <label className="block text-[11px] font-extrabold text-[var(--hos-muted)]">
        Escríbalo en una frase y el sistema completa el formulario (usted revisa antes de publicar)
        <textarea
          className={`${fieldBase} mt-[4px] min-h-[52px] resize-y`}
          placeholder={`Ej.: "${verb}"`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => onDraft(text)}
        className="mt-[8px] inline-flex h-[34px] items-center gap-[6px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[12px] text-[12px] font-extrabold text-[var(--hos-text)] disabled:opacity-60"
      >
        <Sparkles className="h-[14px] w-[14px]" strokeWidth={2.4} /> Completar formulario
      </button>
    </div>
  );
}

/** The active site (if any) an org runs — used to pre-fill district from the
 *  address the org already gave (human feedback: district is redundant then). */
function orgSite(sites: Site[], orgId: string): Site | undefined {
  return sites.find((s) => s.orgId === orgId && s.status === "active");
}

/** Small labeled input for the free-text "¿qué tipo?" that appears when the
 *  category is Otro — captured into the audit log for later category-mining. */
function OtherLabelField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="¿Qué tipo? (ayúdenos a mejorar las categorías)">
      <input className={fieldBase} maxLength={80} placeholder="Descríbalo en pocas palabras" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function PostNeedForm({ orgs, sites = [], onChanged }: { orgs: Org[]; sites?: Site[]; onChanged: () => void }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [siteId, setSiteId] = useState("");
  const [category, setCategory] = useState<NeedCategory>("water");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [notes, setNotes] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const { busy, error, run } = useSubmit(onChanged);
  const siteOptions = district ? sites.filter((s) => s.district === district) : sites;

  const pickOrg = (org: Org) => {
    setOrgId(org.id);
    const s = orgSite(sites, org.id);
    if (s && !district) setDistrict(s.district); // org already told us where it is
  };

  const applyDraft = (text: string) => {
    const d = draftFromText(text, orgs);
    setCategory(d.category);
    setUrgency(d.urgency);
    if (d.district) setDistrict(d.district);
    if (d.quantity !== null) setQuantity(String(d.quantity));
    if (d.unit) setUnit(d.unit);
    if (d.orgId) setOrgId(d.orgId);
    setNotes(text.trim());
  };

  return (
    <form
      className="flex flex-col gap-[10px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => createNeed({ orgId, siteId: siteId || undefined, district, category, quantity: Number(quantity) || 1, unit, urgency, notes, otherLabel: category === "other" ? otherLabel : undefined }),
          () => { setDistrict(""); setSiteId(""); setQuantity("1"); setUnit(""); setNotes(""); setOtherLabel(""); },
        );
      }}
    >
      <FreeTextDraft verb="Se necesitan 40 litros de agua en Maiquetía, urgente" onDraft={applyDraft} />
      <Field label="¿Qué se necesita?"><CategoryPicker value={category} onChange={setCategory} /></Field>
      {category === "other" ? <OtherLabelField value={otherLabel} onChange={setOtherLabel} /> : null}
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Organización que lo pide">
          <OrgCombobox orgs={orgs} value={orgId} onPick={pickOrg} />
          <OrgSelectHint orgs={orgs} />
        </Field>
        <Field label="Urgencia">
          <select className={fieldBase} value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>{URGENCIES.map((u) => <option key={u} value={u}>{URGENCY[u].label}</option>)}</select>
        </Field>
        <Field label="Distrito">
          <DistrictSelect value={district} onChange={(d) => { setDistrict(d); setSiteId(""); }} />
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
            {siteOptions.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.district}</option>)}
          </select>
        </Field>
        <Field label="Cantidad"><input type="number" min={1} className={fieldBase} value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
        <Field label={`Unidad (${UNIT_HINT[category]})`}><input className={fieldBase} placeholder={UNIT_HINT[category]} value={unit} onChange={(e) => setUnit(e.target.value)} /></Field>
      </div>
      <Field label="Detalle o punto de referencia (opcional)"><input className={fieldBase} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">Publicar necesidad</button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}

export function PostOfferForm({ orgs, sites = [], onChanged }: { orgs: Org[]; sites?: Site[]; onChanged: () => void }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [districtFromOrg, setDistrictFromOrg] = useState(false);
  const [category, setCategory] = useState<NeedCategory>("water");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const { busy, error, run } = useSubmit(onChanged);

  const pickOrg = (org: Org) => {
    setOrgId(org.id);
    const s = orgSite(sites, org.id);
    if (s) {
      setDistrict(s.district); // the org already gave its address; reuse it
      setDistrictFromOrg(true);
    }
  };

  const applyDraft = (text: string) => {
    const d = draftFromText(text, orgs);
    setCategory(d.category);
    if (d.district) { setDistrict(d.district); setDistrictFromOrg(false); }
    if (d.quantity !== null) setQuantity(String(d.quantity));
    if (d.unit) setUnit(d.unit);
    if (d.orgId) pickOrg(orgs.find((o) => o.id === d.orgId)!);
  };

  return (
    <form
      className="flex flex-col gap-[10px]"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => createOffer({ orgId, district, category, quantity: Number(quantity) || 1, unit, otherLabel: category === "other" ? otherLabel : undefined }), () => { setDistrict(""); setDistrictFromOrg(false); setQuantity("1"); setUnit(""); setOtherLabel(""); });
      }}
    >
      <FreeTextDraft verb="Tenemos 200 litros de agua para donar en Catia" onDraft={applyDraft} />
      <Field label="¿Qué se ofrece?"><CategoryPicker value={category} onChange={setCategory} /></Field>
      {category === "other" ? <OtherLabelField value={otherLabel} onChange={setOtherLabel} /> : null}
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Organización que lo ofrece">
          <OrgCombobox orgs={orgs} value={orgId} onPick={pickOrg} />
          <OrgSelectHint orgs={orgs} />
        </Field>
        <Field label={districtFromOrg ? "Distrito (tomado de la dirección de la organización)" : "Distrito donde está"}>
          <DistrictSelect value={district} onChange={(d) => { setDistrict(d); setDistrictFromOrg(false); }} />
        </Field>
        <Field label="Cantidad"><input type="number" min={1} className={fieldBase} value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
        <Field label={`Unidad (${UNIT_HINT[category]})`}><input className={fieldBase} placeholder={UNIT_HINT[category]} value={unit} onChange={(e) => setUnit(e.target.value)} /></Field>
      </div>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-green)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">Publicar suministro</button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}

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
  const [otherLabel, setOtherLabel] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [radiusM, setRadiusM] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locating, setLocating] = useState(false);
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

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError("Este dispositivo no permite detectar la ubicación.");
      return;
    }
    setLocating(true);
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pin = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(pin);
        if (!district) setDistrict(districtForPick(address, pin));
        setLocating(false);
      },
      () => {
        setSearchError("No se pudo obtener su ubicación. Fíjela en el mapa.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
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
          () => createSite({ name, orgId, category, district, lat: pos?.lat ?? null, lng: pos?.lng ?? null, radiusM: radiusM || null, bedsTotal: Number(bedsTotal) || 0, bedsFree: Number(bedsFree) || 0, notes: address.trim() ? `Dirección: ${address.trim()}` : "", otherLabel: category === "otro" ? otherLabel : undefined }),
          () => { setName(""); setDistrict(""); setAddress(""); setPos(null); setHits([]); setRadiusM(0); setBedsTotal("0"); setBedsFree("0"); setOtherLabel(""); },
        );
      }}
    >
      <Field label="Tipo de punto"><SiteCategoryPicker value={category} onChange={setCategory} /></Field>
      {category === "otro" ? <OtherLabelField value={otherLabel} onChange={setOtherLabel} /> : null}
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Nombre del sitio"><input className={fieldBase} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Organización responsable">
          <OrgCombobox orgs={orgs} value={orgId} onPick={(o) => setOrgId(o.id)} />
          <OrgSelectHint orgs={orgs} />
        </Field>
      </div>
      <Field label="Dirección — busque, use su ubicación, y ajuste el punto en el mapa">
        <div className="flex gap-[8px] max-[520px]:flex-col">
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
          <div className="flex gap-[8px]">
            <button type="button" disabled={searching || !address.trim()} onClick={() => void search()} className="inline-flex h-[38px] shrink-0 items-center gap-[6px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[12px] text-[12px] font-extrabold text-[var(--hos-text)] disabled:opacity-60">
              <Search className="h-[14px] w-[14px]" strokeWidth={2.4} /> {searching ? "Buscando…" : "Buscar"}
            </button>
            <button type="button" disabled={locating} onClick={useMyLocation} title="Usar mi ubicación actual" className="inline-flex h-[38px] shrink-0 items-center gap-[6px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[12px] text-[12px] font-extrabold text-[var(--hos-text)] disabled:opacity-60">
              <LocateFixed className="h-[14px] w-[14px]" strokeWidth={2.4} /> {locating ? "…" : "Mi ubicación"}
            </button>
          </div>
        </div>
        {searchError ? <p className="mt-[4px] text-[11px] font-bold text-[var(--hos-warn)]">{searchError}</p> : null}
        {hits.length > 0 ? (
          <ul className="mt-[6px] flex flex-col gap-[4px]">
            {hits.map((h) => (
              <li key={`${h.lat},${h.lng}`}>
                <button type="button" onClick={() => pick(h)} className="w-full rounded-[6px] border border-[var(--hos-border)] bg-white px-[10px] py-[7px] text-left text-[12px] font-bold text-[var(--hos-text)] hover:border-[var(--hos-dark)]">
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
            radiusM={radiusM}
            onChange={(p) => {
              setPos(p);
              if (!district) setDistrict(districtForPick(address, p));
            }}
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
        <Field label="Distrito"><DistrictSelect value={district} onChange={setDistrict} /></Field>
        <Field label="Área de cobertura (para que varios grupos puedan compartir una zona)">
          <select className={fieldBase} value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))}>
            {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
      </div>
      {category === "refugio" ? (
        <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
          <Field label="Camas libres"><input type="number" min={0} className={fieldBase} value={bedsFree} onChange={(e) => setBedsFree(e.target.value)} /></Field>
          <Field label="Camas totales"><input type="number" min={0} className={fieldBase} value={bedsTotal} onChange={(e) => setBedsTotal(e.target.value)} /></Field>
        </div>
      ) : null}
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !name || !orgId || !district} className="h-[38px] rounded-[6px] bg-[var(--hos-blue)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">Agregar sitio</button>
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
        <Field label="Nombre de la organización"><input className={fieldBase} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Tipo">
          <select className={fieldBase} value={kind} onChange={(e) => setKind(e.target.value as OrgKind)}>
            {ORG_KINDS.map((k) => <option key={k} value={k}>{ORG_KIND_LABEL[k]}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-[10px]">
        <button type="submit" disabled={busy || !name} className="h-[38px] rounded-[6px] bg-[var(--hos-dark)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60">Registrar organización</button>
        {error ? <span className="text-[12px] font-bold text-[var(--hos-red)]">{error}</span> : null}
      </div>
    </form>
  );
}
