# Progress Status

- **Purpose:** Provide a compact live snapshot without requiring contributors to read archived task history by default.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update after each active-task status change or verification-state change.

## Current Snapshot
- `T074` is now archived after landing fail-closed secret writes, write-only environment records, settings/runtime secret-storage diagnostics, and legacy secret-row sanitize/reporting on read.
- `T075` is actively in progress with the provider seam now implemented across environment mutation, execution-time resolution, runtime-status metadata, and node seam tests.
- The post-`T075` Workspace UI V2 sequence is now defined in live docs as `T076` through `T079`, but tracker promotion remains intentionally deferred until `T075` is archived.
- Settings runtime diagnostics now expose secret-storage capability state, read-model policy, replacement-write policy, runtime-resolution policy, legacy sanitization counts, and optional provider metadata (`providerId/providerVersion/providerStatus/capabilities`).
- Environment list/detail reads sanitize legacy raw secret rows out of ordinary environment JSON when encountered and report bounded warning counts in the same pass.
- The shared route-panel implementation remains at `client/features/route-panel-tabs-layout.tsx`, and the workspace codepath now carries the staged recursive explorer, preview/pinned tab, quick-request, detached-draft, and batch-result baseline even though Codex cannot rerun the full Vitest UI lane.

## Verification
- `npm.cmd run lint` passed on 2026-03-25.
- `npm.cmd run typecheck` passed on 2026-03-25.
- `npm.cmd run test:node` passed on 2026-03-25, including fail-closed environment route coverage, unavailable-provider clear behavior, available-provider locator store/clear coverage, execution-time secret resolve success/failure coverage, and runtime-status optional provider-metadata snapshot assertions.
- `check:app` still reports the known `/app` built-shell gap and sandbox `spawn EPERM` limits for `build:client` and `test:ui`.
- A targeted Vitest rerun for the new workspace-shell/result-panel regressions was attempted on 2026-03-25, but sandboxed esbuild transform startup failed with `spawn EPERM` before the client test runner could start.
- Codex-side Playwright smoke passed on 2026-03-24 for workspace run, history replay-now, capture replay-now, and settings route load.
- Agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- If UI verification is needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Next Contributor Rule
1. Read `../prd/overview.md`.
2. Read `master-task-board.md` and `priority-roadmap.md`.
3. Read `completed-work-summary.md` only if archived context is actually needed.
4. Finish `T075` closeout by keeping docs/trackers aligned to the shipped provider seam and preserving post-T075 queue freeze until T075 is explicitly archived.
