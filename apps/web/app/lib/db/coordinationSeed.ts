// Coordination seed (HOS-2026-007) — REAL public data for the Venezuela 2026
// response, imported from caracasayuda.com (see caracasayudaData.ts for
// provenance and scoping rules). Replaces the earlier fictional demo seed:
// 150 public aid points (acopio/refugio/medico/internet/mascotas, with their
// public coordinates) and ~1000 community need reports from the affected
// Caracas-La Guaira corridor, at district grain.
//
// Timestamps are the source's real created/updated times, so the freshness
// signal stays honest: an aging report reads as aging, not as live truth.
//
// Idempotent: only seeds when no orgs exist.

import { countOrgs, insertNeed, insertOrg, insertSite } from "../repositories/coordination.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newNeedId, newOrgId, newSiteId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import { CARACASAYUDA_NEEDS, CARACASAYUDA_SITES } from "./caracasayudaData.ts";

export async function seedCoordinationIfEmpty(): Promise<boolean> {
  if ((await countOrgs()) > 0) return false;

  await transaction(async () => {
    const now = nowIso();
    // One accountable source org for the whole import — these records come from
    // the community map, not from a registered responder.
    const sourceOrg = newOrgId();
    await insertOrg({
      id: sourceOrg,
      createdAt: now,
      name: "Comunidad · caracasayuda.com",
      kind: "other",
    });

    for (const s of CARACASAYUDA_SITES) {
      await insertSite({
        id: newSiteId(),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        name: s.name,
        orgId: sourceOrg,
        district: s.district,
        category: s.category,
        lat: s.lat,
        lng: s.lng,
        bedsTotal: 0,
        bedsFree: 0,
        status: "active",
        notes: s.notes,
      });
    }

    for (const n of CARACASAYUDA_NEEDS) {
      await insertNeed({
        id: newNeedId(),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        orgId: sourceOrg,
        siteId: null,
        district: n.district,
        category: n.category,
        quantity: 1,
        unit: "",
        urgency: n.urgency,
        status: "open",
        claimedByOrgId: null,
        notes: n.notes,
      });
    }

    // One import event instead of ~1200 per-row events: the audit trail records
    // WHAT was imported, from WHERE and how much, without drowning the log.
    await appendEvent({
      entityType: "coordination",
      entityId: "caracasayuda-import",
      type: "coordination.imported",
      actor: "system:import",
      payload: {
        source: "caracasayuda.com",
        sites: CARACASAYUDA_SITES.length,
        needs: CARACASAYUDA_NEEDS.length,
      },
    });
  });

  return true;
}
