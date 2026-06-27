# Task Management in Agentic HOS

How tasks are created, tracked, and executed in an AI-driven organization.

---

## Overview

Tasks flow through the system in this hierarchy:

```
DECISION (Board approves feature)
    ↓
TASK BACKLOG (What needs to be done)
    ↓
SPRINT BACKLOG (What we're doing this iteration)
    ↓
IN PROGRESS (Actively being worked on)
    ↓
GATES (Mid-project review: continue? reshape? kill?)
    ↓
DONE (Shipped & reviewed)
    ↓
LEARNING (Post-decision review)
```

---

## Task Hierarchy

### Level 1: Epic (Decision Level)
**Owner:** Product/Judge agents

**Example:** "Add AI-Assisted Person Matching"

**Contains:** Multiple features/milestones
**Duration:** Weeks to months
**Triggers:** Board approval (GREEN decision)

**File:** `docs/decision-log/YYYY-MM-DD-epic-name/`

---

### Level 2: Feature (Implementation Level)
**Owner:** CTO + Dev agents

**Example:** "Build ML Model Training Pipeline"

**Contains:** Multiple tasks
**Duration:** 1-2 weeks
**Triggers:** Epic split into features

**File:** `tasks/backlog/HOS-2026-001-feature-name.yaml`

---

### Level 3: Task (Work Item Level)
**Owner:** Individual agents (Dev, DevOps, QA)

**Example:** "Implement embeddings API endpoint"

**Contains:** Specific work
**Duration:** 1-3 days
**Triggers:** Feature split into tasks

**File:** Same as Feature (nested in YAML)

---

### Level 4: Subtask (If Needed)
**Owner:** Same as parent task

**Example:** "Write test for embeddings endpoint"

**Duration:** < 1 day
**Triggers:** Task split if complex

---

## Task Structure (YAML)

### Minimal Task

```yaml
id: "HOS-2026-001-01"
title: "Implement embeddings API"
status: "todo"  # todo | in_progress | in_review | done | blocked
owner: "DEV"
priority: "HIGH"
due_date: "2026-07-10"
epic: "HOS-2026-001"  # Links to parent decision
```

### Complete Task

```yaml
# Core
id: "HOS-2026-001-01"
title: "Implement embeddings API endpoint"
description: |
  Create FastAPI endpoint that takes person description 
  and returns vector embedding for similarity matching.
  
category: "backend"  # backend|frontend|database|infrastructure|devops
status: "todo"  # todo|in_progress|in_review|done|blocked
priority: "HIGH"  # CRITICAL|HIGH|MEDIUM|LOW

# Ownership & Timeline
owner: "DEV"  # Agent responsible
assignee: "Claude-DEV-001"  # Specific agent instance (if needed)
created_at: "2026-06-27T10:00:00Z"
due_date: "2026-07-10T23:59:59Z"
estimated_hours: 16
time_spent_hours: 0

# Relationships
epic_id: "HOS-2026-001"  # Links to decision
feature_id: "HOS-2026-001-feature-1"  # Links to feature
depends_on: ["HOS-2026-001-00"]  # Blocking tasks
blocked_by: []

# Requirements
requirements:
  - "Use sentence-transformers/all-MiniLM-L6-v2 model"
  - "Latency < 100ms per embedding"
  - "Handle up to 1000 concurrent requests"
  - "Cache embeddings for identical descriptions"

# Acceptance Criteria
acceptance_criteria:
  - "Endpoint returns 200 OK with valid embedding vector"
  - "Embedding dimension matches model (384)"
  - "Load test passes: 1000 RPS, < 200ms latency"
  - "Code reviewed and merged"

# Testing
tests_required:
  - unit: "Test embedding generation"
  - integration: "Test API endpoint with real model"
  - performance: "Load test 1000 RPS"

# Definition of Done
done_criteria:
  - "Code merged to main"
  - "Tests passing (100% coverage)"
  - "Performance benchmarks met"
  - "Documentation updated"
  - "Deployed to staging"

# Tracking
status_history:
  - status: "todo"
    date: "2026-06-27"
    note: "Created"
  - status: "in_progress"
    date: "2026-07-01"
    note: "Started implementation"

# Notes
notes:
  - "Use pgvector for storage, sentence-transformers for generation"
  - "Consider batching for efficiency"
  - "Monitor token usage if using cloud API"

# Risk & Blockers
risks:
  - "Model inference might be slow — may need GPU"
  - "Memory usage with large batches"

blockers: []

# Gates
gates:
  - milestone: "25%"
    criteria: "Model loading works, basic endpoint functional"
    date: "2026-07-03"
  - milestone: "75%"
    criteria: "Performance targets met, tests passing"
    date: "2026-07-09"

# Metrics
metrics:
  - "Time to complete (actual vs estimate)"
  - "Test coverage"
  - "API latency"
  - "Code review comments"
```

---

## Task Lifecycle

### 1. CREATION

**Trigger:** Epic/Feature is approved (GREEN decision)

**Who:** Product or CTO agent

**Process:**
```yaml
# Create task file
tasks/backlog/HOS-2026-001-feature-name/
├── 01-task-one.yaml
├── 02-task-two.yaml
└── 03-task-three.yaml

# Link to epic decision
echo "Feature epic: docs/decision-log/2026-06-27-HOS-001-feature/proposal.yaml"
```

**Output:** Task added to backlog with `status: "todo"`

---

### 2. INTAKE (Sprint Planning)

**Timing:** Weekly sprint planning

**Who:** COO or Dev agent

**Process:**
1. Review all `todo` tasks
2. Prioritize for next sprint
3. Estimate effort (hours)
4. Assign to agents
5. Move to `in_progress` or keep in backlog

**Criteria for inclusion:**
- Dependencies are done
- Owner has capacity
- Supports epic timeline
- Unblocked

**Output:** Sprint backlog (usually 3-5 high-priority tasks)

---

### 3. IN PROGRESS

**Trigger:** Agent starts working

**Who:** Assigned agent (DEV, DEVOPS, QA, etc.)

**Process:**
1. Change `status: "in_progress"`
2. Start timer (if tracking)
3. Log work in comments
4. Flag blockers immediately

**Daily Standup:**
```yaml
standup:
  date: "2026-07-02"
  status: "in_progress"
  progress: "50% - Endpoint implemented, testing in progress"
  blockers: []
  next_day: "Run load tests, fix any performance issues"
  help_needed: false
```

**Output:** Real-time progress updates

---

### 4. GATE REVIEWS

**Timing:** At 25%, 50%, 75% of sprint

**Who:** Dev + QA + CTO agents

**Process:**
```yaml
gate:
  milestone: "50%"
  scheduled_date: "2026-07-05"
  
  checklist:
    - "All unit tests passing" → ✓
    - "Code merged to feature branch" → ✓
    - "Performance benchmark started" → ⏳
    - "No blockers identified" → ✓
  
  decision: "CONTINUE"  # CONTINUE | RESHAPE | KILL
  reasoning: "On track. Performance test in progress."
  risks_spotted: "Model loading slower than expected (100ms vs 50ms target)"
  next_gate: "75% - Full performance benchmark required"
```

**Output:** Gate decision (CONTINUE/RESHAPE/KILL)

---

### 5. IN REVIEW

**Trigger:** Agent marks task complete

**Who:** Code reviewer (Dev lead or peer agent)

**Process:**
```yaml
review:
  status: "in_review"
  requested_at: "2026-07-08"
  reviewer: "Claude-CTO-001"
  
  checklist:
    - "Code quality: Good"
    - "Tests: 95% coverage"
    - "Performance: ✓ meets targets"
    - "Documentation: ✓ updated"
    - "No breaking changes: ✓"
  
  verdict: "APPROVE"  # APPROVE | REQUEST_CHANGES | REJECT
  comments:
    - "Great implementation, consider caching for v2"
    - "One edge case: what if model fails to load?"
  
  required_changes: []
```

**Output:** Approval or requested revisions

---

### 6. DONE

**Trigger:** Code merged + all criteria met

**Who:** Dev agent

**Process:**
```yaml
status: "done"
completed_at: "2026-07-10T14:30:00Z"
time_spent_hours: 18  # Actual time vs 16 estimate
merged_at: "2026-07-10T14:25:00Z"
deployed_to: ["staging"]

completion_summary:
  - "API endpoint live on staging"
  - "All tests passing (96% coverage)"
  - "Performance: 85ms avg (target 100ms)"
  - "Documented in API reference"

learnings:
  - "Model loading was bottleneck (took 2 hours to optimize)"
  - "Caching reduced p99 latency by 40%"
  - "Load testing revealed memory leak (fixed)"

next_steps:
  - "Deploy to production after other tasks complete"
  - "Monitor latency in prod for 48 hours"
```

**Output:** Task complete, ready for next phase

---

### 7. LEARNING

**Timing:** After epic ships

**Who:** Judge + Product agents

**Process:**
```yaml
post_delivery_review:
  epic_id: "HOS-2026-001"
  completed_at: "2026-07-25"
  
  original_estimates:
    - "Feature tasks: 60 hours estimated"
    - "Actual: 68 hours"
    - "Variance: +13% (acceptable)"
  
  what_worked:
    - "Gate process caught performance issue early"
    - "Clear acceptance criteria prevented scope creep"
    - "Regular standups kept team aligned"
  
  what_didn_work:
    - "Model optimization took longer than expected"
    - "Load testing should have happened earlier"
  
  improvements_for_v2:
    - "Add GPU allocation to infrastructure tasks"
    - "Include performance profiling in task definition"
    - "Add 20% buffer for ML-related tasks"
  
  metrics:
    - "Time to market: 4 weeks (on schedule)"
    - "Bug escape rate: 2 bugs found in prod (acceptable)"
    - "Team satisfaction: 4.2/5"
```

**Output:** Calibration for future epics

---

## Task Status Workflow

```
CREATION
  ↓
┌─────────────────────────────────────────┐
│           BACKLOG (TODO)                │
│  Ready to start, not yet assigned      │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  SPRINT BACKLOG (Selected for sprint)  │
│  Assigned, ready to start               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│     IN PROGRESS (Actively working)      │
│     ↓ 25% gate → Continue?              │
│     ↓ 50% gate → Continue?              │
│     ↓ 75% gate → Continue?              │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  IN REVIEW (Code/QA review)             │
│  ↓ Approved → Merge                     │
│  ↓ Changes requested → Back to progress │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  DONE (Merged, deployed to staging)     │
│  Ready for next phase or production    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  SHIPPED (Live to users)                │
│  ↓ Post-decision review                 │
│  ↓ Learning captured                    │
└─────────────────────────────────────────┘
```

---

## Task Storage

### Directory Structure

```
tasks/
├── backlog/
│   ├── HOS-2026-001-feature-one/
│   │   ├── 01-task-one.yaml
│   │   ├── 02-task-two.yaml
│   │   └── 03-task-three.yaml
│   └── HOS-2026-002-feature-two/
│       └── ...
├── sprints/
│   ├── 2026-W26-sprint.yaml       # Weekly sprint summary
│   ├── 2026-W27-sprint.yaml
│   └── ...
└── archive/
    └── completed/
        └── 2026-Q2/
            └── HOS-2026-001-completed-tasks.yaml
```

### Sprint Summary

```yaml
# tasks/sprints/2026-W26-sprint.yaml

sprint_id: "2026-W26"
start_date: "2026-06-23"
end_date: "2026-06-29"
status: "in_progress"

sprint_goal: "Complete AI matching engine core + start deployment planning"

tasks:
  - id: "HOS-2026-001-01"
    title: "Implement embeddings API"
    owner: "DEV"
    status: "done"
    estimate: 16
    actual: 18
  
  - id: "HOS-2026-001-02"
    title: "Build model training pipeline"
    owner: "DEVOPS"
    status: "in_progress"
    estimate: 20
    actual: 12  # Still ongoing

  - id: "HOS-2026-001-03"
    title: "Write integration tests"
    owner: "QA"
    status: "todo"
    estimate: 12

velocity:
  points_committed: 48
  points_completed: 18
  points_in_progress: 12
  points_todo: 18
  completion_rate: "37.5%"

blockers: []
risks:
  - "Model training slower than expected"

notes:
  - "Good progress on API. Training pipeline hit snag with data loading."
  - "Plan to address by mid-week."
```

---

## Linking Tasks to Decisions

Every task traces back to a decision:

```
docs/decision-log/2026-06-27-HOS-001-ai-matching/
├── proposal.yaml
├── board/
├── judge_decision.yaml          ← Decision to BUILD
└── execution_gates.yaml

    ↓ (Judge approved as GREEN)

tasks/backlog/HOS-2026-001-ai-matching/
├── 01-implement-embeddings-api.yaml
├── 02-build-training-pipeline.yaml
├── 03-write-integration-tests.yaml
└── ...

    ↓ (Tasks link back to decision)

Header in each task file:
```yaml
epic_id: "HOS-2026-001"
decision_link: "docs/decision-log/2026-06-27-HOS-001-ai-matching/judge_decision.yaml"
# Full decision trail: Decision → Tasks → Code → Review → Learning
```

---

## Task Commands (Future CLI)

```bash
# Create a new task
hos task create --epic HOS-2026-001 --title "Implement embeddings API"

# View backlog
hos task list --status todo --sort priority

# Start working on a task
hos task start HOS-2026-001-01

# Log progress
hos task update HOS-2026-001-01 --progress "50%" --note "API working, testing in progress"

# Request review
hos task review HOS-2026-001-01 --reviewer Claude-CTO-001

# Complete task
hos task complete HOS-2026-001-01 --merge-branch feature/embeddings-api

# View sprint
hos sprint view --week 2026-W26

# Check gates
hos gates check --epic HOS-2026-001 --milestone 50%

# View learning
hos learning view --epic HOS-2026-001 --phase post-delivery
```

---

## Task Metrics & Tracking

### Velocity (Per Sprint)

```yaml
sprint: "2026-W26"
velocity:
  estimated_hours: 48
  completed_hours: 18
  completion_rate: "37.5%"
  trend: "on pace"  # ahead|on_pace|behind
```

### Burndown Chart Data

```yaml
sprint: "2026-W26"
burndown:
  - date: "2026-06-23"
    hours_remaining: 48
  - date: "2026-06-24"
    hours_remaining: 45
  - date: "2026-06-25"
    hours_remaining: 39
  - date: "2026-06-26"
    hours_remaining: 36
  - date: "2026-06-27"
    hours_remaining: 30
  - date: "2026-06-28"
    hours_remaining: 30
  - date: "2026-06-29"
    hours_remaining: 30
```

### Epic Progress

```yaml
epic: "HOS-2026-001"
progress:
  overall: "65%"
  by_phase:
    - "Planning: 100%"
    - "Implementation: 42%"
    - "Testing: 15%"
    - "Deployment: 0%"
  timeline: "on schedule"
  risks: "Model optimization slower than expected"
  next_milestone: "75% complete by 2026-07-15"
```

### Quality Metrics

```yaml
epic: "HOS-2026-001"
quality:
  test_coverage: "94%"
  code_review_comments: 23
  bugs_found_in_review: 2  # Caught before production
  performance_targets_met: true
  documentation_coverage: "100%"
```

---

## Integration with Agentic System

### How Tasks Flow

```
1. BOARD APPROVES FEATURE (GREEN Decision)
   → Judge sets execution gates
   
2. CTO AGENT CREATES TASKS
   → Breaks down feature into tasks
   → Links each task to decision
   
3. COO AGENT PLANS SPRINT
   → Selects high-priority tasks
   → Assigns to agents
   → Sets sprint goal
   
4. DEV/DEVOPS/QA AGENTS WORK
   → Log progress daily
   → Flag blockers
   → Update task status
   
5. GATES TRIGGER MID-SPRINT
   → 25%, 50%, 75% reviews
   → Decision: Continue? Reshape? Kill?
   
6. JUDGE RE-EVALUATES
   → If risks materialize: Reshape or kill
   → Else: Approve next milestone
   
7. POST-DELIVERY REVIEW
   → Compare actual vs estimated
   → Capture learnings
   → Calibrate future estimates
```

### Authority Matrix

| Action | Authority | Can Veto |
|--------|-----------|----------|
| Create task | CTO | Judge (scope change) |
| Prioritize | COO | Judge (timeline impact) |
| Start task | Agent | COO (capacity) |
| Mark done | Agent | QA (quality gate) |
| Approve | Reviewer | Judge (policy/risk) |
| Merge code | Dev | No |
| Re-gate | Judge | No (final authority) |

---

## Example: Task Lifecycle

### Step 1: Decision Approved
```yaml
# docs/decision-log/2026-06-27-HOS-001/judge_decision.yaml
decision: "GREEN_LIGHT"
timeline_approved: "6 weeks"
conditions:
  - "Implement explainability"
  - "Bias audit every month"
```

### Step 2: CTO Creates Tasks
```yaml
# tasks/backlog/HOS-2026-001-ai-matching/01-embeddings-api.yaml
id: "HOS-2026-001-01"
title: "Implement embeddings API"
owner: "DEV"
epic_id: "HOS-2026-001"
status: "todo"
```

### Step 3: COO Adds to Sprint
```yaml
# tasks/sprints/2026-W26-sprint.yaml
sprint_goal: "Complete matching engine core"
tasks:
  - id: "HOS-2026-001-01"
    status: "in_sprint"
    priority: "HIGH"
```

### Step 4: Dev Works on It
```yaml
# Update task file
status: "in_progress"
progress: "50% - Endpoint implemented"
blockers: []
```

### Step 5: Gate Review at 50%
```yaml
# tasks/backlog/HOS-2026-001-ai-matching/01-embeddings-api.yaml
gate:
  milestone: "50%"
  status: "CONTINUE"
  risk: "Model loading slower than expected"
```

### Step 6: Completed & Merged
```yaml
status: "done"
completed_at: "2026-07-10"
time_spent_hours: 18
```

### Step 7: Learning Captured
```yaml
# docs/decision-log/2026-06-27-HOS-001/post_decision_review.yaml
task_performance:
  - "HOS-2026-001-01: 18 hours vs 16 estimate (+12%)"
improvements:
  - "Add 20% buffer for ML infrastructure work"
```

---

## Summary

**Tasks are:**
- Tied to decisions (every task has `epic_id`)
- Tracked in YAML (version-controlled, auditable)
- Gated at 25%, 50%, 75% (can be killed mid-sprint)
- Reviewed by multiple agents (Dev, QA, CTO)
- Measured for learning (actual vs estimate)
- Organized hierarchically (Epic → Feature → Task → Subtask)

**Key Principle:** Tasks exist to execute decisions. If a decision is killed or reshaped, tasks are updated accordingly.
