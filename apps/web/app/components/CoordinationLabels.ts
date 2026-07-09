import {
  Baby,
  Droplets,
  HelpCircle,
  Home,
  Shirt,
  Siren,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NeedCategory, OrgKind, SiteCategory, Urgency } from "@/app/lib/domain/coordination";

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

export const SITE_PIN: Record<SiteCategory, { color: string; glyph: string }> = {
  acopio: { color: "#2E7D5B", glyph: "A" },
  refugio: { color: "#1D6FA8", glyph: "R" },
  medico: { color: "#B4392E", glyph: "+" },
  internet: { color: "#6C4BC8", glyph: "i" },
  mascotas: { color: "#C77E1E", glyph: "M" },
  otro: { color: "#6B7280", glyph: "·" },
};

export const SITE_CATEGORY_STYLE: Record<SiteCategory, string> = {
  acopio: "bg-[#DDEFE8] text-[#16613F]",
  refugio: "bg-[#DCEEF8] text-[#0B4F76]",
  medico: "bg-[#F6DAD5] text-[#8A2A1E]",
  internet: "bg-[#E8E4F4] text-[#4B3D8F]",
  mascotas: "bg-[#FFF1D6] text-[#7A3D00]",
  otro: "bg-[#EEF2EF] text-[var(--hos-muted)]",
};

export const URGENCY: Record<Urgency, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-[#EEF2EF] text-[var(--hos-muted)]" },
  normal: { label: "Normal", className: "bg-[#DCEEF8] text-[#0B4F76]" },
  high: { label: "Alta", className: "bg-[#FFF1D6] text-[#7A3D00]" },
  critical: { label: "Crítica", className: "bg-[#F6DAD5] text-[#8A2A1E]" },
};

export const NEED_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: "Abierta", className: "bg-[#FDF1D8] text-[var(--hos-warn)]" },
  claimed: { label: "Asignada", className: "bg-[#DCEEF8] text-[#0B4F76]" },
  received: { label: "Recibida", className: "bg-[#DDEFE8] text-[#16613F]" },
  cancelled: { label: "Cancelada", className: "bg-[#EEF2EF] text-[var(--hos-muted)]" },
};

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

export const ORG_KIND_LABEL: Record<OrgKind, string> = {
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
