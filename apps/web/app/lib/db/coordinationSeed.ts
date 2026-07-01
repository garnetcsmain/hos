// Coordination seed (HOS-2026-007) — Venezuela 2026 scenario, consistent with
// the reunification seed's districts (La Guaira / Maiquetía / Caracas). Gives the
// board real content on first run: orgs, sites with live capacity, open needs
// (including a claimed one and a deliberately stale one to exercise the freshness
// signal), and offers that the advisory matcher can suggest against the needs.
//
// Idempotent: only seeds when no orgs exist.

import {
  countOrgs,
  insertNeed,
  insertOffer,
  insertOrg,
  insertSite,
} from "../repositories/coordination.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newNeedId, newOfferId, newOrgId, newSiteId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";

function hoursAgo(h: number): string {
  return new Date(Date.parse(nowIso()) - h * 3_600_000).toISOString();
}

export async function seedCoordinationIfEmpty(): Promise<boolean> {
  if ((await countOrgs()) > 0) return false;

  await transaction(async () => {
    const now = nowIso();
    const org = async (name: string, kind: string) => {
      const id = newOrgId();
      await insertOrg({ id, createdAt: now, name, kind: kind as never });
      return id;
    };

    const cruzRoja = await org("Cruz Roja", "ngo");
    const refMaiquetia = await org("Refugio Maiquetía", "shelter");
    const hospitalVargas = await org("Hospital Vargas", "hospital");
    const proteccionCivil = await org("Protección Civil", "government");

    const siteMaiquetia = newSiteId();
    const siteLaGuaira = newSiteId();
    await insertSite({
      id: siteMaiquetia, createdAt: now, updatedAt: now, name: "Refugio Maiquetía 12",
      orgId: refMaiquetia, district: "Maiquetía", bedsTotal: 60, bedsFree: 8, status: "active",
      notes: "Familias con niños; falta fórmula infantil.",
    });
    await insertSite({
      id: siteLaGuaira, createdAt: hoursAgo(30), updatedAt: hoursAgo(30), name: "Refugio La Guaira",
      orgId: proteccionCivil, district: "La Guaira", bedsTotal: 80, bedsFree: 25, status: "active",
      notes: "Capacidad no confirmada desde ayer.",
    });
    await insertSite({
      id: newSiteId(), createdAt: now, updatedAt: now, name: "Albergue Catia",
      orgId: cruzRoja, district: "Caracas", bedsTotal: 40, bedsFree: 0, status: "active", notes: "",
    });

    const need = async (over: Record<string, unknown>) => {
      const id = newNeedId();
      await insertNeed({
        id, createdAt: now, updatedAt: now, orgId: refMaiquetia, siteId: null,
        district: "Maiquetía", category: "other", quantity: 1, unit: "", urgency: "normal",
        status: "open", claimedByOrgId: null, notes: "", ...over,
      } as never);
      await appendEvent({ entityType: "need", entityId: id, type: "need.posted", actor: "org:seed", payload: {} });
      return id;
    };

    await need({ siteId: siteMaiquetia, category: "formula", quantity: 30, unit: "latas", urgency: "critical", notes: "Fórmula 0-6 meses" });
    await need({ siteId: siteMaiquetia, category: "water", quantity: 500, unit: "L", urgency: "high" });
    await need({ orgId: proteccionCivil, siteId: siteLaGuaira, district: "La Guaira", category: "medical", quantity: 20, unit: "dosis", urgency: "high", notes: "Insulina", updatedAt: hoursAgo(28) });
    await need({ orgId: cruzRoja, district: "Caracas", category: "food", quantity: 200, unit: "raciones", urgency: "normal", status: "claimed", claimedByOrgId: proteccionCivil });

    const offer = async (over: Record<string, unknown>) => {
      const id = newOfferId();
      await insertOffer({
        id, createdAt: now, updatedAt: now, orgId: cruzRoja, district: "Maiquetía",
        category: "other", quantity: 1, unit: "", status: "available", notes: "", ...over,
      } as never);
      await appendEvent({ entityType: "offer", entityId: id, type: "offer.posted", actor: "org:seed", payload: {} });
      return id;
    };

    await offer({ category: "water", quantity: 1000, unit: "L", district: "Maiquetía" });
    await offer({ orgId: proteccionCivil, category: "food", quantity: 300, unit: "raciones", district: "Caracas" });
    await offer({ orgId: hospitalVargas, category: "medical", quantity: 50, unit: "dosis", district: "La Guaira", notes: "Insulina disponible" });
  });

  return true;
}
