# Task Management

All project tasks, sprints, and backlog items live here.

## Files

- **[TASKS_ACTIVE.yaml](TASKS_ACTIVE.yaml)** — Single source of truth for all active tasks
- **[TASK_TEMPLATE.yaml](TASK_TEMPLATE.yaml)** — Template for creating new tasks
- **[../TASK_MANAGEMENT.md](../TASK_MANAGEMENT.md)** — Full task management guide

## Directories

```
tasks/
├── backlog/                    # All tasks organized by epic
│   └── HOS-2026-001-feature-name/
│       ├── 01-task-name.yaml   # Copy from TASK_TEMPLATE.yaml
│       ├── 02-task-name.yaml
│       └── 03-task-name.yaml
│
├── sprints/                    # Weekly sprint files
│   ├── 2026-W26-sprint.yaml   # Copy from SPRINT_TEMPLATE.yaml
│   └── ...
│
└── archive/                    # Completed tasks
    └── completed/
        └── 2026-Q2/
            └── tasks.yaml
```

## Quick Start

### Create a New Epic's Tasks

1. Check decision approved in `docs/decision-log/`
2. Create folder: `backlog/HOS-2026-XXX-epic-name/`
3. For each task:
   - Copy `TASK_TEMPLATE.yaml`
   - Fill in: id, title, owner, estimate, due date
   - Set epic_id to match decision
   - Save as `NN-task-name.yaml`
4. Update `TASKS_ACTIVE.yaml` with new tasks

### Start a Sprint

1. Copy `SPRINT_TEMPLATE.yaml`
2. Update: sprint_id, dates, sprint_goal
3. Add tasks from backlog
4. Assign team members
5. Save as `sprints/YYYY-WNN-sprint.yaml`
6. Update `TASKS_ACTIVE.yaml` to reflect sprint start

### Daily Progress

1. Open active sprint: `sprints/YYYY-WNN-sprint.yaml`
2. Add daily standup entry
3. Update task progress in backlog tasks
4. Update daily_burndown in sprint file

### End of Sprint

1. Run sprint review meeting
2. Run retrospective
3. Calculate final metrics
4. Archive completed tasks
5. Update learning/insights
6. Start next sprint

## Integration with Decisions

Every task traces back to a decision:

```
Decision Approved (GREEN)
    ↓
CTO Creates Tasks (in backlog/)
    ↓
COO Adds to Sprint (in sprints/)
    ↓
Team Executes (updates daily)
    ↓
Gates Review (25%, 50%, 75%)
    ↓
Task Complete (status: done)
    ↓
Post-Decision Learning (captured)
```

## Status Workflow

```
todo → in_progress → in_review → done → shipped
                          ↑
                    (if changes needed)
```

## Linking to Code

When a task is in_review, link to the code:

```yaml
code_changes:
  - file: "application/backend/services/person_service.py"
    pr_link: "https://github.com/.../pull/42"
    status: "in_review"
```

## Metrics

Track in sprint file:
- **Velocity:** Hours committed vs. completed per sprint
- **Burndown:** Remaining hours over sprint timeline
- **Cycle Time:** Days from todo to done
- **Variance:** Estimate accuracy (actual vs. estimate)

## Commands (Once CLI is Built)

```bash
hos task create --epic HOS-2026-001 --title "Task Name"
hos task list --status todo --sort priority
hos sprint view 2026-W27
hos task update HOS-2026-001-01 --progress 50%
hos gates check --epic HOS-2026-001
```

## Important Notes

1. **Tasks are version-controlled** — Commit changes to git
2. **One task = 1-3 days** — Break larger work into multiple tasks
3. **Gate reviews are mandatory** — Can't skip 25%, 50%, 75% gates
4. **Link to decisions** — Every task must have epic_id
5. **Track time** — Helps calibrate future estimates
6. **Capture learning** — Record actual vs. estimated for retrospectives

## See Also

- [../TASK_MANAGEMENT.md](../TASK_MANAGEMENT.md) — Full task management guide
- [../AGENTIC_GOVERNANCE.md](../AGENTIC_GOVERNANCE.md) — How decisions flow to tasks
- [../docs/decision-log/](../docs/decision-log/) — Where decisions are stored
