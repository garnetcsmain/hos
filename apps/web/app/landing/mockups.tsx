"use client";

import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplet,
  Flag,
  Fuel,
  Hospital,
  Layers,
  MapPin,
  Navigation,
  Package,
  Pill,
  Radio,
  ScanSearch,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  UserRoundSearch,
  Users,
  Utensils,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useLocale } from "./LocaleProvider";

// High-fidelity, non-interactive mockups of the future HOS platform. They reuse
// the operational app's color tokens (--hos-*) so the explainer previews look
// like the real product, not generic placeholders. All labels are bilingual.

const NAV_ICONS = [MapPin, UserRoundSearch, UserCheck, ScanSearch, ShieldCheck, Radio];

const DOTS: { x: number; y: number; color: string; Icon: typeof MapPin }[] = [
  { x: 24, y: 30, color: "var(--hos-red)", Icon: UserRoundSearch },
  { x: 55, y: 26, color: "var(--hos-green)", Icon: UserCheck },
  { x: 60, y: 34, color: "var(--hos-dark)", Icon: ScanSearch },
  { x: 70, y: 58, color: "var(--hos-blue)", Icon: Hospital },
  { x: 33, y: 64, color: "var(--hos-yellow)", Icon: Warehouse },
  { x: 80, y: 40, color: "#8B5CF6", Icon: Radio },
  { x: 44, y: 48, color: "var(--hos-red)", Icon: UserRoundSearch },
];

/** The operational "Family Reunification Map" — the future home screen. */
export function MapMockup() {
  const { tr } = useLocale();
  const metrics = [
    { value: "18,420", label: { en: "missing requests", es: "solicitudes" }, color: "var(--hos-red)" },
    { value: "7,318", label: { en: "found reports", es: "encontrados" }, color: "var(--hos-green)" },
    { value: "1,206", label: { en: "match candidates", es: "candidatos" }, color: "var(--hos-blue)" },
    { value: "438", label: { en: "families notified", es: "familias avisadas" }, color: "#111827" },
  ];
  const feed = [
    { en: "AI suggested a match", es: "La IA sugirió una coincidencia", t: "10:32" },
    { en: "Verification recorded", es: "Verificación registrada", t: "10:28" },
    { en: "New found report", es: "Nuevo reporte encontrado", t: "10:24" },
    { en: "Family notified", es: "Familia notificada", t: "10:19" },
  ];

  return (
    <div className="flex h-[440px] w-full bg-[#f8faf8] text-[var(--hos-text)]">
      {/* mini sidebar */}
      <div className="flex w-[56px] shrink-0 flex-col items-center gap-[14px] bg-[var(--hos-dark)] py-[16px]">
        <div className="text-[15px] font-extrabold text-white">H</div>
        <div className="mt-[6px] flex flex-col gap-[12px]">
          {NAV_ICONS.map((Icon, i) => (
            <span
              key={i}
              className={`flex h-[30px] w-[30px] items-center justify-center rounded-[8px] ${i === 0 ? "bg-[#20352C] text-white" : "text-[#89A096]"}`}
            >
              <Icon className="h-[16px] w-[16px]" strokeWidth={2.2} />
            </span>
          ))}
        </div>
      </div>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--hos-border)] bg-white px-[18px] py-[12px]">
          <div>
            <div className="text-[15px] font-extrabold leading-tight">
              {tr({ en: "Family Reunification Map", es: "Mapa de Reunificación Familiar" })}
            </div>
            <div className="text-[11px] font-semibold text-[var(--hos-muted)]">
              {tr({ en: "Venezuela response · live incident", es: "Respuesta Venezuela · incidente en vivo" })}
            </div>
          </div>
          <span className="flex items-center gap-[6px] rounded-full bg-[#FFEBD5] px-[10px] py-[4px] text-[10px] font-extrabold text-[#7A3D00]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#c94b3d]" />
            {tr({ en: "LIVE", es: "EN VIVO" })}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 gap-[14px] p-[14px]">
          {/* map */}
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-[10px] border border-[var(--hos-border)] bg-gradient-to-br from-[#e7efe9] via-[#eaf0ed] to-[#dfe9e3]">
            <div className="absolute left-[12px] top-[12px] flex items-center gap-[7px] rounded-full border border-[var(--hos-border)] bg-white/95 px-[10px] py-[5px] text-[10px] font-extrabold shadow-sm">
              <Search className="h-[12px] w-[12px] text-[var(--hos-muted)]" />
              {tr({ en: "La Guaira · Caracas", es: "La Guaira · Caracas" })}
            </div>
            <div className="absolute right-[12px] top-[12px] flex items-center gap-[6px] rounded-full bg-[#DDEFE8] px-[10px] py-[5px] text-[10px] font-extrabold text-[#16613F] shadow-sm">
              <Layers className="h-[12px] w-[12px]" />
              {tr({ en: "Trust layer on", es: "Capa de confianza" })}
            </div>
            {/* district blobs */}
            <div className="absolute left-[8%] top-[18%] h-[26%] w-[28%] rounded-[14px] border border-[#B9D4C8] bg-[#DDEFE8]/70" />
            <div className="absolute left-[46%] top-[20%] h-[28%] w-[30%] rounded-[14px] border border-[#e0d3aa] bg-[#F5E8C9]/70" />
            <div className="absolute left-[18%] top-[58%] h-[26%] w-[30%] rounded-[14px] border border-[#bccbe6] bg-[#E7EEF8]/70" />
            <div className="absolute left-[54%] top-[58%] h-[26%] w-[30%] rounded-[14px] border border-[#B9D4C8] bg-[#DDEFE8]/70" />
            {/* dots */}
            {DOTS.map((d, i) => (
              <span
                key={i}
                className="absolute flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-white shadow-md"
                style={{ left: `${d.x}%`, top: `${d.y}%`, background: d.color }}
              >
                <d.Icon className="h-[12px] w-[12px]" strokeWidth={2.4} />
              </span>
            ))}
            {/* match link */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <line x1="24%" y1="30%" x2="55%" y2="26%" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="5 5" />
            </svg>
          </div>

          {/* right rail */}
          <div className="flex w-[150px] shrink-0 flex-col gap-[10px]">
            <div className="grid grid-cols-2 gap-[8px]">
              {metrics.map((m) => (
                <div key={m.value} className="rounded-[8px] border border-[var(--hos-border)] bg-white px-[8px] py-[7px]">
                  <div className="font-data text-[15px] font-bold leading-none" style={{ color: m.color }}>
                    {m.value}
                  </div>
                  <div className="mt-[5px] text-[9px] font-bold leading-tight text-[var(--hos-muted)]">{tr(m.label)}</div>
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-[8px] border border-[var(--hos-border)] bg-white p-[10px]">
              <div className="text-[10px] font-extrabold text-[var(--hos-text)]">
                {tr({ en: "Recent activity", es: "Actividad reciente" })}
              </div>
              <div className="mt-[8px] flex flex-col gap-[8px]">
                {feed.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-[6px]">
                    <span className="truncate text-[9px] font-semibold text-[var(--hos-text)]">{tr({ en: f.en, es: f.es })}</span>
                    <span className="font-data text-[8px] font-bold text-[var(--hos-muted)]">{f.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Family-facing phone screen: the frictionless "I can't reach my family" intake. */
export function PhoneReportMockup() {
  const { tr } = useLocale();
  return (
    <div className="flex h-[480px] flex-col bg-[#f8faf8] px-[16px] pb-[16px] pt-[40px] text-[var(--hos-text)]">
      <div className="text-[13px] font-extrabold">{tr({ en: "HOS Response Kit", es: "Kit de Respuesta HOS" })}</div>
      <div className="mt-[2px] text-[10px] font-semibold text-[var(--hos-muted)]">
        {tr({ en: "Family reunification", es: "Reunificación familiar" })}
      </div>

      <button className="mt-[14px] flex items-center gap-[10px] rounded-[12px] bg-[var(--hos-red)] px-[14px] py-[13px] text-left text-white shadow-sm">
        <UserRoundSearch className="h-[20px] w-[20px]" strokeWidth={2.4} />
        <span>
          <span className="block text-[13px] font-extrabold leading-tight">{tr({ en: "I can't reach my family", es: "No puedo localizar a mi familia" })}</span>
          <span className="block text-[10px] font-semibold opacity-90">{tr({ en: "No account needed", es: "Sin necesidad de cuenta" })}</span>
        </span>
      </button>

      <div className="mt-[14px] flex flex-col gap-[9px]">
        {[
          { l: { en: "Person's name", es: "Nombre de la persona" }, v: "Carlos Pérez" },
          { l: { en: "City", es: "Ciudad" }, v: "Caracas" },
          { l: { en: "Phone", es: "Teléfono" }, v: "+58 ··· ·· ··" },
          { l: { en: "Relationship", es: "Parentesco" }, v: tr({ en: "Son", es: "Hijo" }) },
        ].map((f, i) => (
          <div key={i} className="rounded-[9px] border border-[var(--hos-border)] bg-white px-[11px] py-[8px]">
            <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--hos-muted)]">{tr(f.l)}</div>
            <div className="mt-[2px] text-[12px] font-semibold">{f.v}</div>
          </div>
        ))}
        <div className="flex items-center gap-[8px] rounded-[9px] border border-dashed border-[var(--hos-border)] bg-white px-[11px] py-[10px] text-[11px] font-semibold text-[var(--hos-muted)]">
          <Camera className="h-[15px] w-[15px]" /> {tr({ en: "Add a photo (optional)", es: "Agregar foto (opcional)" })}
        </div>
      </div>

      <button className="mt-auto rounded-[10px] bg-[var(--hos-dark)] py-[12px] text-[12px] font-extrabold text-white">
        {tr({ en: "Start the search", es: "Comenzar la búsqueda" })}
      </button>
    </div>
  );
}

/** Family-facing phone screen: a possible match arrives. */
export function PhoneMatchMockup() {
  const { tr } = useLocale();
  return (
    <div className="flex h-[480px] flex-col bg-[#f8faf8] px-[16px] pb-[16px] pt-[40px] text-[var(--hos-text)]">
      <div className="flex items-center gap-[7px] text-[var(--hos-green)]">
        <Bell className="h-[15px] w-[15px]" />
        <span className="text-[11px] font-extrabold uppercase tracking-wide">{tr({ en: "Notification", es: "Notificación" })}</span>
      </div>

      <div className="mt-[10px] rounded-[14px] border border-[var(--hos-border)] bg-white p-[14px] shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-extrabold">{tr({ en: "Possible match found", es: "Posible coincidencia" })}</span>
          <span className="rounded-full bg-[#DDEFE8] px-[8px] py-[3px] font-data text-[12px] font-bold text-[#16613F]">94%</span>
        </div>

        <div className="mt-[12px] flex items-center gap-[10px]">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[var(--hos-accent-soft)] text-[15px] font-extrabold text-[#2f6fa0]">CP</div>
          <div>
            <div className="text-[13px] font-extrabold">Carlos Pérez</div>
            <div className="text-[10px] font-semibold text-[var(--hos-muted)]">{tr({ en: "Found · Shelter 17 · Alive", es: "Encontrado · Refugio 17 · Con vida" })}</div>
          </div>
        </div>

        <div className="mt-[12px] flex flex-col gap-[6px]">
          {[
            { en: "Name and neighborhood match", es: "Nombre y barrio coinciden" },
            { en: "Reported by a verified shelter", es: "Reportado por un refugio verificado" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-[7px] text-[10px] font-semibold text-[var(--hos-text)]">
              <Check className="h-[13px] w-[13px] text-[var(--hos-green)]" strokeWidth={2.6} /> {tr({ en: b.en, es: b.es })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[12px] rounded-[10px] bg-[var(--hos-dark)] p-[11px]">
        <div className="flex items-center gap-[7px] text-[11px] font-extrabold text-white">
          <ShieldCheck className="h-[14px] w-[14px] text-[#A7F3D0]" />
          {tr({ en: "A candidate to verify", es: "Un candidato por verificar" })}
        </div>
        <p className="mt-[6px] text-[9px] font-semibold leading-snug text-[#D9E7E0]">
          {tr({ en: "This is not confirmed yet. A trained person checks it before it is final.", es: "Aún no está confirmado. Una persona capacitada lo revisa antes de cerrarlo." })}
        </p>
      </div>

      <button className="mt-auto flex items-center justify-center gap-[7px] rounded-[10px] bg-[var(--hos-green)] py-[12px] text-[12px] font-extrabold text-white">
        {tr({ en: "Review this match", es: "Revisar esta coincidencia" })}
        <ChevronRight className="h-[15px] w-[15px]" />
      </button>
    </div>
  );
}

/* ----------------------- response-coordination mockups -------------------- */

const NEED_PINS: { x: number; y: number; color: string; Icon: typeof MapPin }[] = [
  { x: 22, y: 28, color: "var(--hos-yellow)", Icon: Utensils },
  { x: 48, y: 22, color: "var(--hos-blue)", Icon: Droplet },
  { x: 66, y: 40, color: "var(--hos-red)", Icon: Pill },
  { x: 36, y: 56, color: "#8B5CF6", Icon: Fuel },
  { x: 74, y: 62, color: "var(--hos-blue)", Icon: Droplet },
  { x: 56, y: 70, color: "var(--hos-yellow)", Icon: Utensils },
];

/** Needs Map: what each area needs and what blocks the way. */
export function NeedsMapMockup() {
  const { tr } = useLocale();
  const needs = [
    { Icon: Droplet, color: "var(--hos-blue)", l: { en: "Clean water", es: "Agua potable" }, v: "12 zonas" },
    { Icon: Pill, color: "var(--hos-red)", l: { en: "Medicine", es: "Medicina" }, v: "9 zonas" },
    { Icon: Utensils, color: "var(--hos-yellow)", l: { en: "Food", es: "Comida" }, v: "7 zonas" },
    { Icon: Fuel, color: "#8B5CF6", l: { en: "Fuel", es: "Combustible" }, v: "5 zonas" },
  ];
  return (
    <div className="flex h-[440px] w-full flex-col bg-[#f8faf8] text-[var(--hos-text)]">
      <div className="flex items-center justify-between border-b border-[var(--hos-border)] bg-white px-[18px] py-[12px]">
        <div>
          <div className="text-[15px] font-extrabold leading-tight">{tr({ en: "Needs Map", es: "Mapa de necesidades" })}</div>
          <div className="text-[11px] font-semibold text-[var(--hos-muted)]">{tr({ en: "What each area needs, live", es: "Lo que necesita cada zona, en vivo" })}</div>
        </div>
        <span className="flex items-center gap-[6px] rounded-full bg-[#FDE7E2] px-[10px] py-[4px] text-[10px] font-extrabold text-[#9B2D1F]">
          <AlertTriangle className="h-[11px] w-[11px]" /> {tr({ en: "3 blocked routes", es: "3 rutas bloqueadas" })}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 gap-[14px] p-[14px]">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-[10px] border border-[var(--hos-border)] bg-gradient-to-br from-[#e7efe9] via-[#eaf0ed] to-[#dfe9e3]">
          {/* roads */}
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M 10 70 Q 120 40 240 90" fill="none" stroke="#c2cfc8" strokeWidth="6" strokeLinecap="round" />
            <path d="M 40 10 Q 90 110 150 200" fill="none" stroke="#c2cfc8" strokeWidth="6" strokeLinecap="round" />
            <path d="M 150 30 Q 200 120 120 210" fill="none" stroke="#e0a99f" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 9" />
          </svg>
          {/* road-closure marker */}
          <span className="absolute left-[42%] top-[46%] flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[6px] border-2 border-white bg-[var(--hos-red)] text-white shadow-md">
            <AlertTriangle className="h-[12px] w-[12px]" strokeWidth={2.4} />
          </span>
          {NEED_PINS.map((p, i) => (
            <span
              key={i}
              className="absolute flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-white shadow-md"
              style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.color }}
            >
              <p.Icon className="h-[12px] w-[12px]" strokeWidth={2.4} />
            </span>
          ))}
        </div>
        <div className="flex w-[150px] shrink-0 flex-col gap-[8px]">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--hos-muted)]">{tr({ en: "Top needs now", es: "Necesidades urgentes" })}</div>
          {needs.map((n, i) => (
            <div key={i} className="flex items-center gap-[9px] rounded-[8px] border border-[var(--hos-border)] bg-white px-[9px] py-[8px]">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px]" style={{ background: `color-mix(in srgb, ${n.color} 16%, white)`, color: n.color }}>
                <n.Icon className="h-[14px] w-[14px]" strokeWidth={2.3} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold leading-tight">{tr(n.l)}</div>
                <div className="text-[10px] font-semibold text-[var(--hos-muted)]">{n.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Volunteer Operations: who can help, their skills, and a nearby assignment. */
export function VolunteerOpsMockup() {
  const { tr } = useLocale();
  const vols = [
    { initials: "MR", name: "María R.", skills: [{ en: "Nurse", es: "Enfermera" }, { en: "Driver", es: "Conductora" }], km: "1.2 km", busy: false, job: { en: "Shelter 17 medical", es: "Médico Refugio 17" } },
    { initials: "JL", name: "José L.", skills: [{ en: "Rescue", es: "Rescate" }, { en: "Radio", es: "Radio" }], km: "2.6 km", busy: true, job: { en: "Search · La Guaira", es: "Búsqueda · La Guaira" } },
    { initials: "AC", name: "Ana C.", skills: [{ en: "Logistics", es: "Logística" }], km: "0.8 km", busy: false, job: null },
  ];
  return (
    <div className="flex h-[440px] w-full flex-col bg-[#f8faf8] text-[var(--hos-text)]">
      <div className="flex items-center justify-between border-b border-[var(--hos-border)] bg-white px-[18px] py-[12px]">
        <div>
          <div className="text-[15px] font-extrabold leading-tight">{tr({ en: "Volunteer Operations", es: "Operaciones de voluntarios" })}</div>
          <div className="text-[11px] font-semibold text-[var(--hos-muted)]">{tr({ en: "Right skills, right place", es: "Las habilidades correctas, cerca" })}</div>
        </div>
        <span className="flex items-center gap-[6px] rounded-full bg-[#DDEFE8] px-[10px] py-[4px] text-[10px] font-extrabold text-[#16613F]">
          <Users className="h-[11px] w-[11px]" /> 142 {tr({ en: "ready", es: "listos" })}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[10px] p-[14px]">
        {vols.map((v, i) => (
          <div key={i} className="flex items-center gap-[12px] rounded-[10px] border border-[var(--hos-border)] bg-white px-[13px] py-[11px]">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[var(--hos-accent-soft)] text-[13px] font-extrabold text-[#2f6fa0]">{v.initials}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[8px]">
                <span className="text-[13px] font-extrabold">{v.name}</span>
                <span className={`h-[7px] w-[7px] rounded-full ${v.busy ? "bg-[var(--hos-yellow)]" : "bg-[var(--hos-green)]"}`} />
                <span className="text-[10px] font-semibold text-[var(--hos-muted)]">{v.busy ? tr({ en: "on a mission", es: "en misión" }) : tr({ en: "available", es: "disponible" })}</span>
              </div>
              <div className="mt-[5px] flex flex-wrap items-center gap-[5px]">
                {v.skills.map((s, j) => (
                  <span key={j} className="inline-flex items-center gap-[4px] rounded-full bg-[var(--hos-bg)] px-[7px] py-[2px] text-[9.5px] font-bold text-[var(--hos-muted)]">
                    <Wrench className="h-[9px] w-[9px]" /> {tr(s)}
                  </span>
                ))}
                <span className="inline-flex items-center gap-[3px] text-[9.5px] font-bold text-[var(--hos-muted)]">
                  <Navigation className="h-[9px] w-[9px]" /> {v.km}
                </span>
              </div>
            </div>
            {v.job ? (
              <span className="max-w-[96px] shrink-0 truncate rounded-[7px] bg-[#EAF2EE] px-[8px] py-[6px] text-[9.5px] font-bold text-[#16613F]">{tr(v.job)}</span>
            ) : (
              <span className="shrink-0 rounded-[7px] bg-[var(--hos-dark)] px-[10px] py-[6px] text-[10px] font-extrabold text-white">{tr({ en: "Assign", es: "Asignar" })}</span>
            )}
          </div>
        ))}
        <div className="mt-auto flex items-center gap-[8px] rounded-[8px] bg-[var(--hos-dark)] px-[12px] py-[9px] text-[10px] font-bold text-[#D9E7E0]">
          <Check className="h-[13px] w-[13px] text-[#A7F3D0]" /> {tr({ en: "Matched to the closest job that fits their skills", es: "Conectados con la tarea cercana que va con sus habilidades" })}
        </div>
      </div>
    </div>
  );
}

const SHIPMENTS: {
  id: string;
  Icon: typeof Package;
  what: { en: string; es: string };
  route: string;
  pct: number;
  status: "transit" | "delivered" | "blocked";
}[] = [
  { id: "PAL-1042", Icon: Droplet, what: { en: "Water · 600 L", es: "Agua · 600 L" }, route: "Caracas → Petare", pct: 64, status: "transit" },
  { id: "PAL-1039", Icon: Utensils, what: { en: "Food · 320 kits", es: "Comida · 320 kits" }, route: "Maiquetía → La Guaira", pct: 100, status: "delivered" },
  { id: "PAL-1051", Icon: Pill, what: { en: "Medicine · 12 boxes", es: "Medicina · 12 cajas" }, route: "Caracas → Catia", pct: 38, status: "blocked" },
];

/** Resource & Logistics: track every box and truck end to end, blockages flagged. */
export function LogisticsMockup() {
  const { tr } = useLocale();
  const chip = {
    transit: { bg: "#EAF1F8", fg: "#2f6fa0", Icon: Truck, l: { en: "In transit", es: "En camino" } },
    delivered: { bg: "#DDEFE8", fg: "#16613F", Icon: CheckCircle2, l: { en: "Delivered", es: "Entregado" } },
    blocked: { bg: "#FDE7E2", fg: "#9B2D1F", Icon: Flag, l: { en: "Blocked · reported", es: "Bloqueado · reportado" } },
  } as const;
  return (
    <div className="flex h-[440px] w-full flex-col bg-[#f8faf8] text-[var(--hos-text)]">
      <div className="flex items-center justify-between border-b border-[var(--hos-border)] bg-white px-[18px] py-[12px]">
        <div>
          <div className="text-[15px] font-extrabold leading-tight">{tr({ en: "Resource & Logistics", es: "Recursos y logística" })}</div>
          <div className="text-[11px] font-semibold text-[var(--hos-muted)]">{tr({ en: "Follow every box, end to end", es: "Sigue cada caja, de principio a fin" })}</div>
        </div>
        <span className="flex items-center gap-[6px] rounded-full bg-[#EAF1F8] px-[10px] py-[4px] text-[10px] font-extrabold text-[#2f6fa0]">
          <Package className="h-[11px] w-[11px]" /> 1,204 {tr({ en: "tracked", es: "rastreados" })}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[11px] p-[14px]">
        {SHIPMENTS.map((s) => {
          const c = chip[s.status];
          const blocked = s.status === "blocked";
          return (
            <div key={s.id} className={`rounded-[10px] border bg-white px-[13px] py-[11px] ${blocked ? "border-[#E7B6AC]" : "border-[var(--hos-border)]"}`}>
              <div className="flex items-center gap-[10px]">
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--hos-bg)] text-[var(--hos-text)]">
                  <s.Icon className="h-[16px] w-[16px]" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[8px]">
                    <span className="font-data text-[11px] font-bold text-[var(--hos-muted)]">{s.id}</span>
                    <span className="truncate text-[12px] font-extrabold">{tr(s.what)}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--hos-muted)]">{s.route}</div>
                </div>
                <span className="flex shrink-0 items-center gap-[5px] rounded-full px-[8px] py-[4px] text-[9.5px] font-extrabold" style={{ background: c.bg, color: c.fg }}>
                  <c.Icon className="h-[11px] w-[11px]" /> {tr(c.l)}
                </span>
              </div>
              <div className="mt-[9px] h-[5px] w-full overflow-hidden rounded-full bg-[var(--hos-bg)]">
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: blocked ? "var(--hos-red)" : s.status === "delivered" ? "var(--hos-green)" : "var(--hos-blue)" }} />
              </div>
              {blocked ? (
                <div className="mt-[8px] flex items-center gap-[6px] text-[10px] font-bold text-[#9B2D1F]">
                  <AlertTriangle className="h-[12px] w-[12px]" /> {tr({ en: "Did not reach Catia. A volunteer reported it for review.", es: "No llegó a Catia. Un voluntario lo reportó para revisión." })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Phone screen: report aid that did not arrive (the accountability flow). */
export function AidReportMockup() {
  const { tr } = useLocale();
  return (
    <div className="flex h-[480px] flex-col bg-[#f8faf8] px-[16px] pb-[16px] pt-[40px] text-[var(--hos-text)]">
      <div className="flex items-center gap-[7px] text-[#9B2D1F]">
        <Flag className="h-[15px] w-[15px]" />
        <span className="text-[11px] font-extrabold uppercase tracking-wide">{tr({ en: "Aid accountability", es: "Rendición de cuentas" })}</span>
      </div>
      <div className="mt-[8px] text-[15px] font-extrabold leading-snug">{tr({ en: "Report aid that didn't arrive", es: "Reporta ayuda que no llegó" })}</div>

      <div className="mt-[12px] flex flex-col gap-[9px]">
        {[
          { l: { en: "What was sent", es: "Qué se envió" }, v: tr({ en: "Water · 600 L", es: "Agua · 600 L" }) },
          { l: { en: "Where it should go", es: "A dónde debía llegar" }, v: "Catia, Caracas" },
          { l: { en: "What happened", es: "Qué pasó" }, v: tr({ en: "Held at a checkpoint", es: "Retenida en un punto de control" }) },
        ].map((f, i) => (
          <div key={i} className="rounded-[9px] border border-[var(--hos-border)] bg-white px-[11px] py-[8px]">
            <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--hos-muted)]">{tr(f.l)}</div>
            <div className="mt-[2px] text-[12px] font-semibold">{f.v}</div>
          </div>
        ))}
        <div className="flex items-center gap-[8px] rounded-[9px] border border-dashed border-[var(--hos-border)] bg-white px-[11px] py-[10px] text-[11px] font-semibold text-[var(--hos-muted)]">
          <Camera className="h-[15px] w-[15px]" /> {tr({ en: "Add a photo as evidence", es: "Agrega una foto como evidencia" })}
        </div>
      </div>

      <div className="mt-[12px] rounded-[10px] bg-[var(--hos-dark)] p-[11px]">
        <div className="flex items-center gap-[7px] text-[11px] font-extrabold text-white">
          <ShieldCheck className="h-[14px] w-[14px] text-[#A7F3D0]" /> {tr({ en: "Checked by people", es: "Revisado por personas" })}
        </div>
        <p className="mt-[6px] text-[9px] font-semibold leading-snug text-[#D9E7E0]">
          {tr({ en: "Your report carries evidence, time, and place. A verified organization reviews it.", es: "Tu reporte lleva evidencia, hora y lugar. Una organización verificada lo revisa." })}
        </p>
      </div>

      <button className="mt-auto flex items-center justify-center gap-[7px] rounded-[10px] bg-[var(--hos-red)] py-[12px] text-[12px] font-extrabold text-white">
        <Flag className="h-[15px] w-[15px]" /> {tr({ en: "Send report", es: "Enviar reporte" })}
      </button>
    </div>
  );
}
