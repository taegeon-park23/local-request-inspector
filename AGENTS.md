# AGENTS.md

- **Purpose:** Define collaboration rules, archival policy, and update expectations for this repository.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `docs/tracking/master-task-board.md`, `docs/tracking/priority-roadmap.md`, `docs/tracking/progress-status.md`, `skills/common-workflow.md`
- **Update Rule:** Update this file whenever team roles, delivery workflow, archival policy, or decision policy changes.

## Scope
This file applies to the entire repository unless a deeper `AGENTS.md` overrides it.

## Current Project Mode
- The project is in bounded delivery mode.
- New implementation work must start from one newly defined bounded task, not from reopening archived task history.
- Completed work is summarized in `docs/tracking/completed-work-summary.md`; per-task completed docs are not retained.

## Agent Roles
### 1. Product / Documentation Agent
- Maintains PRD summaries, assumptions, open questions, archival summaries, and cross-document consistency.
- Owns `docs/prd/` and historical summarization in `docs/tracking/completed-work-summary.md`.

### 2. Architecture Agent
- Converts product goals into technical architecture, module boundaries, data contracts, and migration plans.
- Owns architecture docs that remain canonical after task-doc pruning.

### 3. Delivery / Tracking Agent
- Keeps backlog status, priorities, dependencies, execution order, and archival state accurate.
- Owns the live tracker docs in `docs/tracking/`.

### 4. Implementation Agent
- Executes tasks only when one active bounded task is documented.
- Must update live trackers and archive completed task context when the task lands.

### 5. QA / Verification Agent
- Defines test strategy, validation checklists, release-readiness criteria, and regression coverage expectations.
- Must record verification status in live tracker docs and archive the lasting conclusion when a task closes.

## Working Rules
1. **Read before writing:** Review `docs/prd/overview.md`, `docs/tracking/master-task-board.md`, `docs/tracking/priority-roadmap.md`, and the active task doc if one exists.
2. **Default live sources of truth:**
   - Product scope summary: `docs/prd/overview.md`
   - Priority order: `docs/tracking/priority-roadmap.md`
   - Current execution status: `docs/tracking/master-task-board.md`
   - Current snapshot: `docs/tracking/progress-status.md`
   - Active task details: `docs/tasks/task-*.md` only when an active task exists
3. **Archived history is optional context:** Read `docs/tracking/completed-work-summary.md` only when archived decisions or shipped-scope history are actually needed.
4. **No silent assumptions:** If something is unclear, record it under `Assumptions` or `Open Questions` instead of hard-coding a decision.
5. **Traceability first:** Every architecture or implementation change should map either to one active task or to an explicit live-tracker decision.
6. **Smallest useful increment:** Prefer one bounded task at a time.
7. **No pseudo-active completed work:** Once a task is done, archive it and remove its completed task doc instead of keeping it in the default read path.
8. **Closed UI-test rerun policy:** Codex agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` inside this Codex environment as part of normal verification. If UI verification is needed, instruct the user to run `npm.cmd run test:ui` locally and treat that user-run result as authoritative.

## Documentation Rules
- Use clear section headings and keep file names stable for live docs.
- Live planning or task docs must include Purpose, Created date, Last Updated date, Related Documents, and Status where relevant.
- Use relative links so contributors can navigate the repo offline.
- Mark uncertain items explicitly as **확실하지 않음** when the source is ambiguous.
- Do not keep completed task docs as permanent history files.

## Task Lifecycle
1. Create or refine one active task doc in `docs/tasks/`.
2. Add or update the corresponding entry in `docs/tracking/master-task-board.md`.
3. Reflect sequencing changes in `docs/tracking/priority-roadmap.md` if priority changes.
4. Start work only after dependencies and open questions are reviewed.
5. When the task becomes `done`, summarize its lasting outcome in `docs/tracking/completed-work-summary.md`.
6. Delete the completed task doc.
7. Delete closed tracking, handoff, comparison, or review docs tied only to that completed work.
8. Remove stale references from live docs so the default agent read path does not grow without bound.

## Validation Expectations
- Planning-only changes must still be checked for broken links where practical, file naming consistency, and live-doc reference consistency.
- Implementation changes must document tests or explain why they are not possible.
- If sandbox restrictions block a needed verification step, give the user the exact local command, expected success signal, and follow-up interpretation.
- Sandbox-only verification limits should be documented explicitly, but once implementation and handoff are otherwise complete they must not keep a task or tracker doc pseudo-active.

## Decision Principles
- Prioritize work that reduces uncertainty for many downstream tasks.
- Prefer modularity over one-off patches.
- Design for local-first development, explicit security boundaries, and future multi-workspace expansion.
- Keep the live documentation set intentionally small; archive summaries are allowed, but active default-read documents should remain minimal.
