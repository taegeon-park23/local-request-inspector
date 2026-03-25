# T093 Workbench Tab Capability Reinforcement

- **Purpose:** Expand the workspace tab workbench so collection/group overview and batch run result can open in main-center tabs, and add close-current/others/all tab controls.
- **Created:** 2026-03-26
- **Last Updated:** 2026-03-26
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../prd/overview.md`
- **Status:** doing

## Scope
- Add non-request workbench tab types for:
  - collection overview
  - request-group overview
  - batch run result
- Open collection/request-group overview tabs from explorer selection.
- Open/update a central batch-result tab during collection/request-group batch runs.
- Add tab-strip actions: close current tab, close other tabs, close all tabs.

## Assumptions
- Existing right-side result panel remains valid; T093 adds a central-tab lane for WB-01/WB-04 parity, not a replacement of the detail panel.
- One shared batch-result tab slot is acceptable for this bounded task (latest run context).

## Acceptance Criteria
1. Selecting a collection opens a collection overview tab in the main workbench.
2. Selecting a request group opens a request-group overview tab in the main workbench.
3. Running a collection or request group opens/updates a central batch-result tab.
4. Tab strip exposes close current/close others/close all actions and the actions function correctly.
5. Existing request authoring tabs, preview/pin behaviors, and reopen-last-closed behavior remain functional.

## Verification Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test:node`
- Playwright smoke in Codex for selection/run/tab-close flows (excluding known explorer overlay block issue).
- UI full-suite verification remains user-managed (`npm.cmd run test:ui`) per AGENTS policy.
