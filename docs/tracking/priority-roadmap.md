# Priority Roadmap

- **Purpose:** Show the live delivery sequence after completed work has been archived out of the default read path.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `master-task-board.md`, `progress-status.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update when a new bounded task is promoted or when the live verification baseline changes.

## Roadmap Snapshot
1. Foundation, architecture, UX, QA, tooling, and shipped implementation history are archived in `completed-work-summary.md`.
2. `T073` is archived into `completed-work-summary.md`.
3. `T074` is the active bounded task and owns the current security/persistence hardening lane.

## Current Sequencing Rules
- Do not reopen archived completed task docs.
- Define one bounded task at a time and keep the live tracking surface small.
- Keep Codex-side UI reruns closed; use the Playwright skill for Codex-side UI smoke and reserve `npm.cmd run test:ui` for user-managed local verification.

## Immediate Next Step
- Execute `T074`:
- keep secret replacement writes fail-closed until a secure backend exists
- keep ordinary environment JSON free of raw secret values
- decide whether diagnostics or migration/reporting should surface the new secret-backend limitation more explicitly
