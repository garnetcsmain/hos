# 🤔 DECISION PROPOSAL: Single Frontend or Two?

**Status:** TEMPLATE (For Board Review)

This is a structural decision that should go through the Agentic Board.

---

## The Question

**Should we have:**
- **Option A:** One codebase (React Native + React Native Web)
- **Option B:** Two codebases (Next.js for web + React Native for mobile)

---

## Context

### Current Proposal (Option B)
```
frontend/                    (Next.js)
  ├── pages/                 Web-only features
  ├── components/
  └── services/

mobile/                      (React Native)
  └── app/                   Native iOS/Android
```

**Problem:** Code duplication, separate teams, sync overhead

---

## Option A: React Native + React Native Web (Consolidated)

### Structure
```
frontend/                    (React Native + Web)
  ├── src/
  │   ├── screens/          Shared screen components
  │   ├── components/       Shared UI components
  │   ├── services/         Shared API/logic
  │   ├── types/
  │   └── utils/
  ├── web/                  Web-specific (Next.js adapter)
  │   ├── pages/
  │   ├── public/
  │   └── next.config.js
  └── mobile/               Mobile-specific
      ├── ios/
      ├── android/
      └── app.json

shared/                      (Logic used by both)
  ├── services/             API clients
  ├── types/                TypeScript types
  ├── utils/                Helpers
  └── hooks/                Custom hooks
```

### Pros ✅
- **Single codebase** — One version of truth
- **Shared logic** — API calls, validation, state management in one place
- **Consistent UX** — Same components, same behavior everywhere
- **Faster development** — One team, no sync overhead
- **Code reuse** — 70-80% of code shared between web & mobile
- **Offline-first** — Build once, works offline on web & mobile
- **One test suite** — Test logic once

### Cons ❌
- **Learning curve** — React Native Web is less mature than Next.js
- **Performance** — Web performance might not be as optimized
- **Web libraries** — Some npm packages don't work on React Native
- **Platform-specific** — Need `.web.js` and `.native.js` files sometimes
- **Community** — Smaller community than pure Next.js/React Native

### Tech Stack
```yaml
Core:
  - React Native 0.73+
  - React Native Web 0.19+
  - Expo (for easier setup)
  - TypeScript

Web:
  - Next.js 14+ (optional, for SSR/SSG)
  - or Vite + React Router

Mobile:
  - EAS Build (Expo's build service)
  - or Xcode/Android Studio

Shared:
  - TanStack Query (data fetching)
  - Zustand (state management)
  - React Hook Form (forms)
  - Axios (HTTP)

Native Modules (Mobile):
  - react-native-geolocation
  - react-native-camera
  - react-native-maps

Web APIs (Web):
  - localStorage
  - Service workers
  - Geolocation API
  - Camera API
```

---

## Option B: Separate Codebases (Current)

### Structure
```
frontend/          (Next.js)
  ├── pages/
  ├── components/
  └── services/

mobile/            (React Native)
  └── app/
```

### Pros ✅
- **Best-of-breed tools** — Next.js for web, React Native for mobile
- **Optimized performance** — Each platform gets perfect optimization
- **Mature ecosystem** — Both are very mature
- **Easier hiring** — Developers know one or the other
- **Platform-specific features** — Easier to implement native features

### Cons ❌
- **Code duplication** — API logic, validation, types duplicated
- **Sync overhead** — Changes need to happen in both places
- **Two teams** — Need separate web & mobile developers
- **Inconsistent UX** — Different implementations, different bugs
- **Maintenance burden** — Double the testing, double the bugs
- **Slower feature shipping** — Need to implement twice

---

## The Real Question

### What's the **critical path** for HOS?

**For a humanitarian operations platform:**

1. **Mobile is CRITICAL**
   - Families & volunteers mostly on phones
   - Offline capability essential (internet unreliable in disasters)
   - Geolocation needed
   - Photo capture needed

2. **Web is IMPORTANT**
   - Admin dashboards
   - Coordinator view
   - Data entry (bulk imports)
   - Reports & analytics

3. **Offline-first is CRITICAL**
   - Sync when connectivity returns
   - Works in degraded networks

### Which approach enables offline-first better?

**React Native + Web:** Easier — build once, works offline on both
**Separate:** Harder — implement offline twice, keep in sync

---

## Recommendation from Different Lenses

### 🔴 Contrarian Says
"Separate codebases = maintenance nightmare. You'll have bugs fixed in one and not the other. You'll have features in web that don't exist on mobile. You'll split dev resources. This is a classic premature optimization."

### 🟢 Expansionist Says
"One codebase means we can ship faster, iterate faster, pivot faster. If we change the core flow, it takes one week instead of two. At scale, that's the difference between winning and losing."

### 🧠 Principals Says
"HOS principle #6 is 'Build once, deploy everywhere.' Separate codebases violates that. One codebase aligns with our values."

### 📊 Researcher Says
"React Native Web is used by: Shopify, Discord, Twitter (internal tools), Uber. It's production-ready. Adoption is growing, community is active."

### 👤 User Says
"As a volunteer with a phone, I need the app to work offline. As a coordinator, I need a dashboard. If they're built separately, one will work better than the other. That sucks."

---

## My Recommendation

**CONSOLIDATE TO REACT NATIVE + WEB**

### Why
1. HOS is **mobile-first** (families & volunteers on phones)
2. **Offline-first** is critical (unreliable connectivity)
3. **Code reuse** saves time (ship faster)
4. **Consistent UX** across platforms (one user experience)
5. **Aligns with principles** (build once, deploy everywhere)

### Implementation Path
```
Phase 1: MVP (First 6 weeks)
  - Single React Native + Web codebase
  - Deploy web to vercel.com
  - Deploy mobile via EAS (Expo)
  - Shared logic (API, validation, types)

Phase 2: Optimization (Later)
  - Performance tweaks per platform
  - Native modules where needed (camera, geolocation)
  - Keep shared logic, platform-specific UI

Phase 3: Scale (When needed)
  - If web becomes different product → separate
  - But start unified
```

### Stack
```yaml
Core:
  - React Native + Expo (mobile & web foundation)
  - TypeScript (shared types)
  - React Router (web routing)
  - Zustand (state)
  - TanStack Query (data)

Web:
  - Vite + React (lighter than Next.js)
  - or Next.js if we need SSR later

Mobile:
  - EAS Build (CI/CD)
  - or bare React Native if needs are complex

Shared:
  - services/ (API calls)
  - types/ (TypeScript interfaces)
  - utils/ (helpers)
  - hooks/ (custom hooks)
```

---

## Alternative: Keep Next.js + React Native Web

If we want Next.js specifically (for SSR/SSG), we can:
```
frontend/ (Next.js)
  ├── pages/
  ├── components/
  └── public/

shared/   (Shared logic)
  ├── services/
  ├── components/
  └── types/

mobile/   (React Native)
  └── Imports from ../shared/
```

**Pros:** Best of both worlds (Next.js + React Native)
**Cons:** More complex setup, harder for one developer to work on both

---

## Decision Matrix

| Factor | Option A | Option B |
|--------|----------|----------|
| **Code Reuse** | 80% | 20% |
| **Team Size Needed** | 1-2 devs | 2-4 devs |
| **Time to MVP** | 6 weeks | 8-10 weeks |
| **Offline-first** | Easy | Hard |
| **Maintenance** | Low | High |
| **Performance** | Good | Best |
| **Hiring** | Harder | Easier |
| **Community** | Growing | Huge |

---

## Questions for the Board

**For Contrarian:**
- What breaks if we use React Native Web? (be specific)
- What's the worst-case scenario?

**For Expansionist:**
- What could we do faster with one codebase?
- Could we enter adjacent markets faster?

**For Principals:**
- "Build once, deploy everywhere" — which approach better fits this?

**For Researcher:**
- How production-ready is React Native Web in 2026?
- Who's using it successfully?

**For User:**
- Would you rather have consistent UX on one team's code, or best-of-breed tools on two separate teams?

**For Judge:**
- What's the right call for HOS's mission?

---

## Proposal Format

If you want the full Board to review this, create:

```bash
# Copy to docs/decision-log/ and update:
cp docs/decision-log/TEMPLATE_FRONTEND_CONSOLIDATION.md \
   docs/decision-log/2026-MM-DD-frontend-architecture/proposal.md

# Run board review:
hos board-review docs/decision-log/2026-MM-DD-frontend-architecture/proposal.yaml
```

---

## My Gut Check

For HOS, I'd recommend **React Native + Web** because:
1. Mobile is the primary use case
2. Offline-first is critical
3. Code reuse saves precious dev time
4. Aligns with stated principles
5. One consistent product vs. two divergent ones

But **this is a decision for the Board**, not me to make unilaterally.

Do you want me to:
- [ ] Consolidate structure to single React Native + Web?
- [ ] Keep two separate (Next.js + React Native)?
- [ ] Submit as formal Board proposal for review?
