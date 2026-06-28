# Decision: Phase 0 MVP architecture (self-contained, runnable)

**Date:** 2026-06-28
**Status:** Accepted (implementation)
**Scope:** HOS Response Kit — Venezuela 2026. Phase 0 family reunification: missing↔found matching, verification, family notification.

## Context

The repo was thesis + a static UI scaffold (mock data, no backend). The goal was a **fully functional MVP that runs with zero external setup**, deferring anything that needs credentials we don't have yet (cloud AI keys, a hosted Postgres/Supabase, SMS/email/WhatsApp providers).

## Decisions

1. **Persistence — `node:sqlite` (built-in), not Postgres yet.**
   The thesis targets PostgreSQL + PostGIS + pgvector. For a runnable, offline-by-default MVP we use Node's built-in SQLite (no native build, no server, single file at `apps/web/.data/hos.db`). The repository layer (`app/lib/repositories/*`) is the only thing coupled to it, so the documented path to Postgres is a repository swap. Honors "one system holds relational + audit + (later) vectors."

2. **Backend — Next.js API routes (BFF), not FastAPI.**
   Matches the prior BFF decision in `docs/`. All domain logic lives in `app/lib/services/*` and `app/lib/matching/*`, never in route handlers (AGENTS.md §2).

3. **Matching — deterministic rule engine baseline + pluggable multi-provider cloud AI.**
   `app/lib/matching/engine.ts` is an explainable, unit-tested scorer (name w/ accent + Spanish-nickname awareness, age, location, sex, traits, timeline) with **hard-negative penalties** so a common shared name can't carry a contradicted pair over threshold. It always works offline and is the permanent fallback/pre-filter.
   On top, `app/lib/ai/*` is a provider abstraction (Anthropic, OpenAI, and a mock) selected by env. Zero keys → baseline only. One or more keys → each provider's independent signal is **blended 50/50** with the baseline and recorded as evidence. PII sent to models is minimized (no contact, no medical notes, no precise location) and every AI-influenced score change is logged to the event store.

4. **Trust — append-only event store + server-side PII redaction.**
   `events` is INSERT-only (audit/forensics). Public API responses return least-PII projections (`app/lib/domain/projections.ts`), enforced server-side. Coordinator endpoints are gated by a constant-time token (`HOS_COORDINATOR_TOKEN`); unset = open in dev, documented.

5. **AI assists, humans decide.**
   The matcher only ever proposes candidates. Only a human verification (`app/lib/services/verification.ts`) resolves a case and queues a family notification — an atomic, audited transaction.

6. **Notifications — in-app channel now; SMS/email/WhatsApp/Telegram deferred.**
   Confirming a match queues an in-app notification with a redacted recipient and a Spanish body. External channels need a provider and are explicitly deferred (no false delivery claims).

## Deferred (need external setup)

- Cloud AI keys (groundwork done; drop a key in and it activates).
- Hosted Postgres/Supabase + RLS + real auth (token gate is a placeholder).
- SMS/email/WhatsApp/Telegram delivery.
- Photo storage / face comparison.

## Verification

`npm test` (matching + AI blend/registry, incl. adversarial false-positive cases), `tsc --noEmit`, `next build`, and an end-to-end HTTP smoke test of create → auto-match → coordinator review → confirm → resolve → redacted notification → reconstructed timeline.
