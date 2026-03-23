# T044 - Single-Panel Route Tabs Layout

- **Purpose:** Replace the current explorer/main/detail three-column route layout with a single-panel tabbed route layout so one route panel occupies the full main surface at a time.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-043-shell-density-and-collapsible-navigation-refinement.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `task-047-route-panel-scroll-containment-follow-up.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T044 is a client-only layout refactor. Instead of rendering explorer, main work surface, and contextual detail as three simultaneous columns inside each top-level route, each route now exposes those areas as route-local tabs so one panel fills the full shell content area at a time.

## 2. Planned Scope
### In Scope
- add a shared route-panel tab layout primitive
- convert Workspace, Captures, History, Mocks, Environments, Scripts, Settings, and shared placeholders to the single-panel tab pattern
- update shell-content styling so the route owns one full-width content area
- keep explorer/main/detail semantics and aria labels intact, even though they are now tab-selected panels
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
- each top-level route uses route-local tabs instead of the simultaneous three-column route panel layout
- one active route panel fills the full content area at a time
- existing panel labels remain present for accessibility and tests
- affected integration tests are updated for the new interaction pattern
- docs/tracking reflect the landed change and bounded scope

## 5. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `npm.cmd run test:ui`

If `npm.cmd run test:ui` remains sandbox-blocked, request a local rerun with the exact command and expected all-pass result.

## 6. Implementation Notes
- T047 later tightened the shell height and route-panel overflow contract so the T044 single-panel tabs stay inside the main surface without exposing extra page background when route content grows.
- Added a shared route-panel tab layout in `client/features/shared-section-placeholder.tsx` so explorer, main surface, and contextual detail render as route-local tabs instead of simultaneous columns.
- Converted `Workspace`, `Captures`, `History`, `Mocks`, `Environments`, `Scripts`, `Settings`, and the shared placeholder path to the single-panel route-tab pattern.
- Updated shell layout CSS so the route content area is one full-width surface and each top-level route panel now occupies the full main region while inactive panels remain mounted to preserve feature state.
- Added route-panel tab labels to the shared i18n catalog and expanded shell smoke coverage in `client/app/router/AppRouter.test.tsx`.

## 7. Validation Results
- `npm.cmd run typecheck` — passed in sandbox on 2026-03-23
- `npm.cmd run lint:client` — passed in sandbox on 2026-03-23
- `npm.cmd run test:ui` — sandbox-blocked by `sandbox_esbuild_transform_blocked` / `spawn EPERM`; use local rerun handoff per `AGENTS.md`
