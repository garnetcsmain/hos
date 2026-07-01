"use client";

import { useEffect, useState } from "react";
import { Inbox, Link2, MailWarning, PhoneCall, Send, Smartphone } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { type ModalKind } from "@/app/components/IntakeForms";
import { listNotifications, recordFamilyReach } from "@/app/lib/client/api";
import type { Notification, NotificationStatus } from "@/app/lib/domain/types";

// Coordinator inbox for family notifications. A confirmed match opens a tracked
// family-reach obligation (coordinator_callback channel); the coordinator
// records the real contact here. No external delivery is ever claimed — honesty
// is part of the trust layer (Board D4).

const FAMILY_REACH_CHANNEL = "coordinator_callback";

const STATUS_LABELS: Record<NotificationStatus, string> = {
  queued: "Pendiente de contactar",
  sent: "Entregada (en la app)",
  delivered: "Familia contactada",
  failed: "Falló",
};

const STATUS_STYLES: Record<NotificationStatus, string> = {
  queued: "bg-[#FDF1D8] text-[var(--hos-warn)]",
  sent: "bg-[#DDEFE8] text-[#16613F]",
  delivered: "bg-[#DDEFE8] text-[#16613F]",
  failed: "bg-[#F8DAD5] text-[var(--hos-red)]",
};

function isNotificationStatus(value: string): value is NotificationStatus {
  return value === "queued" || value === "sent" || value === "delivered" || value === "failed";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusChip({ status }: { status: string }) {
  const known = isNotificationStatus(status);
  const label = known ? STATUS_LABELS[status] : status;
  const style = known ? STATUS_STYLES[status] : "bg-[#EEF2EF] text-[var(--hos-muted)]";
  return (
    <span className={`inline-flex h-[26px] items-center rounded-full px-[12px] text-[12px] font-extrabold ${style}`}>
      {label}
    </span>
  );
}

function ChannelChip({ channel }: { channel: string }) {
  const callback = channel === FAMILY_REACH_CHANNEL;
  const Icon = callback ? PhoneCall : Smartphone;
  const label = callback ? "Llamada del coordinador" : channel === "in_app" ? "in_app" : channel;
  return (
    <span className="inline-flex h-[26px] items-center gap-[6px] rounded-full bg-[#EEF6F2] px-[12px] text-[12px] font-extrabold text-[var(--hos-muted)]">
      <Icon className="h-[14px] w-[14px]" strokeWidth={2.4} />
      {label}
    </span>
  );
}

// The action a coordinator takes on an OPEN family-reach obligation. Reaching
// the family resolves the case; an unreachable attempt is recorded and the
// obligation stays open for a retry (Board D4).
function FamilyReachActions({ item, onDone }: { item: Notification; onDone: () => void }) {
  const [org, setOrg] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(outcome: "reached" | "unreachable") {
    if (org.trim().length === 0) {
      setError("La organización que contacta es obligatoria.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await recordFamilyReach({
        notificationId: item.id,
        outcome,
        coordinatorOrg: org.trim(),
        note: note.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el contacto.");
      setBusy(false);
    }
  }

  const fieldBase =
    "mt-[6px] w-full rounded-[6px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[10px] py-[8px] text-[13px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";

  return (
    <div className="mt-[14px] rounded-[6px] border border-[#E7E0F6] bg-[#F7F4FC] p-[12px]">
      <div className="text-[12px] font-extrabold text-[#4B2E83]">Registrar contacto con la familia</div>
      <p className="mt-[4px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
        El caso se cierra solo cuando la familia es contactada de verdad. Un intento fallido queda registrado.
      </p>
      <div className="mt-[10px] grid grid-cols-2 gap-[10px] max-[640px]:grid-cols-1">
        <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">
          Organización que contacta
          <input className={fieldBase} value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Cruz Roja, ACNUR…" />
        </label>
        <label className="text-[11px] font-extrabold text-[var(--hos-muted)]">
          Nota <span className="font-bold lowercase text-[#9aa8a2]">(opcional)</span>
          <input
            className={fieldBase}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Medio y resultado del contacto"
          />
        </label>
      </div>
      {error ? <p className="mt-[8px] text-[12px] font-bold text-[var(--hos-red)]">{error}</p> : null}
      <div className="mt-[12px] flex flex-wrap gap-[8px]">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit("reached")}
          className="h-[38px] rounded-[6px] bg-[var(--hos-green)] px-[14px] text-[12px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          Familia contactada
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit("unreachable")}
          className="h-[38px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[14px] text-[12px] font-extrabold text-[var(--hos-text)] transition hover:bg-[#F8FAF8] disabled:opacity-60"
        >
          No se pudo contactar
        </button>
      </div>
    </div>
  );
}

function DeliveryBanner() {
  return (
    <section className="flex items-start gap-[14px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#FDF1D8]">
        <MailWarning className="h-5 w-5 text-[var(--hos-warn)]" strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-extrabold leading-[19px] text-[var(--hos-text)]">
          Un coordinador contacta a la familia — no hay envío automático
        </h2>
        <p className="mt-[8px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
          Al confirmar una coincidencia se abre una obligación de contacto: un coordinador debe comunicarse
          con la familia y registrarlo aquí. El caso solo se cierra con ese contacto real. SMS, correo,
          WhatsApp y Telegram siguen pendientes hasta configurar un proveedor; no afirmamos haber entregado
          por esos canales. La IA recomienda, las personas deciden.
        </p>
      </div>
    </section>
  );
}

function NotificationCard({ item, onDone }: { item: Notification; onDone: () => void }) {
  const actionable = item.channel === FAMILY_REACH_CHANNEL && item.status === "queued";
  return (
    <article className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px]">
      <div className="flex items-start justify-between gap-[14px] max-[640px]:flex-col">
        <h3 className="text-[16px] font-extrabold leading-[20px] text-[var(--hos-text)]">{item.subject}</h3>
        <div className="flex shrink-0 items-center gap-[8px]">
          <ChannelChip channel={item.channel} />
          <StatusChip status={item.status} />
        </div>
      </div>
      <p className="mt-[12px] text-[13px] font-bold leading-[19px] text-[var(--hos-muted)]">{item.body}</p>
      <div className="mt-[14px] flex flex-wrap items-center gap-x-[18px] gap-y-[8px] border-t border-[#E2E8E4] pt-[12px]">
        <span className="flex items-center gap-[6px] text-[12px] font-extrabold text-[var(--hos-muted)]">
          <Send className="h-[14px] w-[14px]" strokeWidth={2.4} />
          <span className="font-data text-[var(--hos-text)]">{item.recipient}</span>
        </span>
        <span className="flex items-center gap-[6px] text-[12px] font-extrabold text-[var(--hos-muted)]">
          <Link2 className="h-[14px] w-[14px]" strokeWidth={2.4} />
          caso <span className="font-data text-[var(--hos-blue)]">{item.missingId}</span>
        </span>
        <span className="ml-auto font-data text-[12px] font-bold text-[var(--hos-muted)]">{formatTime(item.createdAt)}</span>
      </div>
      {actionable ? <FamilyReachActions item={item} onDone={onDone} /> : null}
    </article>
  );
}

export function MessagesInbox() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listNotifications()
      .then((res) => {
        if (!active) return;
        setNotifications(res.notifications);
        setError("");
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "No se pudieron cargar las notificaciones.");
      });
    return () => {
      active = false;
    };
  }, [modalKind, reloadKey]);

  const loading = notifications === null && !error;

  return (
    <AppShell
      title="Family Messages"
      subtitle="Cola de notificaciones a familias · destinatarios redactados · vista de coordinación"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((v) => !v)}
      onOpenFamily={() => setModalKind("family")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="flex flex-1 flex-col gap-[18px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <DeliveryBanner />

        <section className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px]">
          <div className="flex items-center justify-between gap-[14px]">
            <div className="flex items-center gap-[10px]">
              <Inbox className="h-5 w-5 text-[var(--hos-muted)]" strokeWidth={2.3} />
              <h2 className="text-[17px] font-extrabold leading-none text-[var(--hos-text)]">Bandeja de mensajes</h2>
            </div>
            {notifications ? (
              <span className="rounded-full bg-[#DCEEF8] px-[14px] py-[7px] text-[13px] font-extrabold text-[#0B4F76]">
                <span className="font-data">{notifications.length}</span> notificaciones
              </span>
            ) : null}
          </div>

          <div className="mt-[16px] flex flex-col gap-[12px]">
            {loading ? (
              <p className="text-[13px] font-bold text-[var(--hos-muted)]">Cargando notificaciones…</p>
            ) : error ? (
              <p className="text-[13px] font-bold text-[var(--hos-red)]">{error}</p>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((item) => (
                <NotificationCard key={item.id} item={item} onDone={() => setReloadKey((k) => k + 1)} />
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-[var(--hos-border)] bg-[#F8FAF8] px-[18px] py-[40px] text-center">
                <p className="text-[14px] font-extrabold text-[var(--hos-text)]">Aún no hay notificaciones.</p>
                <p className="mt-[8px] text-[12px] font-bold text-[var(--hos-muted)]">
                  Las familias se notifican cuando una organización verifica una coincidencia.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
