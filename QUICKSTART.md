# Quick Start Guide

Get HOS running locally in 5 minutes.

## Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Git

## Setup

```bash
# 1. Run automated setup
./scripts/setup-local.sh

# 2. Start services (in a new terminal)
docker-compose -f config/dev/docker-compose.yml up

# 3. Start backend (in another terminal)
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload

# 4. Start frontend (in another terminal)
cd frontend
npm run dev
```

## Access

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **Database:** `postgresql://hos_user:hos_password@localhost:5432/hos_dev`

## First Steps

### Run Tests
```bash
cd backend
pytest
```

### Initialize Database
```bash
cd backend
alembic upgrade head
```

### Check Code Quality
```bash
cd backend
black . && isort .
```

## Project Layout

| Directory | Purpose |
|-----------|---------|
| `backend/` | Python FastAPI backend |
| `frontend/` | Next.js TypeScript frontend |
| `database/` | PostgreSQL schemas & migrations |
| `docs/` | Architecture & guides |
| `config/` | Environment configs |
| `infrastructure/` | Docker, K8s, Terraform |
| `scripts/` | Setup & utility scripts |

## Documentation

- **[STRUCTURE.md](STRUCTURE.md)** — Detailed folder structure guide
- **[Humanitarian Operations System.md](Humanitarian%20Operations%20System.md)** — Full thesis & vision
- **[AGENTS.md](AGENTS.md)** — Engineering practices
- **[README.md](README.md)** — Project overview

## Common Tasks

### Add a Python dependency
```bash
cd backend
pip install <package>
pip freeze > requirements.txt
```

### Add a Node dependency
```bash
cd frontend
npm install <package>
```

### Create a database migration
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Format code
```bash
cd backend && black . && isort .
cd frontend && npm run format
```

## Troubleshooting

### Database connection failed
```bash
# Check if Docker containers are running
docker-compose -f config/dev/docker-compose.yml ps

# Check logs
docker-compose -f config/dev/docker-compose.yml logs postgres
```

### Python dependencies issues
```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Port already in use
```bash
# Kill process on port (e.g., 8000)
lsof -ti:8000 | xargs kill -9
```

## Next Steps

1. Read [STRUCTURE.md](STRUCTURE.md) to understand the architecture
2. Check [AGENTS.md](AGENTS.md) for engineering practices
3. Review the API docs at http://localhost:8000/api/docs
4. Start building features!

---

**Need help?** See [Humanitarian Operations System.md](Humanitarian%20Operations%20System.md) for the full vision and architecture.
