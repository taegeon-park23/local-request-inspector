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
| T075 | Secret Backend Contract And Capability Surface | doing | Active bounded task doc: `../tasks/task-t075-secret-backend-contract.md`. Contract seams are now in code (`status/store/resolve/clear`, mutation planner, execution-time resolve hook, runtime-status optional provider metadata), with closeout docs pending archival decision. |

## Defined Post-T075 Queue
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| T076 | Workspace UI V2 Canon Refresh | todo | Defined but not promotable until `T075` is closed and archived. Owns the canonical product/architecture refresh for the recursive explorer, preview/pinned tabs, Quick Request, thin create flows, and first-wave non-goals. |
| T077 | Recursive Tree And Placement Contract | todo | Defined post-`T075` follow-up for `parentRequestGroupId`, recursive tree DTOs, same-collection nesting validation, and empty-subtree delete rules. |
| T078 | Workbench Tabs And Quick Request | todo | Defined post-`T075` follow-up for preview/pinned tabs, session-only quick requests, detached-save promotion, and context-seeded request creation. |
| T079 | Runnable Containers And Batch Results | todo | Defined post-T075 follow-up for collection/request-group runs, sequential batch execution DTOs, and right-panel batch result switching. |

## Current State
- **Current bounded task:** `T075` is in progress.
- **Most recent archived implementation:** `T074` secret environment fail-closed policy, settings diagnostics, and legacy secret-row sanitize/reporting.
- **Highest-priority next step:** finish `T075` closeout by confirming tracker/document sync and deciding whether to archive immediately or keep it active for final review.
- **Post-`T075` staged queue:** `T076 -> T077 -> T078 -> T079` is now defined in live docs, but none of those tasks should be promoted in the tracker until `T075` is closed and archived.
- **Verification baseline:** `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test:node` passed on 2026-03-25 after the T075 provider-contract updates. `check:app` still reports the known `/app` built-shell gap plus sandbox `spawn EPERM` limits for `build:client` and `test:ui`.
- **Codex smoke baseline:** Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- **Closed UI-test rerun policy:** agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- **Codex UI verification lane:** use the Playwright skill workflow against the dev route or built shell when available.
- **User-managed local verification:** if UI verification still needs the full UI suite, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Operational Notes
- Completed task history now lives only in `completed-work-summary.md`.
- `docs/tasks/` is reserved for active or incomplete task docs only.
- Future work must start from a newly defined bounded task, not from reopening archived task files.
- `T074` is archived; future secret-storage work should extend the shipped fail-closed policy, runtime-status secret diagnostics, and ordinary-environment sanitization seam instead of reintroducing raw secret persistence into environment JSON.
