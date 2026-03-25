# Progress Status

- **Purpose:** Provide a compact live snapshot without requiring contributors to read archived task history by default.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update after each active-task status change or verification-state change.

## Current Snapshot
- `T073` is actively in progress.
- The task currently owns server decomposition, child-process script-runner hardening, replay completion, linked-script transfer follow-up, and live-doc cleanup.
- Persisted execution log, test-result, error-summary, and history presentation helpers now live in `server/execution-observation-service.js`, reducing another shared execution/history block from `server.js`.
- Inbound capture persistence, presentation, and replay helpers now live in `server/capture-observation-service.js`, reducing another shared observation block from `server.js`.
- Implemented route/workspace UI surfaces no longer use misleading `Placeholder` component/file names for the shipped Captures, History, Mocks, Workspace, and request-builder surfaces.
- Live PRD/architecture docs now reflect the landed React + Vite shell baseline, hybrid JSON/SQLite persistence baseline, and child-process execution baseline instead of keeping those decisions open by default.
- Request placement, saved-request normalization, request-tree building, and bundle helper logic now live in `server/request-resource-service.js` instead of inline inside `server.js`.
- The execution run entrypoint now registers through `server/register-execution-routes.js`, so `server.js` no longer defines `/api/executions/run` inline.
- Request list/tree, collection CRUD, request-group CRUD, and saved-request CRUD routes now register through `server/register-request-resource-routes.js`.
- Authored resource bundle export/import routes now register through `server/register-resource-bundle-routes.js`.
- Environment CRUD, saved-script CRUD, and script-template read routes now register through `server/register-environment-script-routes.js`.
- Mock-rule CRUD, enable/disable, and single-rule bundle export now register through `server/register-mock-rule-routes.js`.
- Built-shell status, `/app` static serving, and fallback rendering now register through `server/register-app-shell-routes.js`.
- App-shell/runtime status APIs now register through `server/register-status-routes.js`, and SSE plus raw-body parser bootstrap now lives in `server/configure-runtime-stream.js`.
- The current implementation slice already landed runtime query repositories, execution cancellation/result APIs, replay-now flows for history/captures, and linked saved-script transfer remapping.
- Runtime cancellation/history/capture routes are now registered through `server/register-runtime-routes.js`, reducing the size of the remaining monolithic route block in `server.js`.
- Legacy inspector mock/assets/execute routes plus the inbound capture catch-all now register through `server/register-legacy-inspector-routes.js`, and inbound mock evaluation reads saved rules through the repository seam.
- Request-resource, environment/script, mock-rule, execution, resource-bundle, and legacy capture writes now route through `repositories.resources.*` and `repositories.runtime.queries` instead of direct storage calls inside the route modules.
- Workspace environment/script helper logic now lives in `server/environment-script-resource-service.js`, mock-rule normalization/list logic now lives in `server/mock-rule-resource-service.js`, authored bundle import planning now lives in `server/resource-bundle-import-service.js`, execution seed/stage/transport flow logic now lives in `server/execution-flow-service.js`, and runtime snapshot/redaction/presentation logic now lives in `server/runtime-presentation-service.js`, cutting `server.js` down to 526 lines from the earlier 1686-line baseline.
- Workspace saved-resource load failures now surface as explicit degraded state, the default runtime-events adapter now reports offline instead of silently replaying synthetic captures when EventSource support is unavailable, and the shipped request-draft/mock authoring paths no longer depend on fixture-backed production defaults.
- The shared route-panel implementation now lives in `client/features/route-panel-tabs-layout.tsx`, while environment detail, script detail, and linked saved-script library failures now surface as degraded state instead of falling back to `No selection` or broken-link copy.
- Node seam tests now cover request-resource mutation, environment/script default reconciliation and listing, the new execution flow service, the new runtime presentation service, blocked execution paths, and resource-bundle preview/import under `server/*.test.js`. Client regression coverage now also exists in the affected Vitest route/request-builder suites for those degraded-state paths.
- The latest archived implementation is `T072`, which shipped linked request-stage saved-script references with export blocking.
- Completed work history has been pruned out of `docs/tasks/` and condensed into `completed-work-summary.md`.

## Verification
- `npm.cmd run check` passed on 2026-03-25.
- `npm.cmd run test:node` passed on 2026-03-25, including the expanded `server/*.test.js` HTTP seam coverage.
- A targeted Vitest rerun for the new environment/scripts/request-stage degraded-state regressions was attempted on 2026-03-25, but sandboxed esbuild transform startup failed with `spawn EPERM` before the client test runner could start.
- Codex-side Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- Agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- Codex-side UI verification should use the Playwright skill workflow.
- The Playwright skill CLI path was attempted first, but sandboxed `npx` package fetch failed; Codex continued with the built-in Playwright browser tooling against the same localhost app.
- If UI verification is needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Next Contributor Rule
1. Read `../prd/overview.md`.
2. Read `master-task-board.md` and `priority-roadmap.md`.
3. Read `completed-work-summary.md` only if archived context is actually needed.
4. Continue `T073` until its server/runtime, replay/transfer, and doc-cleanup scope is complete before introducing another bounded task.


