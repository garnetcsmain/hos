"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanSearch, ShieldCheck, UserRoundSearch } from "lucide-react";
import { AppShell } from "@/app/components/HosDashboard";
import { type ModalKind } from "@/app/components/IntakeForms";
import { listMissing, searchPublic } from "@/app/lib/client/api";
import type { SearchResult } from "@/app/lib/client/api";
import type { AgeBand, PublicFound, PublicMissing } from "@/app/lib/domain/projections";
import type { Sex } from "@/app/lib/domain/types";
import { DEFAULT_LOCALE, t } from "@/app/lib/i18n/strings";

const L = DEFAULT_LOCALE;

const AGE_BAND_LABEL: Record<AgeBand, string> = {
  child: "Menor",
  teen: "Adolescente",
  adult: "Adulto",
  senior: "Adulto mayor",
  unknown: "Edad desconocida",
};

const SEX_LABEL: Record<Sex, string> = {
  F: t("form.sex.F", L),
  M: t("form.sex.M", L),
  U: t("form.sex.U", L),
};

function StatusChip({ status }: { status: PublicMissing["status"] }) {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-[#EAF1EE] px-[10px] py-[4px] text-[11px] font-extrabold text-[var(--hos-muted)]">
      <ShieldCheck className="h-[13px] w-[13px] text-[var(--hos-green)]" strokeWidth={2.4} />
      {t(`status.${status}`, L)}
    </span>
  );
}

function MetaLine({ ageBand, sex, city }: { ageBand: AgeBand; sex: Sex; city: string }) {
  return (
    <div className="text-[12px] font-bold text-[var(--hos-muted)]">
      {AGE_BAND_LABEL[ageBand]} · {SEX_LABEL[sex]} · {city || "—"}
    </div>
  );
}

function MissingCard({ report }: { report: PublicMissing }) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <div className="font-data text-[12px] font-bold text-[var(--hos-blue)]">{report.id}</div>
          <h3 className="mt-[8px] text-[16px] font-extrabold leading-[19px] text-[var(--hos-text)]">{report.givenName}</h3>
          <div className="mt-[8px]">
            <MetaLine ageBand={report.ageBand} sex={report.sex} city={report.city} />
          </div>
        </div>
        <StatusChip status={report.status} />
      </div>
    </div>
  );
}

type SearchRow =
  | { kind: "missing"; report: PublicMissing }
  | { kind: "found"; report: PublicFound };

function SearchResultCard({ row }: { row: SearchRow }) {
  const r = row.report;
  const tag = row.kind === "missing" ? t("nav.missing", L) : t("nav.found", L);
  const tagColor =
    row.kind === "missing"
      ? "bg-[#FBE4E0] text-[#8A2F25]"
      : "bg-[#DDEFE8] text-[#16613F]";
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[8px]">
            <span className="font-data text-[12px] font-bold text-[var(--hos-blue)]">{r.id}</span>
            <span className={`rounded-full px-[8px] py-[3px] text-[10px] font-extrabold uppercase tracking-wide ${tagColor}`}>{tag}</span>
          </div>
          <h3 className="mt-[8px] text-[16px] font-extrabold leading-[19px] text-[var(--hos-text)]">{r.givenName}</h3>
          <div className="mt-[8px]">
            <MetaLine ageBand={r.ageBand} sex={r.sex} city={r.city} />
          </div>
        </div>
        <StatusChip status={r.status} />
      </div>
    </div>
  );
}

function CountTile({ value, label, color }: { value: number | null; label: string; color: string }) {
  return (
    <div className="rounded-[6px] border border-[var(--hos-border)] bg-white px-[16px] py-[14px]">
      <div className={`font-data text-[28px] font-bold leading-none ${color}`}>
        {value === null ? "—" : value.toLocaleString("es")}
      </div>
      <div className="mt-[12px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">{label}</div>
    </div>
  );
}

export function MissingRegistry() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);

  const [reports, setReports] = useState<PublicMissing[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Load the registry on mount and re-load after the intake modal closes.
  useEffect(() => {
    let active = true;
    listMissing()
      .then((data) => {
        if (!active) return;
        setReports(data.reports);
        setLoadError(false);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [modalKind]);

  const totalMissing = reports?.length ?? null;
  const candidateCount = useMemo(
    () => (reports ? reports.filter((r) => r.status === "candidate").length : null),
    [reports],
  );

  const searchRows: SearchRow[] = useMemo(
    () => [
      ...(searchData?.missing ?? []).map((report) => ({ kind: "missing" as const, report })),
      ...(searchData?.found ?? []).map((report) => ({ kind: "found" as const, report })),
    ],
    [searchData],
  );

  async function runSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearchError(false);
    try {
      setSearchData(await searchPublic(query));
    } catch {
      setSearchError(true);
      setSearchData(null);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearchData(null);
    setSearchError(false);
  }

  return (
    <AppShell
      title="Missing Persons Registry"
      subtitle="Reportes de desaparecidos enviados por familias · la IA recomienda, las personas deciden"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((v) => !v)}
      onOpenFamily={() => setModalKind("family")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="flex flex-1 flex-col gap-[28px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <section className="grid grid-cols-2 gap-[16px] max-[760px]:grid-cols-1">
          <CountTile value={totalMissing} label="reportes de desaparecidos" color="text-[var(--hos-red)]" />
          <CountTile value={candidateCount} label={t("status.candidate", L).toLowerCase()} color="text-[var(--hos-blue)]" />
        </section>

        <section className="flex flex-col gap-[14px] rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px]">
          <div className="flex items-center justify-between gap-[16px] max-[760px]:flex-col max-[760px]:items-stretch">
            <div>
              <h2 className="text-[20px] font-extrabold leading-none text-[var(--hos-text)]">{t("nav.missing", L)}</h2>
              <p className="mt-[10px] text-[13px] font-bold leading-[16px] text-[var(--hos-muted)]">
                {t("result.matchNote", L)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalKind("family")}
              className="flex h-[48px] shrink-0 items-center justify-center gap-[10px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[14px] font-extrabold text-white transition hover:bg-[#B63F33] focus:outline-none focus:ring-2 focus:ring-[#F9B4A9]"
            >
              <UserRoundSearch className="h-5 w-5" strokeWidth={2.5} />
              {t("action.reportMissing", L)}
            </button>
          </div>

          <div className="flex items-center gap-[10px] rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px]">
            <ScanSearch className="h-5 w-5 text-[var(--hos-muted)]" />
            <input
              placeholder={t("form.searchPlaceholder", L)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              className="w-full bg-transparent text-[14px] font-bold text-[var(--hos-text)] outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="h-[34px] rounded-[6px] border border-[var(--hos-border)] px-[12px] text-[12px] font-extrabold text-[var(--hos-muted)]"
              >
                {t("form.cancel", L)}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void runSearch()}
              className="h-[34px] rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[12px] font-extrabold text-white"
            >
              {t("form.search", L)}
            </button>
          </div>
        </section>

        {searchData || searching || searchError ? (
          <section className="flex flex-col gap-[12px]">
            <h2 className="text-[16px] font-extrabold leading-none text-[var(--hos-text)]">{t("nav.matches", L)}</h2>
            {searching ? (
              <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("result.submitting", L)}</p>
            ) : searchError ? (
              <p className="text-[13px] font-bold text-[var(--hos-red)]">{t("result.error", L)}</p>
            ) : searchRows.length === 0 ? (
              <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("search.noResults", L)}</p>
            ) : (
              <div className="grid grid-cols-2 gap-[14px] max-[900px]:grid-cols-1">
                {searchRows.map((row) => (
                  <SearchResultCard key={`${row.kind}-${row.report.id}`} row={row} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[16px] font-extrabold leading-none text-[var(--hos-text)]">{t("search.missingTitle", L)}</h2>
          {loadError ? (
            <p className="text-[13px] font-bold text-[var(--hos-red)]">{t("result.error", L)}</p>
          ) : reports === null ? (
            <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("result.submitting", L)}</p>
          ) : reports.length === 0 ? (
            <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("search.noResults", L)}</p>
          ) : (
            <div className="grid grid-cols-2 gap-[14px] max-[900px]:grid-cols-1">
              {reports.map((report) => (
                <MissingCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
