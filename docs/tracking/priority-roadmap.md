# Priority Roadmap

- **Purpose:** Show the live delivery sequence after completed work has been archived out of the default read path.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `progress-status.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update when a new bounded task is promoted or when the live verification baseline changes.

## Roadmap Snapshot
1. Foundation, architecture, UX, QA, tooling, and shipped implementation history are archived in `completed-work-summary.md`.
2. No bounded task is currently active.
3. The next implementation step must begin with one newly defined task in `docs/tasks/` plus matching live-tracker updates.

## Current Sequencing Rules
- Do not reopen archived completed task docs.
- Define one bounded task at a time and keep the live tracking surface small.
- Keep Codex-side UI reruns closed; if UI verification is needed, instruct the user to run `npm.cmd run test:ui` locally.

## Immediate Next Step
- If implementation resumes, create one new bounded task doc, add it to `master-task-board.md`, and only then start coding.
