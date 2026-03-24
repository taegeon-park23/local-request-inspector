# T073 Server Decomposition

- **Purpose:** Decompose the server runtime into bounded route and service seams, replace direct storage access with explicit repositories, and establish the execution/observation interfaces needed for the next follow-up tasks.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-25
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../architecture/internal-api-contracts.md`, `../architecture/script-execution-safety-model.md`
- **Status:** doing
- **Update Rule:** Update when the implementation scope, blockers, or verification status changes.

## Scope
- Split `server.js` so route registration and runtime orchestration do not live in one file.
- Introduce explicit resource repositories and runtime query repositories in `storage/repositories/`.
- Land the first public API additions needed by the next follow-up tasks without breaking the current client payload shape.

## In Scope
- Server route decomposition for runtime status, resource management, execution, observation, and legacy compatibility.
- Repository registry expansion beyond raw `resourceStorage` and `runtimeStorage`.
- Child-process-backed script stage runner, bounded cancellation plumbing, and redaction-safe execution persistence.
- Observation and replay follow-ups that depend on the new server boundaries.
- Authored-resource transfer follow-up for linked request-stage saved-script bindings.

## Out of Scope
- Rewriting the entire frontend information architecture.
- Replacing the legacy `/` prototype route in this task.
- Reintroducing archived task documents for already completed work.

## Verification Plan
- `npm.cmd run check`
- Playwright skill smoke on the dev route after implementation changes land
- User-managed local `npm.cmd run test:ui` only if a final UI confirmation is needed outside Codex

## Notes
- This task intentionally owns the downstream T074-T078 implementation slices so the live tracker can stay bounded to one active task.
- Codex-side UI verification must use the Playwright skill workflow rather than rerunning `npm.cmd run test:ui`.

## Progress
- Extracted persisted execution log, test-result, error-summary, and history presentation helpers into `server/execution-observation-service.js`, so execution routes and runtime history routes now share a bounded observation service instead of another large inline `server.js` block.
- Extracted inbound capture persistence, presentation, and replay helpers into `server/capture-observation-service.js`, so legacy inspector and runtime routes now share a bounded observation service instead of another large inline `server.js` block.
- Renamed misleading implemented `Placeholder` route/surface artifacts to `Route`, `RequestWorkSurface`, and `RequestResultPanel`, and removed thin placeholder alias wrappers that no longer matched the shipped UI.
- Updated live PRD/architecture docs so already-landed stack, persistence, routing, and child-process runner decisions are no longer described as still-open by default.
- Moved request placement, saved-request normalization, request-tree building, and bundle helper logic into `server/request-resource-service.js`, so `server.js` now wires those helpers through a bounded service seam instead of defining them inline.
- Extracted the execution run entrypoint into `server/register-execution-routes.js`, leaving `server.js` with registration and helper orchestration instead of a direct `/api/executions/run` route body.
- Extracted request list/tree, collection CRUD, request-group CRUD, and saved-request CRUD routes into `server/register-request-resource-routes.js`.
- Extracted authored resource bundle export/import routes into `server/register-resource-bundle-routes.js`.
- Extracted environment CRUD, saved-script CRUD, and script-template read routes into `server/register-environment-script-routes.js`.
- Extracted mock-rule CRUD, enable/disable, and single-rule bundle export routes into `server/register-mock-rule-routes.js`.
- Extracted built-shell status/static `/app` route registration and fallback rendering into `server/register-app-shell-routes.js`, so `server.js` keeps only the returned `getClientShellStatus()` hook used by runtime status responses and startup logging.
- Extracted app-shell/runtime status endpoints into `server/register-status-routes.js`, and moved SSE plus raw-body parser bootstrap into `server/configure-runtime-stream.js`.
- Added explicit repository seams for resource storage and runtime queries, and moved history/capture reads onto `repositories.runtime.queries`.
- Extracted runtime cancellation/history/capture route registration out of `server.js` into `server/register-runtime-routes.js` so the execution entrypoint and runtime observation routes are no longer defined in one monolithic block.
- Extracted legacy inspector mock/assets/execute routes and the inbound capture catch-all into `server/register-legacy-inspector-routes.js`, and switched inbound mock-rule evaluation to the repository seam instead of raw storage scans.
- Landed bounded execution follow-up APIs for cancellation, replay, persisted result reads, and persisted test-result reads while preserving the existing route payload shape.
- Replaced the legacy in-server VM execution path with bounded runner modules, including worker-thread fallback for spawn-restricted sandbox environments and redaction-safe freeform console handling.
- Rewired request-resource, environment/script, mock-rule, execution, resource-bundle, and legacy capture routes to use `repositories.resources.*` and `repositories.runtime.queries` instead of direct raw storage calls inside the route modules.
- Extracted repository-backed environment/script helpers into `server/environment-script-resource-service.js` and mock-rule normalization/list helpers into `server/mock-rule-resource-service.js`, so `server.js` no longer carries those authored-resource bootstrap blocks inline.
- Extracted authored resource-bundle import parsing, normalization, and plan preparation into `server/resource-bundle-import-service.js`, reducing `server.js` from 1686 lines to 1256 lines while preserving the existing route payload shape.
- Added Node HTTP seam coverage for environment default reconciliation and script listing via `server/register-environment-script-routes.test.js`.
- Extracted request-seed construction, stage execution mapping, transport helpers, and console/test aggregation into `server/execution-flow-service.js`, reducing `server.js` from 1256 lines to 868 lines while keeping the existing execution route payload shape.
- Added direct seam coverage for the new execution flow service via `server/execution-flow-service.test.js`.
- Extracted runtime request snapshot redaction, response preview policy, and immediate execution presentation helpers into `server/runtime-presentation-service.js`, reducing `server.js` from 868 lines to 526 lines and adding direct seam coverage in `server/runtime-presentation-service.test.js`.
- Replaced the default runtime-events synthetic fallback with an explicit offline adapter, while the shared test renderer now opts into synthetic runtime events on purpose so production no longer masks missing live EventSource support.
- Removed production fallback-to-empty behavior from the workspace request tree/request list loader, so saved-resource route failures now surface as explicit degraded state instead of looking like an empty workspace.
- Removed production fixture-backed draft/mock defaults from `client/features/request-builder/state/request-draft-store.ts` and `client/features/mocks/components/MocksRoute.tsx` so shipped authoring state no longer depends on seed fixture modules.
- Added Node HTTP seam coverage for request-resource mutation, blocked execution failure paths, and resource-bundle preview/import under `server/*.test.js`, and extended `scripts/run-node-seam-tests.mjs` to include `server/`.
- Completed history/capture replay-now flows so both routes open a replay draft, queue an immediate run, and return focus to the Workspace result panel.
- Removed linked saved-script export blocking by serializing/remapping linked request-stage bindings during resource bundle export/import.

## Current Verification Status
- `npm.cmd run check` passed on 2026-03-25.
- Codex-side Playwright smoke succeeded on the Vite dev route for workspace run, history replay-now, capture replay-now, and settings route load on 2026-03-24.
- The Playwright skill CLI path was attempted first, but sandboxed `npx` package fetch failed in this environment, so browser validation continued with the built-in Playwright MCP against the same local app.

## Remaining Work
- Finish the live-doc cleanup slice that upgrades already-decided PRD/architecture uncertainty markers and renames remaining implementation-only `Placeholder` artifacts where they are now misleading.
- Audit the last production false-success/default paths outside the already-fixed workspace, request-draft, mock, and runtime-events flows and remove any remaining ones that still mask degraded state.


