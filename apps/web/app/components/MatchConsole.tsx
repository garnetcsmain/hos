"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/HosDashboard";
import { type ModalKind } from "@/app/components/IntakeForms";
import { CandidateRow, Detail } from "@/app/components/MatchConsoleParts";
import { listMatches, type CandidateView } from "@/app/lib/client/api";

export function MatchConsole({ onlyPending = false }: { onlyPending?: boolean }) {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [views, setViews] = useState<CandidateView[] | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listMatches(onlyPending ? "pending" : undefined)
      .then((res) => {
        if (!active) return;
        const sorted = [...res.candidates].sort((a, b) => b.candidate.score - a.candidate.score);
        setError("");
        setViews(sorted);
        setSelectedId((prev) => {
          if (prev && sorted.some((v) => v.candidate.id === prev)) return prev;
          return sorted[0]?.candidate.id ?? null;
        });
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "No se pudieron cargar las coincidencias.");
        setViews([]);
      });
    return () => {
      active = false;
    };
  }, [onlyPending, reloadKey]);

  const selected = useMemo(
    () => views?.find((v) => v.candidate.id === selectedId) ?? null,
    [views, selectedId],
  );

  const title = onlyPending ? "Verification Queue" : "AI Matching Engine";
  const subtitle = onlyPending
    ? "Cola de verificación · un coordinador humano revisa cada candidato pendiente"
    : "Revisión de candidatos · la IA recomienda, las personas deciden";

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((v) => !v)}
      onOpenFamily={() => setModalKind("family")}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="flex flex-1 flex-col gap-[18px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        {views === null ? (
          <p className="text-[14px] font-bold text-[var(--hos-muted)]">Cargando coincidencias…</p>
        ) : error ? (
          <div className="rounded-[8px] border border-[#F1D8D2] bg-[#FCF1EF] px-[16px] py-[14px] text-[14px] font-bold text-[#8A2C20]">
            {error}
          </div>
        ) : views.length === 0 ? (
          <div className="rounded-[8px] border border-[var(--hos-border)] bg-white px-[18px] py-[28px] text-center">
            <h3 className="text-[18px] font-extrabold text-[var(--hos-text)]">
              {onlyPending ? "No hay candidatos pendientes" : "Aún no hay coincidencias"}
            </h3>
            <p className="mt-[10px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
              La IA seguirá comparando reportes automáticamente. Una coincidencia siempre es un candidato a verificar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-[18px] max-[1100px]:grid-cols-1">
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-[var(--hos-text)]">Candidatos</span>
                <span className="font-data text-[12px] font-bold text-[var(--hos-muted)]">{views.length}</span>
              </div>
              {views.map((view) => (
                <CandidateRow
                  key={view.candidate.id}
                  view={view}
                  active={view.candidate.id === selectedId}
                  onSelect={() => setSelectedId(view.candidate.id)}
                />
              ))}
            </div>
            <div className="min-w-0">
              {selected ? (
                <Detail view={selected} onVerified={() => setReloadKey((k) => k + 1)} />
              ) : (
                <p className="text-[14px] font-bold text-[var(--hos-muted)]">Seleccione un candidato para revisar.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
