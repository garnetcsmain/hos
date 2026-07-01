"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { type ModalKind } from "@/app/components/IntakeForms";
import { listFound } from "@/app/lib/client/api";
import type { PublicFound } from "@/app/lib/domain/projections";
import type { Condition } from "@/app/lib/domain/types";
import { DEFAULT_LOCALE, t } from "@/app/lib/i18n/strings";

const L = DEFAULT_LOCALE;

// AgeBand has no i18n key in strings.ts; render coarse, Spanish-first labels
// here. ageBand() never exposes a precise age — least-PII is preserved.
const AGE_BAND_LABELS: Record<PublicFound["ageBand"], string> = {
  child: "Niño/a",
  teen: "Adolescente",
  adult: "Adulto/a",
  senior: "Adulto/a mayor",
  unknown: "Edad sin especificar",
};

// Visual treatment per condition chip. Green = reassuring, red = grave.
const CONDITION_CHIP: Record<Condition, string> = {
  alive: "bg-[#DDEFE8] text-[#16613F]",
  injured: "bg-[#FFF1D6] text-[#7A3D00]",
  hospitalized: "bg-[#DCEEF8] text-[#0B4F76]",
  deceased: "bg-[#F6DAD5] text-[#8A2A1E]",
  unknown: "bg-[#EEF2EF] text-[var(--hos-muted)]",
};

const STATUS_CHIP: Record<PublicFound["status"], string> = {
  open: "bg-[#EEF2EF] text-[var(--hos-muted)]",
  candidate: "bg-[#DCEEF8] text-[#0B4F76]",
  verifying: "bg-[#FFF1D6] text-[#7A3D00]",
  matched: "bg-[#E7E0F6] text-[#4B2E83]",
  resolved: "bg-[#DDEFE8] text-[#16613F]",
};

const CONDITION_ORDER: Condition[] = ["alive", "injured", "hospitalized", "deceased", "unknown"];

function CountTiles({ reports }: { reports: PublicFound[] }) {
  const byCondition = (condition: Condition) =>
    reports.filter((r) => r.condition === condition).length;

  const tiles: Array<{ value: number; label: string; color: string }> = [
    { value: reports.length, label: "reportes de encontrados", color: "text-[var(--hos-green)]" },
    { value: byCondition("alive"), label: t("form.condition.alive", L), color: "text-[var(--hos-green)]" },
    { value: byCondition("hospitalized"), label: t("form.condition.hospitalized", L), color: "text-[var(--hos-blue)]" },
    { value: byCondition("injured"), label: t("form.condition.injured", L), color: "text-[var(--hos-yellow)]" },
  ];

  return (
    <section className="grid grid-cols-4 gap-[16px] max-[1180px]:grid-cols-2 max-[760px]:grid-cols-1">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-[6px] border border-[var(--hos-border)] bg-white px-[16px] py-[14px]">
          <div className={`font-data text-[28px] font-bold leading-none ${tile.color}`}>
            {tile.value.toLocaleString("es")}
          </div>
          <div className="mt-[12px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">{tile.label}</div>
        </div>
      ))}
    </section>
  );
}

function FoundCard({ report }: { report: PublicFound }) {
  return (
    <article className="flex flex-col gap-[12px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <div className="flex flex-wrap items-center gap-[10px]">
        <span className="font-data text-[12px] font-bold text-[var(--hos-blue)]">{report.id}</span>
        <span className={`rounded-full px-[10px] py-[4px] text-[11px] font-extrabold ${STATUS_CHIP[report.status]}`}>
          {t(`status.${report.status}`, L)}
        </span>
      </div>
      <h3 className="text-[18px] font-extrabold leading-none text-[var(--hos-text)]">{report.givenName}</h3>
      <div className="text-[13px] font-bold text-[var(--hos-muted)]">
        {AGE_BAND_LABELS[report.ageBand]} · {report.city || "—"}
      </div>
      <div className="mt-[2px] flex items-center justify-between gap-[10px]">
        <span className={`rounded-full px-[10px] py-[4px] text-[11px] font-extrabold ${CONDITION_CHIP[report.condition]}`}>
          {t(`form.condition.${report.condition}`, L)}
        </span>
        <span className="flex items-center gap-[6px] text-[11px] font-bold text-[var(--hos-green)]">
          <ShieldCheck className="h-4 w-4" />
          {report.createdAt.slice(0, 10)}
        </span>
      </div>
    </article>
  );
}

function RegistryBody({
  reports,
  loading,
  error,
  onReport,
}: {
  reports: PublicFound[];
  loading: boolean;
  error: string;
  onReport: () => void;
}) {
  return (
    <section className="flex flex-col gap-[18px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px]">
      <div className="flex items-center justify-between gap-[16px] max-[760px]:flex-col max-[760px]:items-stretch">
        <div>
          <div className="text-[13px] font-bold text-[var(--hos-muted)]">Registro de encontrados</div>
          <h2 className="mt-[8px] text-[24px] font-extrabold leading-none text-[var(--hos-text)]">
            Personas reportadas como encontradas
          </h2>
          <p className="mt-[10px] max-w-[560px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
            Cada reporte es un candidato para verificar. La IA recomienda, las personas deciden.
          </p>
        </div>
        <button
          type="button"
          onClick={onReport}
          className="flex h-[48px] shrink-0 items-center justify-center gap-[10px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[14px] font-extrabold text-white transition hover:bg-[#B63F33] focus:outline-none focus:ring-2 focus:ring-[#F9B4A9]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          {t("action.reportFound", L)}
        </button>
      </div>

      {loading ? (
        <p className="py-[24px] text-center text-[13px] font-bold text-[var(--hos-muted)]">{t("result.submitting", L)}</p>
      ) : error ? (
        <p className="py-[24px] text-center text-[13px] font-bold text-[var(--hos-red)]">{error}</p>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center gap-[10px] py-[32px] text-center">
          <UserRoundCheck className="h-[36px] w-[36px] text-[var(--hos-muted)]" strokeWidth={2} />
          <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("search.noResults", L)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[14px] max-[1180px]:grid-cols-2 max-[760px]:grid-cols-1">
          {reports.map((report) => (
            <FoundCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </section>
  );
}

function sortReports(reports: PublicFound[]): PublicFound[] {
  // Newest first, then a stable secondary key on condition severity ordering.
  return [...reports].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
    return CONDITION_ORDER.indexOf(a.condition) - CONDITION_ORDER.indexOf(b.condition);
  });
}

export function FoundRegistry() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [reports, setReports] = useState<PublicFound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Re-fetch whenever the modal closes (modalKind back to null) so a freshly
  // created found report appears without a manual refresh.
  useEffect(() => {
    let active = true;
    listFound()
      .then((res) => {
        if (!active) return;
        setReports(sortReports(res.reports));
        setError("");
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : t("result.error", L));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [modalKind]);

  return (
    <AppShell
      title="Found Persons Registry"
      subtitle={t("action.reportFound.desc", L) + " · " + t("result.matchNote", L)}
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((v) => !v)}
      onOpenFamily={() => setModalKind("found")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="flex flex-1 flex-col gap-[28px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <CountTiles reports={reports} />
        <RegistryBody
          reports={reports}
          loading={loading}
          error={error}
          onReport={() => setModalKind("found")}
        />
      </div>
    </AppShell>
  );
}
