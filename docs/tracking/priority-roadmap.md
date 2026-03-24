# Priority Roadmap

- **Purpose:** Show the live delivery sequence after completed work has been archived out of the default read path.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `progress-status.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update when a new bounded task is promoted or when the live verification baseline changes.

## Roadmap Snapshot
1. Foundation, architecture, UX, QA, tooling, and shipped implementation history are archived in `completed-work-summary.md`.
2. `T073` is the active bounded task and owns the current implementation lane.
3. Follow-up work stays inside `T073` until the server/runtime split, replay/transfer follow-up, and live-doc cleanup are complete.

## Current Sequencing Rules
- Do not reopen archived completed task docs.
- Define one bounded task at a time and keep the live tracking surface small.
- Keep Codex-side UI reruns closed; use the Playwright skill for Codex-side UI smoke and reserve `npm.cmd run test:ui` for user-managed local verification.

## Immediate Next Step
- Execute `T073`:
- Decompose `server.js` into route/service seams.
- Introduce explicit storage repositories.
- Land the runtime API, replay, transfer, and doc follow-up owned by this task.
