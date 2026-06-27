# HOS Agentic System — How It Works

This document is the executive summary. Start here if you're new to how HOS operates.

---

## The Idea

HOS is built by AI agents, not humans. Different agents take different roles (CTO, Product, QA, etc.) and make decisions together. The structure prevents echo chambers, ensures robustness, and captures reasoning.

**This is not a chatbot that gives advice. This is a multi-agent decision-making system that executes strategy.**

---

## Two Layers

### Layer 1: The Agentic Board (Decision-Making)

Six specialized agents review every significant proposal:

| Agent | Role | Asks |
|-------|------|------|
| 🔴 **Contrarian** | Finds fatal flaws | "What breaks? Who gets hurt? What did we miss?" |
| 🟢 **Expansionist** | Maximizes upside | "What's the 10x outcome? What moat do we build?" |
| 🧠 **Principals** | Tests logic & values | "Does this violate our principles? Is it simple?" |
| 📊 **Researcher** | Grounds in data | "What do the numbers say? What do users want?" |
| 👤 **User** | Represents customer | "Would I use this? Does it solve my problem?" |
| 🏛️ **Judge** | Decides | "Green light? Reshape? Kill?" |

Each agent reviews **independently** (no groupthink). The Board doesn't vote or reach consensus — it surfaces tradeoffs. The Judge reads all signals and decides.

### Layer 2: Operational Agents (Execution)

Once a decision is made, operational agents execute:

| Agent | Title | Runs |
|-------|-------|------|
| 🏗️ **CTO** | Chief Technology Officer | Architecture, tech stack, scalability |
| 📋 **COO** | Chief Operations Officer | Timeline, resources, risk, milestones |
| 💻 **DEV** | Development Lead | Code, architecture, implementation |
| ⚙️ **DEVOPS** | Infrastructure | Deployment, monitoring, CI/CD |
| 🧪 **QA** | Quality Assurance | Testing, bug detection, performance |
| 🎯 **Product** | Product Lead | Roadmap, user research, metrics |

Operational agents execute day-to-day work. For major decisions, they escalate to the Board.

---

## Decision Workflow

### 1. Proposal
Someone (Product Agent, CTO, etc.) identifies an idea and writes a proposal.

**Template:** `agents/governance/templates/proposal.yaml`

**Example Questions:**
- What are we building?
- Why does it matter?
- What are the risks?
- How do we measure success?

### 2. Board Review (Parallel, No Communication)
Each of 6 agents reviews independently. They don't talk to each other (prevents groupthink).

**Timeline:** 1-7 days (depending on complexity)

**Each agent produces:**
- Findings (what they discovered)
- Recommendation (GREEN/RESHAPE/KILL)
- Confidence score

**Outputs saved in:** `docs/decision-log/[DECISION_ID]/board/`

### 3. Judge Synthesizes
Judge reads all 5 board outputs and decides.

**Decision:** 
- 🟢 **GREEN LIGHT** — Proceed as proposed
- 🟡 **RESHAPE** — Proceed with modifications
- 🔴 **KILL** — Don't do this

**Judge also sets:**
- Conditions for success
- Risk thresholds
- When to re-evaluate

### 4. If GREEN: Execution
Operational agents plan and execute.

**CTO** → Tech architecture
**Dev** → Implementation plan
**DEVOPS** → Infrastructure
**QA** → Test strategy
**COO** → Timeline & resources

**Code goes in:** `application/backend/`, `application/frontend/`, etc.

### 5. Gates (Mid-Project)
At 25% and 75% complete, re-evaluate:
- Is progress on track?
- Did assumptions hold?
- Should we continue, reshape, or kill?

**Decision:** Operational agents + Judge if escalation needed

### 6. Post-Decision Review
After launch, review actual outcomes vs. assumptions.

**Questions:**
- Did we hit targets?
- Did users like it?
- What did we learn?
- What's next?

**Output:** `docs/decision-log/[DECISION_ID]/post_decision_review.yaml`

---

## Key Principles

### 1. Transparency
Every decision is logged with full reasoning. You can audit why we did something.

### 2. Specialization
Each agent has clear authority in their domain. CTO decides tech, Product decides roadmap, etc.

### 3. No Consensus Required
Agents don't have to agree. The Board's job is to surface different perspectives, not hide them.

### 4. Reversible
Any decision can be revisited if facts change or assumptions prove wrong.

### 5. Human-Safe
For critical decisions (launching to real disaster, data breach, shutting down), humans approve.

### 6. Auditable
Full decision trail for compliance, learning, and transparency.

---

## File Organization

### Where Decisions Live
```
docs/decision-log/
├── 2026-06-27-HOS-001-ai-matching/
│   ├── proposal.yaml                 # Original idea
│   ├── board/                        # Each agent's analysis
│   │   ├── contrarian.md
│   │   ├── expansionist.md
│   │   ├── principals.md
│   │   ├── researcher.md
│   │   └── user.md
│   ├── judge_decision.yaml            # Judge's decision
│   ├── execution_gates.yaml           # Gates during execution
│   └── post_decision_review.yaml      # Did it work?
```

### Where Code Lives
```
application/
├── backend/                    # Python/FastAPI
├── frontend/                   # Next.js/TypeScript
├── database/                   # PostgreSQL
└── mobile/                     # React Native (later)
```

### Where Agent Configs Live
```
agents/
├── board/                      # Board agent configs & prompts
├── ops/                        # Operational agent configs
├── tools/                      # Shared utilities
├── workflows/                  # How agents work together
├── prompts/                    # LLM prompts for each agent
└── governance/                 # Policies & frameworks
```

---

## Example: Proposing a Feature

### Step 1: Write a Proposal
```bash
# Create decision directory
mkdir -p docs/decision-log/2026-MM-DD-new-feature/

# Write proposal (use template)
cat > docs/decision-log/2026-MM-DD-new-feature/proposal.yaml << 'EOF'
decision_id: "HOS-2026-XXX"
title: "Add Photo-Based Matching"
category: "strategic"
proposer: "Product Agent"

summary: "Allow families to upload photos of missing person for photo-based AI matching"

context:
  problem: "Name-based matching misses people if family doesn't know full name or has nickname"
  user_impact: "More families find loved ones; fewer false matches"

scope:
  in:
    - Photo upload interface
    - Photo-based ML model
    - Match ranking by photo similarity
  out:
    - Video support (v2)
    - Facial recognition across borders (legal risk)

resources:
  time_estimate: "8 weeks"
  team: "DEV + ML engineer + DEVOPS"

success_criteria:
  - Match accuracy with photo ≥ 90%
  - Photo upload < 2 seconds
  - Inference < 500ms

risks:
  - Photo privacy (GDPR, consent)
  - Model bias (faces from different ethnicities)
  - Storage costs (images are large)
EOF
```

### Step 2: Trigger Board Review
```bash
# Each agent reviews independently
hos run-agent contrarian --proposal docs/decision-log/2026-MM-DD-new-feature/proposal.yaml
hos run-agent expansionist --proposal docs/decision-log/2026-MM-DD-new-feature/proposal.yaml
hos run-agent principals --proposal docs/decision-log/2026-MM-DD-new-feature/proposal.yaml
hos run-agent researcher --proposal docs/decision-log/2026-MM-DD-new-feature/proposal.yaml
hos run-agent user --proposal docs/decision-log/2026-MM-DD-new-feature/proposal.yaml
```

### Step 3: Judge Decides
```bash
# Judge reviews all board outputs
hos run-judge docs/decision-log/2026-MM-DD-new-feature/
```

Judge outputs decision:
```yaml
decision: "GREEN_LIGHT"
conditions:
  - Must get legal review on photo consent/GDPR
  - Must test model bias (faces from 10+ ethnicities)
  - Implement privacy: delete photos after 30 days
next_gate: "At 50% complete, re-evaluate photo privacy concerns"
```

### Step 4: Execution
If GREEN, Dev Agent starts building:
- CTO designs architecture
- Dev writes code
- DEVOPS sets up infrastructure
- QA builds test suite
- COO tracks timeline

### Step 5: Gates
At 25%, 50%, 75%:
- Did we solve the privacy issue?
- Is model bias acceptable?
- Are we on timeline?
- Kill/reshape if something breaks

### Step 6: Post-Decision
After launch:
- Do users upload photos? (yes? no?)
- Did accuracy improve? (to 90%+?)
- What costs more than expected?
- What did we learn for v2?

---

## How to Get Started

### 1. Read These Documents (In Order)
1. **This file** — How the system works
2. **[AGENTIC_ROLES.md](AGENTIC_ROLES.md)** — What each agent does
3. **[AGENTIC_GOVERNANCE.md](AGENTIC_GOVERNANCE.md)** — How decisions are made
4. **[STRUCTURE_AGENTIC.md](STRUCTURE_AGENTIC.md)** — Where things live in the repo

### 2. Understand the Board
Read the prompt for each agent:
```
agents/prompts/board/
├── contrarian_base.md
├── expansionist_base.md
├── principals_base.md
├── researcher_base.md
└── user_base.md
```

### 3. Make Your First Proposal
Follow the example above. Pick a small feature, write a proposal, run through the board.

### 4. Review a Past Decision
Look at a decision in `docs/decision-log/` to see the format.

---

## FAQ

**Q: If agents disagree, who wins?**
A: The Judge. Judge synthesizes all signals and decides.

**Q: Can agents veto each other?**
A: No. Each agent advises in their domain. Judge makes the call.

**Q: What if a decision is obviously wrong?**
A: Any decision can be revisited. If facts change or new data emerges, we re-gate.

**Q: How is this different from a human team?**
A: Transparency. Every decision is logged with reasoning. No politics, no "we decided at lunch." Every thought process is auditable.

**Q: Can humans override agents?**
A: Yes. For critical decisions, humans must approve. See [Escalation Path](AGENTIC_GOVERNANCE.md#escalation--human-override).

**Q: What if an agent is wrong?**
A: We learn from it. After each decision, we review outcomes. If an agent consistently misses things, we recalibrate its prompt.

**Q: Isn't this just prompt engineering?**
A: Not quite. Each agent is a semi-autonomous system with tools (code analysis, data research, etc.). Prompts guide behavior, but agents do real work.

---

## Next Steps

1. Pick a small feature to propose
2. Write a proposal following the template
3. Run it through the board (can be simulated first)
4. See what each agent says
5. Make the decision and execute

Welcome to the agentic organization.

---

## Commands Reference

```bash
# Propose a feature
hos propose --title "Feature Name" --category strategic

# Run board review
hos board-review docs/decision-log/YYYY-MM-DD-feature/proposal.yaml

# Run a specific agent
hos run-agent contrarian --proposal proposal.yaml

# View decision history
hos decisions --status GREEN --category strategic

# Check a gate
hos check-gate docs/decision-log/YYYY-MM-DD-feature/

# Recalibrate agents (quarterly)
hos recalibrate-agents docs/decision-log/archive/
```

*(Commands not yet implemented; will be built as part of the system)*

---

## Contact & Questions

For questions about the agentic system, see:
- [AGENTIC_GOVERNANCE.md](AGENTIC_GOVERNANCE.md) — Decision processes
- [AGENTIC_ROLES.md](AGENTIC_ROLES.md) — Agent responsibilities
- `agents/governance/policies/` — Specific policies
