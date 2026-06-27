"use client";

import { useState } from "react";
import { AppShell } from "@/app/components/HosDashboard";
import {
  Camera,
  Check,
  ChevronRight,
  ImagePlus,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type Step = 1 | 2 | 3;

const missingCases = [
  {
    id: "MP-VE-0184",
    name: "Maria Alejandra R.",
    ageSex: "29 / F",
    lastSeen: "La Guaira terminal",
    date: "25 Jun 2026",
    status: "Needs review",
    confidence: "3 candidate matches",
    matchProbability: 87,
    foundCandidate: "FP-0491",
    matchEvidence: "Name fragment + location + scar",
    contact: "Sister: Ana R. +58 *** *** 1942",
  },
  {
    id: "MP-VE-0185",
    name: "Diego F. Martinez",
    ageSex: "12 / M",
    lastSeen: "Maiquetia shelter line",
    date: "26 Jun 2026",
    status: "Photo pending",
    confidence: "1 possible hospital report",
    matchProbability: 62,
    foundCandidate: "FP-0472",
    matchEvidence: "Age range + backpack",
    contact: "Father: Luis M. +58 *** *** 2210",
  },
  {
    id: "MP-VE-0186",
    name: "Carmen Luisa P.",
    ageSex: "64 / F",
    lastSeen: "Caracas West bus stop",
    date: "26 Jun 2026",
    status: "High priority",
    confidence: "No candidate yet",
    matchProbability: 12,
    foundCandidate: "No candidate",
    matchEvidence: "Nearby reports do not share enough traits",
    contact: "Neighbor: Rosa G. +58 *** *** 7820",
  },
];

const stepCopy = [
  { step: 1, title: "Consent recorded", detail: "Share only with authorized case team" },
  { step: 2, title: "Photo quality", detail: "Face visible, neutral crop" },
  { step: 3, title: "Sensitive notes", detail: "Medical data hidden from public view" },
] as const;

function IntakeChecks({ currentStep, onSelect }: { currentStep: Step; onSelect: (step: Step) => void }) {
  return (
    <aside className="rounded-[8px] bg-[#F7FAF8] p-[20px]">
      <h3 className="text-[22px] font-extrabold leading-none text-black">Intake checks</h3>
      <div className="mt-[24px] flex flex-col gap-[22px]">
        {stepCopy.map((item) => {
          const active = currentStep === item.step;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => onSelect(item.step)}
              className="flex items-start gap-[16px] text-left"
            >
              <span
                className={[
                  "flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-[18px] font-extrabold",
                  active ? "bg-black text-white" : "bg-[#EAF1EE] text-[var(--hos-muted)]",
                ].join(" ")}
              >
                {item.step}
              </span>
              <span>
                <span className="block text-[18px] font-extrabold leading-none text-black">{item.title}</span>
                <span className="mt-[8px] block text-[16px] font-bold leading-[20px] text-[var(--hos-muted)]">{item.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  type = "text",
  large = false,
}: {
  label: string;
  value: string;
  type?: "text" | "date";
  large?: boolean;
}) {
  return (
    <label
      className={[
        "rounded-[8px] border border-[var(--hos-border)] bg-[#FBFDFC] px-[16px] py-[14px]",
        large ? "col-span-2 max-[760px]:col-span-1" : "",
      ].join(" ")}
    >
      <span className="block text-[15px] font-bold leading-none text-[var(--hos-muted)]">{label}</span>
      <input
        type={type}
        defaultValue={value}
        className="mt-[12px] w-full bg-transparent text-[18px] font-semibold leading-[22px] text-black outline-none"
      />
    </label>
  );
}

function IntakeForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0E1713]/45 p-[24px]">
      <div className="mx-auto min-h-[720px] max-w-[1240px] rounded-[12px] border border-[#B8C2BE] bg-white p-[32px] shadow-xl max-[760px]:p-[18px]">
        <div className="flex items-start justify-between gap-[18px]">
          <div>
            <div className="text-[18px] font-medium leading-none text-[var(--hos-muted)]">Family intake</div>
            <h2 className="mt-[10px] text-[34px] font-extrabold leading-none text-black max-[760px]:text-[28px]">
              Missing Persons Registry
            </h2>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="rounded-full bg-[#DCEEF8] px-[18px] py-[10px] text-[15px] font-extrabold text-[#0B4F76]">
              Draft intake
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close intake"
              className="rounded-[6px] p-[8px] text-[var(--hos-muted)] transition hover:bg-[#F1F5F2] hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-[28px] grid grid-cols-[minmax(0,1fr)_500px] gap-[24px] max-[1100px]:grid-cols-1">
          <div>
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-[14px] max-[760px]:grid-cols-1">
                <Field label="Person name" value="Maria Alejandra R." />
                <Field label="Age / sex" value="29 / F" />
                <Field label="Last seen" value="La Guaira terminal" />
                <Field label="Date" value="2026-06-25" type="date" />
                <Field
                  label="Identifying details"
                  value="Green backpack, small scar above left eyebrow, speaks Spanish and Warao"
                  large
                />
                <Field label="Family contact" value="Sister: Ana R. +58 *** *** 1942" large />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="rounded-[8px] border border-[var(--hos-border)] bg-[#FBFDFC] p-[24px]">
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[8px] border border-dashed border-[var(--hos-border)] bg-[#F8FAF8] text-center">
                  <ImagePlus className="h-[48px] w-[48px] text-[var(--hos-blue)]" />
                  <h3 className="mt-[16px] text-[22px] font-extrabold text-black">Upload a reference photo</h3>
                  <p className="mt-[8px] max-w-[420px] text-[15px] font-bold leading-[22px] text-[var(--hos-muted)]">
                    Use a clear face photo when available. Keep original evidence private and attach provenance.
                  </p>
                  <button
                    type="button"
                    className="mt-[18px] flex h-[44px] items-center gap-[8px] rounded-[6px] bg-[var(--hos-dark)] px-[16px] text-[14px] font-extrabold text-white"
                  >
                    <Camera className="h-4 w-4" />
                    Select image
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="rounded-[8px] border border-[var(--hos-border)] bg-[#FBFDFC] p-[18px]">
                <label className="text-[15px] font-bold leading-none text-[var(--hos-muted)]">
                  Sensitive notes
                  <textarea
                    defaultValue="Last seen helping neighbors near the terminal before communications failed. Family reports asthma medication may be needed."
                    className="mt-[12px] min-h-[260px] w-full resize-none rounded-[8px] border border-[var(--hos-border)] bg-white p-[14px] text-[18px] font-semibold leading-[26px] text-black outline-none focus:ring-2 focus:ring-[#DDEFE8]"
                  />
                </label>
                <div className="mt-[14px] flex items-start gap-[10px] rounded-[8px] bg-[#F1F5F2] p-[12px]">
                  <Lock className="mt-[2px] h-5 w-5 shrink-0 text-[var(--hos-muted)]" />
                  <p className="text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
                    These notes are never public. They are visible only to authorized case reviewers and verification partners.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <IntakeChecks currentStep={step} onSelect={setStep} />
        </div>

        <div className="mt-[28px] flex items-center justify-between gap-[16px] max-[760px]:flex-col max-[760px]:items-stretch">
          <div className="text-[18px] font-medium text-[var(--hos-muted)]">Autosaved 09:42 - record MP-VE-0184</div>
          <div className="flex justify-end gap-[10px]">
            <button
              type="button"
              onClick={() => setStep(step === 1 ? 1 : ((step - 1) as Step))}
              className="h-[48px] rounded-[8px] border border-[var(--hos-border)] px-[18px] text-[15px] font-extrabold text-[var(--hos-muted)]"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as Step)}
                className="flex h-[48px] items-center gap-[8px] rounded-[8px] bg-black px-[18px] text-[15px] font-extrabold text-white"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex h-[48px] items-center gap-[10px] rounded-[8px] bg-black px-[18px] text-[15px] font-extrabold text-white"
              >
                <Check className="h-5 w-5" />
                Save and queue review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchProbability({ value }: { value: number }) {
  const color = value >= 80 ? "bg-[var(--hos-green)]" : value >= 50 ? "bg-[var(--hos-yellow)]" : "bg-[var(--hos-muted)]";

  return (
    <div>
      <div className="flex items-center justify-between gap-[10px]">
        <span className="text-[12px] font-extrabold text-[var(--hos-muted)]">Found match probability</span>
        <span className="font-data text-[18px] font-bold text-[var(--hos-blue)]">{value}%</span>
      </div>
      <div className="mt-[8px] h-[8px] overflow-hidden rounded-full bg-[#EAF1EE]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CaseList({
  selectedCaseId,
  onSelectCase,
  onOpenForm,
}: {
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onOpenForm: () => void;
}) {
  const selectedCase = missingCases.find((item) => item.id === selectedCaseId) ?? missingCases[0];

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-[18px] max-[1180px]:grid-cols-1">
      <div className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px]">
        <div className="flex items-center justify-between gap-[16px] max-[760px]:flex-col max-[760px]:items-stretch">
          <div>
            <div className="text-[13px] font-bold text-[var(--hos-muted)]">Family intake queue</div>
            <h2 className="mt-[8px] text-[24px] font-extrabold leading-none text-[var(--hos-text)]">Reported missing cases</h2>
          </div>
          <button
            type="button"
            onClick={onOpenForm}
            className="flex h-[48px] items-center justify-center gap-[10px] rounded-[6px] bg-[var(--hos-red)] px-[16px] text-[14px] font-extrabold text-white transition hover:bg-[#B63F33]"
          >
            <Plus className="h-5 w-5" />
            Report missing case
          </button>
        </div>

        <div className="mt-[18px] flex items-center gap-[10px] rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px]">
          <Search className="h-5 w-5 text-[var(--hos-muted)]" />
          <input
            placeholder="Search by name, case ID, location, or contact"
            className="w-full bg-transparent text-[14px] font-bold text-[var(--hos-text)] outline-none"
          />
        </div>

        <div className="mt-[18px] grid gap-[14px]">
          {missingCases.map((item) => {
            const selected = item.id === selectedCaseId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCase(item.id)}
                aria-pressed={selected}
                className={[
                  "grid grid-cols-[minmax(0,1fr)_220px] gap-[16px] rounded-[8px] border bg-[#FBFCFB] p-[16px] text-left transition hover:-translate-y-0.5 hover:border-[var(--hos-border)] hover:shadow-sm max-[760px]:grid-cols-1",
                  selected ? "border-[var(--hos-green)] ring-2 ring-[#DDEFE8]" : "border-[#DDE5E1]",
                ].join(" ")}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-[10px]">
                    <span className="font-data text-[12px] font-bold text-[var(--hos-blue)]">{item.id}</span>
                    <span className="rounded-full bg-[#FFEBD5] px-[10px] py-[4px] text-[11px] font-extrabold text-[#7A3D00]">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-[10px] text-[18px] font-extrabold leading-none text-[var(--hos-text)]">{item.name}</h3>
                  <div className="mt-[10px] text-[13px] font-bold text-[var(--hos-muted)]">
                    {item.ageSex} · Last seen: {item.lastSeen} · {item.date}
                  </div>
                  <div className="mt-[8px] text-[13px] font-bold text-[var(--hos-muted)]">{item.contact}</div>
                </div>
                <div className="flex flex-col justify-between gap-[12px]">
                  <div className="text-[13px] font-extrabold text-[var(--hos-text)]">{item.confidence}</div>
                  <MatchProbability value={item.matchProbability} />
                  <div className="flex items-center gap-[8px] text-[12px] font-bold text-[var(--hos-green)]">
                    <ShieldCheck className="h-4 w-4" />
                    Trust metadata attached
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="rounded-[8px] border border-[var(--hos-border)] bg-white p-[18px]">
        <div className="text-[13px] font-bold text-[var(--hos-muted)]">Selected case</div>
        <h3 className="mt-[8px] text-[20px] font-extrabold leading-none text-[var(--hos-text)]">{selectedCase.name}</h3>
        <div className="mt-[16px] rounded-[8px] border border-[#DDE5E1] bg-[#FBFCFB] p-[14px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div>
              <div className="font-data text-[12px] font-bold text-[var(--hos-blue)]">{selectedCase.foundCandidate}</div>
              <div className="mt-[8px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
                {selectedCase.matchEvidence}
              </div>
            </div>
            <div className="font-data text-[28px] font-bold text-[var(--hos-blue)]">{selectedCase.matchProbability}%</div>
          </div>
          <div className="mt-[14px]">
            <MatchProbability value={selectedCase.matchProbability} />
          </div>
        </div>
        <p className="mt-[14px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
          Selecting a case only updates this match summary. Creating or editing intake data uses the report button.
        </p>
      </aside>
    </section>
  );
}

export function MissingRegistry() {
  const [trustLayer, setTrustLayer] = useState(true);
  const [modalKind, setModalKind] = useState<"family" | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(missingCases[0].id);

  return (
    <AppShell
      title="Missing Persons Registry"
      subtitle="Family-submitted missing-person reports for disaster reunification"
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((value) => !value)}
      onOpenFamily={() => setFormOpen(true)}
      modalKind={modalKind}
      onCloseModal={() => setModalKind(null)}
    >
      <div className="flex flex-1 flex-col gap-[28px] px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <div className="grid grid-cols-4 gap-[16px] max-[1180px]:grid-cols-2 max-[760px]:grid-cols-1">
          {[
            ["18,420", "missing requests", "text-[var(--hos-red)]"],
            ["642", "waiting family contact", "text-[var(--hos-yellow)]"],
            ["1,206", "candidate matches", "text-[var(--hos-blue)]"],
            ["94%", "records with consent", "text-[var(--hos-green)]"],
          ].map(([value, label, color]) => (
            <div key={label} className="rounded-[6px] border border-[var(--hos-border)] bg-white px-[16px] py-[14px]">
              <div className={`font-data text-[28px] font-bold leading-none ${color}`}>{value}</div>
              <div className="mt-[12px] text-[12px] font-bold leading-none text-[var(--hos-muted)]">{label}</div>
            </div>
          ))}
        </div>
        <CaseList
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          onOpenForm={() => setFormOpen(true)}
        />
      </div>
      {formOpen ? <IntakeForm onClose={() => setFormOpen(false)} /> : null}
    </AppShell>
  );
}
