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
| T075 | Secret Backend Contract And Capability Surface | todo | Active bounded task doc: `../tasks/task-t075-secret-backend-contract.md`. This task owns the first secure secret provider contract, status/store/resolve/clear semantics, and migration/reporting rules that build on the shipped T074 fail-closed baseline. |

## Current State
- **Current bounded task:** `T075` is defined and ready to start.
- **Most recent archived implementation:** `T074` secret environment fail-closed policy, settings diagnostics, and legacy secret-row sanitize/reporting.
- **Highest-priority next step:** start `T075` by fixing the first provider contract for `status`, `store`, `resolve`, `clear`, and migration/reporting semantics before attaching a real secure backend.
- **Verification baseline:** `npm.cmd run check` passed on 2026-03-25, including the T074 settings/runtime-status diagnostics, legacy secret sanitize coverage, and fail-closed environment route coverage. `check:app` still reports the known `/app` built-shell gap plus sandbox `spawn EPERM` limits for `build:client` and `test:ui`.
- **Codex smoke baseline:** Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI verification still needs the full UI suite, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history now lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs only.
- Future work must start from a newly defined bounded task, not from reopening archived task files.
- `T074` is archived; future secret-storage work should extend the shipped fail-closed policy, runtime-status secret diagnostics, and ordinary-environment sanitization seam instead of reintroducing raw secret persistence into environment JSON.
