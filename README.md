# Humanitarian Operations System (HOS)

> The operational layer that connects humanitarian response.
> **Version 0.1 — Draft / design stage.**

When disaster strikes, the hardest problem is usually not a lack of resources — it is the lack of **coordinated information**. Governments, hospitals, the Red Cross, volunteers, families, and the news each hold one piece of the picture. No one holds all of it. Efforts overlap, needs stay invisible, and families wait.

HOS doesn't replace any of these organizations. It becomes the shared, real-time layer that connects them — giving everyone a common understanding of an event while each organization keeps ownership of its own operations. AI is not the purpose; it is the force multiplier that turns millions of scattered observations into actionable intelligence.

**AI recommends. Humans decide.** Operational authority always stays with qualified organizations.

---

## What we are building first

We are **not** starting with a ten-module operating system. We are starting with the one capability every responder wishes already existed, the piece that saves the most lives in the first 72 hours:

### Phase 0 — Family Reunification · *HOS Response Kit, Venezuela 2026*

One mission: **reduce the time it takes a family to find a loved one.** Three objectives:

1. **Find people** — AI-assisted matching between missing-person and found-person reports.
2. **Verify information** — assign confidence, eliminate duplicates, maintain a trusted timeline.
3. **Connect families** — notify families the moment verified information becomes available.

**How it works**

```
A relative abroad opens the app and taps "I can't reach my family."
  No account. No login. No friction.
  → name · city · phone · last known address · relationship · optional photo

A volunteer at a shelter in Caracas opens the app and reports a found person.
  → photo · name · location · status

AI compares every found report against every missing request, continuously.
  → "Possible match found. Confidence 94%."  →  a human verifies  →  the family is notified.
```

A match is always a **candidate to verify** — never an automatic confirmation that a person has been found.

---

## MVP modules

| # | Module | Purpose |
|---|--------|---------|
| 1 | Missing Persons Registry | The heart of the system |
| 2 | Found Persons Registry | Hospitals, shelters, firefighters, volunteers, Red Cross — everyone reports here |
| 3 | AI Matching Engine | Name, nickname, age, description, neighborhood, hospital, GPS, photo, time, relationships |
| 4 | Verification | Every report carries evidence, confidence, time, location, and verifying organization |
| 5 | Communication | SMS · Email · WhatsApp · Telegram · Push |

Later phases extend to a live **Shelter Directory**, **Volunteer Operations**, a **Needs Map**, and **Resource Logistics**.

---

## Design principles

- **Information before interfaces** — reliable information saves lives; dashboards don't.
- **AI assists humans** — AI recommends, humans decide.
- **Every report has value** — no report is ignored; every report is evaluated.
- **Build once, deploy everywhere** — the platform adapts to the event, not the other way around.
- **Open collaboration** — interoperability is a design requirement, not an afterthought.
- **Offline by default** — it keeps working under degraded connectivity and syncs when it can.
- **Trust is fundamental** — every record carries evidence, provenance, timestamps, and confidence. Trust is measurable.

---

## Architecture (proposed)

One **object model**, not ten disconnected modules. Everything in the system is a *Person, Organization, Volunteer, Location, Incident, Resource, Need, Asset, Mission,* or *Communication* — everything else is relationships. Alongside the relational state, an **event store** records every event (report created → sighting → photo → AI suggestion → verification → family notified), so any record's full history can be reconstructed and audited.

**Proposed stack** (subject to confirmation):

| Layer | Choice |
|-------|--------|
| Database | PostgreSQL + PostGIS (geospatial) + pgvector (embeddings) |
| Backend / AI | Python + FastAPI |
| Frontend | TypeScript + Next.js |
| Mobile / offline (later) | React Native / Expo |
| Realtime | Supabase Realtime or WebSockets |
| Search | Postgres full-text first; Meilisearch/OpenSearch later |

Relational data, geospatial data, permissions, audit logs, and vectors stay in **one Postgres system** for as long as that is simpler, safer, and faster. A dedicated vector database is deferred until scale genuinely demands it.

---

## Repository

| File | What it is |
|------|------------|
| [`Humanitarian Operations System.md`](Humanitarian%20Operations%20System.md) | The full thesis — vision, principles, the reality build, and architecture. **Start here.** |
| [`AGENTS.md`](AGENTS.md) | Engineering, security, and privacy practices for AI agents and humans working in this repo. |
| `README.md` | This file. |

This is a **standalone system** — separate from any remittance or donation platform. No shared code, secrets, or infrastructure.

---

## A note on privacy & safety

HOS handles information about vulnerable people during disasters — missing children, survivors, the displaced. That data can endanger people if mishandled. We build with **data minimization, least privilege, provenance on every record, and human verification before any life-critical decision.** Before contributing, read [`AGENTS.md`](AGENTS.md).

---

## Status

**Phase 0 MVP — functional.** Missing↔found matching, human verification, and family notification work end to end, with an append-only audit trail. A public **presentation page** now fronts the project at `/` (a bilingual explainer of the platform) while the operations console at `/console` continues in active development. The thesis remains the source of truth; scope and stack continue to evolve.

### Run it locally

```bash
cd apps/web
npm install
npm run dev          # http://localhost:3000
```

**Pages.** `/` is the public **presentation page** — a bilingual (English/Spanish) explainer of what HOS is and every module it will offer, written for a general audience, with motion graphics and high-fidelity mockups of the platform. The live operations console — the **Family Reunification Map**, under active development — lives at **`/console`** and auto-seeds the Venezuela scenario on first load. A second console, **Response Coordination** at **`/coordination`** (Phase 1, HOS-2026-007), tracks shelter capacity, a needs board, and supply offers with an advisory needs↔supply matcher; it is coordinator-gated (no public board), records a supply as *received* only when the requesting site confirms real delivery, and flags stale data — see `docs/decision-log/2026-07-01-HOS-007-response-coordination/`.

No external setup is required: persistence is local SQLite via Node's built-in `node:sqlite` (no native build), and matching runs on a deterministic, offline rule engine. Other commands: `npm test` (matching + AI tests, including adversarial false-positive cases), `npm run typecheck`, `npm run build`, `npm run seed`.

### What's wired

- **Intake** — public "I can't reach my family" and responder "found person" forms create real records (no account).
- **AI Matching Engine** — explainable scoring (accent- and Spanish-nickname-aware names, age, location, traits, timeline) with hard-negative penalties against false positives. It only ever proposes *candidates*.
- **Verification** — a coordinator confirms/rejects a candidate; confirming resolves the case and queues a family notification, atomically and audited.
- **Trust** — every public response is least-PII (redaction enforced server-side); every event (report → AI suggestion → verification → notified) is recorded in an append-only store and reconstructable as a per-case timeline.

### Pluggable cloud AI (optional)

Matching uses the local rule engine as a baseline and **blends in any configured cloud-AI provider** (Anthropic, OpenAI, …). With no keys set it runs baseline-only; add one or more keys (see [`.env.example`](.env.example)) and they augment every score, with the evidence and provenance logged. Deferred until credentials are available: hosted Postgres + auth, and SMS/email/WhatsApp/Telegram delivery (the in-app channel works today). See [`docs/decision-log/2026-06-28-mvp-architecture.md`](docs/decision-log/2026-06-28-mvp-architecture.md).

*Technology cannot prevent disasters — but it can reduce uncertainty, and reducing uncertainty saves lives.*
