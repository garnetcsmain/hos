# Agentic Governance Framework

How AI agents make decisions, resolve conflicts, and execute strategy for HOS.

---

## Decision Hierarchy

```
JUDGE (Final Authority)
    ↓
BOARD AGENTS (Signal Input)
    ├─ Contrarian (Risk/Flaw)
    ├─ Expansionist (Upside)
    ├─ Principals (Logic/Values)
    ├─ Researcher (Data/Reality)
    └─ User (Customer POV)
    ↓
OPERATIONAL AGENTS (Execution)
    ├─ CTO (Tech Strategy)
    ├─ COO (Operations)
    ├─ DEV (Implementation)
    ├─ DEVOPS (Infrastructure)
    ├─ QA (Quality)
    └─ Product (Roadmap)
```

---

## Types of Decisions

### 1️⃣ Tactical (No Board Required)
**Definition:** Code-level, day-to-day, low-risk decisions.

**Examples:**
- Fix a bug
- Refactor internal code
- Add a test
- Optimize a query
- Choose between two design patterns

**Authority:** DEV Agent
**Approval:** None (logged, but no gate)
**Timeline:** Immediate

---

### 2️⃣ Operational (Operational Agents + Optional Board)
**Definition:** Affects timeline, resources, or product delivery.

**Examples:**
- Prioritize Feature A over Feature B
- Delay release by 2 weeks
- Add a new dependency
- Redesign a component
- Change test coverage strategy

**Authority:** COO or CTO (depending on nature)
**Board Review:** If it affects scope/timeline significantly → Run board review
**Timeline:** 1-3 days

---

### 3️⃣ Strategic (Board Required)
**Definition:** Affects product direction, user experience, company strategy.

**Examples:**
- Add a major new feature
- Enter a new market
- Change core architecture
- Pivot to a new user segment
- Security model change
- Major refactor

**Authority:** Judge Agent
**Board Review:** MANDATORY (all 5 agents)
**Timeline:** 3-7 days
**Human Approval:** If major strategic implications → Human stakeholders must sign off

---

### 4️⃣ Critical (Judge + Human Approval)
**Definition:** Life-or-death for the project or users.

**Examples:**
- Data breach discovered
- Security vulnerability in production
- Major outage
- Shutdown decision
- Major pivot away from stated mission
- Legal/compliance violation

**Authority:** Judge + Humans
**Board Review:** Expedited (24h)
**Human Approval:** Required (escalate immediately)
**Timeline:** Immediate

---

## Board Review Process

### Phase 1: Intake (Proposer)

**Input:** Standardized proposal
```yaml
decision_id: "HOS-2026-027"
title: "Add AI-Assisted Matching Engine"
category: "strategic"  # tactical|operational|strategic|critical
proposer: "DEV Agent"
created_at: "2026-06-27T10:00:00Z"

summary: "Implement ML-based person matching to improve match accuracy from 60% to 85%"

context:
  problem: "Manual matching is slow; many missed matches"
  user_impact: "Families wait longer; some reunifications fail"
  competitive_context: "Other systems use rule-based; we could lead with ML"

scope:
  in:
    - ML model training pipeline
    - Vector embeddings for names/descriptions
    - Real-time match scoring
  out:
    - Photo-based matching (v2)
    - Cross-border search (v3)

resources:
  ml_training_data: "5000 historical matches"
  compute: "GPU for model training"
  time_estimate: "6 weeks"
  team: "DEV + DEVOPS + Product"

success_criteria:
  - Match accuracy ≥ 85%
  - False positive rate < 10%
  - Inference latency < 500ms
  - Can be retrained monthly
  - Audit trail of all matches

risks:
  - Model bias: Could over-match names from same region
  - Data quality: Training data may be incomplete
  - Retraining: Monthly updates could be resource-heavy
  - Explainability: Families may not trust AI-suggested matches

assumptions:
  - We have enough historical data
  - Model bias is manageable
  - Matches will improve user trust
  - We can explain matches to families
```

**Output Location:** `docs/decision-log/HOS-2026-027/`

---

### Phase 2: Board Review (Parallel, 1-3 days)

Each agent reviews independently. No communication between agents (prevents groupthink).

```bash
# Each agent runs in isolation
claude --agent contrarian review docs/decision-log/HOS-2026-027/proposal.yaml
claude --agent expansionist review docs/decision-log/HOS-2026-027/proposal.yaml
claude --agent principals review docs/decision-log/HOS-2026-027/proposal.yaml
claude --agent researcher review docs/decision-log/HOS-2026-027/proposal.yaml
claude --agent user review docs/decision-log/HOS-2026-027/proposal.yaml
```

**Each Agent Outputs:**
- **Contrarian:** Flaws, edge cases, failure modes
- **Expansionist:** Upside, adjacent opportunities, moats
- **Principals:** Alignment with values, logical consistency
- **Researcher:** Market data, competitive analysis, user research
- **User:** Usability, whether it solves actual problem

All outputs saved to `docs/decision-log/HOS-2026-027/board/`

---

### Phase 3: Judge Synthesis (1 day)

Judge reviews all board outputs + proposal.

**Decision Framework:**

```
1. FATAL FLAWS?
   IF Contrarian found unfixable flaw with HIGH+ severity
   AND Researcher confirms it's real
   THEN → KILL

2. PRINCIPLES VIOLATION?
   IF Principals found CRITICAL violation of core values
   THEN → KILL or RESHAPE to fix

3. USER ACCEPTANCE?
   IF User says "wouldn't use this" or "creates new friction"
   AND it's core UX
   THEN → RESHAPE or KILL

4. REALITY CHECK?
   IF Researcher found data contradicts assumptions
   THEN → KILL or RESHAPE based on reality

5. UPSIDE VS RISK
   IF Expansionist sees 10x+ potential
   AND Contrarian's flaws are manageable
   AND Researcher confirms market exists
   THEN → Weight GREEN higher

6. SIMPLICITY TEST
   IF Principals found simpler solution
   THEN → Prefer simpler
```

**Judge Output:**
```yaml
decision_id: "HOS-2026-027"
decision: "GREEN_LIGHT"  # GREEN_LIGHT | RESHAPE | KILL
confidence: 0.92
reasoning: |
  ML matching addresses real problem (Researcher: users want faster matches).
  Expansionist sees path to 10x impact (mobile photos → cross-border).
  Contrarian's bias risk is real but manageable (monthly retraining + audit trail).
  Principals: aligns with "Information before interfaces" (better matching = better info).
  User: family finds matches faster = core value unlock.

conditions:
  - Must implement explainability (audit trail of why each match)
  - Model retraining SLA: monthly or when accuracy drops below 82%
  - False positive rate monitoring: alert if > 12%
  - User testing before production: 100 families test, >80% say helpful
  - Bias audit: monthly check on over-matching by region

next_gate: "After 2 weeks production. Re-evaluate if accuracy < 85% or false positives > 10%."

timeline_approved: "6 weeks"
resource_approved: "1 ML engineer + 0.5 DEVOPS for infra"

escalation: "If model performs poorly after 4 weeks, escalate to board for course correction."
```

---

### Phase 4: Execution Tracking

If GREEN LIGHT: Operational agents execute with gates.

```
Week 1-2: Data preparation + model selection
  Gate Check: Do we have clean training data? → CONTINUE or STOP

Week 3-4: Model training + validation
  Gate Check: Accuracy ≥ 85%? False positives < 10%? → CONTINUE or RESHAPE

Week 5-6: Production deployment + monitoring
  Gate Check: Real-world performance matches test? → CONTINUE or ROLLBACK

Week 2-6 (ongoing): Audit trail, explainability
  Gate Check: Can families understand why we matched them? → CONTINUE or IMPROVE
```

Each gate is a mini-decision: CONTINUE, RESHAPE, or KILL.

---

### Phase 5: Post-Decision Review (After 2 weeks)

Judge + Proposer review actual outcomes vs. assumptions.

```yaml
decision_id: "HOS-2026-027"
phase: "post_decision_review"
actual_results:
  match_accuracy: 0.87
  false_positive_rate: 0.08
  inference_latency_ms: 340
  user_trust_score: 0.79

analysis:
  - Exceeded accuracy target ✓
  - False positives below threshold ✓
  - Performance better than expected ✓
  - User trust slightly lower than hoped (families still skeptical of AI)
    → Action: Improve explainability in UI

next_decision:
  question: "Expand to cross-border matching?"
  timing: "Next month"
  gate: "If user trust reaches 0.85+, proceed with mobile photo matching"
```

---

## Conflict Resolution

### What if Two Agents Disagree?

**Example:** DEV wants to refactor core matching logic. CTO says "too risky right now."

**Resolution:**
1. **Clarify the disagreement:** What are they disagreeing about? Is it risk? Timing? Implementation?
2. **Run Operational Board:** CTO vs. DEV present their case. Researcher gathers data on similar refactors. Contrarian finds flaw in risk assessment.
3. **Judge decides:** Based on board input, Judge rules on priority.

**Escalation:** If agreement still impossible, escalate to human stakeholders.

---

### What if a Gate Fails?

**Example:** ML model accuracy is 78%, target was 85%.

**Options:**
1. **CONTINUE:** If Contrarian says flaw is manageable, keep going with monitoring
2. **RESHAPE:** Reduce scope (only match high-confidence, not borderline)
3. **KILL:** Stop, redirect resources elsewhere

**Decision:** Operational agent proposes, Judge confirms + board if needed.

---

## Escalation & Human Override

**When to escalate to humans:**

1. **Strategic pivots** (changing our core mission)
2. **Life-or-death decisions** (shutting down, major data breach)
3. **Legal/compliance violations** (security, privacy)
4. **Stuck disagreement** (Board can't resolve, Judge uncertain)
5. **Resource crisis** (can't afford to continue)

**Escalation Path:**
```
Stuck at Operational Agent level
    ↓
Present to Judge + Operational Board
    ↓
If still stuck or high-stakes → Escalate to Human Stakeholders
    ↓
Human decision + human-signed approval
    ↓
Log in decision archive with "HUMAN OVERRIDE" tag
```

---

## Logging & Transparency

### Every Decision Records

```
docs/decision-log/
├── 2026-06-27-HOS-001-add-ai-matching/
│   ├── proposal.yaml
│   ├── board/
│   │   ├── contrarian.md
│   │   ├── expansionist.md
│   │   ├── principals.md
│   │   ├── researcher.md
│   │   └── user.md
│   ├── judge-decision.yaml
│   ├── execution-gates.yaml
│   └── post-decision-review.yaml
```

### Query Decisions

```bash
# All decisions by category
ls docs/decision-log/ | grep strategic

# All decisions by agent
grep -r "RESHAPE" docs/decision-log/*/judge-decision.yaml

# Decisions that were killed
grep -r "KILL" docs/decision-log/*/judge-decision.yaml | wc -l

# Decisions that succeeded (post-decision review)
grep -r "exceeded target" docs/decision-log/*/post-decision-review.yaml
```

---

## Agent Calibration

### How We Know Agents Are Working Well

- **Contrarian:** Finding real flaws (e.g., "We assumed X was true but Researcher found Y")
- **Expansionist:** Suggesting 10x outcomes that Judge agrees are plausible
- **Principals:** Catching value misalignments before user backlash
- **Researcher:** Data is ground truth; when used, outcomes match predictions
- **User:** Usability issues Researcher found → User prioritizes correctly
- **Judge:** Decisions that are GREEN → succeed; decisions that are KILL → would have failed

### Recalibration

If agents are consistently wrong:
1. Review past decisions
2. Identify systematic bias (e.g., Contrarian too pessimistic?)
3. Adjust prompts or retrain
4. Re-test on past decisions

---

## Agent Communication Protocol

### Allowed Communication
- ✓ Input from Proposer
- ✓ Access to proposal + past decisions
- ✓ Research data (Researcher publishes findings)
- ✓ Output to Judge

### Forbidden Communication
- ✗ Agents talking to each other during review (prevents groupthink)
- ✗ Judge talking to agents mid-review (biases input)
- ✗ Proposer lobbying agents (sanitized proposal only)

### Output Format (Mandatory)

All agents output in this structure:

```markdown
# [Agent Name] Review: [Decision ID]

## My Recommendation
[GREEN LIGHT | RESHAPE | KILL]

## Key Findings

### Finding 1
- Issue: [What I found]
- Severity: [CRITICAL|HIGH|MEDIUM|LOW]
- Evidence: [Why I think this is true]
- If wrong: [What would change my mind?]

### Finding 2
...

## Confidence Score
[0.0 = guessing, 1.0 = certain]
Reasoning: [Why I'm this confident]

## What I Don't Know
[Gaps in my analysis]

## Questions for Judge
[If Judge wants to dive deeper]
```

---

## Metrics: Are Agents Making Good Decisions?

Track over time:

| Metric | How | Target |
|--------|-----|--------|
| **Decision Quality** | % of GREEN decisions that succeeded (hit targets) | > 80% |
| **Kill Accuracy** | % of KILL decisions that would have failed | > 90% |
| **Reshape Rate** | How often we RESHAPE vs GREEN | < 30% |
| **Time to Decide** | Average days from proposal to Judge decision | < 5 days |
| **Escalation Rate** | How often we escalate to humans | < 5% |
| **User Satisfaction** | Do users like decisions? (post-delivery survey) | > 80% |
| **Agent Alignment** | How often do agents agree on severity? | > 75% |

### Quarterly Calibration
Review all decisions from last quarter:
- What worked?
- What failed?
- Did agents predict correctly?
- Retrain/recalibrate as needed

---

## Governance Principles (Summary)

1. **Transparency** — Every decision logged, all reasoning visible
2. **Specialization** — Each agent has a domain, doesn't override others
3. **No Consensus** — Agents disagree, that's the point
4. **Signal, Not Vote** — Board provides information, Judge decides
5. **Reversible** — Any decision can be revisited if facts change
6. **Human Safety** — Humans approve critical decisions
7. **Auditable** — Full decision trail for compliance & learning
8. **Adaptive** — Agents improve over time based on outcomes
