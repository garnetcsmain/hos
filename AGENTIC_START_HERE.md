# 🤖 HOS Agentic Project — START HERE

This is an **AI-first, agent-driven humanitarian operations platform**.

## The Vision

HOS is built by a team of specialized AI agents that make decisions together:
- **🔴 Contrarian** finds fatal flaws
- **🟢 Expansionist** finds biggest upside  
- **🧠 Principals** works with pure logic
- **📊 Researcher** pulls real market data
- **👤 User** role-plays as the customer
- **🏛️ Judge** synthesizes and decides

Plus operational agents (CTO, DEV, DEVOPS, QA, COO, Product) that execute the strategy.

## Read This First (In Order)

1. **[AGENTIC_SYSTEM.md](AGENTIC_SYSTEM.md)** ← Start here (10 min read)
   - How the agentic system works
   - Decision workflow
   - Example of proposing a feature

2. **[AGENTIC_ROLES.md](AGENTIC_ROLES.md)** (20 min read)
   - What each agent does
   - Their temperament & approach
   - Decision framework for each role

3. **[AGENTIC_GOVERNANCE.md](AGENTIC_GOVERNANCE.md)** (30 min read)
   - How decisions are made
   - Conflict resolution
   - Logging & transparency
   - Escalation to humans

4. **[STRUCTURE_AGENTIC.md](STRUCTURE_AGENTIC.md)** (10 min read)
   - Where everything lives
   - How the directory structure reflects agents
   - File organization

## Quick Reference

### The Agentic Board

```
     📊 RESEARCHER
         ↑
    ┌────┼────┐
    │    │    │
🔴 CONTRARIAN  🟢 EXPANSIONIST
    │    │    │
    └────┼────┘
         ↓
     🧠 PRINCIPALS

         🏛️ JUDGE ← Synthesizes & Decides

         👤 USER (Reviews any decision)
```

### The Decision Cycle

```
1. PROPOSE
   ↓
2. BOARD REVIEWS (5 agents in parallel)
   ├─ Contrarian: "Here's what breaks"
   ├─ Expansionist: "Here's the 10x opportunity"
   ├─ Principals: "Does this fit our values?"
   ├─ Researcher: "Here's what data says"
   └─ User: "Would I use this?"
   ↓
3. JUDGE DECIDES (🟢 GREEN | 🟡 RESHAPE | 🔴 KILL)
   ↓
4. IF GREEN: EXECUTE
   ├─ CTO: Architecture
   ├─ DEV: Implementation
   ├─ DEVOPS: Infrastructure
   ├─ QA: Testing
   └─ COO: Timeline
   ↓
5. GATES (25%, 75% done) → Continue/Reshape/Kill?
   ↓
6. POST-DECISION REVIEW (Did it work?)
```

### Key Documents

| File | What It Is |
|------|-----------|
| **AGENTIC_SYSTEM.md** | How the system works (executive summary) |
| **AGENTIC_ROLES.md** | Detailed role descriptions & responsibilities |
| **AGENTIC_GOVERNANCE.md** | Decision processes, policies, governance |
| **STRUCTURE_AGENTIC.md** | Directory structure & file organization |
| **Humanitarian Operations System.md** | Product vision & architecture |
| **AGENTS.md** | Engineering & security practices |

### Key Directories

```
hos/
├── agents/                    # Agentic organization (core)
│   ├── board/                # Decision-making board agents
│   ├── ops/                  # Operational agents (CTO, DEV, etc.)
│   ├── prompts/              # LLM prompts for each role
│   ├── governance/           # Policies & decision frameworks
│   └── workflows/            # How agents coordinate
│
├── application/               # Product code
│   ├── backend/              # Python/FastAPI
│   ├── frontend/             # Next.js/TypeScript
│   └── database/             # PostgreSQL + PostGIS
│
├── docs/                      # Documentation & decision log
│   ├── decision-log/         # ← Every decision logged here
│   └── architecture/         # Design docs
│
└── infrastructure/            # Deployment & ops
```

## The First Feature Proposal

Let's say you want to propose a feature. Here's how it goes:

### Step 1: Write Proposal
```yaml
# docs/decision-log/2026-MM-DD-feature-name/proposal.yaml

decision_id: "HOS-2026-001"
title: "Add AI-Assisted Person Matching"
proposer: "Product Agent"

summary: "ML-based matching to improve accuracy from 60% to 85%"

context:
  problem: "Manual matching is slow; many missed reunifications"
  user_impact: "Families find loved ones faster"

scope:
  in:
    - ML model training
    - Vector embeddings
    - Real-time scoring
  out:
    - Photo-based matching (v2)

success_criteria:
  - Match accuracy ≥ 85%
  - False positives < 10%
  - Inference < 500ms

risks:
  - Model bias (same-region names)
  - Data quality issues
  - Explainability to families
```

### Step 2: Board Reviews
Each agent independently analyzes:

```
🔴 Contrarian: "Model might over-match people from same region"
🟢 Expansionist: "Could expand to cross-border searches later"
🧠 Principals: "Aligns with 'Information before interfaces'"
📊 Researcher: "5000 historical matches show demand"
👤 User: "Would save my family time looking"
```

### Step 3: Judge Decides
```yaml
decision: "GREEN_LIGHT"
conditions:
  - Monthly model retraining required
  - Bias audit every quarter
  - Explainability: show why we matched
next_gate: "After 2 weeks in production"
```

### Step 4: Execute
- DEV starts coding
- DEVOPS sets up infrastructure
- QA writes tests
- COO tracks timeline

### Step 5: Gates
- Week 2: Is accuracy on track? Kill/continue?
- Week 4: Is team on schedule? Kill/continue?

### Step 6: Learn
- Launch review: Did it work?
- What did we learn for v2?

## How to Use This Repo

### "I want to understand how we make decisions"
→ Read: **AGENTIC_SYSTEM.md** (10 min)

### "I want to see an example decision"
→ Look in: `docs/decision-log/` (once there are decisions)

### "I want to propose a new feature"
→ Follow: Template in **AGENTIC_GOVERNANCE.md**

### "I'm implementing a feature"
→ Code goes in: `application/backend/` or `application/frontend/`

### "I want to understand a specific agent's role"
→ Read: **AGENTIC_ROLES.md** → find agent section

## Guiding Principles

1. **Transparency** — Every decision is logged with full reasoning
2. **Specialization** — Each agent has clear authority in their domain
3. **No Consensus** — Agents don't have to agree; differences are valuable
4. **Reversible** — Any decision can be revisited if facts change
5. **Human-Safe** — Critical decisions require human approval
6. **Auditable** — Full decision trail for compliance & learning

## Next Steps

1. **Read** [AGENTIC_SYSTEM.md](AGENTIC_SYSTEM.md) (the quick version)
2. **Explore** `agents/prompts/board/` to see how agents think
3. **Pick a feature** to propose
4. **Write a proposal** following the template
5. **Run it through the board** (can simulate first)
6. **Learn from what each agent finds**

---

## FAQ

**Q: Isn't this just using ChatGPT to make decisions?**
A: No. This is a structured multi-agent system where agents have specific roles, tools, and decision frameworks. Each agent brings a different lens.

**Q: Who is in charge?**
A: The Judge. But Judge reads all signals from 5 other agents before deciding.

**Q: What if agents are wrong?**
A: We learn from it. After every decision, we review outcomes and recalibrate.

**Q: Can humans override the agents?**
A: Yes. For critical decisions (launching to real disasters, major pivots), humans must approve.

**Q: Is this really how it will work?**
A: Yes. This is the actual system that will govern HOS development. Proposals go through this board. Decisions are logged. Every design decision is made by agents with full reasoning captured.

---

## Document Map

```
AGENTIC_START_HERE.md (you are here)
  ↓
AGENTIC_SYSTEM.md (how it works)
  ├─→ AGENTIC_ROLES.md (what each agent does)
  ├─→ AGENTIC_GOVERNANCE.md (how decisions are made)
  └─→ STRUCTURE_AGENTIC.md (where things live)
  
Humanitarian Operations System.md (product vision)
AGENTS.md (engineering practices)
README.md (project overview)
```

---

Welcome to HOS. The agents are ready to build.
