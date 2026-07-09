"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { configureBrowserSupabase, isSupabaseConfiguredClient, signUp } from "@/app/lib/client/supabase";

type PublicSupabaseConfig = { url: string; anonKey: string } | null;

const field =
  "mt-[6px] w-full rounded-[8px] border border-[var(--hos-border)] bg-[#F8FAF8] px-[12px] py-[10px] text-[14px] font-semibold text-[var(--hos-text)] outline-none focus:ring-2 focus:ring-[#DDEFE8]";
const label = "block text-[12px] font-extrabold text-[var(--hos-muted)]";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1F5F3] px-[20px]">
      <div className="w-full max-w-[400px] rounded-[12px] border border-[var(--hos-border)] bg-white p-[28px] shadow-sm">
        <h1 className="text-[20px] font-extrabold text-[var(--hos-text)]">Crear cuenta de colaborador</h1>
        <p className="mt-[6px] text-[13px] font-bold leading-[18px] text-[var(--hos-muted)]">
          Sin aprobación. Con una cuenta puede reportar necesidades, ofrecer suministros y registrar
          puntos de ayuda. Quien crea un sitio queda como su responsable.
        </p>
        <div className="mt-[18px]">{children}</div>
      </div>
    </main>
  );
}

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err, needsVerification } = await signUp(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (needsVerification) {
      setSent(true);
      return;
    }
    router.push("/coordination"); // project has email confirmation off -> straight in
  }

  if (sent) {
    return (
      <div>
        <div className="rounded-[8px] border border-[#CBE6D8] bg-[#F1FAF5] px-[12px] py-[12px] text-[13px] font-bold leading-[18px] text-[#16613F]">
          Le enviamos un correo de verificación a <span className="font-extrabold">{email}</span>. Ábralo y
          confirme su cuenta; luego inicie sesión. (Verificar el correo solo comprueba que es suyo — no hay
          aprobación de nadie.)
        </div>
        <Link href="/login" className="mt-[16px] inline-block text-[13px] font-extrabold text-[var(--hos-blue)] underline underline-offset-2">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <label className={label}>
        Correo
        <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className={`${label} mt-[14px]`}>
        Contraseña (mínimo 8 caracteres)
        <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </label>
      {error ? <p className="mt-[12px] text-[13px] font-bold text-[var(--hos-red)]">{error}</p> : null}
      <button type="submit" disabled={busy || !email || !password} className="mt-[18px] h-[44px] w-full rounded-[8px] bg-[var(--hos-dark)] text-[14px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60">
        {busy ? "Creando…" : "Crear cuenta"}
      </button>
      <p className="mt-[14px] text-[12px] font-bold text-[var(--hos-muted)]">
        ¿Ya tiene cuenta?{" "}
        <Link href="/login" className="text-[var(--hos-blue)] underline underline-offset-2">Iniciar sesión</Link>
      </p>
    </form>
  );
}

export function SignupClient({ supabaseConfig }: { supabaseConfig: PublicSupabaseConfig }) {
  const configured = Boolean(supabaseConfig) || isSupabaseConfiguredClient();
  useEffect(() => {
    configureBrowserSupabase(supabaseConfig);
  }, [supabaseConfig]);

  return (
    <Card>
      {configured ? (
        <SignupForm />
      ) : (
        <div className="rounded-[8px] border border-[#D4DED9] bg-[#F8FAF8] px-[12px] py-[10px] text-[12px] font-bold leading-[16px] text-[var(--hos-muted)]">
          El registro con correo no está configurado en este entorno (falta Supabase Auth).
        </div>
      )}
    </Card>
  );
}
