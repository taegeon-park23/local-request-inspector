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
| - | (No active bounded task) | - | `T075` is archived. Promote one next bounded task (`T076`) when follow-up implementation starts. |

## Defined Post-T075 Queue
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| T076 | Workspace UI V2 Canon Refresh | todo | Next promotable bounded task after archived `T075`. Owns canonical product/architecture refresh for recursive explorer, preview/pinned tabs, Quick Request, thin create flows, and first-wave non-goals. |
| T077 | Recursive Tree And Placement Contract | todo | Follow-up for `parentRequestGroupId`, recursive tree DTOs, same-collection nesting validation, and empty-subtree delete rules. |
| T078 | Workbench Tabs And Quick Request | todo | Follow-up for preview/pinned tabs, session-only quick requests, detached-save promotion, and context-seeded request creation. |
| T079 | Runnable Containers And Batch Results | todo | Follow-up for collection/request-group runs, sequential batch execution DTOs, and right-panel batch result switching. |

## Current State
- **Current bounded task:** none active (awaiting next promotion).
- **Most recent archived implementation:** `T075` secret provider contract/capability seam (`status/store/resolve/clear`), environment mutation planner, execution-time secret resolve hook, and runtime-status optional provider metadata.
- **Highest-priority next step:** promote `T076` as the next single bounded task before new implementation work starts.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-25 for the archived `T075` changes.
- **Codex smoke baseline:** Playwright smoke passed on 2026-03-25 for workspace route load, settings route load, and runtime-status endpoint reachability.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI verification still needs the full UI suite, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history now lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs only.
- Future work must start from one newly promoted bounded task, not from reopening archived task files.
- `T074` and `T075` are archived; future secret-storage work should extend their shipped seams instead of reintroducing raw secret persistence into environment JSON.
