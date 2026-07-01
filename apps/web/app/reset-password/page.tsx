"use client";

// Password-recovery landing page (HOS-2026-001-08). The reset email link returns
// here with a recovery token in the URL; supabase-js (detectSessionInUrl) turns
// it into a short-lived recovery session and fires PASSWORD_RECOVERY. We then let
// the coordinator set a new password via updateUser, sign the recovery session
// out, and send them back to /login to sign in fresh.
//
// Access here is NOT coordinator access: a valid recovery token only lets someone
// set the password of the account the token was minted for. Coordinator
// authorization is still enforced separately by the invite-only allowlist on
// every /api route, so this page never widens who can reach the board.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  updatePassword,
} from "@/app/lib/client/supabase";

const field =
  "mt-[6px] w-full rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px] text-[14px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";
const label = "block text-[12px] font-extrabold text-[var(--hos-muted)]";
const MIN_PASSWORD = 8;

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1F5F3] px-[20px]">
      <div className="w-full max-w-[380px] rounded-[12px] border border-[var(--hos-border)] bg-white p-[28px] shadow-sm">
        <h1 className="text-[20px] font-extrabold text-[var(--hos-text)]">Restablecer contraseña</h1>
        <div className="mt-[18px]">{children}</div>
      </div>
    </main>
  );
}

type Phase = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  // Start "invalid" when auth isn't configured at all; otherwise "checking"
  // until supabase-js resolves the recovery session from the URL below.
  const [phase, setPhase] = useState<Phase>(() =>
    isSupabaseConfiguredClient() ? "checking" : "invalid",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Wait for the recovery session that supabase-js establishes from the URL. A
  // PASSWORD_RECOVERY event (or an already-present session) means the link was
  // valid. supabase-js does a NETWORK round-trip to validate the token, so we
  // must not judge "invalid" on a short wall-clock timer: fail fast only when
  // the URL carries no recovery token at all; when one IS present, allow a
  // generous window for a slow mobile connection. The fallback timer also marks
  // the outcome settled, so a late success can't flip the card back. All state
  // changes happen in async callbacks (no synchronous setState in effect).
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return; // unconfigured — initial phase is already "invalid"
    const loc = typeof window !== "undefined" ? window.location : ({ hash: "", search: "" } as Location);
    const hasRecoveryToken =
      /access_token=|type=recovery/.test(loc.hash) || /[?&]code=/.test(loc.search);
    let settled = false;
    const resolve = (next: Phase) => {
      if (settled) return;
      settled = true;
      setPhase(next);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) resolve("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) resolve("ready");
    });
    const timer = setTimeout(() => resolve("invalid"), hasRecoveryToken ? 15000 : 1500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await updatePassword(password);
    if (err) {
      // Don't echo the raw provider string; the common failures (too short,
      // reused password) are covered by a fixed, non-leaking message.
      setError("No se pudo actualizar la contraseña. Elija una diferente y con al menos 8 caracteres.");
      setBusy(false);
      return;
    }
    // Drop the recovery session so the next step is a clean, deliberate sign-in.
    await getBrowserSupabase()?.auth.signOut();
    setPhase("done");
    setTimeout(() => router.replace("/login"), 1800);
  }

  if (phase === "checking") {
    return (
      <Card>
        <p className="text-[13px] font-bold text-[var(--hos-muted)]">Verificando el enlace…</p>
      </Card>
    );
  }

  if (phase === "invalid") {
    return (
      <Card>
        <p className="text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
          No pudimos validar este enlace de recuperación. Si su conexión es lenta, vuelva a intentarlo;
          si ya expiró, solicite uno nuevo desde la pantalla de inicio de sesión.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-[18px] h-[44px] w-full rounded-[8px] bg-[var(--hos-dark)] text-[14px] font-extrabold text-white transition hover:opacity-90"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-[12px] h-[40px] w-full rounded-[8px] border border-[var(--hos-border)] bg-white text-[13px] font-extrabold text-[var(--hos-muted)] transition hover:text-[var(--hos-text)]"
        >
          Solicitar un enlace nuevo
        </button>
      </Card>
    );
  }

  if (phase === "done") {
    return (
      <Card>
        <p className="text-[13px] font-bold leading-[18px] text-[#16613F]">
          Contraseña actualizada. Redirigiéndolo para iniciar sesión…
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
        Elija una nueva contraseña para su cuenta de coordinación.
      </p>
      <form onSubmit={submit} className="mt-[16px]">
        <label className={label}>
          Nueva contraseña
          <input
            className={field}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className={`${label} mt-[14px]`}>
          Confirmar contraseña
          <input
            className={field}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="mt-[12px] text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !password || !confirm}
          className="mt-[18px] h-[44px] w-full rounded-[8px] bg-[var(--hos-dark)] text-[14px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </Card>
  );
}
