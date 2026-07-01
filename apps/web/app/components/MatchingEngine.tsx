"use client";

import { useState } from "react";
import { AppShell } from "@/app/components/HosDashboard";
import { Term } from "@/app/components/Term";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";

const candidates = [
  {
    id: "FP-0491",
    evidence: "Parte del nombre + lugar + cicatriz",
    confidence: 87,
    action: "revisar",
    risk: "Requiere consentimiento y verificación de la familia",
  },
  {
    id: "FP-0472",
    evidence: "Rango de edad + morral",
    confidence: 62,
    action: "comparar",
    risk: "La foto es de baja calidad",
  },
  {
    id: "FP-0440",
    evidence: "Solo un reporte cercano",
    confidence: 41,
    action: "descartar",
    risk: "Evidencia débil, lugar poco seguro",
  },
];

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-[8px] overflow-hidden rounded-full bg-[#EAF1EE]">
      <div className="h-full rounded-full bg-[var(--hos-blue)]" style={{ width: `${value}%` }} />
    </div>
  );
}

export function MatchingEngine() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]);

  return (
    <AppShell
      title="Motor de coincidencias con IA"
      subtitle="Revisión de candidatos para comparar reportes de desaparecidos y encontrados"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((value) => !value)}
      onOpenFamily={() => undefined}
      modalKind={null}
      onCloseModal={() => undefined}
    >
      <div className="flex flex-1 flex-col gap-[18px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <section className="rounded-[8px] border border-[#B8C2BE] bg-white p-[18px] shadow-sm">
          <div className="flex items-start justify-between gap-[16px] max-[760px]:flex-col">
            <div>
              <div className="text-[13px] font-bold leading-none text-[var(--hos-muted)]">Revisión de <Term k="candidato">candidatos</Term></div>
              <div className="mt-[8px] text-[15px] font-bold leading-none text-[var(--hos-muted)]">
                Las probabilidades cambian a medida que llegan nuevos reportes.
              </div>
            </div>
            <div className="rounded-full bg-[#DCEEF8] px-[14px] py-[8px] text-[14px] font-extrabold text-[#0B4F76]">
              {candidates.length} candidatos
            </div>
          </div>

          <div className="mt-[18px] grid grid-cols-3 gap-[14px] max-[900px]:grid-cols-1">
            <button
              type="button"
              className="min-h-[92px] rounded-[8px] border-2 border-black bg-[#DCEEF8] p-[16px] text-left"
            >
              <div className="text-[14px] font-bold uppercase leading-none text-[var(--hos-muted)]"><Term k="puntuacion">Puntuación</Term> de coincidencia</div>
              <div className="mt-[12px] font-data text-[32px] font-bold leading-none text-[#0B4F76]">
                {selectedCandidate.confidence}%
              </div>
            </button>
            <div className="min-h-[92px] rounded-[8px] border border-[var(--hos-border)] bg-[#FBFDFC] p-[16px]">
              <div className="text-[14px] font-bold uppercase leading-none text-[var(--hos-muted)]">Rasgos en común</div>
              <div className="mt-[12px] text-[32px] font-semibold leading-none text-black">6</div>
            </div>
            <div className="min-h-[92px] rounded-[8px] border border-[var(--hos-border)] bg-[#FBFDFC] p-[16px]">
              <div className="text-[14px] font-bold uppercase leading-none text-[var(--hos-muted)]">Alertas de riesgo</div>
              <div className="mt-[12px] text-[32px] font-semibold leading-none text-black">1</div>
            </div>
          </div>

          <div className="mt-[18px] overflow-hidden rounded-[8px] border border-[var(--hos-border)]">
            <div className="grid grid-cols-[180px_minmax(260px,1fr)_140px_150px] bg-[#EEF6F2] max-[980px]:hidden">
              {["Candidato", "Evidencia", "Confianza", "Acción"].map((header) => (
                <div key={header} className="border-r border-[#D6E2DD] px-[14px] py-[12px] text-[14px] font-bold text-[var(--hos-muted)] last:border-r-0">
                  {header}
                </div>
              ))}
            </div>
            {candidates.map((candidate) => {
              const selected = selectedCandidate.id === candidate.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setSelectedCandidate(candidate)}
                  className={[
                    "grid w-full grid-cols-[180px_minmax(260px,1fr)_140px_150px] border-t border-[#DDE5E1] text-left transition hover:bg-[#F8FAF8] max-[980px]:grid-cols-1 max-[980px]:gap-[10px] max-[980px]:p-[14px]",
                    selected ? "bg-[#F8FCFA]" : "bg-white",
                  ].join(" ")}
                >
                  <div className="px-[14px] py-[12px] text-[15px] font-extrabold text-black max-[980px]:p-0">{candidate.id}</div>
                  <div className="px-[14px] py-[12px] text-[15px] font-bold text-[var(--hos-muted)] max-[980px]:p-0">
                    {candidate.evidence}
                  </div>
                  <div className="px-[14px] py-[12px] max-[980px]:p-0">
                    <div className="text-[15px] font-bold text-[var(--hos-muted)]">{candidate.confidence}%</div>
                    <div className="mt-[8px] max-w-[120px]">
                      <ConfidenceBar value={candidate.confidence} />
                    </div>
                  </div>
                  <div className="px-[14px] py-[12px] max-[980px]:p-0">
                    <span className="inline-flex h-[30px] items-center rounded-full bg-[#EEF3F1] px-[14px] text-[13px] font-extrabold text-[var(--hos-muted)]">
                      {candidate.action}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-[18px] flex items-center justify-between gap-[18px] max-[900px]:flex-col max-[900px]:items-stretch">
            <p className="text-[14px] font-bold leading-[20px] text-[var(--hos-muted)]">
              La IA nunca confirma la identidad. El coordinador debe comparar la evidencia y pedir la verificación.
            </p>
            <button
              type="button"
              className="flex h-[44px] items-center justify-center gap-[10px] rounded-[8px] bg-black px-[18px] text-[14px] font-extrabold text-white"
            >
              <Check className="h-4 w-4" />
              Abrir revisión
            </button>
          </div>
        </section>

        <section className="grid grid-cols-[minmax(0,1fr)_300px] gap-[18px] max-[1100px]:grid-cols-1">
          <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
            <h3 className="text-[17px] font-extrabold text-[var(--hos-text)]">Probabilidad del candidato elegido</h3>
            <div className="mt-[12px] rounded-[8px] border border-[#DDE5E1] bg-[#FBFCFB] p-[14px]">
              <div className="flex items-center justify-between gap-[14px]">
                <div>
                  <div className="font-data text-[13px] font-bold text-[var(--hos-blue)]">{selectedCandidate.id}</div>
                  <div className="mt-[8px] text-[15px] font-extrabold text-[var(--hos-text)]">{selectedCandidate.evidence}</div>
                </div>
                <div className="font-data text-[26px] font-bold text-[#0B4F76]">{selectedCandidate.confidence}%</div>
              </div>
              <div className="mt-[12px]">
                <ConfidenceBar value={selectedCandidate.confidence} />
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[16px]">
            <div className="flex items-center gap-[10px]">
              {selectedCandidate.confidence >= 80 ? (
                <ShieldCheck className="h-5 w-5 text-[var(--hos-green)]" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-[var(--hos-yellow)]" />
              )}
              <h3 className="text-[17px] font-extrabold text-[var(--hos-text)]">Guía de revisión</h3>
            </div>
            <p className="mt-[12px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">{selectedCandidate.risk}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
