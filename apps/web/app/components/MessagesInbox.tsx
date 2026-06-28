"use client";

import { useEffect, useState } from "react";
import { Inbox, Link2, MailWarning, Send, Smartphone } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { type ModalKind } from "@/app/components/IntakeForms";
import { listNotifications } from "@/app/lib/client/api";
import type { Notification, NotificationStatus } from "@/app/lib/domain/types";

// Coordinator inbox for family notifications. The in-app channel is delivered
// now; SMS/email/WhatsApp/Telegram are deferred until a provider is configured.
// We never claim external delivery — honesty is part of the trust layer.

const STATUS_LABELS: Record<NotificationStatus, string> = {
  queued: "En cola",
  sent: "Entregada (en la app)",
  failed: "Falló",
};

const STATUS_STYLES: Record<NotificationStatus, string> = {
  queued: "bg-[#FDF1D8] text-[var(--hos-warn)]",
  sent: "bg-[#DDEFE8] text-[#16613F]",
  failed: "bg-[#F8DAD5] text-[var(--hos-red)]",
};

function isNotificationStatus(value: string): value is NotificationStatus {
  return value === "queued" || value === "sent" || value === "failed";
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
  const inApp = channel === "in_app";
  return (
    <span className="inline-flex h-[26px] items-center gap-[6px] rounded-full bg-[#EEF6F2] px-[12px] text-[12px] font-extrabold text-[var(--hos-muted)]">
      <Smartphone className="h-[14px] w-[14px]" strokeWidth={2.4} />
      {inApp ? "in_app" : channel}
    </span>
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
          Solo el canal in-app se entrega ahora
        </h2>
        <p className="mt-[8px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
          El envío por SMS, correo, WhatsApp y Telegram está pendiente hasta configurar un proveedor.
          No afirmamos haber entregado por esos canales. Cada notificación informa que una coincidencia
          es un candidato para verificar, nunca una confirmación automática: la IA recomienda, las personas deciden.
        </p>
      </div>
    </section>
  );
}

function NotificationCard({ item }: { item: Notification }) {
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
    </article>
  );
}

export function MessagesInbox() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");

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
  }, [modalKind]);

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
              notifications.map((item) => <NotificationCard key={item.id} item={item} />)
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
