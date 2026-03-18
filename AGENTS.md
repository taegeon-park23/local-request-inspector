# AGENTS.md

- **Purpose:** Define collaboration rules, role ownership, and update expectations for this repository.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `docs/tracking/master-task-board.md`, `docs/tracking/priority-roadmap.md`, `skills/common-workflow.md`
- **Update Rule:** Update this file whenever team roles, delivery workflow, or decision policy changes.

## Scope
This file applies to the entire repository unless a deeper `AGENTS.md` overrides it.

## Current Project Mode
- The project is in **delivery-preparation mode**, not broad feature implementation mode.
- Before building major features, contributors must maintain planning, backlog, and readiness documents under `docs/`.
- If a requested implementation depends on unresolved product or architecture decisions, document the gap first and link the related task.

## Agent Roles
### 1. Product / Documentation Agent
- Maintains PRD summaries, assumptions, open questions, readiness docs, and cross-document consistency.
- Owns `docs/prd/`, roadmap summaries, and task descriptions before implementation starts.

### 2. Architecture Agent
- Converts PRD goals into technical architecture, module boundaries, data contracts, and migration plans.
- Owns system design docs, decision records, and technical risk analysis.

### 3. Delivery / Tracking Agent
- Keeps backlog status, priorities, dependencies, and execution order accurate.
- Owns `docs/tracking/` and ensures every major task has a clear owner and next action.

### 4. Implementation Agent
- Executes tasks only when acceptance criteria, dependencies, and unresolved decisions are documented.
- Must update the linked task file status and implementation notes after code changes.

### 5. QA / Verification Agent
- Defines test strategy, validation checklists, release-readiness criteria, and regression coverage expectations.
- Must link validation results back to the originating task.

## Working Rules
1. **Read before writing:** Review `docs/prd/overview.md`, `docs/tracking/master-task-board.md`, and the relevant task file before starting work.
2. **Single source of truth:**
   - Product scope summary: `docs/prd/overview.md`
   - Priority order: `docs/tracking/priority-roadmap.md`
   - Execution status: `docs/tracking/master-task-board.md`
   - Task details: `docs/tasks/task-*.md`
3. **Status discipline:** Every started task must have a status of `doing`, `blocked`, or `done` in the task file and master board.
4. **No silent assumptions:** If something is unclear, record it under `Assumptions` or `Open Questions` rather than hard-coding a decision.
5. **Traceability first:** Every architecture or implementation change should link back to at least one task ID.
6. **Smallest useful increment:** Prefer preparing decisions and interfaces before implementation of large vertical slices.
7. **Do not skip readiness criteria:** P0 work should not start until dependencies and definition of done are documented.

## Documentation Rules
- Use clear section headings and keep file names stable.
- Each planning or task document must include:
  - Purpose
  - Created date
  - Last updated date
  - Related document links
  - Status where relevant
- Use relative links so other agents can navigate the repo offline.
- Mark uncertain items explicitly as **확실하지 않음** when the source is ambiguous.

## Task Lifecycle
1. Create or refine task doc in `docs/tasks/`
2. Add or update entry in `docs/tracking/master-task-board.md`
3. Reflect sequencing in `docs/tracking/priority-roadmap.md` if priority changes
4. Start work only after dependencies and open questions are reviewed
5. Record outputs, decisions, and follow-up tasks in the task doc

## Branch / Commit / PR Guidance
- Keep commits scoped to a coherent planning or implementation unit.
- Commit message format recommendation:
  - `docs: establish delivery prep structure`
  - `feat: ...`
  - `refactor: ...`
- PR title should summarize the primary delivered value.
- PR body should include summary, key documents changed, validation performed, and unresolved questions.

## Validation Expectations
- Planning-only changes must still be checked for:
  - broken links where practical
  - file naming consistency
  - task ID consistency across docs
- Implementation changes must document tests or explain why they are not yet possible.

## Decision Principles
- Prioritize work that reduces uncertainty for many downstream tasks.
- Prefer modularity over one-off patches.
- Design for local-first development, explicit security boundaries, and future multi-workspace expansion.
- When choosing between speed and clarity during preparation, prefer clarity.
