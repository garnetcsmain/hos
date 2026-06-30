"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  Flag,
  HandHelping,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Newspaper,
  Package,
  Radio,
  ScanSearch,
  Send,
  ShieldCheck,
  Target,
  Truck,
  User,
  UserCheck,
  UserRoundSearch,
  Users,
  Warehouse,
  Wifi,
  Zap,
} from "lucide-react";
import { content } from "./content";
import { useLocale } from "./LocaleProvider";
import {
  BrowserFrame,
  Eyebrow,
  PhoneFrame,
  Reveal,
  Section,
  SectionHeading,
} from "./primitives";
import { LazyPlayer } from "./remotion/RemotionShowcase";
import {
  AidReportMockup,
  LogisticsMockup,
  MapMockup,
  NeedsMapMockup,
  PhoneMatchMockup,
  PhoneReportMockup,
  VolunteerOpsMockup,
} from "./mockups";

/* ------------------------------------------------------------------ Hero -- */

export function HeroSection() {
  const { tr } = useLocale();
  const h = content.hero;
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-[var(--m-bg)] px-[24px] pb-[64px] pt-[120px] text-[var(--m-on-dark)] sm:px-[40px] sm:pt-[140px]"
    >
      <div className="m-aurora pointer-events-none absolute inset-0" />
      <div className="m-grid-dots pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-b from-transparent to-[var(--m-bg)]" />

      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-[48px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-[8px] rounded-full bg-white/8 px-[13px] py-[7px] text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--m-on-dark-soft)] ring-1 ring-white/12">
              <span className="m-live-dot inline-block h-[7px] w-[7px] rounded-full bg-[var(--m-green)] text-[var(--m-green)]" />
              {tr(h.eyebrow)}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-[22px] text-[clamp(38px,6vw,64px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
              {tr(h.headline)}
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-[22px] max-w-[540px] text-[clamp(16px,2.1vw,20px)] leading-[1.6] text-[var(--m-on-dark-soft)]">
              {tr(h.subhead)}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-[32px] flex flex-wrap items-center gap-[12px]">
              <a
                href="#how"
                className="group inline-flex items-center gap-[8px] rounded-full bg-[var(--m-green)] px-[22px] py-[13px] text-[15px] font-bold text-[#04130c] shadow-[0_10px_30px_rgba(52,192,130,0.32)] transition hover:brightness-105"
              >
                {tr(h.secondaryCta)}
                <ArrowRight className="h-[17px] w-[17px] transition-transform group-hover:translate-x-[2px]" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-[18px] text-[13px] font-semibold text-[var(--m-on-dark-faint)]">{tr(h.note)}</p>
          </Reveal>
        </div>

        <Reveal delay={160} className="m-anim-float">
          <LazyPlayer id="chaos-to-clarity" badge={tr({ en: "Animated", es: "Animado" })} />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Problem -- */

const PROBLEM_ICONS = [Building2, Heart, ShieldCheck, MessageCircle, Users, Newspaper];

export function ProblemSection() {
  const { tr } = useLocale();
  const p = content.problem;
  return (
    <Section id="problem" theme="soft">
      <SectionHeading
        eyebrow={<Eyebrow tone="red">{tr({ en: "The problem", es: "El problema" })}</Eyebrow>}
        title={tr(p.title)}
        intro={tr(p.intro)}
      />
      <div className="mt-[44px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
        {p.points.map((pt, i) => {
          const Icon = PROBLEM_ICONS[i % PROBLEM_ICONS.length];
          return (
            <Reveal key={i} delay={i * 70}>
              <div className="flex h-full items-start gap-[14px] rounded-[16px] border border-[var(--m-line)] bg-white p-[20px] shadow-[var(--m-shadow-sm)]">
                <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--m-paper-2)] text-[var(--m-ink-soft)]">
                  <Icon className="h-[19px] w-[19px]" strokeWidth={2.1} />
                </span>
                <div>
                  <div className="text-[15px] font-extrabold text-[var(--m-ink)]">{tr(pt.label)}</div>
                  <p className="mt-[6px] text-[13.5px] leading-[1.5] text-[var(--m-ink-soft)]">{tr(pt.text)}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal delay={120}>
        <div className="mt-[28px] flex items-start gap-[12px] rounded-[16px] bg-[var(--m-ink)] px-[22px] py-[18px] text-[clamp(16px,2.1vw,20px)] font-semibold leading-[1.45] text-white">
          <span className="mt-[4px] h-[10px] w-[10px] shrink-0 rounded-full bg-[var(--m-red)]" />
          {tr(p.punchline)}
        </div>
      </Reveal>
    </Section>
  );
}

/* -------------------------------------------------------------- Big idea -- */

const PRINCIPLE_ICONS = [ScanSearch, Heart, Wifi, ShieldCheck];

export function BigIdeaSection() {
  const { tr } = useLocale();
  const b = content.bigIdea;
  return (
    <Section id="idea" theme="dark">
      <div className="m-grid-dots pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative grid items-center gap-[44px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <SectionHeading
            dark
            eyebrow={<Eyebrow tone="green">{tr({ en: "The idea", es: "La idea" })}</Eyebrow>}
            title={tr(b.title)}
            intro={tr(b.body)}
          />
          <Reveal delay={100}>
            <div className="mt-[24px] flex items-start gap-[11px] rounded-[14px] bg-[var(--m-green)]/10 px-[16px] py-[13px] ring-1 ring-[var(--m-green)]/20">
              <Heart className="mt-[1px] h-[17px] w-[17px] shrink-0 text-[var(--m-green)]" strokeWidth={2.2} />
              <p className="text-[13.5px] font-semibold leading-[1.5] text-[var(--m-on-dark)]">{tr(content.unityLine)}</p>
            </div>
          </Reveal>
          <div className="mt-[32px] grid gap-[14px] sm:grid-cols-2">
            {b.principles.map((pr, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className="flex h-full flex-col gap-[10px] rounded-[16px] bg-white/[0.04] p-[18px] ring-1 ring-white/10">
                    <span className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[var(--m-green)]/15 text-[var(--m-green)]">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    </span>
                    <div className="text-[15px] font-extrabold text-white">{tr(pr.title)}</div>
                    <p className="text-[13px] leading-[1.5] text-[var(--m-on-dark-soft)]">{tr(pr.text)}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal delay={120}>
          <BrowserFrame url="hos.app / map" glow>
            <MapMockup />
          </BrowserFrame>
          <p className="mt-[14px] text-center text-[12.5px] font-semibold text-[var(--m-on-dark-faint)]">
            {tr({ en: "Every report becomes one dot on one shared map.", es: "Cada reporte se vuelve un punto en un mismo mapa compartido." })}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------- How it works -- */

function StoryVisual({ kind }: { kind: "report" | "found" | "match" }) {
  const { tr } = useLocale();
  if (kind === "report")
    return (
      <PhoneFrame>
        <PhoneReportMockup />
      </PhoneFrame>
    );
  if (kind === "match")
    return (
      <PhoneFrame>
        <PhoneMatchMockup />
      </PhoneFrame>
    );
  // found report card (the volunteer in Caracas)
  return (
    <BrowserFrame url="hos.app / found">
      <div className="bg-[#f8faf8] p-[20px] text-[var(--hos-text)]">
        <div className="flex items-center gap-[8px] text-[var(--hos-green)]">
          <UserCheck className="h-[16px] w-[16px]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wide">{tr({ en: "Found report", es: "Reporte de encontrado" })}</span>
        </div>
        <div className="mt-[14px] flex gap-[14px]">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--hos-accent-soft)] text-[22px] font-extrabold text-[#2f6fa0]">
            CP
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-extrabold">Carlos Pérez</div>
            <div className="mt-[2px] text-[12px] font-semibold text-[var(--hos-muted)]">
              {tr({ en: "Shelter 17 · Maiquetía", es: "Refugio 17 · Maiquetía" })}
            </div>
            <span className="mt-[8px] inline-flex items-center gap-[6px] rounded-full bg-[#DDEFE8] px-[10px] py-[4px] text-[11px] font-bold text-[#16613F]">
              <span className="h-[6px] w-[6px] rounded-full bg-[var(--hos-green)]" />
              {tr({ en: "Alive · safe", es: "Con vida · a salvo" })}
            </span>
          </div>
        </div>
        <div className="mt-[16px] grid grid-cols-3 gap-[8px]">
          {[
            { Icon: ShieldCheck, l: { en: "Verified shelter", es: "Refugio verificado" } },
            { Icon: MapPin, l: { en: "GPS logged", es: "GPS registrado" } },
            { Icon: Check, l: { en: "Photo on file", es: "Foto adjunta" } },
          ].map((c, i) => (
            <div key={i} className="rounded-[9px] border border-[var(--hos-border)] bg-white px-[8px] py-[9px] text-center">
              <c.Icon className="mx-auto h-[15px] w-[15px] text-[var(--hos-green)]" />
              <div className="mt-[5px] text-[9.5px] font-bold leading-tight text-[var(--hos-muted)]">{tr(c.l)}</div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function HowItWorksSection() {
  const { tr } = useLocale();
  const h = content.howItWorks;
  const kinds: Array<"report" | "found" | "match"> = ["report", "found", "match"];
  return (
    <Section id="how" theme="paper">
      <SectionHeading
        align="center"
        eyebrow={<Eyebrow tone="blue">{tr({ en: "How it works", es: "Cómo funciona" })}</Eyebrow>}
        title={tr(h.title)}
        intro={tr(h.intro)}
      />
      <div className="mt-[56px] flex flex-col gap-[40px]">
        {h.steps.map((s, i) => {
          const flip = i % 2 === 1;
          return (
            <Reveal key={i}>
              <div className={`grid items-center gap-[32px] lg:grid-cols-2 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className={flip ? "lg:pl-[40px]" : "lg:pr-[40px]"}>
                  <div className="flex items-center gap-[12px]">
                    <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[var(--m-ink)] text-[15px] font-extrabold text-white">
                      {i + 1}
                    </span>
                    <span className="rounded-full bg-[var(--m-paper-3)] px-[12px] py-[5px] text-[12px] font-bold text-[var(--m-ink-soft)]">{tr(s.role)}</span>
                  </div>
                  <h3 className="mt-[18px] text-[clamp(20px,2.6vw,26px)] font-extrabold leading-[1.18] tracking-[-0.01em] text-[var(--m-ink)]">{tr(s.title)}</h3>
                  <p className="mt-[14px] text-[15px] leading-[1.6] text-[var(--m-ink-soft)]">{tr(s.body)}</p>
                  <div className="mt-[16px] inline-flex items-center gap-[8px] text-[13px] font-bold text-[var(--m-green-deep)]">
                    <ArrowRight className="h-[15px] w-[15px]" />
                    {tr(s.caption)}
                  </div>
                </div>
                <div className="flex justify-center">
                  <StoryVisual kind={kinds[i]} />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- Modules -- */

const MODULE_ICONS: Record<string, typeof UserRoundSearch> = {
  missing: UserRoundSearch,
  found: UserCheck,
  matching: ScanSearch,
  verification: ShieldCheck,
  communication: MessageCircle,
};
const MODULE_TONE: Record<string, string> = {
  missing: "var(--m-red)",
  found: "var(--m-green)",
  matching: "var(--m-teal)",
  verification: "var(--m-blue)",
  communication: "var(--m-violet)",
};

export function ModulesSection() {
  const { tr } = useLocale();
  return (
    <Section id="modules" theme="soft">
      <SectionHeading
        align="center"
        eyebrow={<Eyebrow tone="neutral">{tr({ en: "The 5 modules", es: "Los 5 módulos" })}</Eyebrow>}
        title={tr({ en: "Five simple parts, one mission", es: "Cinco partes simples, una misión" })}
        intro={tr({ en: "Each part does one job well. Together, they help a family find someone again.", es: "Cada parte hace bien una sola tarea. Juntas, ayudan a una familia a encontrar a alguien." })}
      />
      <div className="mt-[44px] grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        {content.modules.map((m, i) => {
          const Icon = MODULE_ICONS[m.id] ?? UserRoundSearch;
          const tone = MODULE_TONE[m.id] ?? "var(--m-green)";
          return (
            <Reveal key={m.id} delay={i * 60}>
              <div className="flex h-full flex-col rounded-[18px] border border-[var(--m-line)] bg-white p-[22px] shadow-[var(--m-shadow-sm)] transition hover:shadow-[var(--m-shadow-md)]">
                <div className="flex items-center gap-[12px]">
                  <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[13px]" style={{ background: `color-mix(in srgb, ${tone} 16%, white)`, color: tone }}>
                    <Icon className="h-[21px] w-[21px]" strokeWidth={2.2} />
                  </span>
                  <span className="font-data text-[12px] font-bold text-[var(--m-ink-soft)]">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-[16px] text-[18px] font-extrabold leading-[1.2] text-[var(--m-ink)]">{tr(m.name)}</h3>
                <div className="mt-[4px] text-[13px] font-bold" style={{ color: tone }}>{tr(m.tagline)}</div>
                <p className="mt-[12px] text-[13.5px] leading-[1.55] text-[var(--m-ink-soft)]">{tr(m.body)}</p>
                <ul className="mt-[14px] flex flex-col gap-[8px]">
                  {m.bullets.map((bl, j) => (
                    <li key={j} className="flex items-center gap-[8px] text-[12.5px] font-semibold text-[var(--m-ink)]">
                      <Check className="h-[14px] w-[14px] shrink-0" style={{ color: tone }} strokeWidth={2.6} />
                      {tr(bl)}
                    </li>
                  ))}
                </ul>
                <div className="mt-[16px] border-t border-[var(--m-line)] pt-[12px] text-[11.5px] font-semibold text-[var(--m-ink-soft)]">
                  <span className="text-[var(--m-ink)]">{tr({ en: "For: ", es: "Para: " })}</span>
                  {tr(m.forWho)}
                </div>
              </div>
            </Reveal>
          );
        })}

        {/* Featured: the matching engine, animated */}
        <Reveal delay={120} className="md:col-span-2 lg:col-span-3">
          <div className="grid items-center gap-[28px] rounded-[20px] border border-[var(--m-line)] bg-white p-[22px] shadow-[var(--m-shadow-sm)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <Eyebrow tone="green">{tr({ en: "Module 3 in motion", es: "Módulo 3 en acción" })}</Eyebrow>
              <h3 className="mt-[14px] text-[clamp(20px,2.4vw,26px)] font-extrabold leading-[1.18] text-[var(--m-ink)]">
                {tr({ en: "How the AI matches people", es: "Cómo la IA compara personas" })}
              </h3>
              <p className="mt-[12px] text-[14.5px] leading-[1.6] text-[var(--m-ink-soft)]">
                {tr({ en: "It lines up a missing report next to a found one and checks the clues that overlap — name, age, neighborhood — then shows how sure it is. It only ever suggests.", es: "Pone un reporte de desaparecido junto a uno de encontrado y revisa las pistas que coinciden — nombre, edad, barrio — y muestra qué tan segura está. Solo sugiere." })}
              </p>
            </div>
            <LazyPlayer id="match-pulse" badge={tr({ en: "Animated", es: "Animado" })} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------- AI on day 1 -- */

const SOURCE_ICONS = [Radio, Send, Heart, MessageCircle, Newspaper, Users, Building2];

export function AiDaySection() {
  const { tr } = useLocale();
  const a = content.aiDay1;
  return (
    <Section id="ai" theme="dark">
      <div className="grid items-start gap-[44px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="lg:sticky lg:top-[90px]">
          <SectionHeading
            dark
            eyebrow={<Eyebrow tone="violet">{tr({ en: "What AI does", es: "Qué hace la IA" })}</Eyebrow>}
            title={tr(a.title)}
            intro={tr(a.body)}
          />
          <Reveal delay={120}>
            <div className="mt-[24px] inline-flex items-center gap-[10px] rounded-[14px] bg-[var(--m-teal)]/10 px-[16px] py-[13px] text-[13.5px] font-semibold text-[var(--m-on-dark)] ring-1 ring-[var(--m-teal)]/25">
              <Languages className="h-[18px] w-[18px] text-[var(--m-teal)]" />
              {tr(a.outputNote)}
            </div>
          </Reveal>
          <Reveal delay={180} className="mt-[24px] block">
            <LazyPlayer id="signals-to-structure" badge={tr({ en: "Animated", es: "Animado" })} />
          </Reveal>
        </div>

        <div className="flex flex-col gap-[12px]">
          {a.sources.map((s, i) => {
            const Icon = SOURCE_ICONS[i % SOURCE_ICONS.length];
            return (
              <Reveal key={i} delay={i * 50}>
                <div className="flex items-start gap-[14px] rounded-[14px] bg-white/[0.04] p-[16px] ring-1 ring-white/10">
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-white/8 text-[var(--m-on-dark)]">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-extrabold text-white">{tr(s.name)}</div>
                    <p className="mt-[4px] text-[13px] italic leading-[1.45] text-[var(--m-on-dark-soft)]">“{tr(s.example)}”</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- Timeline -- */

export function TimelineSection() {
  const { tr } = useLocale();
  const t = content.aiTimeline;
  return (
    <Section theme="darker">
      <div className="grid items-center gap-[44px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Reveal>
          <LazyPlayer id="timeline-reconstruct" badge={tr({ en: "Animated", es: "Animado" })} />
        </Reveal>
        <div>
          <SectionHeading
            dark
            eyebrow={<Eyebrow tone="blue">{tr({ en: "The AI timeline", es: "Línea de tiempo" })}</Eyebrow>}
            title={tr(t.title)}
            intro={tr(t.intro)}
          />
          <Reveal delay={120}>
            <div className="mt-[24px] rounded-[16px] bg-white/[0.04] p-[20px] ring-1 ring-white/10">
              <div className="text-[14px] font-extrabold text-white">“{tr(t.question)}”</div>
              <div className="mt-[14px] flex flex-col gap-[12px]">
                {t.events.map((e, i) => (
                  <div key={i} className="flex gap-[14px]">
                    <div className="flex flex-col items-center">
                      <span className={`h-[11px] w-[11px] rounded-full ${i === t.events.length - 1 ? "bg-[var(--m-teal)]" : "bg-[var(--m-on-dark-faint)]"}`} />
                      {i < t.events.length - 1 ? <span className="mt-[2px] w-px flex-1 bg-white/12" /> : null}
                    </div>
                    <div className="pb-[2px]">
                      <span className="font-data text-[11px] font-bold text-[var(--m-on-dark-faint)]">{tr(e.date)}</span>
                      <p className="mt-[2px] text-[13px] leading-[1.4] text-[var(--m-on-dark)]">{tr(e.label)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-[18px] text-[13px] leading-[1.55] text-[var(--m-on-dark-soft)]">{tr(t.note)}</p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------- Object model -- */

const OBJECT_ICONS = [User, Building2, Heart, MapPin, AlertTriangle, Package, HandHelping, Truck, Target, MessageCircle];

export function ObjectModelSection() {
  const { tr } = useLocale();
  const o = content.objectModel;
  return (
    <Section theme="paper">
      <SectionHeading
        align="center"
        eyebrow={<Eyebrow tone="neutral">{tr({ en: "Under the hood", es: "Por dentro" })}</Eyebrow>}
        title={tr(o.title)}
        intro={tr(o.body)}
      />
      <div className="mt-[44px] grid gap-[12px] sm:grid-cols-2 lg:grid-cols-5">
        {o.objects.map((obj, i) => {
          const Icon = OBJECT_ICONS[i % OBJECT_ICONS.length];
          return (
            <Reveal key={i} delay={(i % 5) * 50}>
              <div className="flex h-full flex-col gap-[10px] rounded-[14px] border border-[var(--m-line)] bg-white p-[16px] text-center shadow-[var(--m-shadow-sm)]">
                <span className="mx-auto flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[var(--m-paper-2)] text-[var(--m-green-deep)]">
                  <Icon className="h-[19px] w-[19px]" strokeWidth={2.1} />
                </span>
                <div className="text-[14px] font-extrabold text-[var(--m-ink)]">{tr(obj.title)}</div>
                <p className="text-[11.5px] leading-[1.4] text-[var(--m-ink-soft)]">{tr(obj.text)}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal delay={120}>
        <p className="mx-auto mt-[28px] max-w-[620px] text-center text-[14px] leading-[1.6] text-[var(--m-ink-soft)]">{tr(o.note)}</p>
      </Reveal>
    </Section>
  );
}

/* -------------------------------------------------- Response coordination -- */

const CAP_ICON: Record<string, typeof Users> = {
  volunteers: Users,
  needs: MapPin,
  logistics: Truck,
  shelter: Warehouse,
};
const CAP_TONE: Record<string, string> = {
  volunteers: "var(--m-blue)",
  needs: "var(--m-green)",
  logistics: "var(--m-teal)",
  shelter: "var(--m-amber)",
};

function CapabilityFeature({
  cap,
  mockup,
  url,
  flip,
}: {
  cap: (typeof content.response.capabilities)[number];
  mockup: React.ReactNode;
  url: string;
  flip: boolean;
}) {
  const { tr } = useLocale();
  const Icon = CAP_ICON[cap.id] ?? Users;
  const tone = CAP_TONE[cap.id] ?? "var(--m-green)";
  return (
    <Reveal>
      <div className={`grid items-center gap-[32px] lg:grid-cols-2 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className={flip ? "lg:pl-[24px]" : "lg:pr-[24px]"}>
          <div className="flex items-center gap-[12px]">
            <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[13px]" style={{ background: `color-mix(in srgb, ${tone} 16%, white)`, color: tone }}>
              <Icon className="h-[21px] w-[21px]" strokeWidth={2.2} />
            </span>
            <span className="text-[13px] font-bold" style={{ color: tone }}>{tr(cap.tagline)}</span>
          </div>
          <h3 className="mt-[16px] text-[clamp(20px,2.6vw,27px)] font-extrabold leading-[1.16] tracking-[-0.01em] text-[var(--m-ink)]">{tr(cap.name)}</h3>
          <p className="mt-[13px] text-[15px] leading-[1.6] text-[var(--m-ink-soft)]">{tr(cap.body)}</p>
          <ul className="mt-[16px] flex flex-col gap-[9px]">
            {cap.bullets.map((bl, j) => (
              <li key={j} className="flex items-center gap-[9px] text-[13.5px] font-semibold text-[var(--m-ink)]">
                <Check className="h-[15px] w-[15px] shrink-0" style={{ color: tone }} strokeWidth={2.6} />
                {tr(bl)}
              </li>
            ))}
          </ul>
          <div className="mt-[18px] flex items-start gap-[9px] rounded-[12px] bg-[var(--m-paper-3)] px-[13px] py-[11px]">
            <Zap className="mt-[1px] h-[15px] w-[15px] shrink-0 text-[var(--m-amber)]" strokeWidth={2.4} fill="var(--m-amber)" />
            <span className="text-[12.5px] font-semibold leading-[1.45] text-[var(--m-ink-soft)]">
              <span className="font-extrabold text-[var(--m-ink)]">{tr({ en: "Why now: ", es: "Por qué ahora: " })}</span>
              {tr(cap.whyNow)}
            </span>
          </div>
        </div>
        <BrowserFrame url={url}>{mockup}</BrowserFrame>
      </div>
    </Reveal>
  );
}

export function ResponseSection() {
  const { tr } = useLocale();
  const r = content.response;
  const cap = (id: string) => r.capabilities.find((c) => c.id === id)!;
  const shelter = cap("shelter");
  const ShelterIcon = CAP_ICON.shelter;
  return (
    <Section id="response" theme="soft">
      <SectionHeading
        eyebrow={<Eyebrow tone="amber">{tr(r.eyebrow)}</Eyebrow>}
        title={tr(r.title)}
        intro={tr(r.intro)}
      />
      <Reveal delay={100}>
        <div className="mt-[24px] flex items-start gap-[11px] rounded-[14px] bg-[var(--m-ink)] px-[20px] py-[15px] text-[clamp(15px,1.9vw,18px)] font-semibold leading-[1.45] text-white">
          <Zap className="mt-[3px] h-[18px] w-[18px] shrink-0 text-[var(--m-amber)]" strokeWidth={2.4} fill="var(--m-amber)" />
          {tr(r.urgency)}
        </div>
      </Reveal>

      <div className="mt-[52px] flex flex-col gap-[48px]">
        <CapabilityFeature cap={cap("volunteers")} mockup={<VolunteerOpsMockup />} url="hos.app / volunteers" flip={false} />
        <CapabilityFeature cap={cap("needs")} mockup={<NeedsMapMockup />} url="hos.app / needs" flip />
        <CapabilityFeature cap={cap("logistics")} mockup={<LogisticsMockup />} url="hos.app / logistics" flip={false} />
      </div>

      {/* Shelter Directory — the fourth piece, in brief */}
      <Reveal delay={80}>
        <div className="mt-[40px] flex flex-col gap-[16px] rounded-[20px] border border-[var(--m-line)] bg-white p-[24px] shadow-[var(--m-shadow-sm)] sm:flex-row sm:items-center">
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px]" style={{ background: "color-mix(in srgb, var(--m-amber) 18%, white)", color: "#9a6a16" }}>
            <ShelterIcon className="h-[24px] w-[24px]" strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-[12px] gap-y-[2px]">
              <h3 className="text-[18px] font-extrabold text-[var(--m-ink)]">{tr(shelter.name)}</h3>
              <span className="text-[13px] font-bold text-[#9a6a16]">{tr(shelter.tagline)}</span>
            </div>
            <p className="mt-[7px] text-[13.5px] leading-[1.55] text-[var(--m-ink-soft)]">{tr(shelter.body)}</p>
          </div>
          <div className="flex flex-wrap gap-[7px] sm:max-w-[280px]">
            {shelter.bullets.map((bl, j) => (
              <span key={j} className="rounded-full bg-[var(--m-paper-2)] px-[11px] py-[6px] text-[11.5px] font-semibold text-[var(--m-ink-soft)]">{tr(bl)}</span>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------- Aid accountability -- */

const ACCT_STEP_ICONS = [Flag, Truck, ShieldCheck];

export function AccountabilitySection() {
  const { tr } = useLocale();
  const a = content.accountability;
  return (
    <Section id="accountability" theme="darker">
      <div className="grid items-start gap-[40px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <SectionHeading
            dark
            eyebrow={<Eyebrow tone="red">{tr(a.eyebrow)}</Eyebrow>}
            title={tr(a.title)}
          />
          <Reveal delay={100}>
            <div className="mt-[22px] flex items-start gap-[11px] rounded-[14px] bg-[var(--m-red)]/12 px-[18px] py-[15px] ring-1 ring-[var(--m-red)]/25">
              <AlertTriangle className="mt-[2px] h-[18px] w-[18px] shrink-0 text-[var(--m-red)]" strokeWidth={2.3} />
              <p className="text-[14.5px] font-semibold leading-[1.5] text-white">{tr(a.problem)}</p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-[18px] text-[15px] leading-[1.6] text-[var(--m-on-dark-soft)]">{tr(a.body)}</p>
          </Reveal>
          <div className="mt-[24px] flex flex-col gap-[12px]">
            {a.steps.map((s, i) => {
              const Icon = ACCT_STEP_ICONS[i % ACCT_STEP_ICONS.length];
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className="flex items-start gap-[14px] rounded-[14px] bg-white/[0.04] p-[16px] ring-1 ring-white/10">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--m-green)]/15 text-[var(--m-green)]">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    </span>
                    <div>
                      <div className="text-[14px] font-extrabold text-white">{tr(s.title)}</div>
                      <p className="mt-[5px] text-[12.5px] leading-[1.5] text-[var(--m-on-dark-soft)]">{tr(s.text)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal delay={120} className="flex justify-center lg:sticky lg:top-[90px]">
          <PhoneFrame>
            <AidReportMockup />
          </PhoneFrame>
        </Reveal>
      </div>

      <Reveal delay={100} className="mt-[44px] block">
        <LazyPlayer id="aid-journey" badge={tr({ en: "Animated", es: "Animado" })} />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-[24px] flex items-start gap-[11px] rounded-[14px] bg-[var(--m-green)]/10 px-[18px] py-[14px] ring-1 ring-[var(--m-green)]/22">
          <ShieldCheck className="mt-[1px] h-[18px] w-[18px] shrink-0 text-[var(--m-green)]" strokeWidth={2.2} />
          <p className="text-[13.5px] font-semibold leading-[1.5] text-[var(--m-on-dark)]">{tr(a.note)}</p>
        </div>
      </Reveal>
    </Section>
  );
}

/* ----------------------------------------------------------------- Trust -- */

const TRUST_ICONS = [Check, MapPin, Radio, Target, ShieldCheck];

export function TrustSection() {
  const { tr } = useLocale();
  const t = content.trust;
  return (
    <Section id="trust" theme="dark">
      <div className="grid items-start gap-[44px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <SectionHeading
            dark
            eyebrow={<Eyebrow tone="green">{tr({ en: "Trust", es: "Confianza" })}</Eyebrow>}
            title={tr(t.title)}
            intro={tr(t.body)}
          />
          <Reveal delay={120}>
            <div className="mt-[24px] inline-flex items-center gap-[10px] rounded-[14px] bg-[var(--m-green)]/12 px-[16px] py-[13px] text-[13.5px] font-bold text-[var(--m-on-dark)] ring-1 ring-[var(--m-green)]/25">
              <ShieldCheck className="h-[18px] w-[18px] text-[var(--m-green)]" />
              {tr(t.aiNote)}
            </div>
          </Reveal>
        </div>
        <div className="grid gap-[12px] sm:grid-cols-2">
          {t.badges.map((b, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <Reveal key={i} delay={i * 60}>
                <div className="flex h-full flex-col gap-[10px] rounded-[14px] bg-white/[0.04] p-[18px] ring-1 ring-white/10">
                  <div className="flex items-center gap-[10px]">
                    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[var(--m-green)]/15 text-[var(--m-green)]">
                      <Icon className="h-[17px] w-[17px]" strokeWidth={2.3} />
                    </span>
                    <span className="text-[14px] font-extrabold text-white">{tr(b.name)}</span>
                  </div>
                  <p className="text-[12.5px] leading-[1.5] text-[var(--m-on-dark-soft)]">{tr(b.text)}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- Closing -- */

const ROADMAP_STATE_STYLE: Record<string, string> = {
  now: "bg-[var(--m-green)] text-[#04130c]",
  next: "bg-[var(--m-amber)] text-[#3a2a05]",
  exploring: "bg-white/15 text-white",
};

export function ClosingSection() {
  const { tr } = useLocale();
  const c = content.closing;
  return (
    <section className="relative overflow-hidden bg-[var(--m-bg)] px-[24px] py-[110px] text-center text-white sm:px-[40px]">
      <div className="m-aurora pointer-events-none absolute inset-0 opacity-90" />
      <div className="relative mx-auto max-w-[760px]">
        <Reveal>
          <h2 className="text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em]">{tr(c.title)}</h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-[22px] max-w-[620px] text-[clamp(16px,2.1vw,20px)] leading-[1.6] text-[var(--m-on-dark-soft)]">{tr(c.body)}</p>
        </Reveal>
        <Reveal delay={180}>
          <div className="mx-auto mt-[36px] max-w-[600px] rounded-[20px] bg-white/[0.05] p-[10px] text-left ring-1 ring-white/12">
            <div className="flex items-center gap-[9px] px-[10px] pt-[8px]">
              <span className="m-live-dot inline-block h-[8px] w-[8px] rounded-full bg-[var(--m-green)] text-[var(--m-green)]" />
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--m-green)]">{tr(content.roadmap.badge)}</span>
            </div>
            <p className="mt-[8px] px-[10px] text-[13.5px] font-semibold leading-[1.5] text-[var(--m-on-dark-soft)]">{tr(content.roadmap.line)}</p>
            <div className="mt-[12px] flex flex-col gap-[8px]">
              {content.roadmap.items.map((it) => (
                <div key={it.state} className="flex items-center gap-[12px] rounded-[12px] bg-white/[0.04] px-[14px] py-[11px]">
                  <span className={`shrink-0 rounded-full px-[10px] py-[4px] text-[10.5px] font-extrabold uppercase tracking-wide ${ROADMAP_STATE_STYLE[it.state]}`}>
                    {tr(it.status)}
                  </span>
                  <span className="text-[13px] font-semibold leading-[1.4] text-white">{tr(it.label)}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-[22px] text-[14px] font-semibold text-[var(--m-on-dark-faint)]">{tr(c.reassurance)}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer -- */

export function SiteFooter() {
  const { tr } = useLocale();
  return (
    <footer className="border-t border-white/10 bg-[var(--m-bg)] px-[24px] py-[44px] text-[var(--m-on-dark-soft)] sm:px-[40px]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-[18px]">
        <div className="flex items-baseline gap-[10px]">
          <span className="text-[18px] font-extrabold text-white">HOS</span>
          <span className="text-[12px] font-bold">{tr({ en: "Humanitarian Operations System", es: "Sistema de Operaciones Humanitarias" })}</span>
        </div>
        <p className="max-w-[660px] text-[13px] leading-[1.55]">{tr(content.footer.note)}</p>
        <p className="max-w-[660px] text-[12px] leading-[1.5] text-[var(--m-on-dark-faint)]">{tr(content.footer.disclaimer)}</p>
        <div className="mt-[6px] border-t border-white/10 pt-[16px] text-[12px] font-semibold text-[var(--m-on-dark-faint)]">
          {tr(content.footer.copyright)}
        </div>
      </div>
    </footer>
  );
}
