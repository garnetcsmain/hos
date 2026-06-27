# Frontend Architecture Decision

**Date:** 2026-06-27  
**Decision:** Keep separate codebases (Next.js web + React Native mobile)  
**Status:** Active (can be revisited)

---

## Architecture

### Web Frontend (Next.js)
```
frontend/                    
├── src/
│   ├── pages/              Server-side rendered pages
│   ├── components/         React components
│   ├── hooks/              Custom hooks
│   ├── services/           API client
│   ├── types/              TypeScript types
│   └── styles/             CSS/Tailwind
├── public/                 Static assets
├── package.json
└── next.config.ts
```

**Stack:**
- Next.js 14+ (App Router, SSR, SSG)
- TypeScript
- TailwindCSS
- React Hook Form
- Axios (HTTP client)
- Zustand (state management)

**Purpose:**
- Web dashboards (coordinators, admins)
- Data entry forms
- Analytics & reports
- Desktop-optimized UX

### Mobile Frontend (React Native)
```
mobile/                    
├── app/
│   ├── screens/           Native screens
│   ├── components/        Reusable UI components
│   ├── services/          API client
│   ├── types/             TypeScript types
│   └── utils/             Helpers
├── app.json               Expo config
└── package.json
```

**Stack:**
- React Native 0.73+
- Expo (for development & deployment)
- TypeScript
- React Navigation (routing)
- Zustand (state management)
- Axios (HTTP client)

**Purpose:**
- Mobile-first experience (families, volunteers)
- Offline capability (critical for disasters)
- Native features (camera, geolocation, push notifications)
- iOS & Android

---

## Why Separate?

### Tradeoffs Accepted

| Aspect | Impact | Why It's OK |
|--------|--------|-----------|
| Code duplication | API logic duplicated | Can abstract shared utilities package later |
| Team coordination | Need sync between teams | Clear APIs & types minimize friction |
| Maintenance | Double the testing | Each platform gets optimized tooling |
| Deployment | Two CI/CD pipelines | No dependencies between them |
| Timeline | Takes longer | Better UX per platform is worth it |

### What This Enables

1. **Next.js advantages for web:**
   - Server-side rendering (better SEO, faster initial load)
   - Vercel hosting (simple, integrated)
   - API routes (can simplify backend calls)
   - Image optimization
   - Incremental Static Regeneration (ISR)

2. **React Native advantages for mobile:**
   - True native performance (iOS/Android)
   - Offline-first (critical for HOS)
   - Native APIs (camera, geolocation, sensors)
   - App store distribution (iOS/Android)
   - Push notifications (native)

3. **Clear separation of concerns:**
   - Web team optimizes dashboard UX
   - Mobile team optimizes field UX
   - Different design systems if needed
   - No compromises

---

## Shared Code (Minimal)

What we WILL share:
```
shared/                    (npm package or monorepo)
├── types/                 
│   ├── person.ts         Person type definition
│   ├── match.ts          Match type definition
│   └── ...
├── services/
│   └── api-config.ts     API URL, timeout defaults
├── utils/
│   ├── validators.ts     Form validation
│   ├── formatters.ts     Date, phone formatting
│   └── errors.ts         Error handling
└── hooks/
    └── useGeolocation.ts Shared hook
```

**NOT shared:**
- UI components (web & mobile have different designs)
- Styling (Next.js uses CSS-in-JS/Tailwind, React Native uses StyleSheet)
- Navigation (Next.js routing vs React Navigation)
- State management (can differ)

---

## API Contract

Both frontends talk to the same backend (Python/FastAPI).

**API Service (Shared):**
```typescript
// shared/services/api.ts
export const personService = {
  create: (data: CreatePersonDTO) => Promise<Person>,
  list: (filters: PersonFilters) => Promise<Person[]>,
  findMatches: (personId: string) => Promise<Match[]>,
}
```

**Web usage:**
```typescript
// frontend/src/services/person.ts
import { personService } from '@hos/shared'

export const getPerson = (id: string) => {
  return personService.list({ id })
}
```

**Mobile usage:**
```typescript
// mobile/app/services/person.ts
import { personService } from '@hos/shared'

export const searchPeople = (name: string) => {
  return personService.list({ name })
}
```

---

## Development Setup

### Web Development
```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
npm run deploy    # Deploy to Vercel
```

### Mobile Development
```bash
cd mobile
npm install
npm start         # Expo dev server
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run build     # EAS build
```

### Shared Types
```bash
# If using monorepo:
cd shared
npm publish       # Publish to npm

# Or, use workspace
npm install -w shared -w frontend -w mobile
```

---

## Deployment

### Web (Next.js)
- **Platform:** Vercel (recommended) or AWS
- **URL:** https://hos.vercel.app
- **Auto-deploy:** On merge to main
- **CDN:** Vercel Edge Network

### Mobile (React Native)
- **iOS:** App Store
- **Android:** Google Play
- **Build:** EAS Build (Expo service)
- **Distribution:** Over-the-air updates via EAS Updates

---

## When to Reconsider

This decision can be revisited if:

1. **Web becomes very different** — If web needs become 80%+ different, consolidate might not matter anyway
2. **Mobile doesn't happen** — If mobile takes 2+ years, keep web moving forward
3. **Team grows large** — Separate codebases need more coordination at scale
4. **Offline-first fails** — If offline isn't actually needed, consider consolidating
5. **Maintenance becomes painful** — If keeping types/services in sync is too hard

**Re-evaluation:** Quarterly during retrospectives

---

## Code Sharing Strategy

### Option 1: npm Package (Recommended for now)
```
hos-shared/                (separate package)
├── types/
├── services/
└── utils/

frontend/ (depends on hos-shared)
mobile/   (depends on hos-shared)
```

**Pros:** Clean separation, versioned, reusable
**Cons:** Extra CI/CD pipeline for shared package

### Option 2: Monorepo (Nx or Turborepo)
```
hos/
├── packages/shared
├── apps/frontend
└── apps/mobile
```

**Pros:** Single repo, shared versioning
**Cons:** More complex setup

### Option 3: Copy-paste (Not recommended)
**Pros:** No dependencies
**Cons:** Maintenance nightmare

---

## Type Safety

Even though code is separate, **types are shared & strict:**

```typescript
// shared/types/person.ts (single source of truth)
export interface Person {
  id: string
  name: string
  age?: number
  description: string
  lastSeen?: Location
  confidence: number
  createdAt: Date
  verifiedBy?: Organization
}

// Both frontend AND mobile import this
import { Person } from '@hos/shared/types'
```

This ensures:
- Web & mobile work with same data structures
- API changes propagate to both
- Type mismatches caught at compile time
- No "web got Person v1, mobile got v2" confusion

---

## Communication Between Teams

### Sync Point: Shared Types
- **Owned by:** Backend team + Data model owners
- **Updated:** When API changes
- **Versioned:** Semver in shared package
- **Breaking changes:** Coordinated deprecation

### Async Coordination
- **Slack channel:** #frontend-mobile-sync
- **Meeting:** Weekly 15min standup (if async breaks down)
- **Decision log:** Shared decisions in this repo

### API Contract Tests
- **Owned by:** Backend team
- **Run on:** Both frontends in CI
- **Goal:** Catch API mismatches early

---

## Success Metrics

After launch, measure:
- **Web performance:** LCP, FCP, CLS (Core Web Vitals)
- **Mobile performance:** App launch time, frame rate
- **User engagement:** Platform usage (% on web vs mobile)
- **Bug trends:** Are bugs in both or platform-specific?
- **Development velocity:** Feature shipping speed each platform

If web/mobile diverge in quality, may want to consolidate later.

---

## Risk & Mitigation

### Risk: Maintenance burden increases
**Mitigation:** Shared types + API contracts catch most issues early

### Risk: Web & mobile features diverge
**Mitigation:** Product roadmap is single; features ship to both or neither

### Risk: Team coordination overhead
**Mitigation:** Weekly sync, clear API contract, shared types

### Risk: Type mismatches between web & mobile
**Mitigation:** Single source of truth for types, CI tests

---

## Summary

✅ **Separate codebases** (Next.js web + React Native mobile)
✅ **Shared types** (TypeScript interfaces in single package)
✅ **Shared API client** (Axios + service layer)
✅ **Independent deployment** (Vercel for web, EAS for mobile)
✅ **Single product** (coordinated feature releases)

**Why this works:**
- Web & mobile have genuinely different UX needs
- Next.js is best for web (SSR, SEO, performance)
- React Native is best for mobile (offline, native APIs)
- Types keep them in sync
- Backend API is single source of truth

**Revisit if:** Development becomes unsustainable or needs fundamentally change
