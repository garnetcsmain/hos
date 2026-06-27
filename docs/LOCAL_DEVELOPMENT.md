# Local Development Setup

## Prerequisites

- Node.js 18+
- Python 3.11+
- Vercel CLI: `npm i -g vercel`
- Supabase CLI: `npm i -g supabase`

---

## First-Time Setup

### 1. Clone the repo

```bash
git clone https://github.com/garnetcsmain/hos.git
cd hos
```

### 2. Link to Vercel project

```bash
vercel link
# Select: garnetcs → hos
```

### 3. Pull environment variables (staging)

Never use production locally. Always pull from the staging/preview environment:

```bash
# Frontend
vercel env pull frontend/.env.local --environment=preview

# Backend
vercel env pull backend/.env --environment=preview
```

This gives you all staging env vars without anyone sharing secrets manually.

> **Note:** Sensitive vars (marked Sensitive in Vercel) return empty strings via pull.
> Get those from the team lead via 1Password or a secure channel — never Slack plain text.

### 4. Install dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

---

## Running Locally

### Backend (FastAPI)

```bash
cd backend
python -m uvicorn app.main:app --reload
# http://localhost:8000
```

### Frontend (Next.js)

```bash
cd frontend
npm run dev
# http://localhost:3000
```

### Mobile (Expo)

```bash
cd mobile
npm start
# Scan QR with Expo Go app
```

---

## Environment Files

| File | Purpose | Committed? |
|------|---------|------------|
| `frontend/.env.local` | Frontend local secrets | No (.gitignore) |
| `backend/.env` | Backend local secrets | No (.gitignore) |
| `frontend/.env.example` | Template with placeholders | Yes |
| `backend/.env.example` | Template with placeholders | Yes |

**Rule:** Never commit `.env` or `.env.local`. The `.example` files are the only templates committed to git.

---

## Environments

| Environment | Supabase | Vercel | Purpose |
|-------------|----------|--------|---------|
| **Local** | Staging DB | Preview vars | Developer machines |
| **Staging** | Staging DB | Preview deploys | QA, integration testing |
| **Production** | Production DB | Production | Live users |

Local dev always connects to **staging Supabase**, never production.

---

## Getting Access

Ask the team lead to:
1. Add you to the Vercel team: `vercel.com/garnetcs`
2. Add you to the Supabase org: `supabase.com` (HOS project)
3. Share sensitive vars via 1Password

Once added, `vercel env pull` handles the rest.

---

## See Also

- [docs/BEST_PRACTICES.md](BEST_PRACTICES.md) — Coding standards
- [docs/ARCHITECTURE_DECISION_BFF.md](ARCHITECTURE_DECISION_BFF.md) — Backend architecture
- [backend/.env.example](../backend/.env.example) — Backend env template
