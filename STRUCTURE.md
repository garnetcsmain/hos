# HOS Project Structure

## Overview

```
hos/
├── backend/              # Python FastAPI backend
├── frontend/             # Next.js TypeScript frontend
├── mobile/               # React Native mobile app (future)
├── database/             # PostgreSQL schemas & migrations
├── docs/                 # Architecture & documentation
├── config/               # Environment & deployment configs
├── infrastructure/       # Docker, Kubernetes, Terraform
├── scripts/              # Utility scripts
└── .github/              # CI/CD workflows
```

---

## Backend (`backend/`)

**Tech Stack:** Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── person.py           # Person entity (missing/found)
│   │   ├── organization.py      # Organizations, NGOs, hospitals
│   │   ├── location.py          # Geographic locations
│   │   ├── match.py            # AI matching results
│   │   └── event.py            # Event store for audit trail
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── person.py
│   │   ├── match.py
│   │   └── search.py
│   ├── services/               # Business logic
│   │   ├── person_service.py
│   │   ├── match_service.py    # AI matching logic
│   │   ├── search_service.py   # Full-text & similarity search
│   │   └── notification_service.py
│   ├── routes/                 # API endpoints
│   │   ├── persons.py          # /api/persons
│   │   ├── matches.py          # /api/matches
│   │   └── search.py           # /api/search
│   ├── agents/                 # AI agent implementations
│   │   ├── matcher.py          # Matching engine
│   │   └── verifier.py         # Verification agent
│   ├── middleware/             # Request/response middleware
│   │   ├── auth.py
│   │   ├── logging.py
│   │   └── error_handler.py
│   └── utils/                  # Helpers & utilities
│       ├── embeddings.py       # pgvector embeddings
│       ├── geospatial.py       # PostGIS queries
│       └── validators.py
├── tests/
│   ├── unit/                   # Unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/            # Integration tests
│   │   ├── test_api.py
│   │   └── test_db.py
│   └── conftest.py             # Pytest fixtures
├── migrations/                 # Alembic database migrations
│   └── versions/
├── config/
│   ├── settings.py             # Environment config
│   └── database.py
├── requirements.txt            # Python dependencies
├── Dockerfile
└── .env.example
```

### Key Modules

- **Models** — Person, Organization, Location, MatchResult, Event. Each model includes timestamps, provenance, and confidence scores.
- **Services** — Business logic layer; handles matching, verification, notifications.
- **Agents** — AI-powered matching and verification. Isolated from main app for easy swapping.
- **Routes** — RESTful API. Returns paginated, filterable results.

---

## Frontend (`frontend/`)

**Tech Stack:** Next.js 14+, TypeScript, React, TailwindCSS

```
frontend/
├── src/
│   ├── pages/                  # Next.js pages
│   │   ├── index.tsx           # Landing page
│   │   ├── report-missing.tsx  # Missing person form (no login)
│   │   ├── report-found.tsx    # Found person form
│   │   ├── search.tsx          # Search & browse
│   │   ├── matches.tsx         # View potential matches
│   │   └── dashboard.tsx       # Org dashboard
│   ├── components/             # Reusable React components
│   │   ├── forms/              # Form components
│   │   │   ├── PersonForm.tsx
│   │   │   └── SearchForm.tsx
│   │   ├── cards/              # Card components
│   │   │   ├── PersonCard.tsx
│   │   │   └── MatchCard.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Spinner.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── usePersonForm.ts
│   │   ├── useMatches.ts
│   │   └── useGeolocation.ts
│   ├── services/               # API client
│   │   ├── api.ts              # Axios/fetch wrapper
│   │   ├── persons.ts          # Person API calls
│   │   └── matches.ts          # Match API calls
│   ├── types/                  # TypeScript types
│   │   ├── person.ts
│   │   ├── match.ts
│   │   └── api.ts
│   ├── styles/                 # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   └── utils/                  # Helpers
│       ├── format.ts
│       ├── validation.ts
│       └── location.ts
├── public/                     # Static assets
│   ├── images/
│   └── icons/
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Key Features

- **No login on report** — anyone can report missing/found persons.
- **Progressive disclosure** — optional fields for advanced matching.
- **Photo support** — upload with fallback to description-only matching.
- **Notification inbox** — matches appear in real-time.

---

## Database (`database/`)

**Tech Stack:** PostgreSQL 14+, PostGIS, pgvector

```
database/
├── schemas/
│   ├── 001_initial_schema.sql  # Core tables
│   ├── 002_geospatial.sql      # PostGIS setup
│   ├── 003_embeddings.sql      # pgvector setup
│   ├── 004_audit_log.sql       # Event store
│   └── indexes.sql             # Performance indexes
├── migrations/                 # Alembic auto-migrations
│   └── versions/
├── seeds/
│   └── demo_data.sql           # Test data for development
└── queries/
    ├── person_similarity.sql   # Semantic search query
    └── geospatial.sql          # Location-based queries
```

### Key Tables

- **persons** — missing or found persons, with name, age, description, photo, location, timestamp, confidence.
- **organizations** — NGOs, hospitals, government agencies.
- **locations** — named places (cities, shelters, hospitals) with PostGIS geometries.
- **matches** — AI-suggested matches with confidence, evidence, verifying agent.
- **events** — immutable audit log. Every change (report created → match suggested → verified → family notified) is logged.

---

## Documentation (`docs/`)

```
docs/
├── architecture/
│   ├── data-model.md           # Entity relationships
│   ├── api-design.md           # REST API conventions
│   ├── ai-matching.md          # How matching works
│   └── security.md             # Threat model, encryption, audit
├── guides/
│   ├── getting-started.md      # Local dev setup
│   ├── contributing.md         # Development guidelines
│   └── deployment.md           # How to deploy
├── api/
│   └── endpoints.md            # API reference
└── incident-responses/
    └── venezuela-2026.md       # First deployment case study
```

---

## Configuration (`config/`)

```
config/
├── dev/
│   ├── docker-compose.yml      # Local Postgres + Redis
│   └── .env
├── staging/
│   └── .env
└── prod/
    └── .env
```

Use environment variables for all secrets. Never commit `.env` files with real values.

---

## Infrastructure (`infrastructure/`)

```
infrastructure/
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── kubernetes/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
└── terraform/
    ├── main.tf                 # Cloud resources (AWS/GCP/Azure)
    ├── database.tf             # Managed Postgres
    └── variables.tf
```

---

## Scripts (`scripts/`)

```
scripts/
├── setup-local.sh              # Initialize local dev environment
├── migrate-db.sh               # Run database migrations
├── seed-demo-data.sh           # Load test data
└── backup-db.sh                # Database backup
```

---

## CI/CD (`.github/workflows/`)

```
.github/workflows/
├── test.yml                    # Run tests on PR
├── lint.yml                    # Code quality checks
├── build.yml                   # Build Docker images
└── deploy.yml                  # Deploy to staging/prod
```

---

## Development Workflow

### Getting Started

```bash
# 1. Clone and setup
git clone https://github.com/garnetcsmain/hos.git
cd hos
./scripts/setup-local.sh

# 2. Start local Postgres + Redis
docker-compose -f config/dev/docker-compose.yml up

# 3. Run migrations
./scripts/migrate-db.sh

# 4. Start backend
cd backend && python -m uvicorn app.main:app --reload

# 5. Start frontend (new terminal)
cd frontend && npm run dev
```

### Adding a Feature

1. **Database** — create migration in `database/migrations/`
2. **Backend** — add models, schemas, services, routes in `backend/app/`
3. **Frontend** — add pages, components, hooks in `frontend/src/`
4. **Tests** — add unit/integration tests in `backend/tests/`
5. **Docs** — update relevant docs in `docs/`

### Branching

- `main` — production-ready
- `staging` — integration branch
- `feature/*` — feature branches
- `bugfix/*` — bug fixes
- `docs/*` — documentation

---

## Notes

- **Keep it flat** — avoid deep nesting; 2–3 levels max.
- **Colocation** — keep related code together (e.g., PersonCard.tsx + PersonCard.test.tsx).
- **Types first** — define types in `frontend/src/types/` early; let the UI follow.
- **One model per file** — `backend/app/models/person.py`, not `backend/app/models.py`.
- **Env vars** — all config is in environment; never hardcode secrets or URLs.
