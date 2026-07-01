"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  sendPasswordReset,
  SUPABASE_TOKEN_KEY,
} from "@/app/lib/client/supabase";
import { COORDINATOR_TOKEN_KEY } from "@/app/lib/client/api";

const field =
  "mt-[6px] w-full rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px] text-[14px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";
const label = "block text-[12px] font-extrabold text-[var(--hos-muted)]";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1F5F3] px-[20px]">
      <div className="w-full max-w-[380px] rounded-[12px] border border-[var(--hos-border)] bg-white p-[28px] shadow-sm">
        <h1 className="text-[20px] font-extrabold text-[var(--hos-text)]">Acceso de coordinación</h1>
        <p className="mt-[6px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
          Solo personal autorizado. Este panel maneja datos sensibles de personas vulnerables.
        </p>
        <div className="mt-[18px]">{children}</div>
      </div>
    </main>
  );
}

function SupabaseLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err || !data.session) {
      setError(err?.message ?? "No se pudo iniciar sesión.");
      setBusy(false);
      return;
    }
    window.localStorage.setItem(SUPABASE_TOKEN_KEY, data.session.access_token);
    router.push("/coordination");
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    // Always confirm "sent" regardless of the outcome, and NEVER surface the raw
    // provider error. resetPasswordForEmail applies a per-identity resend
    // cooldown, so echoing its error would let an attacker distinguish a
    // registered coordinator (rate-limit error) from an unregistered address
    // (silent success) — an account-enumeration oracle against the invite-only
    // roster. Any real failure is swallowed; the coordinator can simply retry.
    await sendPasswordReset(email);
    setBusy(false);
    setResetSent(true);
  }

  if (mode === "reset") {
    return (
      <form onSubmit={submitReset}>
        {resetSent ? (
          <div className="rounded-[8px] border border-[#CBE6D8] bg-[#F1FAF5] px-[12px] py-[12px] text-[13px] font-bold leading-[18px] text-[#16613F]">
            Si tu correo está registrado, te enviamos un enlace para restablecer la contraseña. Revisa
            tu bandeja de entrada.
          </div>
        ) : (
          <>
            <p className="text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <label className={`${label} mt-[14px]`}>
              Correo
              <input
                className={field}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            {error ? <p className="mt-[12px] text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || !email}
              className="mt-[18px] h-[44px] w-full rounded-[8px] bg-[var(--hos-dark)] text-[14px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Enviando…" : "Enviar enlace"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setResetSent(false);
            setError("");
          }}
          className="mt-[14px] text-[12px] font-extrabold text-[var(--hos-muted)] underline underline-offset-2 hover:text-[var(--hos-text)]"
        >
          Volver a iniciar sesión
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit}>
      <label className={label}>
        Correo
        <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className={`${label} mt-[14px]`}>
        Contraseña
        <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </label>
      {error ? <p className="mt-[12px] text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || !email || !password}
        className="mt-[18px] h-[44px] w-full rounded-[8px] bg-[var(--hos-dark)] text-[14px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Entrando…" : "Iniciar sesión"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode("reset");
          setError("");
        }}
        className="mt-[14px] text-[12px] font-extrabold text-[var(--hos-muted)] underline underline-offset-2 hover:text-[var(--hos-text)]"
      >
        ¿Olvidaste tu contraseña?
      </button>
      <p className="mt-[12px] text-[11px] font-bold leading-[15px] text-[var(--hos-muted)]">
        El acceso es por invitación: su correo debe estar autorizado por un administrador.
      </p>
    </form>
  );
}

function TokenFallback() {
  const router = useRouter();
  const [token, setToken] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.localStorage.setItem(COORDINATOR_TOKEN_KEY, token.trim());
        router.push("/coordination");
      }}
    >
      <div className="rounded-[8px] border border-[#D4DED9] bg-[#F8FAF8] px-[12px] py-[10px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">
        El inicio de sesión con correo aún no está configurado en este entorno. Ingrese el token de
        coordinación para continuar.
      </div>
      <label className={`${label} mt-[14px]`}>
        Token de coordinación
        <input className={field} type="password" value={token} onChange={(e) => setToken(e.target.value)} />
      </label>
      <button
        type="submit"
        disabled={!token.trim()}
        className="mt-[18px] h-[44px] w-full rounded-[8px] bg-[var(--hos-dark)] text-[14px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        Continuar
      </button>
    </form>
  );
}

export default function LoginPage() {
  return <Card>{isSupabaseConfiguredClient() ? <SupabaseLogin /> : <TokenFallback />}</Card>;
}
