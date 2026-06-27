# Best Practices for HOS Development

Guidelines for code quality, deployment, and team collaboration in an agentic organization.

---

## 1. Supabase Integration Best Practices

### GitHub Integration Setup

**DO:**
```bash
# Initialize Supabase in project root
supabase init

# This creates:
supabase/
├── migrations/           # Version-controlled schema changes
├── functions/            # Edge functions
├── config.toml          # Project config
└── seed.sql             # Optional test data
```

**Working Directory:** `.` (root of repo)

**DO:**
- ✅ Commit `supabase/` folder to git
- ✅ Version control all migrations
- ✅ Link GitHub to Supabase (automatic PR previews)
- ✅ Review migrations before merging to main

**DON'T:**
- ❌ Manually change database schema via Supabase dashboard
- ❌ Skip migrations (always use `supabase migration new`)
- ❌ Commit `.env` files or secrets
- ❌ Use `POSTGRES_PASSWORD` in plain text

### Database Migrations

**Process:**

```bash
# 1. Create a migration
supabase migration new add_person_table

# 2. This creates: supabase/migrations/TIMESTAMP_add_person_table.sql

# 3. Write your migration:
cat > supabase/migrations/20260627123456_add_person_table.sql << 'EOF'
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_persons_name ON persons(name);
EOF

# 4. Test locally
supabase db push

# 5. Commit to git
git add supabase/migrations/
git commit -m "Add persons table"
git push

# 6. GitHub Actions auto-deploys to preview environments
# 7. Merge PR → auto-deploys to production
```

**Migration naming:**
```
TIMESTAMP_description.sql

Good:  20260627_add_persons_table.sql
Bad:   migration1.sql, add_table.sql
```

**Migration content:**

```sql
-- DO: Add descriptive comments
-- Persons table: stores missing/found person reports
-- Includes geospatial data (location) and confidence scores

CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INT,
  description TEXT,
  photo_url TEXT,
  location GEOMETRY(POINT, 4326),  -- PostGIS: lat/long
  confidence DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- DO: Add indexes for performance
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_location ON persons USING GIST(location);

-- DON'T: Leave migrations without rollback
-- Always include reversible changes:
```

### Environment Management

**Files to NEVER commit:**
```
.env
.env.local
.env.*.local
.env.production.local
supabase/.env
```

**Create `.env.example`:**
```bash
# .env.example (COMMIT THIS)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # SECRET - don't expose
DATABASE_URL=postgresql://user:password@host:5432/postgres
```

**Setup locally:**
```bash
cp .env.example .env.local
# Edit .env.local with real values
```

---

## 2. Backend Development

### Code Organization

**DO:**
```
application/backend/
├── app/
│   ├── models/
│   │   ├── person.py           # One model per file
│   │   ├── match.py
│   │   └── organization.py
│   ├── schemas/
│   │   ├── person.py           # Request/response schemas
│   │   └── match.py
│   ├── services/
│   │   ├── person_service.py   # Business logic
│   │   └── match_service.py
│   ├── routes/
│   │   ├── persons.py          # API endpoints
│   │   └── matches.py
│   └── main.py                 # FastAPI app
```

**DON'T:**
```
❌ app/models.py               (all models in one file)
❌ app/utils.py                (dumping ground for helpers)
❌ app/database.py + app/crud.py  (redundant)
```

### Type Hints & Validation

**DO:**
```python
# ✅ Always use type hints
from pydantic import BaseModel, Field
from datetime import datetime

class PersonCreate(BaseModel):
    name: str = Field(..., min_length=1)
    age: int | None = Field(None, ge=0, le=150)
    description: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "age": 35,
                "description": "Last seen near downtown"
            }
        }

# ✅ Use in routes
@app.post("/persons", response_model=PersonSchema)
async def create_person(person: PersonCreate) -> PersonSchema:
    return await person_service.create(person)
```

**DON'T:**
```python
❌ def create_person(data):  # No type hints
❌ def create_person(data: dict):  # Dict is too loose
❌ No validation (accept any data)
```

### Error Handling

**DO:**
```python
from fastapi import HTTPException, status

@app.post("/persons/{person_id}")
async def verify_person(person_id: str):
    person = await person_service.get(person_id)
    
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person {person_id} not found"
        )
    
    if not person.confidence > 0.8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot verify person with low confidence"
        )
    
    return await person_service.verify(person_id)
```

**DON'T:**
```python
❌ return None  # Silent failure
❌ raise Exception("error")  # Generic exception
❌ return {"error": "something bad"}  # Inconsistent error format
```

### Async/Await

**DO:**
```python
# ✅ Always use async for I/O
@app.get("/persons")
async def list_persons(skip: int = 0, limit: int = 10):
    persons = await db.persons.find().skip(skip).limit(limit).to_list()
    return persons

# ✅ Await all async calls
result = await person_service.create(data)
```

**DON'T:**
```python
❌ def list_persons():  # Blocking call, blocks event loop
❌ result = person_service.create(data)  # Missing await
```

---

## 3. Frontend Development

### React/Next.js

**File Structure:**
```
frontend/src/
├── pages/          (next.js routes)
├── components/
│   ├── forms/      (form components)
│   │   ├── PersonForm.tsx
│   │   └── PersonForm.test.tsx
│   ├── cards/
│   │   ├── PersonCard.tsx
│   │   └── PersonCard.test.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── hooks/
│   ├── usePersonForm.ts
│   └── usePersonForm.test.ts
├── types/
│   ├── person.ts
│   └── match.ts
└── services/
    ├── api.ts
    └── api.test.ts
```

**Colocation Rule:**
```
PersonCard.tsx
PersonCard.test.tsx     ← Test next to component
PersonCard.stories.tsx  ← Storybook next to component (optional)
```

**DO:**
```tsx
// ✅ Use TypeScript types
interface PersonCardProps {
  person: Person
  onVerify: (personId: string) => Promise<void>
  isLoading?: boolean
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  onVerify,
  isLoading = false
}) => {
  return <div>...</div>
}

// ✅ Export component and props type
export type { PersonCardProps }
```

**DON'T:**
```tsx
❌ export default PersonCard  (harder to refactor)
❌ const PersonCard = (props) => {}  (no type safety)
❌ import PersonCard from '../PersonCard'  (no type imports)
```

### API Client

**DO:**
```typescript
// services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
})

// ✅ Type-safe API calls
export const personService = {
  create: (data: PersonCreate) => 
    api.post<Person>('/persons', data),
  
  list: (filters: PersonFilters) =>
    api.get<Person[]>('/persons', { params: filters }),
  
  verify: (personId: string) =>
    api.post(`/persons/${personId}/verify`, {}),
}

// ✅ Use in components
const { data: person } = await personService.get(id)
```

**DON'T:**
```typescript
❌ fetch('/api/persons')  (no types, error handling)
❌ axios.get('/api/persons')  (no centralized config)
❌ Hardcoded URLs (should be env var)
```

---

## 4. Mobile Development (React Native)

### Project Structure
```
mobile/app/
├── screens/
│   ├── HomeScreen.tsx
│   ├── ReportMissingScreen.tsx
│   └── ReportMissingScreen.test.tsx
├── components/
│   ├── PersonCard.tsx
│   └── PersonCard.test.tsx
├── services/
│   ├── api.ts
│   └── offline.ts
├── hooks/
│   └── usePersonForm.ts
└── types/
    └── person.ts
```

### Offline-First

**Critical for HOS:**

**DO:**
```typescript
// services/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export const offlineService = {
  // Cache all API responses
  cache: async (key: string, data: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(data))
  },
  
  // Retrieve from cache when offline
  get: async (key: string) => {
    const cached = await AsyncStorage.getItem(key)
    return cached ? JSON.parse(cached) : null
  },
  
  // Queue requests when offline, sync when back online
  queueRequest: async (request: PendingRequest) => {
    const queue = await AsyncStorage.getItem('pending_requests')
    const requests = queue ? JSON.parse(queue) : []
    requests.push(request)
    await AsyncStorage.setItem('pending_requests', JSON.stringify(requests))
  },
  
  // Sync when connectivity returns
  syncPending: async () => {
    const queue = await AsyncStorage.getItem('pending_requests')
    if (!queue) return
    
    const requests = JSON.parse(queue)
    for (const req of requests) {
      try {
        await api.request(req)
        // Remove from queue on success
      } catch (err) {
        // Retry next sync
      }
    }
  }
}
```

**DON'T:**
```typescript
❌ Only work when online
❌ Lose user data if connection drops
❌ No sync queue
```

---

## 5. Git Workflow

### Branch Names

**DO:**
```
feature/add-ai-matching
feature/improve-search-speed
bugfix/fix-offline-sync
docs/update-readme
refactor/simplify-person-model
```

**DON'T:**
```
❌ my-branch
❌ fix-stuff
❌ wip
❌ temp
```

### Commit Messages

**DO:**
```
git commit -m "Add AI matching engine

- Implement embeddings API
- Add model training pipeline
- Improve match accuracy to 85%

Fixes #42"
```

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>

type: feat|fix|docs|refactor|test|chore
scope: backend|frontend|mobile|database|agents
subject: 50 chars max, imperative mood
body: 72 chars per line, explains WHY not WHAT
footer: References issues (Fixes #123)
```

**DON'T:**
```
❌ "fixed bug"
❌ "wip"
❌ "asdf"
❌ commit messages with no context
```

### Pull Requests

**DO:**
```markdown
## Summary
- Added AI matching engine
- Improved match accuracy from 60% to 85%
- Added bias audit checks

## Test Plan
- [ ] Manual test with 100 historical matches
- [ ] Verify accuracy >= 85%
- [ ] Check false positive rate < 10%
- [ ] Load test: 1000 RPS

## Files Changed
- backend/services/match_service.py
- application/database/migrations/001_add_match_scoring.sql
```

**DON'T:**
```
❌ No description
❌ "fixes stuff"
❌ No test plan
❌ Comment "looks good" without review
```

### Code Review

**Reviewer:**
- ✅ Check: Does this solve the problem?
- ✅ Check: Are there edge cases?
- ✅ Check: Is this testable?
- ✅ Check: Does performance degrade?
- ✅ Check: Are there security issues?

**Author:**
- ✅ Respond to all comments
- ✅ Don't commit after approval changes (request re-review)
- ✅ Link to issue/decision

---

## 6. Testing Best Practices

### Backend Testing

**DO:**
```python
# ✅ Test happy path, sad path, edge cases
class TestPersonService:
    async def test_create_person_success(self):
        """Happy path: create valid person"""
        data = PersonCreate(name="John", age=35)
        person = await person_service.create(data)
        assert person.name == "John"
    
    async def test_create_person_missing_name(self):
        """Sad path: missing required field"""
        data = PersonCreate(age=35)  # name is missing
        with pytest.raises(ValidationError):
            await person_service.create(data)
    
    async def test_create_person_invalid_age(self):
        """Edge case: age out of bounds"""
        data = PersonCreate(name="John", age=999)
        with pytest.raises(ValidationError):
            await person_service.create(data)
```

### Frontend Testing

**DO:**
```typescript
// ✅ Test component rendering and interaction
describe('PersonCard', () => {
  it('renders person name', () => {
    const person = { id: '1', name: 'John', age: 35 }
    render(<PersonCard person={person} />)
    expect(screen.getByText('John')).toBeInTheDocument()
  })
  
  it('calls onVerify when verify button clicked', async () => {
    const onVerify = jest.fn()
    render(<PersonCard person={person} onVerify={onVerify} />)
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    expect(onVerify).toHaveBeenCalledWith('1')
  })
})
```

### Test Coverage

**Target:** 80%+ coverage for critical paths

```bash
# Run with coverage
pytest --cov=app --cov-report=html

# Check coverage
coverage report
```

---

## 7. Performance Best Practices

### Database

**DO:**
```sql
-- ✅ Add indexes for frequently queried columns
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_created_at ON persons(created_at DESC);

-- ✅ Use EXPLAIN to check query performance
EXPLAIN ANALYZE
SELECT * FROM persons WHERE name ILIKE '%john%';

-- ✅ Batch inserts
INSERT INTO persons (name, age, description) VALUES
  ('John', 35, 'Missing'),
  ('Jane', 28, 'Found'),
  ('Bob', 42, 'Missing');
```

**DON'T:**
```sql
❌ SELECT * FROM persons WHERE age > 30  (no index)
❌ Loop and insert one by one (slow)
❌ Denormalize unnecessarily
```

### API

**DO:**
```python
# ✅ Paginate results
@app.get("/persons")
async def list_persons(skip: int = 0, limit: int = 10):
    # Prevent massive queries
    limit = min(limit, 100)
    return await db.persons.find().skip(skip).limit(limit)

# ✅ Cache expensive operations
from functools import lru_cache

@lru_cache(maxsize=100)
async def get_popular_matches():
    return await db.matches.find({"verified": True}).limit(10)
```

**DON'T:**
```python
❌ SELECT * FROM persons  (all rows)
❌ No pagination
❌ Re-compute expensive queries
```

### Frontend

**DO:**
```typescript
// ✅ Lazy load images
<Image src={person.photo} loading="lazy" />

// ✅ Debounce search
const debouncedSearch = useMemo(
  () => debounce((query: string) => searchPeople(query), 300),
  []
)

// ✅ Virtualize long lists
<FixedSizeList height={600} itemCount={10000} itemSize={50}>
  {PersonRow}
</FixedSizeList>
```

**DON'T:**
```typescript
❌ Load all images eagerly
❌ Search on every keystroke (kills backend)
❌ Render 10,000 items at once
```

---

## 8. Security Best Practices

### Secrets Management

**DO:**
```bash
# ✅ Use environment variables
export SUPABASE_SERVICE_ROLE_KEY="sk-..."
export DATABASE_URL="postgresql://..."

# ✅ Use .env files locally (never commit)
cp .env.example .env.local
# Edit .env.local

# ✅ Use GitHub secrets for CI/CD
# Settings → Secrets and variables → Actions
SUPABASE_ACCESS_TOKEN=***
DATABASE_PASSWORD=***
```

**DON'T:**
```
❌ Hardcode secrets in code
❌ Commit .env files
❌ Expose secrets in logs
❌ Share passwords in Slack
```

### Data Validation

**DO:**
```python
# ✅ Validate all user input
from pydantic import BaseModel, validator, EmailStr

class PersonCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr | None = None
    age: int | None = Field(None, ge=0, le=150)
    
    @validator('name')
    def name_no_sql_injection(cls, v):
        if any(sql_keyword in v.lower() for sql_keyword in ['select', 'drop']):
            raise ValueError('Invalid characters in name')
        return v
```

**DON'T:**
```python
❌ Accept user input without validation
❌ Concatenate SQL queries (use parameterized queries)
❌ Trust client-side validation only
```

### API Security

**DO:**
```python
# ✅ Add rate limiting
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/persons")
@limiter.limit("10/minute")
async def create_person(person: PersonCreate):
    return await person_service.create(person)

# ✅ Add CORS restrictions
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hos.example.com"],  # Specific origin
    allow_methods=["GET", "POST"],
    allow_credentials=True,
)

# ✅ Add authentication
from fastapi_jwt_extended import create_access_token

@app.post("/auth/login")
async def login(credentials: Credentials):
    if verify_password(credentials):
        return {"access_token": create_access_token(data={"sub": user_id})}
```

**DON'T:**
```python
❌ allow_origins=["*"]  (open to all)
❌ No authentication
❌ No rate limiting
```

---

## 9. Documentation Best Practices

**DO:**
```markdown
# Function docstring
def create_person(data: PersonCreate) -> Person:
    """Create a new person report.
    
    Args:
        data: Person creation data
        
    Returns:
        Created person with ID
        
    Raises:
        ValueError: If name is empty
    """
    pass

# README structure
# Project Name
## Overview
## Setup
## Usage
## API Documentation
## Contributing
## License
```

**DON'T:**
```python
❌ No docstrings
❌ "TODO" comments (fix them or create issue)
❌ Outdated documentation
```

---

## 10. Deployment Best Practices

### Database Migrations

**DO:**
```bash
# ✅ Always test migrations locally
supabase db push

# ✅ Review migrations before merging
git log --oneline supabase/migrations/

# ✅ Never skip migrations
# ✅ One migration per commit
# ✅ Reversible migrations (rollback path)
```

### Backend Deployment

**DO:**
```bash
# ✅ Use Docker
docker build -t hos-backend .
docker push registry/hos-backend:latest

# ✅ Use environment-specific configs
.env.development
.env.staging
.env.production

# ✅ Run migrations before deploy
docker run hos-backend alembic upgrade head
```

### Frontend Deployment

**DO:**
```bash
# ✅ Build before deployment
npm run build

# ✅ Test build locally
npm run start  # Production build

# ✅ Use environment-specific configs
NEXT_PUBLIC_API_URL=https://api.hos.app  # Production
NEXT_PUBLIC_API_URL=https://staging-api.hos.app  # Staging

# ✅ Deploy to Vercel
vercel deploy --prod
```

---

## Summary Checklist

- [ ] Types everywhere (TypeScript)
- [ ] Tests for critical paths (80%+ coverage)
- [ ] Error handling (specific, meaningful errors)
- [ ] Security (validate input, manage secrets)
- [ ] Performance (indexes, pagination, caching)
- [ ] Documentation (READMEs, docstrings, API docs)
- [ ] Git hygiene (meaningful commits, code review)
- [ ] Offline-first on mobile (queue & sync)
- [ ] Version control migrations (never manual schema changes)
- [ ] Monitoring (logs, alerts, metrics)

---

## Questions?

See:
- [AGENTIC_GOVERNANCE.md](AGENTIC_GOVERNANCE.md) — Decision processes
- [TASK_MANAGEMENT.md](TASK_MANAGEMENT.md) — How tasks flow
- [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) — Frontend decisions
