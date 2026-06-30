"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// The marketing/explainer page carries its own bilingual content as {en, es}
// objects, so it gets its own tiny locale runtime rather than reusing the
// operational app's key-based t(). English-first (the user asked for "english
// and spanish"); the choice persists in localStorage.

export type Lang = "en" | "es";
export type Bi = { en: string; es: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Resolve a bilingual {en, es} field to the active language. */
  tr: (b: Bi | undefined) => string;
};

const LocaleContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "hos-landing-lang";

export function LocaleProvider({
  children,
  defaultLang = "en",
}: {
  children: React.ReactNode;
  defaultLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    // Hydrate the saved preference once on mount. localStorage is browser-only,
    // so this can't run during SSR or in a state initializer without a
    // hydration mismatch; reading it here is the intended pattern.
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from browser storage
      if (saved === "en" || saved === "es") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "en" ? "es" : "en"),
    [lang, setLang],
  );

  const tr = useCallback((b: Bi | undefined) => (b ? b[lang] : ""), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggle, tr }),
    [lang, setLang, toggle, tr],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Ctx {
  const c = useContext(LocaleContext);
  if (!c) throw new Error("useLocale must be used inside <LocaleProvider>");
  return c;
}

/** Apple-style segmented control: EN | ES. */
export function LocaleToggle({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const { lang, setLang } = useLocale();
  const dark = variant === "dark";

  const track = dark
    ? "bg-white/10 ring-1 ring-white/15"
    : "bg-[var(--m-paper-3)] ring-1 ring-[var(--m-line)]";
  const idle = dark ? "text-white/70 hover:text-white" : "text-[var(--m-ink-soft)] hover:text-[var(--m-ink)]";
  const activeBg = dark ? "bg-white text-[var(--m-ink)]" : "bg-white text-[var(--m-ink)]";

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-[3px] rounded-full p-[3px] ${track} ${className}`}
    >
      {(["en", "es"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={[
              "h-[28px] min-w-[40px] rounded-full px-[12px] text-[12px] font-bold uppercase tracking-wide transition-all duration-300",
              active ? `${activeBg} shadow-sm` : idle,
            ].join(" ")}
          >
            {l === "en" ? "EN" : "ES"}
          </button>
        );
      })}
    </div>
  );
}
