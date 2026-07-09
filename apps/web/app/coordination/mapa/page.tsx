import { CoordinationOpsMap } from "@/app/components/CoordinationOpsMap";

// Full-screen operations map (HOS-2026-007-11). Desktop-only by design: it is
// the "wall monitor" view for an operations center, not a field tool — the
// phone-sized experience is the /coordination console itself.
export default function CoordinationOpsMapPage() {
  return <CoordinationOpsMap />;
}
