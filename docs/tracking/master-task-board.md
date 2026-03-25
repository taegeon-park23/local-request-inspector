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
| - | No active bounded task | - | Promote exactly one new bounded task before starting additional implementation work. |

## Defined Queue
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| T093 | Workbench Tab Capability Reinforcement | todo | Align with PRD WB-01/WB-04 must/should coverage after `T092` archival. |

## Current State
- **Current bounded task:** none (awaiting next promotion).
- **Most recent archived implementation:** `T092` Request Create Sheet Unification.
- **Highest-priority next step:** promote `T093` as the next single active bounded task.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-26 after `T088/T089/T091` implementation updates.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI full-suite verification is still needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs.
- Future work must start from one newly promoted bounded task.
- `T074` and `T075` are archived; future secret-storage work should extend their shipped seams instead of reintroducing raw secret persistence into environment JSON.

