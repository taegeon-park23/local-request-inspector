# T044 - Single-Panel Route Tabs Layout

- **Purpose:** Replace the current explorer/main/detail three-column route layout with a single-panel tabbed route layout so one route panel occupies the full main surface at a time.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-043-shell-density-and-collapsible-navigation-refinement.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T044 is a client-only layout refactor. The original landed slice replaced simultaneous explorer/main/detail columns with route-local tabs. This follow-up keeps that route-tab baseline for observation and placeholder routes, but workspace-oriented management/authoring routes now bypass it with a floating explorer dock so explorer selection updates the visible main and detail surfaces immediately.

## 2. Planned Scope
### In Scope
- add a shared route-panel tab layout primitive
- convert Workspace, Captures, History, Mocks, Environments, Scripts, Settings, and shared placeholders to the single-panel tab pattern
- update shell-content styling so the route owns one full-width content area
- keep explorer/main/detail semantics and aria labels intact, even when workspace-oriented routes bypass the tab strip with a floating explorer dock
- update smoke/integration tests that depend on the previous always-visible three-panel layout

### Explicitly Out Of Scope
- backend or persistence changes
- request/capture/history/mock semantics changes
- docking, split resizing, or multi-panel persistence
- broader information architecture redesign beyond the current three canonical route panels

## 3. Guardrails
1. The slice must remain client-only.
2. Route-local panel state must not reset underlying feature state when tabs switch.
3. Existing explorer/main/detail semantics should remain explicit in DOM labels and test contracts.
4. If sandbox UI verification is blocked, local rerun handoff should be used per `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- observation/placeholder routes keep route-local tabs, while workspace-oriented routes can bypass them with a floating explorer dock
- workspace, environments, and scripts show explorer selection results in the visible main/detail surfaces without requiring a second tab click
- existing panel labels remain present for accessibility and tests
- affected integration tests are updated for the new interaction pattern
- docs/tracking reflect the landed change and bounded scope

## 5. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `npm.cmd run test:ui`

If `npm.cmd run test:ui` remains sandbox-blocked, request a local rerun with the exact command and expected all-pass result.

## 6. Implementation Notes
- Added a shared route-panel layout primitive in `client/features/shared-section-placeholder.tsx` that still supports route-local tabs for observation/placeholder routes but can also render a floating explorer dock for workspace-oriented routes.
- Converted `Workspace`, `Environments`, and `Scripts` to the floating explorer mode so explorer, main, and detail stay mounted together and selection updates are visible immediately.
- Added shell-store persistence for per-route floating explorer open/collapsed state and responsive dock/overlay CSS in `client/app/shell/material-theme.css`.
- Expanded shell and route tests so workspace-oriented routes cover explorer-driven selection visibility plus explorer collapse/expand behavior without extra route-panel tab clicks.

## 7. Validation Results
- `npm run typecheck` — passed in sandbox on 2026-03-23 after the floating-explorer follow-up
- `npm run lint:client` — passed in sandbox on 2026-03-23 after the floating-explorer follow-up
- `npm run test:ui -- client/app/router/AppRouter.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/environments/components/EnvironmentsPlaceholder.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx` — passed in sandbox on 2026-03-23 after the floating-explorer follow-up
