# Master Task Board
- **Purpose:** Provide the canonical live execution status for work that is still operationally relevant.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-26
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
| - | No active bounded task | - | Promote one bounded task from the roadmap before starting implementation changes. |

## Defined Queue
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| - | No queued bounded task | - | Define the next bounded task when promotion criteria are agreed. |

## Current State
- **Current bounded task:** None (`idle` until the next bounded task is promoted).
- **Most recent archived implementation:** `T102` Browser-Style One-Line Tab Rail + Horizontal Scroll Conversion.
- **Highest-priority next step:** promote the next bounded task and keep single-task execution discipline.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-26 after `T102` tab-shell browser-rail and pin-icon updates.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI full-suite verification is still needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs.
- Future work must start from one newly promoted bounded task.
- `T074` and `T075` are archived; future secret-storage work should extend their shipped seams instead of reintroducing raw secret persistence into environment JSON.

