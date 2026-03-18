# Common Workflow Skill

- **Purpose:** Provide repeatable workflow guidance for planning, task tracking, and handoff in this repository.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `../AGENTS.md`, `../docs/tracking/master-task-board.md`, `../docs/tasks/task-001-foundation-architecture.md`
- **Update Rule:** Update when planning workflow or handoff expectations change.

## When to Use
Use this workflow when:
- breaking down product scope into executable tasks
- preparing the next task for implementation
- updating task status after architecture, coding, or QA work
- handing work to another agent or developer

## Workflow Steps
1. **Load context**
   - Read `docs/prd/overview.md`
   - Read `docs/tracking/priority-roadmap.md`
   - Open the target task file in `docs/tasks/`
2. **Confirm readiness**
   - Verify priority, dependencies, and open questions
   - Confirm whether the task is ready to move from `todo` to `doing`
3. **Record intent**
   - Update the task file with current owner/role, date, and planned output
   - Update the master board status if work begins
4. **Execute within scope**
   - Keep changes tied to the specific task ID
   - If new work appears, create a follow-up task instead of expanding scope silently
5. **Handoff cleanly**
   - Record what was completed, what remains, blockers, and recommended next step
   - Link any new artifacts or files created

## Minimum Handoff Template
- Task ID:
- Current status:
- What changed:
- Validation performed:
- Open questions / blockers:
- Recommended next action:

## Readiness Checklist
A task is ready for implementation when all are true:
- objective is clear
- dependencies are known
- definition of done exists
- open questions are either resolved or explicitly accepted
- expected outputs are documented

## Escalation Rule
If a P0 task is blocked by missing product or architecture decisions, stop implementation and document the blocker in:
- the task file
- `docs/tracking/master-task-board.md`
- optionally `docs/prd/overview.md` if the scope itself is unclear
