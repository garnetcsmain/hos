"use client";

import { useState } from "react";
import { Check, ScanSearch, ShieldCheck, X } from "lucide-react";
import { createFound, createMissing, searchPublic } from "@/app/lib/client/api";
import type { CreateResult, SearchResult } from "@/app/lib/client/api";
import { DEFAULT_LOCALE, t } from "@/app/lib/i18n/strings";

export type ModalKind = "missing" | "found" | "match" | "family" | null;

const L = DEFAULT_LOCALE;

type Values = Record<string, string>;
type FieldType = "text" | "date" | "number" | "select" | "textarea" | "checkbox";

interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  full?: boolean;
}

const sexOptions = [
  { value: "U", label: t("form.sex.U", L) },
  { value: "F", label: t("form.sex.F", L) },
  { value: "M", label: t("form.sex.M", L) },
];

const conditionOptions = (["alive", "injured", "hospitalized", "deceased", "unknown"] as const).map(
  (c) => ({ value: c, label: t(`form.condition.${c}`, L) }),
);

const missingFields: FieldDef[] = [
  { key: "fullName", label: t("form.name", L), required: true, full: true },
  { key: "age", label: t("form.age", L), type: "number" },
  { key: "sex", label: t("form.sex", L), type: "select", options: sexOptions },
  { key: "city", label: t("form.city", L) },
  { key: "lastSeenLocation", label: t("form.lastSeenLocation", L) },
  { key: "lastSeenAt", label: t("form.lastSeenAt", L), type: "date" },
  { key: "description", label: t("form.description", L), type: "textarea", full: true },
  { key: "sensitiveNotes", label: t("form.sensitiveNotes", L), type: "textarea", full: true },
  { key: "reporterName", label: t("form.reporterName", L) },
  { key: "reporterRelationship", label: t("form.reporterRelationship", L) },
  { key: "reporterContact", label: t("form.reporterContact", L), full: true },
  { key: "consent", label: t("form.consent", L), type: "checkbox", full: true },
];

const foundFields: FieldDef[] = [
  { key: "fullName", label: t("form.name", L), full: true },
  { key: "age", label: t("form.age", L), type: "number" },
  { key: "sex", label: t("form.sex", L), type: "select", options: sexOptions },
  { key: "city", label: t("form.city", L) },
  { key: "foundLocation", label: t("form.foundLocation", L) },
  { key: "foundAt", label: t("form.foundAt", L), type: "date" },
  { key: "condition", label: t("form.condition", L), type: "select", options: conditionOptions },
  { key: "description", label: t("form.description", L), type: "textarea", full: true },
  { key: "reporterOrg", label: t("form.reporterOrg", L), required: true, full: true },
];

function Field({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const base =
    "mt-[6px] w-full rounded-[6px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px] text-[14px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";

  if (def.type === "checkbox") {
    return (
      <label className={`flex items-center gap-[10px] text-[13px] font-bold text-[var(--hos-muted)] ${def.full ? "col-span-2 max-[640px]:col-span-1" : ""}`}>
        <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "false")} />
        {def.label}
      </label>
    );
  }

  return (
    <label className={`text-[12px] font-extrabold text-[var(--hos-muted)] ${def.full ? "col-span-2 max-[640px]:col-span-1" : ""}`}>
      {def.label}
      {!def.required ? <span className="ml-[6px] font-bold lowercase text-[#9aa8a2]">({t("form.optional", L)})</span> : null}
      {def.type === "select" ? (
        <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : def.type === "textarea" ? (
        <textarea className={`${base} min-h-[72px] resize-none`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"}
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function buildPayload(fields: FieldDef[], values: Values): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = values[f.key] ?? "";
    if (f.type === "checkbox") payload[f.key] = raw === "true";
    else if (f.type === "number") payload[f.key] = raw === "" ? null : Number(raw);
    else payload[f.key] = raw;
  }
  return payload;
}

function ReportForm({ kind, onClose }: { kind: "missing" | "found"; onClose: () => void }) {
  const fields = kind === "missing" ? missingFields : foundFields;
  const [values, setValues] = useState<Values>(kind === "missing" ? { sex: "U", consent: "true" } : { sex: "U", condition: "unknown" });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [result, setResult] = useState<CreateResult | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    setStatus("submitting");
    setError("");
    try {
      const payload = buildPayload(fields, values);
      const res = kind === "missing" ? await createMissing(payload) : await createFound(payload);
      setResult(res);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("result.error", L));
      setStatus("error");
    }
  }

  if (status === "done" && result) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#DDEFE8]">
          <Check className="h-7 w-7 text-[var(--hos-green)]" strokeWidth={2.6} />
        </div>
        <h3 className="mt-[16px] text-[20px] font-extrabold text-[var(--hos-text)]">{t("result.caseCreated", L)}</h3>
        <p className="mt-[8px] text-[13px] font-bold text-[var(--hos-muted)]">{t("result.caseNumber", L)}</p>
        <p className="font-data text-[22px] font-bold text-[var(--hos-blue)]">{result.id}</p>
        <p className="mt-[14px] text-[14px] font-bold text-[var(--hos-text)]">
          {result.candidates > 0 ? `${result.candidates} ${t("result.candidatesFound", L)}` : t("result.noCandidates", L)}
        </p>
        <p className="mt-[12px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">{t("result.matchNote", L)}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-[18px] h-[44px] rounded-[6px] bg-[var(--hos-dark)] px-[18px] text-[14px] font-extrabold text-white"
        >
          Entendido
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-[14px]"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="grid grid-cols-2 gap-[12px] max-[640px]:grid-cols-1">
        {fields.map((f) => (
          <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
        ))}
      </div>
      {error ? <p className="text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
      <div className="flex justify-end gap-[10px]">
        <button type="button" onClick={onClose} className="h-[44px] rounded-[6px] border border-[var(--hos-border)] px-[16px] text-[13px] font-extrabold text-[var(--hos-muted)]">
          {t("form.cancel", L)}
        </button>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-[44px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[13px] font-extrabold text-white disabled:opacity-60"
        >
          {status === "submitting" ? t("result.submitting", L) : t(`form.submit.${kind}`, L)}
        </button>
      </div>
    </form>
  );
}

function SearchPanel() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      setData(await searchPublic(query));
    } finally {
      setLoading(false);
    }
  }

  const rows = [
    ...(data?.missing ?? []).map((r) => ({ ...r, kind: "missing" as const })),
    ...(data?.found ?? []).map((r) => ({ id: r.id, givenName: r.givenName, ageBand: r.ageBand, city: r.city, status: r.status, kind: "found" as const })),
  ];

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[10px] rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px]">
        <ScanSearch className="h-5 w-5 text-[var(--hos-muted)]" />
        <input
          autoFocus
          placeholder={t("form.searchPlaceholder", L)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void run()}
          className="w-full bg-transparent text-[14px] font-bold text-[var(--hos-text)] outline-none"
        />
        <button type="button" onClick={() => void run()} className="h-[34px] rounded-[6px] bg-[var(--hos-dark)] px-[14px] text-[12px] font-extrabold text-white">
          {t("form.search", L)}
        </button>
      </div>
      {loading ? <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("result.submitting", L)}</p> : null}
      {data && rows.length === 0 && !loading ? <p className="text-[13px] font-bold text-[var(--hos-muted)]">{t("search.noResults", L)}</p> : null}
      <div className="flex flex-col gap-[10px]">
        {rows.map((r) => (
          <div key={`${r.kind}-${r.id}`} className="flex items-center justify-between rounded-[8px] border border-[#DDE5E1] bg-[#FBFCFB] px-[14px] py-[12px]">
            <div>
              <div className="font-data text-[12px] font-bold text-[var(--hos-blue)]">{r.id}</div>
              <div className="mt-[4px] text-[14px] font-extrabold text-[var(--hos-text)]">{r.givenName}</div>
              <div className="text-[12px] font-bold text-[var(--hos-muted)]">{r.ageBand} · {r.city || "—"}</div>
            </div>
            <div className="flex items-center gap-[8px] text-[12px] font-extrabold text-[var(--hos-muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--hos-green)]" />
              {t(`status.${r.status}`, L)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TITLES: Record<Exclude<ModalKind, null>, { title: string; description: string }> = {
  missing: { title: t("action.reportMissing", L), description: t("action.reportMissing.desc", L) },
  family: { title: t("action.cantReach", L), description: t("action.reportMissing.desc", L) },
  found: { title: t("action.reportFound", L), description: t("action.reportFound.desc", L) },
  match: { title: t("action.checkMatch", L), description: t("action.checkMatch.desc", L) },
};

export function ActionModal({ kind, onClose }: { kind: ModalKind; onClose: () => void }) {
  if (!kind) return null;
  const header = TITLES[kind];
  const reportKind: "missing" | "found" | null = kind === "found" ? "found" : kind === "match" ? null : "missing";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0E1713]/45 p-[18px]" role="dialog" aria-modal="true">
      <div className="my-[24px] w-full max-w-[640px] rounded-[10px] border border-[var(--hos-border)] bg-white p-[22px] shadow-xl">
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <h2 className="text-[22px] font-extrabold leading-none text-[var(--hos-text)]">{header.title}</h2>
            <p className="mt-[10px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">{header.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-[6px] p-[6px] text-[var(--hos-muted)] transition hover:bg-[#F1F5F2] hover:text-[var(--hos-text)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-[20px]">
          {reportKind ? <ReportForm kind={reportKind} onClose={onClose} /> : <SearchPanel />}
        </div>
      </div>
    </div>
  );
}
