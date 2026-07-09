"use client";

// Per-user light/dark preference for the Pulso board. Persisted in
// localStorage (there is no server-side user-preferences store yet — that
// waits on the same auth/RLS chain as HOS-2026-011; a per-device preference is
// the honest MVP and is what a theme toggle conventionally is). First visit
// falls back to the OS preference, then the explicit choice sticks.
//
// Backed by useSyncExternalStore so the value is read straight from the
// external stores (localStorage + the OS media query) without a mount-time
// setState, and stays SSR-safe via a stable server snapshot.

import { useCallback, useSyncExternalStore } from "react";

export type PulseTheme = "light" | "dark";

const KEY = "hos.pulse.theme";

function readStored(): PulseTheme | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  mq?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    mq?.removeEventListener("change", onChange);
  };
}

function getSnapshot(): PulseTheme {
  return readStored() ?? (prefersDark() ? "dark" : "light");
}

// Server render (and the very first client paint) is stable "light" until the
// store is read on the client; the toggle then reflects the real preference.
function getServerSnapshot(): PulseTheme {
  return "light";
}

/** [theme, toggle] — theme is derived from the stored choice, falling back to
 *  the OS preference; toggling writes the opposite and notifies subscribers. */
export function usePulseTheme(): [PulseTheme, () => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: PulseTheme = getSnapshot() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Private mode / blocked storage: the choice won't persist. Still fire
      // the notification so the current view updates for the session.
    }
    // localStorage writes don't fire "storage" in the same document, so nudge
    // subscribers explicitly to re-read the snapshot.
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  return [theme, toggle];
}
