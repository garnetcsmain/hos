// Next.js instrumentation hook. register() runs once when a server instance
// boots (next start / next dev) — the right place for a deploy-time boot guard.
//
// We skip the production *build* phase and any non-Node runtime: the guard is
// about refusing to SERVE traffic while misconfigured, not about blocking a
// build (a build has no runtime secrets and produces no live endpoint). The
// import is dynamic so the guard module is never pulled into the edge bundle.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { assertCoordinatorBootConfig } = await import(
    "./app/lib/http/bootGuard.ts"
  );
  try {
    assertCoordinatorBootConfig();
  } catch (err) {
    // A misconfigured non-local deploy must crash loudly and exit non-zero, so
    // an orchestrator/operator sees a failed boot rather than a server that is
    // "up" but quietly refusing every request. This is the Board D3 "refuse to
    // start" guarantee; we exit here instead of rethrowing to avoid Next's
    // unhandledRejection path leaving the process alive with a bound port.
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
