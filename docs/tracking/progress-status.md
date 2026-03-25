# Progress Status

- **Purpose:** Provide a compact live snapshot without requiring contributors to read archived task history by default.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update after each active-task status change or verification-state change.

## Current Snapshot
- `T074` is actively in progress.
- `T073` is now archived after landing the server/runtime split, replay-now completion, linked-script transfer remap, shipped false-success cleanup, and live-doc alignment work.
- Environment summaries and route copy now reflect the shipped request-level environment baseline instead of still claiming runtime resolution is deferred.
- Secret-backed environment rows now persist only write-only metadata in the ordinary environment record shape, and runtime placeholder resolution skips those rows until a secure backend exists.
- Environment create/update routes now fail closed with `secret_storage_unavailable` when secret replacement writes are attempted without a secure backend.
- The shared route-panel implementation remains at `client/features/route-panel-tabs-layout.tsx`, while environment/script/request-stage degraded-state regressions continue to have client coverage even though Codex cannot rerun the full Vitest UI lane.

## Verification
- `npm.cmd run check` passed on 2026-03-25.
- `npm.cmd run test:node` passed on 2026-03-25, including the new fail-closed environment route coverage and updated environment record/resolution assertions.
- `check:app` still reports the known `/app` built-shell gap and sandbox `spawn EPERM` limits for `build:client` and `test:ui`.
- A targeted Vitest rerun for the degraded-state client regressions was attempted on 2026-03-25, but sandboxed esbuild transform startup failed with `spawn EPERM` before the client test runner could start.
- Codex-side Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- Agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- If UI verification is needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Next Contributor Rule
1. Read `../prd/overview.md`.
2. Read `master-task-board.md` and `priority-roadmap.md`.
3. Read `completed-work-summary.md` only if archived context is actually needed.
4. Continue `T074` until its fail-closed policy, verification, and capability-reporting scope is complete before introducing another bounded task.
