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
| T074 | Secret Environment Fail-Closed Policy | doing | Active bounded task doc: `../tasks/task-t074-secret-environment-fail-closed.md`. This task owns the secret-storage seam, fail-closed environment mutation policy, write-only environment-record shape, and secret capability follow-up. |

## Current State
- **Current active implementation:** `T074` secret environment fail-closed policy.
- **Most recent archived implementation:** `T073` server decomposition, runtime hardening, replay/transfer follow-up, and documentation cleanup.
- **Highest-priority next step:** keep `T074` bounded to fail-closed secret handling: carry the new policy into diagnostics/status guidance and decide whether legacy secret-bearing records need an explicit migration/reporting seam.
- **Verification baseline:** `npm.cmd run check` passed on 2026-03-25, including the updated environment record/resolution tests and the new `server/register-environment-script-routes.test.js` fail-closed coverage. `check:app` still reports the known `/app` built-shell gap plus sandbox `spawn EPERM` limits for `build:client` and `test:ui`.
- **Codex smoke baseline:** Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI verification still needs the full UI suite, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history now lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs only.
- Future work must start from a newly defined bounded task, not from reopening archived task files.
- `T073` is archived; future work should build on its route/service and repository seams rather than reintroducing monolithic server patterns.
