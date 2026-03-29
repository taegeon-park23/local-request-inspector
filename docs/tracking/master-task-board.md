# Master Task Board
- **Purpose:** Provide the canonical live execution status for work that is still operationally relevant.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-29
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
| T104 | UI Capture Evidence Baseline | blocked | Historical carry-over task remains blocked on user-local Playwright runtime/screenshots. The original task doc is not present in the repo, so this carried-forward title is **확실하지 않음**. |

## Defined Queue
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| - | No queued bounded task | - | `T105` is archived. Promote one new bounded task only after `T104` is intentionally kept blocked or explicitly unblocked. |

## Current State
- **Current bounded task:** None (`idle` after archiving `T105`; `T104` remains blocked).
- **Most recent archived implementation:** `T105` Workspace Core Layout Primitives Cleanup.
- **Highest-priority next step:** keep `T104` blocked until user-local capture evidence is available, then promote exactly one new bounded task.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-29 after `T105` workspace-core layout primitive cleanup.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI full-suite verification is still needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs.
- Future work must start from one newly promoted bounded task.
- `T074` and `T075` are archived; future secret-storage work should extend their shipped seams instead of reintroducing raw secret persistence into environment JSON.
