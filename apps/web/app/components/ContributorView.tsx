"use client";

// The surface a self-signup contributor gets (human direction 2026-07-03).
// They can CONTRIBUTE (report needs, offer supplies, register orgs, add sites)
// and MANAGE the sites they own or were delegated — but they NEVER see the
// sensitive needs board (precise locations + contacts stay coordinator-only).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, UserPlus, X } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { CreateRecordFlow, type CreateKind } from "@/app/components/CoordinationConsoleSections";
import { SiteCard } from "@/app/components/CoordinationParts";
import {
  getMyBoard,
  grantSiteAccess,
  listSiteAccess,
  revokeSiteAccess,
  type ContributorBoard,
  type Me,
  type SiteGrant,
} from "@/app/lib/client/coordination";
import type { Site } from "@/app/lib/domain/coordination";
import type { SiteView } from "@/app/lib/domain/coordinationViews";

// Grant/revoke another person's right to manage one of MY sites.
function SiteAccessPanel({ site }: { site: Site }) {
  const [open, setOpen] = useState(false);
  const [grants, setGrants] = useState<SiteGrant[]>([]);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("0"); // 0 = indefinite
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { grants } = await listSiteAccess(site.id);
      setGrants(grants);
    } catch {
      /* ignore */
    }
  }, [site.id]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listSiteAccess(site.id)
      .then(({ grants }) => {
        if (alive) setGrants(grants);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open, site.id]);

  async function grant() {
    setBusy(true);
    setError("");
    try {
      await grantSiteAccess({ siteId: site.id, email, hoursValid: Number(days) > 0 ? Number(days) * 24 : null });
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo dar acceso.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(grantEmail: string) {
    setBusy(true);
    try {
      await revokeSiteAccess({ siteId: site.id, email: grantEmail });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-[8px] rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] p-[10px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-[6px] text-[12px] font-extrabold text-[var(--hos-blue)]"
      >
        <UserPlus className="h-[14px] w-[14px]" strokeWidth={2.4} />
        {open ? "Cerrar acceso" : "Dar acceso a un voluntario"}
      </button>
      {open ? (
        <div className="mt-[8px] flex flex-col gap-[8px]">
          <p className="text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
            Escriba el correo de la cuenta de la persona que verificó en el sitio. Podrá actualizar la
            capacidad y los avisos de este sitio.
          </p>
          <div className="flex flex-wrap items-end gap-[8px]">
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[36px] min-w-[200px] flex-1 rounded-[6px] border border-[var(--hos-border)] bg-white px-[10px] text-[13px] font-semibold outline-none"
            />
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="h-[36px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[8px] text-[12px] font-bold"
            >
              <option value="0">Sin vencimiento</option>
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="7">7 días</option>
            </select>
            <button
              type="button"
              disabled={busy || !email.trim()}
              onClick={() => void grant()}
              className="h-[36px] rounded-[6px] bg-[var(--hos-dark)] px-[12px] text-[12px] font-extrabold text-white disabled:opacity-60"
            >
              Dar acceso
            </button>
          </div>
          {error ? <p className="text-[12px] font-bold text-[var(--hos-red)]">{error}</p> : null}
          {grants.length > 0 ? (
            <ul className="flex flex-col gap-[4px]">
              {grants.map((g) => (
                <li key={g.email} className="flex items-center justify-between gap-[8px] text-[12px] font-bold text-[var(--hos-text)]">
                  <span>
                    {g.email}
                    {g.expiresAt ? (
                      <span className="ml-[6px] font-bold text-[var(--hos-muted)]">
                        (vence {new Date(g.expiresAt).toLocaleDateString("es-VE")})
                      </span>
                    ) : (
                      <span className="ml-[6px] font-bold text-[var(--hos-muted)]">(sin vencimiento)</span>
                    )}
                  </span>
                  <button type="button" onClick={() => void revoke(g.email)} className="text-[var(--hos-red)]" aria-label="Quitar acceso">
                    <X className="h-[13px] w-[13px]" strokeWidth={2.6} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ContributorView({ me }: { me: Me }) {
  const [board, setBoard] = useState<ContributorBoard | null>(null);
  const [error, setError] = useState("");
  const [createKind, setCreateKind] = useState<"menu" | CreateKind | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await getMyBoard();
        if (alive) setBoard(b);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "No se pudo cargar.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  const onCreated = () => {
    reload();
    setCreateKind(null);
  };

  const orgs = board?.orgs ?? [];
  const activeSites = useMemo(() => (board?.sites ?? []).map((v) => v.site), [board]);
  const mySites: SiteView[] = useMemo(() => {
    if (!board) return [];
    const managed = new Set(board.managedSiteIds);
    return board.sites.filter((v) => managed.has(v.site.id));
  }, [board]);

  return (
    <AppShell title="Colaborar" subtitle={`Sesión: ${me.email ?? "colaborador"}`}>
      <div className="flex flex-1 flex-col gap-[16px] px-[28px] py-[28px] max-[900px]:px-[18px]">
        <section className="flex items-start gap-[12px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#EEF6F2]">
            <ShieldCheck className="h-5 w-5 text-[var(--hos-green)]" strokeWidth={2.2} />
          </span>
          <p className="text-[12px] font-bold leading-[17px] text-[var(--hos-muted)]">
            Puede reportar necesidades, ofrecer suministros, registrar su organización y agregar puntos de
            ayuda. El sitio que usted crea queda a su cargo: puede actualizar su capacidad y avisos, y dar
            acceso a un voluntario que haya verificado. El panel completo de coordinación es solo para
            coordinadores.
          </p>
        </section>

        {createKind !== null ? (
          <CreateRecordFlow
            createKind={createKind}
            setCreateKind={setCreateKind}
            orgs={orgs}
            activeSites={activeSites}
            onCreated={onCreated}
            onClose={() => setCreateKind(null)}
          />
        ) : (
          <>
            <div>
              <button
                type="button"
                onClick={() => setCreateKind("menu")}
                className="inline-flex h-[40px] items-center gap-[6px] rounded-[6px] bg-[var(--hos-dark)] px-[16px] text-[13px] font-extrabold text-white"
              >
                <Plus className="h-[15px] w-[15px]" strokeWidth={2.6} /> Nuevo registro
              </button>
            </div>

            <section>
              <h3 className="text-[14px] font-extrabold text-[var(--hos-text)]">Mis sitios</h3>
              <p className="mt-[2px] text-[12px] font-bold text-[var(--hos-muted)]">
                Sitios que usted creó o que le delegaron. Actualice su capacidad, publique avisos y delegue acceso.
              </p>
              {error ? <p className="mt-[8px] text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
              <div className="mt-[12px] grid grid-cols-2 gap-[12px] max-[900px]:grid-cols-1">
                {mySites.length === 0 ? (
                  <p className="text-[13px] font-bold text-[var(--hos-muted)]">
                    Todavía no administra ningún sitio. Use &quot;Nuevo registro → Agregar sitio&quot; para crear uno.
                  </p>
                ) : (
                  mySites.map((v) => (
                    <div key={v.site.id}>
                      <SiteCard view={v} onChanged={reload} />
                      <SiteAccessPanel site={v.site} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
