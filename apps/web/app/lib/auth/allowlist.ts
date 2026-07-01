// Coordinator allowlist (HOS-2026-001-08). Auth is INVITE-ONLY: a signed-in
// user is a coordinator only if their email is explicitly listed. An empty
// allowlist admits NOBODY — a fail-closed default, so turning on Supabase auth
// without naming coordinators does not silently open the door.

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Parse a comma/space-separated allowlist env value into normalized emails. */
export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map(normalizeEmail)
    .filter((e) => e.length > 0);
}

export function isAllowedCoordinator(
  email: string | null | undefined,
  allowlist: string[],
): boolean {
  if (!email) return false;
  if (allowlist.length === 0) return false; // invite-only: no allowlist => no access
  return allowlist.includes(normalizeEmail(email));
}
