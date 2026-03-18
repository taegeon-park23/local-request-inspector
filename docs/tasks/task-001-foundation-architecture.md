# T001 - Foundation Architecture and Domain Model

- **Purpose:** Prepare the first implementation-critical planning task so another agent or developer can start it immediately.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `../prd/overview.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/overview.md`, `../architecture/domain-model.md`, `../architecture/migration-plan.md`, `../../skills/common-workflow.md`
- **Status:** doing
- **Priority:** P0

## 1. Summary
Define the target application architecture and core domain model for the Local API Workbench upgrade. This task should establish the structure needed for backend refactoring, frontend rewrite planning, persistence design, and execution-engine redesign.

## 2. Why This Is the First Task
This task is ranked first because it has the broadest downstream impact.
- It establishes the product’s future module boundaries before code changes begin.
- It determines how requests, scripts, environments, history, and mock rules relate to one another.
- It reduces rework across frontend, backend, storage, and QA.
- It surfaces hard decisions early, including persistence choice pressure and script-sandbox boundaries.

Without this task, later work is likely to fragment into inconsistent assumptions.

## 3. Objective
Produce a decision-ready architecture package that answers:
- what the main application modules are
- what the core domain entities are
- how the current monolithic server/UI can be migrated incrementally
- which major decisions must be made next, and in what order

## 4. Definition of Done
This task is done when all of the following are true:
- A high-level system architecture document exists and is linked from this task.
- Core domain entities and relationships are documented at a planning level.
- The migration path from current structure to target structure is outlined.
- Major unresolved decisions are explicitly listed with recommended next owners.
- Dependencies and impacts on T003, T004, T005, T006, and T007 are called out.
- The master task board and progress status are updated to reflect completion or new blockers.

## 5. Required Inputs
- PRD summary in `../prd/overview.md`
- Current repository structure (`server.js`, `public/index.html`)
- Backlog context in `../tracking/master-task-board.md`
- Sequencing logic in `../tracking/priority-roadmap.md`

## 6. Pre-Start Checks
Before starting, confirm:
- No newer PRD direction has superseded the current summary.
- The work will remain architecture/planning focused, not implementation-heavy.
- Any uncertain scope remains marked as assumption or open question.

## 7. Expected Outputs
At minimum, produce:
1. architecture overview document
2. domain model draft
3. migration strategy outline
4. identified follow-up decisions list

Suggested path:
- `docs/architecture/overview.md`
- `docs/architecture/domain-model.md`
- `docs/architecture/migration-plan.md`
- or equivalent structure if better justified

## 8. Dependencies
### Depends On
- T002 Delivery documentation and tracking system

### Unlocks
- T003 UX information architecture and workspace flows
- T004 Persistence strategy decision
- T005 Script execution safety model
- T006 Frontend stack and application shell decision
- T007 Shared domain schema and naming conventions
- T008 Internal API contract design

## 9. Risks
- Overdesigning before enough product constraints are known
- Locking in a stack decision too early
- Mixing architecture definition with implementation details
- Underestimating the security implications of the current script execution model

## 10. Decision Needs / Open Questions
1. Preferred persistence model is **확실하지 않음**.
2. Long-term UI platform and packaging direction are **확실하지 않음**.
3. Exact local security guarantees for script execution are **확실하지 않음**.
4. Whether inbound and outbound events must share one persistence model in MVP is **확실하지 않음**.

## 11. Current Progress
- Architecture overview drafted in `../architecture/overview.md`.
- Domain model drafted in `../architecture/domain-model.md`.
- Migration strategy drafted in `../architecture/migration-plan.md`.
- Current codebase findings documented to support T003, T004, T005, T006, T007, and T008.

## 12. Remaining Open Questions
1. Persistence model is still **확실하지 않음** and should be resolved in T004.
2. Frontend stack and packaging direction are still **확실하지 않음** and should be resolved across T003/T006.
3. Sandbox isolation and capability policy remain **확실하지 않음** and should be resolved in T005.
4. Canonical shared schema details still need formalization in T007.

## 13. Handoff Checklist
Before handing this task to the next contributor, verify:
- [x] Architecture docs are created and linked
- [x] Domain entities have names, responsibilities, and relationships
- [x] Migration phases are described
- [x] Open questions are visible and actionable
- [x] Downstream task impacts are listed
- [x] `master-task-board.md` status is updated
- [x] `progress-status.md` is updated

## 14. Recommended Owner
- Primary: Architecture Agent / Senior Engineer
- Secondary reviewer: Product / Documentation Agent
