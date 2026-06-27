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

Design stage. The thesis is the source of truth; the codebase is being scaffolded from it. Direction, scope, and stack are still open to change.

*Technology cannot prevent disasters — but it can reduce uncertainty, and reducing uncertainty saves lives.*
