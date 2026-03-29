# Master Task Board
- **Purpose:** Provide the canonical live execution status for work that is still operationally relevant.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-30
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
| - | No active bounded task | - | Promote exactly one new bounded task before starting the next implementation slice. |

## Defined Queue
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| - | No queued bounded task | - | Choose and promote one follow-up slice after `T118`. |

## Current State
- **Current bounded task:** none.
- **Most recent archived implementation:** `T118` Narrow-Width Management Surface Polish.
- **Dropped task decision:** `T104` UI Capture Evidence Baseline was explicitly dropped by user reprioritization on 2026-03-29; it is no longer treated as a live blocker.
- **Highest-priority next step:** run user-managed local UI verification (`npm.cmd run test:ui` plus medium-width checks) or promote one new bounded polish slice if additional implementation work is still needed.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-30 after `T118` medium-width route-panel polish. Playwright smoke also confirmed that `/environments` and `/scripts` drop into stacked surface/detail tabs with the explorer collapsed at `1100px`. Direct Codex-side vitest execution remains blocked by local PowerShell execution policy and a Vite/esbuild `spawn EPERM`; `npm.cmd run test:ui` remains user-managed only.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI full-suite verification is still needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs.
- Future work must start from one newly promoted bounded task.
- `T074` and `T075` are archived; future secret-storage work should extend their shipped seams instead of reintroducing raw secret persistence into environment JSON.



