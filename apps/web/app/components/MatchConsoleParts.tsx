"use client";

import { useState } from "react";
import { Check, ShieldAlert, ShieldCheck, Sparkles, Users } from "lucide-react";
import { verifyCandidate, type CandidateView, type VerifyResult } from "@/app/lib/client/api";
import type { MatchCandidate, MatchFactor, MatchStatus } from "@/app/lib/domain/types";

export const AI_NOTE =
  "La IA nunca confirma identidad. Un coordinador compara la evidencia y decide.";

const STATUS_CHIP: Record<MatchStatus, { label: string; className: string }> = {
  pending: { label: "Por revisar", className: "bg-[#EEF3F1] text-[var(--hos-muted)]" },
  confirmed: { label: "Confirmada", className: "bg-[#DDEFE8] text-[#16613F]" },
  rejected: { label: "Descartada", className: "bg-[#F6E0DC] text-[#8A2C20]" },
};

const CONDITION_LABEL: Record<string, string> = {
  alive: "Con vida",
  injured: "Herida",
  hospitalized: "Hospitalizada",
  deceased: "Fallecida",
  unknown: "Desconocida",
};

export function scoreColor(score: number): string {
  if (score >= 80) return "text-[var(--hos-green)]";
  if (score >= 50) return "text-[var(--hos-yellow)]";
  return "text-[var(--hos-muted)]";
}

function scoreBar(score: number): string {
  if (score >= 80) return "bg-[var(--hos-green)]";
  if (score >= 50) return "bg-[var(--hos-yellow)]";
  return "bg-[var(--hos-muted)]";
}

/** A factor is a contributing signal only when it carries weight and is not an
 *  AI side-channel; AI assessments and contradiction flags render as notes. */
function isSignal(factor: MatchFactor): boolean {
  return factor.weight > 0 && !factor.key.startsWith("ai:");
}

function ScoreBar({ score, bar }: { score: number; bar: string }) {
  return (
    <div className="h-[8px] overflow-hidden rounded-full bg-[#EAF1EE]">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </div>
  );
}

export function StatusChip({ status }: { status: MatchStatus }) {
  const chip = STATUS_CHIP[status];
  return (
    <span className={`inline-flex h-[24px] items-center rounded-full px-[10px] text-[11px] font-extrabold ${chip.className}`}>
      {chip.label}
    </span>
  );
}

// At/above this many same-name reports, a high score is treated as a
// common-name caution rather than neutral context (Board D1).
const COMMON_NAME_THRESHOLD = 3;

/** Base-rate / name-commonness signal: how many OTHER open reports share this
 *  candidate's name. A high count means a strong name match is less conclusive
 *  — a common name, not necessarily the same person (the engine's "wrong
 *  morgue" failure mode). */
function NameBaseRate({ count }: { count: number }) {
  if (count <= 0) {
    return (
      <p className="mt-[10px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
        Ningún otro reporte abierto comparte este nombre.
      </p>
    );
  }
  const high = count >= COMMON_NAME_THRESHOLD;
  const noun = count === 1 ? "otro reporte abierto comparte" : "otros reportes abiertos comparten";
  return (
    <div
      className={[
        "mt-[10px] flex items-start gap-[8px] rounded-[6px] border px-[10px] py-[8px]",
        high ? "border-[#F1D8D2] bg-[#FCF1EF]" : "border-[var(--hos-border)] bg-[#F8FAF8]",
      ].join(" ")}
    >
      <Users
        className={`mt-[1px] h-[14px] w-[14px] shrink-0 ${high ? "text-[var(--hos-red)]" : "text-[var(--hos-muted)]"}`}
        strokeWidth={2.4}
      />
      <div>
        <div className={`text-[12px] font-extrabold ${high ? "text-[#8A2C20]" : "text-[var(--hos-text)]"}`}>
          {count} {noun} este nombre
        </div>
        <div className="mt-[2px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
          {high
            ? "Nombre común: un puntaje alto aquí es menos concluyente. Confirme con edad, lugar y rasgos."
            : "Considere la coincidencia de nombre junto con las demás señales."}
        </div>
      </div>
    </div>
  );
}

export function CandidateRow({
  view,
  active,
  onSelect,
}: {
  view: CandidateView;
  active: boolean;
  onSelect: () => void;
}) {
  const { candidate, missing, found } = view;
  const foundName = found.fullName?.trim() || "(sin identificar)";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={[
        "w-full rounded-[8px] border px-[14px] py-[12px] text-left transition",
        active
          ? "border-[var(--hos-blue)] bg-[#F4FAFD] shadow-sm"
          : "border-[var(--hos-border)] bg-white hover:bg-[#F8FAF8]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-[10px]">
        <span className={`font-data text-[22px] font-bold leading-none ${scoreColor(candidate.score)}`}>
          {candidate.score}%
        </span>
        <StatusChip status={candidate.status} />
      </div>
      <div className="mt-[10px] text-[14px] font-extrabold leading-[18px] text-[var(--hos-text)]">
        {missing.fullName || "—"} <span className="text-[var(--hos-muted)]">→</span> {foundName}
      </div>
      <div className="mt-[6px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">{found.city || "—"}</div>
      {view.nameBaseRate > 0 ? (
        <div
          className={[
            "mt-[8px] inline-flex items-center gap-[5px] text-[11px] font-bold leading-none",
            view.nameBaseRate >= COMMON_NAME_THRESHOLD ? "text-[var(--hos-red)]" : "text-[var(--hos-muted)]",
          ].join(" ")}
        >
          <Users className="h-[12px] w-[12px]" strokeWidth={2.2} />
          {view.nameBaseRate} con nombre similar
        </div>
      ) : null}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[3px] border-b border-[#E2E8E4] py-[8px] last:border-b-0">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--hos-muted)]">{label}</span>
      <span className="text-[13px] font-bold leading-[17px] text-[var(--hos-text)]">{value || "—"}</span>
    </div>
  );
}

function ageSex(age: number | null, sex: string): string {
  const a = age === null ? "edad desconocida" : `${age} años`;
  const s = sex === "F" ? "femenino" : sex === "M" ? "masculino" : "sexo sin especificar";
  return `${a} · ${s}`;
}

function ReportCard({
  heading,
  accent,
  name,
  age,
  sex,
  city,
  location,
  locationLabel,
  at,
  atLabel,
  condition,
  description,
  reporterOrg,
}: {
  heading: string;
  accent: string;
  name: string;
  age: number | null;
  sex: string;
  city: string;
  location: string;
  locationLabel: string;
  at: string | null;
  atLabel: string;
  condition?: string;
  description: string;
  reporterOrg?: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px]">
      <div className={`text-[11px] font-extrabold uppercase tracking-wide ${accent}`}>{heading}</div>
      <div className="mt-[8px] text-[16px] font-extrabold leading-[20px] text-[var(--hos-text)]">{name}</div>
      <div className="mt-[10px] flex flex-col">
        <Row label="Edad / sexo" value={ageSex(age, sex)} />
        <Row label="Ciudad" value={city} />
        <Row label={locationLabel} value={location} />
        <Row label={atLabel} value={at ? at.slice(0, 10) : "—"} />
        {condition !== undefined ? <Row label="Condición" value={condition} /> : null}
        {reporterOrg !== undefined ? <Row label="Organización que reporta" value={reporterOrg} /> : null}
        <Row label="Rasgos" value={description} />
      </div>
    </div>
  );
}

function EvidenceChain({ candidate }: { candidate: MatchCandidate }) {
  const signals = candidate.factors.filter(isSignal);
  const flags = candidate.factors.filter((f) => !isSignal(f));
  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <h3 className="text-[15px] font-extrabold leading-none text-[var(--hos-text)]">Cadena de evidencia</h3>
      <p className="mt-[8px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">
        Cada señal es ponderada y explicable. Modelo: <span className="font-data">{candidate.model}</span>
      </p>
      <div className="mt-[14px] flex flex-col gap-[12px]">
        {signals.length === 0 ? (
          <p className="text-[12px] font-bold text-[var(--hos-muted)]">Sin señales ponderadas disponibles.</p>
        ) : (
          signals.map((f) => {
            const pct = Math.round(f.score * 100);
            return (
              <div key={f.key}>
                <div className="flex items-center justify-between gap-[10px]">
                  <span className="text-[13px] font-extrabold text-[var(--hos-text)]">{f.label}</span>
                  <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{pct}%</span>
                </div>
                <div className="mt-[6px]">
                  <ScoreBar score={pct} bar={scoreBar(pct)} />
                </div>
                <p className="mt-[5px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">{f.detail}</p>
              </div>
            );
          })
        )}
      </div>
      {flags.length > 0 ? (
        <div className="mt-[16px] border-t border-[#E2E8E4] pt-[14px]">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--hos-muted)]">
            Señales y alertas
          </div>
          <div className="mt-[10px] flex flex-col gap-[8px]">
            {flags.map((f) => {
              const ai = f.key.startsWith("ai:");
              return (
                <div
                  key={f.key}
                  className={[
                    "flex items-start gap-[8px] rounded-[6px] border px-[10px] py-[8px]",
                    ai ? "border-[#CFE3F2] bg-[#F1F8FC]" : "border-[#F1D8D2] bg-[#FCF1EF]",
                  ].join(" ")}
                >
                  {ai ? (
                    <Sparkles className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[var(--hos-blue)]" strokeWidth={2.4} />
                  ) : (
                    <ShieldAlert className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[var(--hos-red)]" strokeWidth={2.4} />
                  )}
                  <div>
                    <div className={`text-[12px] font-extrabold ${ai ? "text-[#0B4F76]" : "text-[#8A2C20]"}`}>{f.label}</div>
                    <div className="mt-[2px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">{f.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Decision = "confirmed" | "needs_more" | "rejected";

function VerifyPanel({ candidateId, onVerified }: { candidateId: string; onVerified: () => void }) {
  const [verifierOrg, setVerifierOrg] = useState("");
  const [verifierName, setVerifierName] = useState("");
  const [evidence, setEvidence] = useState("");
  const [confidence, setConfidence] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function submit(decision: Decision) {
    if (verifierOrg.trim().length === 0) {
      setError("La organización que verifica es obligatoria.");
      setStatus("error");
      return;
    }
    const trimmedConfidence = confidence.trim();
    if (trimmedConfidence !== "") {
      const n = Number(trimmedConfidence);
      if (!Number.isInteger(n) || n < 0 || n > 100) {
        setError("La confianza debe ser un entero entre 0 y 100.");
        setStatus("error");
        return;
      }
    }
    setStatus("submitting");
    setError("");
    try {
      // confidence is omitted (not null) when empty: the server schema accepts
      // an absent value, not null.
      const payload: {
        candidateId: string;
        decision: Decision;
        verifierOrg: string;
        verifierName: string;
        evidence: string;
        confidence?: number;
      } = {
        candidateId,
        decision,
        verifierOrg: verifierOrg.trim(),
        verifierName: verifierName.trim(),
        evidence: evidence.trim(),
      };
      if (trimmedConfidence !== "") payload.confidence = Number(trimmedConfidence);
      const res = await verifyCandidate(payload);
      setResult(res);
      setStatus("done");
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la verificación.");
      setStatus("error");
    }
  }

  if (status === "done" && result) {
    const resolved = result.decision === "confirmed" && result.resolved;
    const chipKey: MatchStatus =
      result.decision === "confirmed" ? "confirmed" : result.decision === "rejected" ? "rejected" : "pending";
    return (
      <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
        <div className="flex items-center gap-[10px]">
          <span className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#DDEFE8]">
            <Check className="h-5 w-5 text-[var(--hos-green)]" strokeWidth={2.6} />
          </span>
          <div>
            <div className="text-[15px] font-extrabold text-[var(--hos-text)]">Verificación registrada</div>
            <div className="mt-[2px] flex items-center gap-[8px] text-[12px] font-bold text-[var(--hos-muted)]">
              Decisión: <StatusChip status={chipKey} />
            </div>
          </div>
        </div>
        {resolved ? (
          <div className="mt-[14px] rounded-[6px] bg-[#DDEFE8] px-[12px] py-[10px] text-[13px] font-extrabold text-[#16613F]">
            Caso resuelto · familia notificada
          </div>
        ) : null}
      </div>
    );
  }

  const fieldBase =
    "mt-[6px] w-full rounded-[6px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px] text-[14px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";

  return (
    <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
      <h3 className="text-[15px] font-extrabold leading-none text-[var(--hos-text)]">Verificación humana</h3>
      <p className="mt-[8px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">
        Registre la evidencia que sustenta su decisión. Una coincidencia es un candidato a verificar.
      </p>
      <div className="mt-[14px] grid grid-cols-2 gap-[12px] max-[640px]:grid-cols-1">
        <label className="text-[12px] font-extrabold text-[var(--hos-muted)]">
          Organización que verifica
          <input
            className={fieldBase}
            value={verifierOrg}
            onChange={(e) => setVerifierOrg(e.target.value)}
            placeholder="Cruz Roja, ACNUR…"
          />
        </label>
        <label className="text-[12px] font-extrabold text-[var(--hos-muted)]">
          Su nombre <span className="ml-[6px] font-bold lowercase text-[#9aa8a2]">(opcional)</span>
          <input className={fieldBase} value={verifierName} onChange={(e) => setVerifierName(e.target.value)} />
        </label>
        <label className="col-span-2 text-[12px] font-extrabold text-[var(--hos-muted)] max-[640px]:col-span-1">
          Evidencia
          <textarea
            className={`${fieldBase} min-h-[72px] resize-none`}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Documento de identidad, testimonio del familiar, foto comparada…"
          />
        </label>
        <label className="text-[12px] font-extrabold text-[var(--hos-muted)]">
          Confianza (0-100) <span className="ml-[6px] font-bold lowercase text-[#9aa8a2]">(opcional)</span>
          <input
            type="number"
            min={0}
            max={100}
            className={fieldBase}
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
          />
        </label>
      </div>
      {error ? <p className="mt-[12px] text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
      <div className="mt-[16px] flex flex-wrap gap-[10px]">
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={() => void submit("confirmed")}
          className="h-[44px] rounded-[6px] bg-[var(--hos-green)] px-[16px] text-[13px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          Confirmar
        </button>
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={() => void submit("needs_more")}
          className="h-[44px] rounded-[6px] border border-[var(--hos-border)] bg-white px-[16px] text-[13px] font-extrabold text-[var(--hos-text)] transition hover:bg-[#F8FAF8] disabled:opacity-60"
        >
          Necesita más
        </button>
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={() => void submit("rejected")}
          className="h-[44px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[13px] font-extrabold text-white transition hover:bg-[#B63F33] disabled:opacity-60"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

export function Detail({ view, onVerified }: { view: CandidateView; onVerified: () => void }) {
  const { candidate, missing, found } = view;
  const foundName = found.fullName?.trim() || "Sin identificar";
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
        <div className="flex items-start justify-between gap-[14px]">
          <div>
            <div className="text-[12px] font-bold leading-none text-[var(--hos-muted)]">Prioridad de revisión</div>
            <div className={`mt-[10px] font-data text-[34px] font-bold leading-none ${scoreColor(candidate.score)}`}>
              {candidate.score}%
            </div>
          </div>
          <div className="flex items-center gap-[8px]">
            {candidate.score >= 80 ? (
              <ShieldCheck className="h-5 w-5 text-[var(--hos-green)]" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-[var(--hos-yellow)]" />
            )}
            <StatusChip status={candidate.status} />
          </div>
        </div>
        <div className="mt-[14px]">
          <ScoreBar score={candidate.score} bar={scoreBar(candidate.score)} />
        </div>
        <p className="mt-[10px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
          Puntaje para ordenar y priorizar la revisión, no una probabilidad calibrada (aún sin validar con resultados reales).
        </p>
        <NameBaseRate count={view.nameBaseRate} />
      </div>

      <div className="grid grid-cols-2 gap-[16px] max-[860px]:grid-cols-1">
        <ReportCard
          heading="Reporte de desaparecido"
          accent="text-[var(--hos-red)]"
          name={missing.fullName || "—"}
          age={missing.age}
          sex={missing.sex}
          city={missing.city}
          location={missing.lastSeenLocation}
          locationLabel="Último lugar conocido"
          at={missing.lastSeenAt}
          atLabel="Última fecha conocida"
          description={missing.description}
        />
        <ReportCard
          heading="Reporte de encontrado"
          accent="text-[var(--hos-green)]"
          name={foundName}
          age={found.age}
          sex={found.sex}
          city={found.city}
          location={found.foundLocation}
          locationLabel="Lugar donde fue encontrada"
          at={found.foundAt}
          atLabel="Fecha en que fue encontrada"
          condition={CONDITION_LABEL[found.condition] ?? found.condition}
          description={found.description}
          reporterOrg={found.reporterOrg}
        />
      </div>

      <EvidenceChain candidate={candidate} />

      <VerifyPanel key={candidate.id} candidateId={candidate.id} onVerified={onVerified} />

      <p className="rounded-[8px] border border-[#D4DED9] bg-[#F8FAF8] px-[14px] py-[12px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
        {AI_NOTE}
      </p>
    </div>
  );
}
