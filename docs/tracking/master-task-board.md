# Master Task Board
- **Purpose:** Provide the canonical live execution status for work that is still operationally relevant.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `priority-roadmap.md`, `progress-status.md`, `completed-work-summary.md`, `../prd/overview.md`, `../architecture/overview.md`
- **Update Rule:** Update when an active task is created, completed, blocked, reprioritized, or archived.

## Status Legend
- `todo`: defined but not started
- `doing`: actively in progress
- `blocked`: waiting on a non-sandbox dependency or product decision
- `done`: completed and already archived into `completed-work-summary.md`

## Active Register
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| None | No active bounded task | n/a | All previously completed work has been archived into `completed-work-summary.md`. |

## Current State
- **Current active implementation:** none.
- **Most recent archived implementation:** `T072` request-stage linked reusable-script reference baseline.
- **Highest-priority next step:** create one new bounded task before resuming implementation.
- **Verification baseline:** `npm.cmd run check` and `npm.cmd run test:node` passed on 2026-03-24.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **User-managed local verification:** if UI verification is needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history now lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs only.
- Future work must start from a newly defined bounded task, not from reopening archived task files.
- Saved-request export and workspace authored-resource export still reject linked request-stage bindings until a future task explicitly owns linked-request transfer semantics.
