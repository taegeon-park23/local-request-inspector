# T073 Server Decomposition

- **Purpose:** Decompose the server runtime into bounded route and service seams, replace direct storage access with explicit repositories, and establish the execution/observation interfaces needed for the next follow-up tasks.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
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
- Extracted mock-rule CRUD, enable/disable, and single-rule bundle export routes into `server/register-mock-rule-routes.js`.
- Extracted built-shell status/static `/app` route registration and fallback rendering into `server/register-app-shell-routes.js`, so `server.js` keeps only the returned `getClientShellStatus()` hook used by runtime status responses and startup logging.
- Extracted app-shell/runtime status endpoints into `server/register-status-routes.js`, and moved SSE plus raw-body parser bootstrap into `server/configure-runtime-stream.js`.
- Added explicit repository seams for resource storage and runtime queries, and moved history/capture reads onto `repositories.runtime.queries`.
- Extracted runtime cancellation/history/capture route registration out of `server.js` into `server/register-runtime-routes.js` so the execution entrypoint and runtime observation routes are no longer defined in one monolithic block.
- Extracted legacy inspector mock/assets/execute routes and the inbound capture catch-all into `server/register-legacy-inspector-routes.js`, and switched inbound mock-rule evaluation to the repository seam instead of raw storage scans.
- Landed bounded execution follow-up APIs for cancellation, replay, persisted result reads, and persisted test-result reads while preserving the existing route payload shape.
- Replaced the legacy in-server VM execution path with bounded runner modules, including worker-thread fallback for spawn-restricted sandbox environments and redaction-safe freeform console handling.
- Completed history/capture replay-now flows so both routes open a replay draft, queue an immediate run, and return focus to the Workspace result panel.
- Removed linked saved-script export blocking by serializing/remapping linked request-stage bindings during resource bundle export/import.

## Current Verification Status
- `npm.cmd run check` passed on 2026-03-24.
- Codex-side Playwright smoke succeeded on the Vite dev route for workspace run, history replay-now, capture replay-now, and settings route load on 2026-03-24.
- The Playwright skill CLI path was attempted first, but sandboxed `npx` package fetch failed in this environment, so browser validation continued with the built-in Playwright MCP against the same local app.

## Remaining Work
- Continue reducing `server.js` so route registration and orchestration are split more cleanly across bounded modules instead of accumulating additional runtime logic in one file.
- Finish the live-doc cleanup slice that upgrades already-decided PRD/architecture uncertainty markers and renames remaining implementation-only `Placeholder` artifacts where they are now misleading.
