# HOS Agentic Project Structure

This is an **AI-first, agent-driven project**. Directory structure reflects agentic decision-making and execution.

---

## Top-Level Structure

```
hos/
├── agents/                    # Agentic organization (core)
├── application/               # Product code (what we build)
├── infrastructure/            # Deployment & ops
├── docs/                      # Documentation & decision log
└── [config files]             # Governance, roles, prompts
```

---

## 🤖 Agents Directory (Heart of the Project)

```
agents/
├── board/                     # Decision-making layer
│   ├── contrarian/           # Finds fatal flaws
│   │   ├── prompt.md
│   │   ├── system_instructions.yaml
│   │   └── examples/
│   ├── expansionist/          # Finds biggest upside
│   │   ├── prompt.md
│   │   ├── system_instructions.yaml
│   │   └── examples/
│   ├── principals/            # Works with pure logic
│   │   ├── prompt.md
│   │   ├── system_instructions.yaml
│   │   └── examples/
│   ├── researcher/            # Pulls real data
│   │   ├── prompt.md
│   │   ├── system_instructions.yaml
│   │   ├── search_strategies.yaml
│   │   └── data_sources/
│   ├── user/                  # Role-plays as user
│   │   ├── prompt.md
│   │   ├── personas/
│   │   │   ├── missing_family.md
│   │   │   ├── shelter_volunteer.md
│   │   │   └── responder.md
│   │   └── scenarios/
│   └── judge/                 # Makes final decision
│       ├── decision_framework.yaml
│       ├── prompt.md
│       ├── templates/
│       │   ├── decision_output.yaml
│       │   └── gate_criteria.yaml
│       └── historical_decisions/
│
├── ops/                       # Operational agents (execution)
│   ├── cto/                   # Chief Technology Officer
│   │   ├── system_instructions.yaml
│   │   ├── responsibilities.md
│   │   ├── decision_authority.yaml
│   │   └── templates/
│   │       ├── architecture_review.md
│   │       └── tech_roadmap.md
│   ├── coo/                   # Chief Operations Officer
│   │   ├── system_instructions.yaml
│   │   ├── responsibilities.md
│   │   ├── timeline_tracker.yaml
│   │   └── templates/
│   │       ├── milestone_plan.md
│   │       └── risk_register.yaml
│   ├── dev/                   # Development Lead
│   │   ├── system_instructions.yaml
│   │   ├── code_standards.md
│   │   ├── review_checklist.yaml
│   │   └── templates/
│   │       ├── feature_spec.md
│   │       └── code_review.md
│   ├── devops/                # Infrastructure & Deployment
│   │   ├── system_instructions.yaml
│   │   ├── deployment_strategy.yaml
│   │   ├── monitoring.yaml
│   │   └── templates/
│   │       ├── infrastructure_plan.md
│   │       └── incident_response.md
│   ├── qa/                    # Quality Assurance
│   │   ├── system_instructions.yaml
│   │   ├── testing_strategy.yaml
│   │   ├── test_templates/
│   │   └── bug_severity.yaml
│   └── product/               # Product & Strategy
│       ├── system_instructions.yaml
│       ├── roadmap.yaml
│       ├── user_research/
│       └── templates/
│           ├── feature_brief.md
│           └── success_metrics.md
│
├── tools/                     # Shared tools & utilities
│   ├── code/                  # Code analysis & generation
│   │   ├── analyzer.py
│   │   ├── generator.py
│   │   └── linter.py
│   ├── analysis/              # Data & trend analysis
│   │   ├── market_analyzer.py
│   │   ├── competitive_analyzer.py
│   │   └── metrics.py
│   ├── research/              # Research & data gathering
│   │   ├── web_searcher.py
│   │   ├── data_extractor.py
│   │   └── sources.yaml
│   └── decision/              # Decision support
│       ├── gate_checker.py
│       ├── risk_assessor.py
│       └── decision_logger.py
│
├── workflows/                 # Agent workflows & coordination
│   ├── planning/              # Planning workflows
│   │   ├── feature_intake.yaml
│   │   ├── sprint_planning.yaml
│   │   └── roadmap_creation.yaml
│   ├── development/           # Development workflows
│   │   ├── feature_development.yaml
│   │   ├── code_review.yaml
│   │   └── deployment_flow.yaml
│   ├── review/                # Review & decision workflows
│   │   ├── board_review.yaml
│   │   ├── gate_review.yaml
│   │   └── post_mortem.yaml
│   └── release/               # Release workflows
│       ├── release_planning.yaml
│       ├── release_testing.yaml
│       └── deployment.yaml
│
├── prompts/                   # Prompt templates & examples
│   ├── board/
│   │   ├── contrarian_base.md
│   │   ├── expansionist_base.md
│   │   ├── principals_base.md
│   │   ├── researcher_base.md
│   │   ├── user_base.md
│   │   └── judge_base.md
│   ├── ops/
│   │   ├── cto_base.md
│   │   ├── coo_base.md
│   │   ├── dev_base.md
│   │   ├── devops_base.md
│   │   ├── qa_base.md
│   │   └── product_base.md
│   └── system/
│       ├── shared_instructions.md
│       ├── communication_protocol.md
│       └── escalation_rules.md
│
└── governance/                # Policies & frameworks
    ├── policies/
    │   ├── decision_policy.yaml
    │   ├── escalation_policy.yaml
    │   ├── conflict_resolution.yaml
    │   └── human_override.yaml
    ├── frameworks/
    │   ├── decision_framework.yaml
    │   ├── risk_framework.yaml
    │   ├── quality_framework.yaml
    │   └── security_framework.yaml
    └── decisions/             # Historical decision log
        ├── 2026-06/
        │   ├── HOS-001-ai-matching/
        │   │   ├── proposal.yaml
        │   │   ├── board_outputs/
        │   │   ├── judge_decision.yaml
        │   │   ├── execution_gates.yaml
        │   │   └── post_decision_review.yaml
        │   └── ...
        └── archive/
```

---

## 📦 Application Directory (What We Build)

The actual product code, organized by the architecture, not by agent roles.

```
application/
├── backend/                   # Python/FastAPI
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── person.py
│   │   ├── organization.py
│   │   ├── match.py
│   │   └── event.py
│   ├── schemas/              # Pydantic request/response
│   │   ├── person.py
│   │   └── match.py
│   ├── services/             # Business logic
│   │   ├── person_service.py
│   │   ├── match_service.py
│   │   └── notification_service.py
│   ├── routes/               # API endpoints
│   │   ├── persons.py
│   │   ├── matches.py
│   │   └── health.py
│   ├── middleware/           # Request handling
│   │   ├── auth.py
│   │   └── logging.py
│   ├── main.py              # App entry point
│   ├── config.py            # Settings
│   ├── requirements.txt
│   └── tests/               # Test suite
│       ├── unit/
│       └── integration/
│
├── frontend/                 # Next.js/TypeScript
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tests/
│
├── mobile/                   # React Native (v2)
│   └── app/
│
└── database/                 # PostgreSQL + PostGIS + pgvector
    ├── schemas/
    ├── migrations/
    └── seeds/
```

**Key:** Agents make decisions about what to build (`agents/`), code is in `application/`.

---

## 🏗️ Infrastructure Directory

Deployment, monitoring, and operations.

```
infrastructure/
├── docker/                   # Containerization
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── kubernetes/               # K8s orchestration
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
└── terraform/                # Infrastructure as Code
    ├── main.tf
    ├── database.tf
    └── variables.tf
```

---

## 📚 Documentation Directory

All user-facing and archival documentation.

```
docs/
├── architecture/             # System design
│   ├── data-model.md
│   ├── api-design.md
│   ├── ai-matching.md
│   └── security.md
├── workflows/                # How to do things
│   ├── getting-started.md
│   ├── running-board-review.md
│   ├── feature-development.md
│   └── deployment.md
├── decision-log/             # Decision archive (critical)
│   ├── 2026-06-27-HOS-001-ai-matching/
│   │   ├── proposal.yaml
│   │   ├── board_outputs/
│   │   ├── judge_decision.yaml
│   │   └── execution_gates.yaml
│   └── archive/
└── incident-responses/       # Post-mortems & case studies
    └── venezuela-2026.md
```

---

## 🔑 Key Files (Top Level)

| File | Purpose |
|------|---------|
| **AGENTIC_ROLES.md** | What each agent does & how they work |
| **AGENTIC_GOVERNANCE.md** | How decisions are made, conflicts resolved |
| **Humanitarian Operations System.md** | Product vision & thesis |
| **AGENTS.md** | Engineering & security practices |
| **README.md** | Project overview |

---

## Workflow: A Feature Through the System

### 1️⃣ Idea → Proposal
**Product Agent** writes feature brief

→ Stored in: `docs/decision-log/2026-MM-DD-feature-name/`

### 2️⃣ Board Review
Each of 6 agents reviews independently

→ Outputs stored in: `docs/decision-log/2026-MM-DD-feature-name/board/`

### 3️⃣ Judge Decides
Judge synthesizes, makes decision (GREEN/RESHAPE/KILL)

→ Stored in: `docs/decision-log/2026-MM-DD-feature-name/judge_decision.yaml`

### 4️⃣ If GREEN: Execution
**CTO** → Architecture plan
**Dev** → Implementation plan
**DevOps** → Infrastructure plan
**QA** → Test strategy
**COO** → Timeline & milestones

→ Code in: `application/backend/`, `application/frontend/`, etc.

### 5️⃣ Gates & Monitoring
Re-evaluate at 25%, 75% complete

→ Tracked in: `docs/decision-log/2026-MM-DD-feature-name/execution_gates.yaml`

### 6️⃣ Post-Decision Review
Was it successful? What did we learn?

→ Stored in: `docs/decision-log/2026-MM-DD-feature-name/post_decision_review.yaml`

---

## How to Navigate

### "I want to understand the product vision"
→ Read: `Humanitarian Operations System.md` → `README.md`

### "I need to understand agentic roles"
→ Read: `AGENTIC_ROLES.md` → `AGENTIC_GOVERNANCE.md`

### "I want to see how we made decision X"
→ Look in: `docs/decision-log/` → find decision ID

### "I'm implementing a feature"
→ Code goes in: `application/` based on module (backend/frontend/database)

### "I need to propose a new feature"
→ Follow: `agents/governance/policies/decision_policy.yaml` → write proposal → submit for board review

### "I want to improve an agent's prompts"
→ Edit: `agents/prompts/` → re-test on past decisions

---

## Commands (Once Tooling is Built)

```bash
# Run a board review
hos run-board-review docs/decision-log/YYYY-MM-DD-feature-name/proposal.yaml

# Run a specific agent
hos run-agent contrarian --proposal proposal.yaml

# Check a decision gate
hos check-gate docs/decision-log/YYYY-MM-DD-feature-name/

# View decision history
hos decision-history --category strategic --status GREEN

# Re-calibrate agents
hos recalibrate-agents docs/decision-log/archive/

# Deploy feature
hos deploy --feature HOS-001 --target staging
```

---

## Principles

1. **Agent decisions** in `agents/`, **product code** in `application/`
2. **Every decision logged** in `docs/decision-log/`
3. **Agents specialize** — no overlapping authority
4. **Transparency** — all reasoning visible
5. **Reversible** — any decision can be revisited if facts change
6. **Human-safe** — critical decisions require human approval

