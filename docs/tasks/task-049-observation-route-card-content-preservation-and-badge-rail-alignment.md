# T049 - Observation Route Card Content Preservation And Badge-Rail Alignment

- **Purpose:** Refine the `Captures`, `History`, and `Mocks` observation routes so explorer/detail cards preserve long data instead of clipping it, detail headers keep high-priority status badges on one horizontal rail, and timeline/detail cards avoid the nested-card compression that made narrow panels hard to read.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-014-history-inspector-behavior-spec.md`, `task-041-captures-observation-route-localization-pass.md`, `task-042-history-observation-route-localization-pass.md`, `task-044-single-panel-route-tabs-layout.md`, `task-045-mocks-route-localization-pass.md`, `task-047-route-panel-scroll-containment-follow-up.md`, `task-048-observation-route-focused-explorer-overlay-and-density-refinement.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T049 is a client-only observation-route readability follow-up on top of `T048`. The focused overlay remains intact, but the internal cards are rebalanced so high-priority badges stay on one horizontal rail, lower-priority metadata moves into readable text/meta sections, explorer rows preserve more text, and capture/history timeline entries no longer use a visually compressed double-card structure inside the narrow detail panel.

## 2. Delivered Scope
### Completed
- converted the observation-route detail headers into a two-column `copy + badge rail` layout so `method` and primary status badges stay on one horizontal rail on desktop and still wrap as a row on narrower widths
- reduced the detail-header badge sets to high-priority state only:
  - `History`: `method`, `executionOutcome`, `transportOutcome`
  - `Captures`: `method`, `mockOutcome`
  - `Mocks`: `ruleState`, `priority`
- moved lower-priority metadata such as history source/tests, capture scope/time, and mock fixed-delay/source into header meta text plus summary-card metadata instead of stacking them in the header badge rail
- reduced explorer-row top badges so secondary chips no longer compete for the first line, and moved that information into the row meta text
- relaxed text clipping rules across explorer rows, selected-summary cards, detail card descriptions, key-value metadata, and preview blocks so long path/body/status text wraps instead of disappearing behind ellipsis
- widened the observation summary-card grids so route-specific cards break into additional rows earlier instead of compressing long content into unreadable columns
- simplified capture/history timeline rendering so the list item owns only the rail structure while the inner `DetailViewerSection` remains the single visible card surface
- updated route-level regression tests to cover the new badge-rail composition, lower-priority metadata placement, long-string rendering, and single-card timeline structure

### Explicitly Still Deferred
- workspace/environments/scripts card density follow-up
- broader shell layout redesign, split resizing, or docking changes
- DTO, API, or storage-schema changes for observation records
- deeper trace viewers, virtualization, or additional observation tabs

## 3. Guardrails
1. The slice remains client-only.
2. Existing observation DTOs, runtime payload semantics, and replay behavior stay unchanged.
3. Only `Captures`, `History`, and `Mocks` receive the new header/card readability overrides.
4. If UI verification is sandbox-blocked, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- observation-route detail headers keep their high-priority badges on a horizontal rail without stacking into one-badge-per-line columns
- low-priority header metadata is still visible through meta text or summary cards after leaving the badge rail
- explorer rows and selected-summary cards preserve long path/body/matcher text by wrapping instead of truncating it away
- capture/history timeline entries render as a single visible card surface inside each timeline row
- task/tracking docs reflect the landed follow-up under `T049`

## 5. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/history/components/HistoryPlaceholder.test.tsx client/features/captures/components/CapturesPlaceholder.test.tsx client/features/mocks/components/MocksPlaceholder.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/features/history/components/HistoryPlaceholder.test.tsx client/features/captures/components/CapturesPlaceholder.test.tsx client/features/mocks/components/MocksPlaceholder.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and all assertions in the three targeted files pass, including the new header badge-rail composition, long-text rendering, and single-card timeline structure checks.
  - Manual UI confirmation: open `/history`, `/captures`, and `/mocks`, then confirm the detail-header badge rail stays horizontal, long path/body strings remain readable, and the right-side timeline/detail cards do not show the previous compressed double-card framing.
  - If the command passes, treat `T049` as fully verified with no additional repo-side follow-up.
  - If the command fails, inspect the route-level badge-rail assertions in the three observation-route placeholder tests before reopening scope.

## 6. Implementation Notes
- `client/app/shell/material-theme.css` now adds route-scoped observation-detail overrides instead of changing the global `request-work-surface__badges` behavior shared with Workspace.
- `client/features/history/components/HistoryPlaceholder.tsx`, `client/features/captures/components/CapturesPlaceholder.tsx`, and `client/features/mocks/components/MocksPlaceholder.tsx` now move low-priority header metadata out of the badge rail and expose timeline entry class hooks for the single-card detail structure.
- Tests focus on structure and visible data placement rather than pixel styling: header badge membership, full-string rendering, and direct-child timeline card composition.

## 7. Recommended Follow-Up Direction
- If later observation-route polish resumes, keep it bounded to one concern such as mobile detail-panel tuning, richer summary-card action placement, or reusing the same content-preserving card rules in non-observation routes after this narrower pattern settles.
