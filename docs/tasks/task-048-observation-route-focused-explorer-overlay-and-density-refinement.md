# T048 - Observation Route Focused Explorer Overlay And Density Refinement

- **Purpose:** Refine the `Captures`, `History`, and `Mocks` route explorers so the floating explorer behaves as a focused overlay, the visible main/detail surfaces are less noisy while the explorer is open, and the explorer list cards expose bounded high-signal summaries without clipping important data.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-014-history-inspector-behavior-spec.md`, `task-041-captures-observation-route-localization-pass.md`, `task-042-history-observation-route-localization-pass.md`, `task-044-single-panel-route-tabs-layout.md`, `task-045-mocks-route-localization-pass.md`, `task-047-route-panel-scroll-containment-follow-up.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T048 is a client-only UX follow-up on top of the floating explorer baseline from `T044` and the panel containment fix from `T047`. Observation routes now keep the explorer as a floating pattern, but when it is open it behaves like a focused overlay: the explorer sits above a scrim, the detail column is hidden on desktop, and list selection collapses the explorer back into the normal main/detail reading mode. The explorer internals also shift from taller multi-line cards toward compact list rows plus a sticky selected-summary card so important observation data stays readable in a narrow surface.

## 2. Delivered Scope
### Completed
- added a focused-overlay floating explorer variant to `RoutePanelTabsLayout` without changing backend contracts or storage behavior
- introduced scrimmed observation-route explorer behavior that hides the desktop detail column while the explorer is open and preserves the existing narrow-screen drawer pattern
- reduced the floating explorer toggle to a compact icon button while preserving the same expand/collapse accessible names
- updated `Captures`, `History`, and `Mocks` so selecting a list row closes the explorer and returns emphasis to the main/detail reading surfaces
- added sticky explorer summary cards for the currently selected capture, execution, or mock rule so high-signal metadata stays visible without relying on the taller list rows
- compressed observation-route explorer list rows by trimming badge count, reducing padding/min-height, and clamping long text instead of forcing everything into full-height cards
- updated route tests and shell tests to cover focused-overlay visibility, summary-card rendering, and auto-collapse after selection

### Explicitly Still Deferred
- workspace/environments/scripts explorer redesign
- split resizing, persistent multi-panel docking, or broader shell IA changes
- DTO, API, or storage-schema changes for observation records
- new deep-detail tabs, trace viewers, or richer per-row virtualization

## 3. Guardrails
1. The slice remains client-only.
2. Existing observation DTOs and replay semantics stay unchanged.
3. Focused overlay applies only to `Captures`, `History`, and `Mocks`; authoring/management routes outside that set keep their current explorer behavior.
4. If UI verification is sandbox-blocked, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- observation routes can opt into a focused floating explorer variant
- a visible scrim blocks background interaction while the focused explorer is open
- the observation-route detail column hides while the focused explorer is open on desktop widths
- capture/history/mock list selection closes the explorer automatically
- selected-summary cards render inside the explorer and stay aligned with the current selected row
- observation list rows use the reduced-density layout without losing key state/path/time information
- task/tracking docs reflect the landed follow-up under `T048`

## 5. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/app/router/AppRouter.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/features/captures/components/CapturesPlaceholder.test.tsx client/features/mocks/components/MocksPlaceholder.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/app/router/AppRouter.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/features/captures/components/CapturesPlaceholder.test.tsx client/features/mocks/components/MocksPlaceholder.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and all assertions in the four targeted files pass, including the new focused-overlay detail-visibility, sticky selected-summary, and explorer auto-collapse checks.
  - If the command passes, treat `T048` as fully verified with no additional repo-side follow-up.
  - If the command fails, inspect the focused-overlay visibility assertions in `AppRouter.test.tsx` and the route-specific selected-summary/auto-collapse assertions in the observation-route placeholder tests before reopening scope.

## 6. Implementation Notes
- `client/features/shared-section-placeholder.tsx` now owns a `focused-overlay` floating explorer variant rather than forcing every floating explorer to use the same visual interaction model.
- `client/app/shell/material-theme.css` now contains the focused overlay scrim/detail-hide styling plus the explorer summary/list density overrides instead of reopening shell structure or route DTO semantics.
- `client/features/history/components/HistoryPlaceholder.tsx`, `client/features/captures/components/CapturesPlaceholder.tsx`, and `client/features/mocks/components/MocksPlaceholder.tsx` now each expose a sticky explorer summary card and collapse the explorer after direct list selection.
- Tests stay focused on interaction outcomes: detail visibility state, accessible toggle labels, summary-card presence, and explorer auto-collapse.

## 7. Recommended Follow-Up Direction
- If later explorer polish resumes, keep it bounded to one concern such as summary-card action affordances, mobile safe-area tuning, or extending the same density rules to `Workspace`/`Environments`/`Scripts` after this observation-route variant has settled.
