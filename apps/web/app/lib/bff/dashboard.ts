import {
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
  { label: "Map", href: "/", icon: Map },
  { label: "Missing", href: "/missing", icon: UserRoundSearch },
  { label: "Found", href: "/found", icon: UserCheck },
  { label: "Matches", href: "/matches", icon: ScanSearch },
  { label: "Verify", href: "/verify", icon: ShieldCheck },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Sources", href: "/sources", icon: Radio },
] as const;

export const districts = [
  { name: "La Guaira", className: "left-[86px] top-[88px] h-[126px] w-[198px] bg-[#DDEFE8]" },
  { name: "Maiquetia", className: "left-[330px] top-[112px] h-[146px] w-[226px] bg-[#F5E8C9]" },
  { name: "Caracas West", className: "left-[132px] top-[324px] h-[160px] w-[240px] bg-[#E7EEF8]" },
  { name: "Caracas East", className: "left-[442px] top-[330px] h-[156px] w-[228px] bg-[#DDEFE8]" },
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
  { value: "18,420", label: "missing requests", color: "text-[var(--hos-red)]" },
  { value: "7,318", label: "found reports", color: "text-[var(--hos-green)]" },
  { value: "1,206", label: "match candidates", color: "text-[var(--hos-blue)]" },
  { value: "438", label: "families notified", color: "text-[#111827]" },
];

export const actions = [
  { title: "Report missing person", description: "No account required", icon: UserRoundSearch, color: "text-[var(--hos-red)]" },
  { title: "Report found person", description: "For shelters, hospitals, volunteers", icon: UserCheck, color: "text-[var(--hos-green)]" },
  { title: "Check a possible match", description: "Use case number or phone", icon: ScanSearch, color: "text-[var(--hos-blue)]" },
];

export const priorities = [
  { name: "Carlos Perez", confidence: "94%", color: "text-[var(--hos-green)]", lines: ["Missing: mother in Canada", "Found: Shelter 17, Maiquetia"] },
  { name: "Ana R. Mendoza", confidence: "88%", color: "text-[var(--hos-yellow)]", lines: ["Hospital unidentified adult", "Neighbor report confirms area"] },
  { name: "Luis Alberto P.", confidence: "81%", color: "text-[var(--hos-blue)]", lines: ["Telegram sighting duplicate", "Needs photo comparison"] },
];

export const sources = [
  { label: "Volunteer reports", rate: "324/min", color: "text-[var(--hos-blue)]" },
  { label: "Hospitals and shelters", rate: "88/min", color: "text-[var(--hos-green)]" },
  { label: "Social and messaging", rate: "1.8k/min", color: "text-[var(--hos-yellow)]" },
  { label: "Government bulletins", rate: "12/min", color: "text-[#111827]" },
];

export const trustMetadata = ["Evidence", "Provenance", "Timestamp", "Confidence", "Verification history"];

export function getDashboardData() {
  return {
    mission: "Venezuela earthquake response",
    status: "active incident",
    window: "72 hour reunification mission",
    priorities,
    sources,
    metrics,
  };
}

export { Check, Building2 };
