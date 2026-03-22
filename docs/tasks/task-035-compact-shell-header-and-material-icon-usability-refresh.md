# T035 - Compact Shell Header And Material Icon Usability Refresh

- **Purpose:** Compact the oversized shell header and add a bounded Material-style icon system that improves scanability without changing feature semantics, ownership, or server contracts.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-010-frontend-workspace-shell-implementation-plan.md`, `task-027-placeholder-route-mvp.md`, `task-030-request-environment-selection-and-runtime-resolution.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T035 delivered a bounded visual plus light-UX continuation of the Material 3 baseline. The shell header is now a compact desktop row that keeps only the brand mark, a route-only `Workbench / section` breadcrumb, and runtime connection status. Navigation monograms were replaced with a local SVG icon primitive inspired by Material Symbols Rounded, and shared UI primitives plus major route headers, tabs, and primary actions now support icon-plus-label treatment without changing feature semantics or accessible names.

## 2. Why This Task Mattered
- The old top bar spent too much vertical space on brand/supporting copy that was not needed during routine use.
- `T027` and `T030` made more top-level routes and request-level authoring surfaces real, so denser navigation and better scan cues had immediate value.
- The repo already had a Material 3 token baseline, so a client-only usability refresh could improve day-to-day use without reopening backend or state-ownership scope.

## 3. Delivered Scope
### Completed
- compact single-row shell header on desktop with compact wrap on smaller widths
- route-only breadcrumb of `Workbench / current section`
- runtime connection status retained in the shell header with a shell-level icon
- local SVG `AppIcon` primitive with curated Material-style icons
- section metadata updates for nav and breadcrumb icon usage
- icon support in `PanelTabs`, `DetailViewerSection`, and `EmptyStateCallout`
- icon-plus-label treatment for key primary actions and top-level route headers

### Explicitly Still Deferred
- backend or storage API changes
- request/capture/history/mock/environment/script feature semantics changes
- icon-only controls as the primary interaction model
- top-bar environment selector
- new settings mutation controls
- request-stage script attachment/reference changes

## 4. Definition Of Done
This task is complete because all of the following are now true:
- the top shell header is compacted to one main desktop row and only shows the brand mark, route breadcrumb, and runtime connection state
- navigation rail monograms are replaced with section icons while keeping existing label-based accessible names
- shared tabs/detail sections/empty callouts can render optional icons without changing existing text contracts
- top-level route headers and major primary actions use icon-plus-label presentation where planned
- tracking and Material 3 adoption docs reflect the visual-plus-light-UX continuation slice

## 5. Outputs
- this task record
- compact shell/header/nav TSX and CSS updates
- local SVG icon primitive and shared primitive extensions
- top-level route header, tab, and primary-action icon usage
- tracking/doc updates in `../tracking/` and `../architecture/material-3-adoption-plan.md`

## 6. Guardrails
1. Keep this task client-only.
2. Do not change server APIs, storage formats, or runtime DTOs.
3. Keep text labels canonical for accessibility and test stability.
4. Do not turn chips/badges/data cells into icon-heavy surfaces.
5. Treat this as a visual plus light-UX slice, not a feature-flow redesign.

## 7. Validation Results
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 54 tests.

## 8. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: QA / Verification Agent
