# Master Task Board
- **Purpose:** Provide the canonical live execution status for work that is still operationally relevant.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
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
| T073 | Server Decomposition, Runtime Hardening, and Replay/Transfer Follow-Up | doing | Active bounded task doc: `../tasks/task-t073-server-decomposition.md`. This task owns the server split, child-process runner, observation follow-up, replay completion, linked-script transfer follow-up, and live-doc cleanup. |

## Current State
- **Current active implementation:** `T073` server decomposition, runtime hardening, replay/transfer follow-up, and documentation cleanup.
- **Most recent archived implementation:** `T072` request-stage linked reusable-script reference baseline.
- **Highest-priority next step:** continue `T073` by moving the remaining execution helpers out of `server.js`, then finish the last production false-success cleanup and live-doc alignment after the runtime-events fallback hardening.
- **Verification baseline:** `npm.cmd run check` and `npm.cmd run test:node` passed on 2026-03-25, including the expanded `server/*.test.js` HTTP seam coverage for request-resource, environment/script, execution, and resource-bundle routes.
- **Codex smoke baseline:** Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI verification still needs the full UI suite, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history now lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs only.
- Future work must start from a newly defined bounded task, not from reopening archived task files.
- `T073` explicitly owns the linked request-stage transfer follow-up, replay completion, and runtime API expansion that were previously deferred.


