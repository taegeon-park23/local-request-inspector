# T050 - Workspace, Environments, And Scripts Focused Overlay Reuse And Content Preservation

- **Purpose:** Reuse the focused floating-explorer pattern from `T048` and the content-preserving badge/card rules from `T049` across `Workspace`, `Environments`, and `Scripts` so those non-observation routes stay less cluttered while still exposing their critical data inside explorer and detail cards.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-027-placeholder-route-mvp.md`, `task-038-environments-and-scripts-route-localization-pass.md`, `task-039-workspace-authoring-localization-pass.md`, `task-040-workspace-result-panel-localization-pass.md`, `task-048-observation-route-focused-explorer-overlay-and-density-refinement.md`, `task-049-observation-route-card-content-preservation-and-badge-rail-alignment.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T050 is a client-only UX follow-up that extends the already-landed observation-route explorer/card refinements into `Workspace`, `Environments`, and `Scripts`. These routes now share the focused explorer overlay behavior on desktop, auto-collapse explorer on select/create flows that move users into editing, and preserve longer route-local data through wider wrapping card copy plus route-scoped horizontal badge rails. Workspace-specific sticky explorer summary assumptions from this document are superseded by `task-051-workspace-request-flow-and-canonical-request-tree.md`; the Environments and Scripts portions remain current.

## 2. Delivered Scope
### Completed
- switched `Workspace`, `Environments`, and `Scripts` to the shared `focused-overlay` floating explorer variant so explorer open state now uses the compact icon toggle, blocking scrim, and desktop detail hide behavior already proven on the observation routes
- wired explorer auto-collapse only into edit-driving actions:
  - workspace saved-request open
  - workspace new-request creation
  - environment selection and new-environment creation
  - script selection, new-script creation, and template seeding
- kept import/export/filter/search interactions explorer-local so transfer or filtering work does not unexpectedly close the explorer
- added route-local explorer readability support for:
  - workspace selected requests and transfer state, later superseded by `T051` into a canonical persisted tree without the sticky workspace summary card
  - current environment selection/draft with default state, variable counts, updated timestamp, and resolution summary
  - current script selection/draft with stage, template source, updated timestamp, capability summary, and source preview
- reduced explorer row clipping in workspace/environments/scripts by letting core title, URL, description, resolution, and source-preview text wrap instead of disappearing into tighter row widths
- converted environment and script detail headers to the same `copy + badge rail` pattern used in observation routes so only high-priority chips stay in the header while the rest remains in readable summary/meta cards
- applied route-scoped badge-rail/content-preservation CSS to workspace result/header surfaces, environment/script management detail headers, workspace explorer rows, filter grids, summary grids, and script template cards without widening observation-route selectors or global badge behavior
- updated regression coverage for shell-level focused-overlay reuse plus route-level auto-collapse and sticky-summary behavior

### Explicitly Still Deferred
- `Settings` route reuse
- workspace result-panel component structure changes beyond the bounded header/card readability pass
- DTO, API, storage, or runtime payload changes
- top-bar environment selection, request-stage script reference semantics, and broader management-route import/export expansion

## 3. Guardrails
1. The slice remains client-only.
2. Existing workspace execution, replay, CRUD, import/export, and runtime semantics stay unchanged.
3. Global `request-work-surface__badges` behavior remains intact for unrelated surfaces; T050 uses route-scoped overrides only.
4. If UI verification is sandbox-blocked, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- workspace/environments/scripts use the shared focused explorer overlay chrome on desktop
- select/create actions that move into editing collapse the explorer automatically
- environments/scripts expose sticky explorer summary cards with route-relevant data, while the workspace route is later superseded by T051 into a breadcrumb-first canonical request tree
- environment/script detail headers keep only their highest-priority chips in a horizontal rail and preserve other metadata through readable summary text/cards
- docs/tracking reflect the landed `T050` follow-up

## 5. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/app/router/AppRouter.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/environments/components/EnvironmentsPlaceholder.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/app/router/AppRouter.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/environments/components/EnvironmentsPlaceholder.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and all assertions in the four targeted files pass, including the new focused-overlay chrome checks, explorer auto-collapse flows, and sticky summary-card assertions.
  - Manual UI confirmation:
    - open `/workspace`, `/environments`, and `/scripts`
    - confirm the compact explorer toggle opens a focused overlay with a scrim and hidden desktop detail panel
    - confirm request/environment/script selection closes the explorer automatically
    - confirm explorer summaries and detail cards preserve long URLs, descriptions, resolution text, capability text, and source previews without clipping away the core data
  - If the command passes, treat `T050` as fully verified with no additional repo-side follow-up.
  - If the command fails, inspect the new focused-overlay assertions in `AppRouter.test.tsx` and the route-level explorer-summary assertions in the three route placeholder tests before reopening scope.

## 6. Implementation Notes
- `client/features/workspace/components/WorkspaceExplorer.tsx` gained the initial readability hooks in T050, but the workspace-specific sticky summary ownership described here is superseded by `T051` in favor of a canonical tree plus inline breadcrumb.
- `client/features/environments/components/EnvironmentsRoute.tsx` and `client/features/scripts/components/ScriptsRoute.tsx` now close the explorer when moving into editing, expose current-summary cards inside the explorer, and use management-detail badge-rail hooks.
- `client/app/shell/material-theme.css` now includes a non-observation follow-up block for workspace/management explorer summary cards, filter grids, detail-header badge rails, summary grids, and template-card wrapping without changing the observation-route-only `T049` selectors.

## 7. Recommended Follow-Up Direction
- If later polish resumes here, keep it bounded to one concern such as `Settings` reuse, workspace result-panel internal card rebalancing, or management-route mobile tuning rather than reopening a broad shell redesign.



