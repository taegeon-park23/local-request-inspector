# T062 - Post-Run Environment Resolution Summary Implementation

- **Purpose:** Implement the bounded `EnvironmentResolutionSummary` lane chosen by `T033` and contracted by `T034` so active request results and persisted history both expose the same server-authored post-run environment resolution summary.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-030-request-environment-selection-and-runtime-resolution.md`, `task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `task-034-post-t033-resolution-summary-contract.md`, `task-061b-standalone-saved-scripts-authored-resource-bundle-expansion.md`, `../architecture/request-environment-resolution-summary-contract.md`, `../architecture/internal-api-contracts.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T034` fixed the future contract for one bounded post-run environment-observation slice. `T062` implements that slice by computing one server-authored `EnvironmentResolutionSummary` during execution, persisting it inside the execution request snapshot, and rendering it in:

- the active Workspace result panel `Execution Info`
- persisted History detail `Execution Info`

This work stays bounded to metadata-only observation. It does not add a resolved-request inspector, pre-run validation tiers, explorer propagation, or raw secret/value exposure.

## 2. Scope
### Included
- extend environment resolution helpers so they report:
  - resolved placeholder count
  - unresolved placeholder count
  - affected input areas
- create one bounded server-authored `EnvironmentResolutionSummary`
- persist that summary inside execution request snapshots without changing runtime snapshot schema version
- surface the summary in active result observation and persisted history detail
- update route-local i18n labels for status and affected-area presentation
- add low-level resolver regression coverage and bounded UI regression coverage

### Explicitly Excluded
- raw resolved request previews
- placeholder-name or field-path inspection in the client
- new result/history tabs
- pre-run unresolved warning tiers
- explorer/saved-request summary propagation
- environment transfer or broader bundle expansion

## 3. Interface / Contract Notes
- `RequestRunObservation` now carries optional `environmentResolutionSummary`.
- `HistoryRecord` now carries optional `environmentResolutionSummary`.
- runtime request snapshots now persist optional `environmentResolutionSummary` as an additive field.
- `RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION` is intentionally unchanged because this slice is additive and should not widen into runtime migration work.

## 4. Implementation Notes
- the server remains the only owner of environment resolution classification and summary copy
- the client renders status/count/affected-area labels but does not derive summary text independently
- missing or legacy history records without the new field continue to render normally because the UI only shows the section when the summary is present
- `resolvedPlaceholderCount` is implemented as total successful substitution occurrences, not distinct placeholder names

## 5. Validation Plan
- `node storage/resource/environment-resolution.test.js`
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`
- `npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

If the UI test command is blocked by the sandbox, record the exact local rerun handoff and expected success signal here before marking the task done.

## 6. Completion Criteria
- one shared bounded environment-resolution summary is produced by the server during execution
- active result observation and persisted history both render the same summary semantics in `Execution Info`
- older persisted history without the summary still renders without regression
- tracking and contract docs point to this implementation as the landed realization of `T034`

## 7. Delivered Output
- extended resolver helpers so environment resolution now returns successful substitution counts and affected input areas in addition to unresolved placeholder metadata
- added bounded server-owned `EnvironmentResolutionSummary` creation and persistence inside execution request snapshots
- surfaced the summary in Workspace result-panel `Execution Info` and History `Execution Info` with localized status/affected-area labels
- kept runtime snapshot schema version stable and treated the new summary as additive snapshot metadata
- updated API/architecture/tracking docs so `T034` now has one landed implementation slice instead of only a future contract note

## 8. Validation Results
### Passed in this sandbox
- `node storage/resource/environment-resolution.test.js`
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`

### Sandbox-blocked local rerun handoff
- Command:
  - `npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
- Sandbox failure:
  - `esbuild` helper preflight was blocked with `sandbox_esbuild_transform_blocked (spawn EPERM)` before Vite/Vitest transform work could start.
- Expected success signal when run locally:
  - Vitest starts normally instead of failing at the preflight wrapper.
  - `RequestBuilderCommands.test.tsx` passes the active result-panel environment-resolution summary assertions.
  - `HistoryPlaceholder.test.tsx` passes the persisted history environment-resolution summary assertions.
  - `AppRouter.test.tsx` continues to pass without route-shell regression.
