# 🤔 DECISION PROPOSAL: Do We Need a BFF?

**Status:** TEMPLATE (For Board Review)

**Question:** Should we add a Backend-For-Frontend (BFF) layer?

---

## Current Architecture

```
Frontend (Next.js)  ──┐
                      ├─→ Backend (Python/FastAPI)  ──→ Database
Mobile (React Native)─┘

Problems with this:
- Frontend & mobile have different needs
- Backend has to serve both (compromises)
- Frontend does extra work to adapt API responses
- Mobile does extra work for offline sync
```

---

## Option A: Keep Current (Single Backend, No BFF)

### Structure
```
Frontend (Next.js)
  └─→ Backend (Python/FastAPI) ──→ Database

Mobile (React Native)
  └─→ Backend (Python/FastAPI) ──→ Database
```

### Pros ✅
- **Simple** — One backend to maintain
- **Single source of truth** — One API definition
- **Fast to build** — No intermediate layer
- **Easy to scale** — Scale one backend
- **Clear responsibility** — Backend owns data logic

### Cons ❌
- **Compromise API** — Must satisfy both platforms
- **Frontend bloat** — Extra code to transform API responses
- **Mobile struggles** — Offline/sync logic in frontend
- **Coupled** — Changes to backend affect both frontends
- **Inefficient queries** — Get more data than needed sometimes

### When This Works
✅ Simple, consistent use cases (same data everywhere)
✅ Frontend & mobile have similar needs
✅ Small team (easy coordination)
✅ Early stage (iterate fast)

---

## Option B: Add One Shared BFF (Next.js API Routes)

### Structure
```
Frontend (Next.js)
  └─→ BFF (Next.js API Routes)  ──┐
                                   ├─→ Backend (Python) ──→ Database
Mobile (React Native)  ────────────┘
  └─→ Backend (Python) directly
```

### Pros ✅
- **Frontend-optimized API** — BFF shapes data for Next.js
- **Reduces frontend logic** — No data transformation in React
- **Colocation** — API & UI code in same repo
- **Vercel integration** — API routes on Vercel (serverless)
- **Handles web concerns** — Authentication, sessions, cookies

### Cons ❌
- **Mobile still hits backend directly** — No optimization for mobile
- **Extra layer** — More to maintain (but in same repo)
- **Offline/sync still in mobile** — Mobile doesn't benefit
- **Not best-of-breed** — Next.js APIs vs dedicated BFF

### When This Works
✅ Web is primary platform
✅ Mobile can work with raw backend API
✅ Team is small
✅ Using Vercel (serverless is natural)

---

## Option C: Two BFFs (One per Frontend)

### Structure
```
Frontend (Next.js)
  └─→ BFF-Web (Node.js/Express) ──┐
                                   ├─→ Backend (Python) ──→ Database
Mobile (React Native)              │
  └─→ BFF-Mobile (Node.js) ────────┘
```

### Pros ✅
- **Optimized for each platform** — Web BFF shapes for web, mobile BFF for mobile
- **Clean separation** — Each frontend gets what it needs
- **Independent scaling** — Can scale BFF-Web and BFF-Mobile separately
- **Web concerns** — Sessions, cookies, SSR support
- **Mobile concerns** — Offline sync, batch operations, data compression
- **Clear responsibilities** — Each BFF knows its platform

### Cons ❌
- **Maintenance burden** — Three backends (main + 2 BFFs)
- **More complexity** — More layers to debug
- **Code duplication** — BFF-Web and BFF-Mobile might duplicate logic
- **More to deploy** — Three things instead of one
- **Coordination** — Changes to main backend → update both BFFs

### When This Works
✅ Web and mobile are very different (different features)
✅ Large team (dedicated web + mobile teams)
✅ Performance is critical
✅ Offline-first is essential (mobile)
✅ You can handle the complexity

---

## Option D: Monolithic Backend + Thin BFF Layer

### Structure
```
Frontend (Next.js)  ──┐
                      ├─→ BFF (Single) ──→ Backend (Python) ──→ Database
Mobile (React Native)─┘
```

**BFF handles:**
- Routing (which frontend called, what they need)
- Aggregation (combining multiple backend calls)
- Transformation (shaping data per platform)
- Caching (store responses)
- Rate limiting (per platform)

### Pros ✅
- **Single integration point** — One BFF to maintain
- **Platform awareness** — BFF knows who's calling
- **Can optimize per platform** — Routes differently for web vs mobile
- **Aggregation** — Combine multiple backend calls
- **Observability** — All frontend traffic goes through BFF

### Cons ❌
- **Still one layer** — Not optimized for each platform specifically
- **Routing logic** — Need to detect which frontend calling
- **Might be overkill** — If platforms have same needs

### When This Works
✅ Frontend and mobile have some different needs
✅ Want centralized control over API
✅ Want aggregation/caching layer
✅ Medium complexity

---

## Decision Matrix

| Factor | Single Backend | BFF-Web Only | Two BFFs | Thin BFF |
|--------|---|---|---|---|
| **Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Web optimization** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Mobile optimization** | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Offline-first support** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Cost (servers)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

---

## For HOS Specifically

### HOS Needs
1. **Mobile is primary** (families & volunteers on phones)
2. **Offline-first is critical** (unreliable connectivity)
3. **Web is secondary** (coordination dashboards)
4. **Different data shapes** (mobile needs compact, web needs detailed)
5. **Performance matters** (families waiting for info)

### Which Option Fits?

#### 🔴 Contrarian Says
"Single backend = problem. Mobile can't optimize for offline. Web gets bloated responses. You'll regret this in 3 months when mobile struggles with sync and web has unnecessary data. Add BFF-Mobile at minimum."

#### 🟢 Expansionist Says
"Two BFFs = best upside. Each platform gets perfect optimization. If mobile works perfectly offline, families reunify faster. That's the win. Cost of two more servers is worth the competitive advantage."

#### 🧠 Principals Says
"HOS principle #1: 'Build once, deploy everywhere' conflicts with two separate BFFs. But principle #2 is 'AI assists humans' which means offline-first on mobile. Mobile BFF aligns with principles."

#### 📊 Researcher Says
"Uber, Twitter, Airbnb all use BFFs. Single backend doesn't scale well once platforms diverge. Early stage can use single backend, but plan to split."

#### 👤 User Says
"As a volunteer in the field, I need the app to work when I have no signal. As a coordinator at a desk, I need dashboards with all the details. One backend serving both = compromises both."

---

## My Recommendation for HOS

### Short Term (MVP): **Option A - Single Backend**
- Keep it simple
- Get to market fast
- Learn what web/mobile actually need
- One team managing everything

### Medium Term (3+ months): **Option B or C**
Once you have real usage data:
- If mobile struggles with offline → Add BFF-Mobile (Option C lighter version)
- If web feels slow → Add BFF-Web with caching
- If both need optimization → Full Option C (two BFFs)

### Timeline
```
Month 1-2: Single backend (Option A)
          └─→ Get real usage data
          └─→ See where pain is

Month 3-4: Evaluate
          └─→ Mobile offline struggles? → Add BFF-Mobile
          └─→ Web performance issues? → Add BFF-Web
          └─→ Both good? → Stay with single backend

Month 6+: Full architecture
          └─→ Two BFFs if mobile is primary
          └─→ Single BFF if simple
          └─→ Stay single if still working
```

---

## Implementation: If You Choose BFFs

### BFF-Mobile (Node.js Express)

**Purpose:** Optimize for mobile - offline, sync, compression

```typescript
// bff-mobile/src/routes/persons.ts

// GET /persons?lastSync=timestamp
// Returns only changed persons since lastSync
// Mobile can sync incrementally

app.get('/persons', async (req, res) => {
  const lastSync = req.query.lastSync ? new Date(req.query.lastSync) : null
  
  let query = {}
  if (lastSync) {
    query = { updated_at: { $gt: lastSync } }
  }
  
  const persons = await backend.get('/persons', { query })
  
  // Optimize for mobile
  const compact = persons.map(p => ({
    id: p.id,
    name: p.name,
    desc: p.description,  // Short field name
    confidence: p.confidence,
    updatedAt: p.updated_at,
  }))
  
  res.json({
    persons: compact,
    timestamp: new Date(),  // For next sync
  })
})

// POST /sync
// Batch sync: upload pending changes, download new
app.post('/sync', async (req, res) => {
  const { pending } = req.body
  
  // Upload pending changes
  for (const item of pending) {
    await backend.post('/persons', item)
  }
  
  // Download what's new
  const newData = await backend.get('/persons?since=' + req.body.lastSync)
  
  res.json({ success: true, newData })
})
```

### BFF-Web (Next.js API Routes)

**Purpose:** Optimize for web - sessions, detailed data, analytics

```typescript
// frontend/pages/api/persons.ts

export default async function handler(req, res) {
  // Check authentication (via session)
  const session = getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  if (req.method === 'GET') {
    // Get all persons with full details
    const persons = await backend.get('/persons', {
      headers: { 'Authorization': `Bearer ${process.env.BACKEND_KEY}` }
    })
    
    // Add web-specific fields
    const enriched = persons.map(p => ({
      ...p,
      isVerified: p.confidence > 0.8,
      status: p.verified_by ? 'verified' : 'pending',
      editLink: `/admin/persons/${p.id}/edit`,
    }))
    
    return res.json(enriched)
  }
}
```

---

## Questions for the Board

**For Contrarian:**
- What breaks if we use single backend?
- What's the worst mobile offline failure?

**For Expansionist:**
- If mobile works perfectly offline, what can we do?
- What adjacent markets open up?

**For Principals:**
- Does single backend violate "offline-first" principle?

**For Researcher:**
- Do similar products use BFFs?
- When do they add them?

**For User:**
- Would you rather have 1 backend (compromised) or 2 BFFs (optimized)?

**For Judge:**
- Start simple and split later? Or split from the start?

---

## Recommendation

**OPTION A (Start Simple, Plan to Scale)**

- **Now:** Single Python backend serving both frontends
- **Later:** Add BFFs when you hit pain points
- **Defer complexity** until needed

**Why:**
1. Fastest to market (MVP)
2. Learn real user needs first
3. Add BFFs when you have data
4. Start with one backend (Principle #1)

**But:**
- Plan the architecture NOW (know how BFFs will fit)
- Write backend API to be "multi-client aware" (can shape responses)
- Document what data each frontend really needs

---

## Decision Template

Copy this and run through board:

```markdown
# Proposal: Single Backend vs BFFs

## Option Chosen: Single Backend (for now)

## Timeline to Revisit:
- Month 3: Evaluate if mobile offline works
- Month 6: Add BFFs if needed

## Conditions to Add BFFs:
- Mobile can't sync effectively offline
- Web needs data compression
- Performance degrades

## Next Gate:
Month 3 retrospective - check mobile offline experience
```

---

## See Also

- [AGENTIC_GOVERNANCE.md](AGENTIC_GOVERNANCE.md) — How to make this decision
- [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) — Backend practices
- [application/README.md](application/README.md) — Current architecture
