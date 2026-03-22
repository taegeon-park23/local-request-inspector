# T024 - M3-F3 Implementation Handoff

- **Purpose:** Record the exact M3-F3 TSX/CSS patch and its validation follow-up state so the bounded request-builder/result-panel presentation cleanup can be resumed or revalidated without re-auditing scope.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-010-frontend-workspace-shell-implementation-plan.md`, `task-018-delivery-milestone-plan.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/m3-f3-implementation-handoff.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T024 captured the exact `M3-F3` implementation handoff after an earlier official `npm run check:m3f3-gate` procedure reported `gate_clear`. Since then, the documented wrapper/CSS patch has been applied in code, `npm.cmd run typecheck` passes, and `npm.cmd run test:node` now includes a static wrapper/CSS shape guard for the applied `M3-F3` files. Later validation follow-ups also added UI-test harness polyfills for `URL.createObjectURL`, `URL.revokeObjectURL`, `Blob.text`, and `File.text`, narrowed stale duplicate-text and timing-sensitive assertions across workspace/captures/history/replay/mocks/router tests, and fixed the `MocksPlaceholder` draft reducer path so React events are not read after release. A user-verified non-sandbox local `npm.cmd run test:ui` later passed all 47 tests on 2026-03-22, and a same-day `npm.cmd run check` rerun in this sandbox also passed. Direct sandbox reruns of `npm.cmd run check:m3f3-gate` and `npm.cmd run test:ui` still reported environment-level esbuild startup failure, but the repo now treats that as a local-verification handoff issue rather than as a reason to keep `M3-F3` open. The handoff note therefore remains the canonical applied-patch record plus local-verification guide for any future re-check.

## 2. Why This Task Matters Now
- The bounded M3-F3 wrapper/CSS patch is now applied, and future contributors need one canonical reference for both the landed DOM/CSS shape and the local verification commands to use when sandboxed checks cannot run.
- Without a canonical handoff note, future contributors would still have to rediscover which wrappers, classes, CSS seams, and expected verification signals matter for later confirmation.
- The current issue remains execution continuity, not product ambiguity: the slice stayed narrow, and later sandbox-only verification gaps should be handled through local reruns instead of reopening scope.

## 3. Input Sufficiency Check
The current repo truth is sufficient to complete T024 because:
- `../architecture/material-3-adoption-plan.md` already narrows `M3-F3` to request-builder and active request observation wrapper hierarchy only.
- `../tracking/post-m3-reactivation-guide.md` already records that `M3-F3` is landed in tracking and uses local-verification handoff when sandboxed confirmation is blocked.
- `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx` and `client/features/request-builder/components/RequestResultPanelPlaceholder.tsx` already show the exact applied grouping cleanup that the handoff note describes.
- `client/app/shell/material-theme.css` already contains the shared request-builder / observation support-container language that the pending wrapper classes should extend.

## 4. Definition Of Done
This task is done when all of the following are true:
- `../tracking/m3-f3-implementation-handoff.md` exists
- the handoff note records the exact applied `M3-F3` target files and wrapper/class additions
- the handoff note keeps `M3-F3` inside request-builder/result-panel TSX hierarchy cleanup plus minimal companion CSS
- tracking docs can point contributors to the handoff note instead of forcing another scope-audit pass
- future sandbox-blocked confirmation can be handled through explicit local command handoff rather than by leaving `M3-F3` pseudo-active

## 5. Outputs
- `../tracking/m3-f3-implementation-handoff.md`
- `../../scripts/m3-f3-static-shape.test.mjs`
- tracking updates in `../tracking/`

## 6. Key Decisions
1. T024 is a documentation and execution-continuity task, not a substitute for the actual `M3-F3` implementation.
2. The handoff note fixes the exact applied patch scope to two TSX files plus one CSS file.
3. The handoff note keeps `M3-F3` presentation-only: wrapper hierarchy cleanup, support-container grouping, and minimal companion CSS only.
4. The handoff note records the local tool-side TSX edit failure as execution context, not as a repo-level blocker, because the official gate already reports `gate_clear`.
5. No new backlog promotion is created in this pass; `M3-F3` can be treated as closed in tracking once the local-verification handoff is documented, even if sandbox-only reruns remain blocked here.

## 7. Open Questions
1. Whether a future contributor will still want to rerun the full local closeout command set immediately remains **확실하지 않음**.
2. Whether any additional CSS beyond the named wrapper classes will be needed after the first direct visual pass remains **확실하지 않음**.
3. Whether direct local UI inspection will surface any tiny hierarchy adjustment beyond the documented wrappers remains **확실하지 않음**.

## 8. Handoff Checklist
- [x] `T024` task file exists and is linked from tracking docs
- [x] `M3-F3` now has a canonical implementation handoff note
- [x] board, roadmap, progress, and reactivation docs can close `M3-F3` without leaving sandbox-only verification as the active blocker
- [x] no new optional backlog promotion is created in this pass

## 9. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Frontend Lead / Implementation Agent

## 10. Closure Decision
T024 remains closed as **done** at the documentation level. The repo now has both a stable exact handoff and the applied M3-F3 wrapper/CSS patch in code, plus one clear local-verification path for future contributors when sandboxed checks are blocked. The user-verified non-sandbox `npm.cmd run test:ui` pass on 2026-03-22 and same-day sandbox `npm.cmd run check` pass are retained as supporting evidence, while future sandbox-only rerun failures are treated as local-verification handoff cases rather than as reasons to keep `M3-F3` open in tracking.

## 11. Local Verification Handoff
If a future contributor needs to confirm the landed `M3-F3` slice outside the sandbox, use:
1. `npm.cmd run check:m3f3-gate`
   Expected result: exit code `0` and `Gate status: gate_clear`
2. `npm.cmd run check`
   Expected result: exit code `0`
3. `npm.cmd run test:ui`
   Expected result: `Test Files  8 passed (8)` and `Tests  47 passed (47)`

If one of those commands fails locally, record the failure against the current implementation work. If they pass locally while the sandbox still fails, keep the local result as the authoritative verification signal for that turn.

## 12. Validation Follow-Up Log
- 2026-03-22: A user-verified non-sandbox local `npm.cmd run test:ui` rerun passed all 47 tests after the fourth assertion cleanup pass, confirming that the stabilized UI suite clears outside the sandboxed esbuild restriction.
- 2026-03-22: A same-day sandbox closeout rerun recorded mixed official results: `npm.cmd run check` passed, but `npm.cmd run check:m3f3-gate` still returned `env_blocked_transform` and direct `npm.cmd run test:ui` still failed preflight with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- 2026-03-22: Follow-up policy now treats sandbox-blocked verification as a local command handoff case rather than as a reason to keep `M3-F3` active in tracking docs.
- 2026-03-22: A second UI-test assertion-stabilization pass updated the remaining stale selectors in `AppRouter.test.tsx`, `CapturesPlaceholder.test.tsx`, `HistoryPlaceholder.test.tsx`, `MocksPlaceholder.test.tsx`, `RequestBuilderCommands.test.tsx`, and `replay-bridge.test.tsx` so the tests follow the current M3-F3 DOM, persisted-source copy, and replay draft behavior rather than duplicated text nodes or pre-refactor selection assumptions.
- 2026-03-22: `npm.cmd run lint:client` and `npm.cmd run typecheck` passed after this follow-up. A fresh `npm.cmd run test:ui` rerun is still required outside the current sandbox because prior in-sandbox Vite/esbuild startup remained environment-blocked.
- 2026-03-22: A third narrow assertion pass cleaned up the remaining duplicated-tab, duplicated-status, and seeded-input assumptions in `RequestBuilderCommands.test.tsx`, `CapturesPlaceholder.test.tsx`, `MocksPlaceholder.test.tsx`, and `HistoryPlaceholder.test.tsx` after a local rerun reduced the failure set to five.
- 2026-03-22: A fourth assertion pass replaced the last brittle duplicated-badge checks and aligned the blocked-run dirty-state assertion with the current draft-tab behavior after the local rerun reduced the suite to three failures.
