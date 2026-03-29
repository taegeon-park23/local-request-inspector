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
| - | No queued bounded task | - | Choose and promote one follow-up slice after `T116` archival or run the user-managed UI verification lane first. |

## Current State
- **Current bounded task:** None. Define and promote exactly one new bounded task before more implementation work begins.
- **Most recent archived implementation:** `T116` Settings Detail Consistency Follow-Up.
- **Dropped task decision:** `T104` UI Capture Evidence Baseline was explicitly dropped by user reprioritization on 2026-03-29; it is no longer treated as a live blocker.
- **Highest-priority next step:** either run the user-managed local UI verification lane or promote one new bounded task for the next polish slice.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-30 after `T116` settings/detail consistency follow-up. `npm.cmd run test:ui` remains user-managed only.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI full-suite verification is still needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs.
- Future work must start from one newly promoted bounded task.
- `T074` and `T075` are archived; future secret-storage work should extend their shipped seams instead of reintroducing raw secret persistence into environment JSON.


