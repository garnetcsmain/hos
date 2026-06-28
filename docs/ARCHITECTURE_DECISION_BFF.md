# ✅ DECISION MADE: Use Next.js API Routes as BFF

**Date:** 2026-06-27  
**Decision:** Option B - Next.js API Routes BFF  
**Status:** Active

---

## Architecture

```
Frontend (Next.js)
  ├─ Pages & Components (React)
  └─ API Routes (/pages/api/) ← BFF layer
         ↓
         ├─→ Backend (Python/FastAPI)
         ├─→ External Services (Auth, etc.)
         └─→ Database (Postgres)

Mobile (React Native)
  └─→ Backend (Python/FastAPI) directly
         ↓
         └─→ Database (Postgres)
```

---

## What This Means

### Next.js API Routes (The BFF)

**Purpose:** Transform backend API for web frontend

```typescript
// frontend/pages/api/persons/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication (via Next.js session/JWT)
  const session = getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      // Call backend API
      const response = await fetch(`${process.env.BACKEND_URL}/api/persons`, {
        headers: {
          'Authorization': `Bearer ${process.env.BACKEND_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      // TRANSFORM for web frontend
      const enriched = data.map((person: any) => ({
        id: person.id,
        name: person.name,
        age: person.age,
        description: person.description,
        confidence: person.confidence,
        lastSeen: person.last_seen,
        isVerified: person.verified_by !== null,
        status: person.confidence > 0.8 ? 'high-confidence' : 'pending-verification',
        editUrl: `/admin/persons/${person.id}/edit`,
        viewUrl: `/persons/${person.id}`,
      }))
      
      return res.status(200).json(enriched)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch persons' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
```

### Backend (Unchanged)

Python/FastAPI still provides REST API for both frontends:

```python
# application/backend/routes/persons.py

@app.get("/persons")
async def list_persons(skip: int = 0, limit: int = 10):
    """Get all persons - raw data from backend"""
    persons = await db.persons.find().skip(skip).limit(limit)
    return persons

@app.post("/persons")
async def create_person(person: PersonCreate):
    """Create new person report"""
    return await db.persons.insert_one(person.dict())
```

### Mobile (Direct to Backend)

React Native connects directly to Python backend (no BFF):

```typescript
// mobile/app/services/api.ts

import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
})

// Mobile calls backend directly
export const personService = {
  list: () => api.get('/api/persons'),
  create: (data) => api.post('/api/persons', data),
}
```

---

## Why Option B for HOS

### Pros Realized ✅
- **Simple** — One additional layer (BFF in Next.js)
- **Colocated** — API routes live with web frontend
- **Web-optimized** — Transform data for web UX needs
- **Vercel native** — API routes run on Vercel serverless
- **Authentication** — Sessions/cookies handled natively
- **No extra server** — Runs on same Vercel instance
- **Easy to maintain** — All web code in one place

### Tradeoff Accepted ⚠️
- **Mobile hits backend directly** — No mobile-specific optimization (yet)
- **Can add later** — If mobile offline needs grow, add BFF-Mobile then

---

## File Structure

### Frontend (Web + BFF)

```
frontend/
├── src/
│   ├── pages/          (Next.js pages)
│   ├── components/     (React components)
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── styles/
├── pages/
│   ├── api/            ← BFF LAYER
│   │   ├── persons/
│   │   │   ├── index.ts       (GET /api/persons)
│   │   │   └── [id].ts        (GET /api/persons/:id)
│   │   ├── matches/
│   │   │   └── index.ts
│   │   └── auth/
│   │       └── [...nextauth].ts
│   └── dashboard.tsx   (Page using BFF)
├── public/
├── package.json
└── next.config.ts
```

### Backend (Unchanged)

```
application/backend/
├── app/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   └── main.py
└── ...
```

### Mobile (Unchanged)

```
mobile/app/
├── screens/
├── components/
├── services/
├── types/
└── ...
```

---

## API Layer Diagram

```
USER BROWSER
    ↓
Next.js Frontend (React)
    ↓
Next.js API Routes (BFF) ← Transforms data
    ↓ (HTTP request to backend)
Python FastAPI Backend
    ↓
PostgreSQL Database
    ↑
    ↓ (also called by mobile)
React Native Mobile
```

---

## Frontend Service Pattern

### Old (Direct to Backend)
```typescript
// ❌ frontend/src/services/api.ts
const response = await fetch('http://localhost:8000/api/persons')
const persons = response.json()  // Raw backend data
```

### New (Through BFF)
```typescript
// ✅ frontend/src/services/api.ts
const response = await fetch('/api/persons')  // Next.js API route
const persons = response.json()  // Transformed by BFF
```

**Benefits:**
- No CORS issues (same origin)
- Authentication handled by Next.js
- Data transformation in one place
- Can cache responses
- Easier to add features (logging, rate limiting)

---

## Environment Setup

### Frontend `.env.local`
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000  # Frontend itself
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # Backend (for BFF)
BACKEND_SERVICE_KEY=sk-...  # Service key for BFF→backend calls
```

### Backend `.env`
```bash
# application/backend/.env
DATABASE_URL=postgresql://...
```

### Mobile `.env`
```bash
# mobile/.env
REACT_APP_BACKEND_URL=http://localhost:8000  # Direct to backend
```

---

## Development Workflow

### Start Backend
```bash
cd application/backend
python -m uvicorn app.main:app --reload
# http://localhost:8000
```

### Start Frontend (with BFF)
```bash
cd frontend
npm run dev
# http://localhost:3000
# API routes at http://localhost:3000/api/*
```

### Start Mobile
```bash
cd mobile
npm start
# Connects directly to http://localhost:8000
```

### Test Frontend Calls BFF

```bash
# Test BFF is working
curl http://localhost:3000/api/persons

# Should transform backend response
```

---

## Deployment

### Backend (Python/FastAPI)
- Deploy to AWS ECS, Heroku, or similar
- URL: `https://api.hos.app`

### Frontend (Next.js)
- Deploy to Vercel
- URL: `https://hos.app`
- API routes run automatically on Vercel
- BFF calls backend via `NEXT_PUBLIC_BACKEND_URL` env var

### Mobile (React Native)
- Deploy to App Store/Google Play
- Calls backend directly at `https://api.hos.app`

---

## When to Add BFF-Mobile

**Revisit this decision if:**
- Mobile struggles with offline sync
- Mobile needs data compression
- Mobile needs batch operations
- Performance is critical for mobile

**Then split to:**
```
Frontend (Next.js) → BFF-Web (API Routes)
Mobile (React Native) → BFF-Mobile (Node.js) → Backend
                                  ↓
                            Python Backend
```

---

## Questions & Answers

**Q: Why not GraphQL?**
A: REST is simpler for this stage. GraphQL adds complexity early. Easy to add later.

**Q: What about data duplication?**
A: BFF transforms but doesn't cache. Backend is source of truth.

**Q: How do we keep types in sync?**
A: Shared types package (shared/types/) + TypeScript ensures consistency.

**Q: Can mobile also use BFF?**
A: Yes, if needed later. Start with mobile→backend direct.

**Q: What about authentication?**
A: Next.js session handles web. Mobile uses JWT token.

---

## Summary

✅ **Next.js API Routes as BFF** for web frontend  
✅ **Direct backend connection** for mobile (can add BFF-Mobile later)  
✅ **One additional layer** (minimal complexity)  
✅ **Vercel native** (serverless API routes)  
✅ **Transform data for web** (BFF shapes responses)  
✅ **Mobile stays simple** (no BFF overhead yet)  

---

## Implementation Checklist

- [ ] Create `frontend/pages/api/` directory structure
- [ ] Implement first BFF endpoint: `GET /api/persons`
- [ ] Update frontend services to call BFF instead of backend
- [ ] Add environment variables
- [ ] Test: Frontend → BFF → Backend flow
- [ ] Add error handling in BFF
- [ ] Add logging/monitoring
- [ ] Deploy BFF with frontend to Vercel

---

## See Also

- [docs/BEST_PRACTICES.md](BEST_PRACTICES.md) — Backend practices
- [docs/ARCHITECTURE_BFF_DECISION.md](ARCHITECTURE_BFF_DECISION.md) — Full decision document
- [application/README.md](../application/README.md) — Application structure
