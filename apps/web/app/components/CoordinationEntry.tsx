"use client";

// Entry point for /coordination. Branches on the signed-in role:
//  - coordinator (invite-only allowlist) -> the full board (CoordinationConsole)
//  - any other signed-up user -> the contributor surface (ContributorView),
//    which can add records and manage its own sites but NEVER reads the
//    sensitive needs board (D1).
// Not signed in -> the console handles login/redirect as before.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoordinationConsole } from "@/app/components/CoordinationConsole";
import { ContributorView } from "@/app/components/ContributorView";
import { getMe, type Me } from "@/app/lib/client/coordination";
import { ApiError } from "@/app/lib/client/api";
import {
  getBrowserSupabase,
  isSupabaseConfiguredClient,
  SUPABASE_TOKEN_KEY,
} from "@/app/lib/client/supabase";

async function mirrorSession(): Promise<void> {
  if (!isSupabaseConfiguredClient() || typeof window === "undefined") return;
  const token = (await getBrowserSupabase()?.auth.getSession())?.data.session?.access_token;
  if (token) window.localStorage.setItem(SUPABASE_TOKEN_KEY, token);
}

export function CoordinationEntry() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | "loading" | "error">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      await mirrorSession();
      try {
        const who = await getMe();
        if (alive) setMe(who);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          router.replace("/login");
          return;
        }
        setMe("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (me === "loading") {
    return <p className="px-[28px] py-[28px] text-[14px] font-bold text-[var(--hos-muted)]">Cargando…</p>;
  }
  if (me === "error" || me === null) {
    // Fall back to the console, which renders its own actionable auth error.
    return <CoordinationConsole />;
  }
  // `?vista=colaborador` lets a coordinator preview the contributor surface.
  // Harmless: it only ever shows the LESS-privileged view, never more. Read
  // inline (we are past the SSR "loading" render, so window is available).
  const preview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("vista") === "colaborador";
  if (preview) return <ContributorView me={me} />;
  return me.isCoordinator ? <CoordinationConsole /> : <ContributorView me={me} />;
}
