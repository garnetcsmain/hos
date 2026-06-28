# Application Code

Production code for HOS platform across web, mobile, and database.

## Structure

### Backend (Python/FastAPI)
```
backend/
├── models/               SQLAlchemy ORM models
├── schemas/             Pydantic request/response schemas
├── services/            Business logic layer
├── routes/              API endpoints
├── middleware/          Request/response handlers
├── main.py             FastAPI app entry
├── config.py           Environment configuration
├── requirements.txt    Python dependencies
└── tests/              Test suite
```

**Stack:** Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy

### Frontend Web (Next.js)
```
frontend/
├── src/
│   ├── pages/          Server-rendered pages
│   ├── components/     React components
│   ├── hooks/          Custom React hooks
│   ├── services/       API client & data services
│   ├── types/          TypeScript types
│   ├── styles/         CSS/Tailwind styles
│   └── utils/          Helper functions
├── public/             Static assets
├── package.json        Node dependencies
└── next.config.ts     Next.js configuration
```

**Stack:** Next.js 14+, TypeScript, React, TailwindCSS

**Purpose:** 
- Coordinator dashboards
- Admin interfaces
- Data entry forms
- Analytics & reporting
- Desktop-optimized UX

**Deploy to:** Vercel or AWS

### Frontend Mobile (React Native)
```
mobile/
├── app/
│   ├── screens/        Native screen components
│   ├── components/     Reusable UI components
│   ├── services/       API client
│   ├── types/          TypeScript types
│   └── utils/          Helper functions
├── app.json            Expo configuration
├── package.json        React Native dependencies
└── eas.json            EAS Build configuration
```

**Stack:** React Native 0.73+, Expo, TypeScript

**Purpose:**
- Mobile-first experience (families, volunteers)
- Offline-first functionality (critical for disasters)
- Native features (camera, geolocation, notifications)
- iOS & Android support

**Deploy to:** App Store (iOS), Google Play (Android)

### Database (PostgreSQL)
```
database/
├── schemas/            SQL schema definitions
├── migrations/         Alembic migration files
└── seeds/              Test data (demo_data.sql)
```

**Stack:** PostgreSQL 14+, PostGIS (geospatial), pgvector (embeddings)

## Architecture Decision: Separate Codebases

**Decision:** Keep Next.js (web) and React Native (mobile) **separate**

See [docs/FRONTEND_ARCHITECTURE.md](../docs/FRONTEND_ARCHITECTURE.md) for detailed rationale.

### Why Separate?

✅ **Next.js advantages for web:**
- Server-side rendering (SSR)
- Vercel deployment
- API routes
- Image optimization
- SEO friendly

✅ **React Native advantages for mobile:**
- Offline-first (critical)
- Native performance
- Native APIs (camera, geolocation)
- App store distribution
- Push notifications

✅ **Shared code:**
- Types (TypeScript interfaces)
- API client logic
- Validation functions
- Backend is single source of truth

### How They Stay in Sync

1. **Shared types package** (`shared/types/`)
   - Single definition of Person, Match, Organization, etc.
   - Both web & mobile import from same source

2. **API contract**
   - Backend owns REST API definition
   - Both frontends implement same client

3. **Backend-driven**
   - When backend API changes, types update
   - Both frontends update to match

## Shared Code (If Using Monorepo)

Optional: Extract shared logic to `shared/` package:
```
shared/
├── types/              (TypeScript interfaces)
├── services/           (API client methods)
└── utils/              (Validation, formatting)
```

For now, each frontend has its own copies to avoid monorepo complexity.

## Environment Setup

### Backend
```bash
cd application/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend Web
```bash
cd application/frontend
npm install
npm run dev              # http://localhost:3000
npm run build            # Production build
npm run deploy           # Push to Vercel
```

### Frontend Mobile
```bash
cd application/mobile
npm install
npm start                # Expo dev server
npm run ios              # iOS simulator
npm run android          # Android emulator
npm run build            # EAS build
```

## API Endpoints

Both frontends call the same backend API:
```
http://localhost:8000/api/

/persons/
  GET    - List all persons
  POST   - Create person report

/matches/
  GET    - List potential matches
  POST   - Verify a match

/search/
  GET    - Search persons by name, description
```

See `backend/main.py` and `backend/routes/` for full API.

## Type Safety Across Stacks

**Single source of truth: `shared/types/person.ts`**

```typescript
// shared/types/person.ts
export interface Person {
  id: string
  name: string
  age?: number
  description: string
  lastSeen?: Location
  photo?: Photo
  createdAt: Date
  confidence: number
  verifiedBy?: string
}

// Both frontends use:
// frontend/src/services/person.ts
import { Person } from '@shared/types'

// mobile/app/services/person.ts
import { Person } from '@shared/types'
```

Result: Web & mobile work with same data structure, API mismatches caught at compile time.

## Database

PostgreSQL with:
- **PostGIS** for geospatial queries (find people near location)
- **pgvector** for semantic search (AI matching)
- **Migrations** via Alembic (version-controlled schema)

See `database/schemas/` for table definitions.

## Testing

Each frontend has its own tests:

**Backend:** `application/backend/tests/`
**Web:** `application/frontend/__tests__/` (Jest)
**Mobile:** `application/mobile/__tests__/` (Jest)

Run with:
```bash
cd application/backend && pytest
cd application/frontend && npm run test
cd application/mobile && npm run test
```

## CI/CD

GitHub Actions workflows (`.github/workflows/`):
- Test backend on PR
- Build web frontend on PR
- Build mobile on PR
- Deploy web to Vercel on merge to main
- Deploy mobile to EAS on tag

## Deployment

- **Backend:** Docker container to AWS ECS or similar
- **Frontend (web):** Vercel
- **Frontend (mobile):** EAS Build → App Store/Google Play
- **Database:** AWS RDS PostgreSQL

See `infrastructure/` for deployment configs.

## When to Revisit This Decision

This architecture can be reconsidered if:
- Web & mobile diverge significantly (80%+ different features)
- Mobile doesn't ship (focus on web only)
- Code sharing pain becomes unbearable
- Team size/structure changes

**Review quarterly** during retrospectives.

---

See [../docs/FRONTEND_ARCHITECTURE.md](../docs/FRONTEND_ARCHITECTURE.md) for full architectural decision rationale.
