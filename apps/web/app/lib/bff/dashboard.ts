import {
  Boxes,
  Building2,
  Check,
  Hospital,
  Map,
  MessageCircle,
  Radio,
  ScanSearch,
  ShieldCheck,
  UserCheck,
  UserRoundSearch,
  UsersRound,
  Warehouse,
  WifiOff,
} from "lucide-react";

export const navItems = [
  { label: "Mapa", href: "/console", icon: Map },
  { label: "Desaparecidos", href: "/missing", icon: UserRoundSearch },
  { label: "Encontrados", href: "/found", icon: UserCheck },
  { label: "Coincidencias", href: "/matches", icon: ScanSearch },
  { label: "Verificar", href: "/verify", icon: ShieldCheck },
  { label: "Mensajes", href: "/messages", icon: MessageCircle },
  { label: "Coordinación", href: "/coordination", icon: Boxes },
  { label: "Fuentes", href: "/sources", icon: Radio },
] as const;

export const districts = [
  { name: "La Guaira", className: "left-[86px] top-[88px] h-[126px] w-[198px] bg-[#DDEFE8]" },
  { name: "Maiquetia", className: "left-[330px] top-[112px] h-[146px] w-[226px] bg-[#F5E8C9]" },
  { name: "Caracas Oeste", className: "left-[132px] top-[324px] h-[160px] w-[240px] bg-[#E7EEF8]" },
  { name: "Caracas Este", className: "left-[442px] top-[330px] h-[156px] w-[228px] bg-[#DDEFE8]" },
];

export const mapSignals = [
  { x: 190, y: 168, color: "bg-[var(--hos-red)]", icon: UserRoundSearch },
  { x: 410, y: 190, color: "bg-[var(--hos-green)]", icon: UserCheck },
  { x: 430, y: 206, color: "bg-[var(--hos-dark)]", icon: ScanSearch },
  { x: 474, y: 286, color: "bg-[var(--hos-blue)]", icon: UsersRound },
  { x: 530, y: 394, color: "bg-[var(--hos-blue)]", icon: Hospital },
  { x: 250, y: 414, color: "bg-[var(--hos-yellow)]", icon: Warehouse },
  { x: 612, y: 202, color: "bg-[#8B5CF6]", icon: Radio },
  { x: 354, y: 510, color: "bg-[#111827]", icon: WifiOff },
];

export const metrics = [
  { value: "18,420", label: "solicitudes de desaparecidos", color: "text-[var(--hos-red)]" },
  { value: "7,318", label: "reportes de encontrados", color: "text-[var(--hos-green)]" },
  { value: "1,206", label: "posibles coincidencias", color: "text-[var(--hos-blue)]" },
  { value: "438", label: "familias avisadas", color: "text-[#111827]" },
];

// `kind` is a STABLE id that drives which modal opens — never key off `title`,
// which is display copy and changes with translation.
export const actions = [
  { kind: "missing", title: "Reportar una persona desaparecida", description: "No necesita cuenta", icon: UserRoundSearch, color: "text-[var(--hos-red)]" },
  { kind: "found", title: "Reportar una persona encontrada", description: "Para refugios, hospitales y voluntarios", icon: UserCheck, color: "text-[var(--hos-green)]" },
  { kind: "match", title: "Revisar una posible coincidencia", description: "Use el número de caso o el teléfono", icon: ScanSearch, color: "text-[var(--hos-blue)]" },
] as const;

export const priorities = [
  { name: "Carlos Perez", confidence: "94%", color: "text-[var(--hos-green)]", lines: ["Desaparecido: su mamá en Canadá", "Encontrado: Refugio 17, Maiquetía"] },
  { name: "Ana R. Mendoza", confidence: "88%", color: "text-[var(--hos-yellow)]", lines: ["Adulto sin identificar en hospital", "Un vecino confirma la zona"] },
  { name: "Luis Alberto P.", confidence: "81%", color: "text-[var(--hos-blue)]", lines: ["Avistamiento repetido en Telegram", "Falta comparar la foto"] },
];

export const sources = [
  { label: "Reportes de voluntarios", rate: "324/min", color: "text-[var(--hos-blue)]" },
  { label: "Hospitales y refugios", rate: "88/min", color: "text-[var(--hos-green)]" },
  { label: "Redes y mensajería", rate: "1.8k/min", color: "text-[var(--hos-yellow)]" },
  { label: "Boletines del gobierno", rate: "12/min", color: "text-[#111827]" },
];

export const trustMetadata = ["Evidencia", "Origen", "Fecha y hora", "Confianza", "Historial de verificación"];

export function getDashboardData() {
  return {
    mission: "Respuesta al terremoto en Venezuela",
    status: "incidente activo",
    window: "Misión de reunificación de 72 horas",
    priorities,
    sources,
    metrics,
  };
}

export { Check, Building2 };
