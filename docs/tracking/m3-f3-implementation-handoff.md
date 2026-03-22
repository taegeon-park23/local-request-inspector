# M3-F3 Implementation Handoff

- **Purpose:** Record the exact M3-F3 wrapper/CSS patch plus the latest validation state so request-builder and active observation cleanup can be resumed or revalidated without rediscovering scope.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../architecture/material-3-adoption-plan.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`
- **Status:** active reference
- **Update Rule:** Update only if the exact `M3-F3` wrapper/CSS patch scope changes or once the slice is fully landed.

## 1. Current State
- The documented M3-F3 wrapper/CSS patch is now applied in `RequestWorkSurfacePlaceholder.tsx`, `RequestResultPanelPlaceholder.tsx`, and `material-theme.css`.
- `npm.cmd run typecheck` passed on 2026-03-22 after the patch landed.
- A user-verified non-sandbox local `npm.cmd run test:ui` passed the then-current full UI suite on 2026-03-22.
- A same-day `npm.cmd run check` rerun in this sandbox passed.
- Direct sandbox reruns of `npm.cmd run check:m3f3-gate` and `npm.cmd run test:ui` still hit environment-level esbuild worker startup failure, but that sandbox-only result no longer keeps `M3-F3` open in tracking.
- This note now serves as the canonical applied-patch reference plus the local-verification handoff guide when sandboxed checks cannot run.

## 2. Scope Anchor
### In Scope
- `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx`
- `client/features/request-builder/components/RequestResultPanelPlaceholder.tsx`
- `client/app/shell/material-theme.css`

### Non-Goals
- no save/run/history/captures/mocks/scripts/replay semantic changes
- no route, provider, or state-boundary changes
- no new authored-resource work
- no per-feature layout rewrite outside the two named surfaces
- no `M3-F4`-style redesign or new component-system work

## 3. Applied TSX Patch
### 3.1 RequestWorkSurfacePlaceholder
Target file:
- `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx`

Applied wrapper/class additions:
1. Add `request-work-surface__header-copy` to the existing header-copy container inside `.request-work-surface__header`.
2. Wrap the existing location/source paragraph in a new support container:
   - `request-builder-core__identity-support`
   - keep the existing `request-builder-core__source-copy` paragraph inside it
3. Replace the current flat `request-builder-core__command-copy-group` paragraph stack with three internal groups:
   - `request-builder-core__command-intro`
   - `request-builder-core__command-status-list`
   - `request-builder-core__command-support`

Expected shape:
- the replay/save/run explanatory paragraph moves into `request-builder-core__command-intro`
- the `save-command-status` and `run-command-status` readiness notes live together inside `request-builder-core__command-status-list`
- the deferred Duplicate note lives in `request-builder-core__command-support`

Intent:
- keep command actions, command-state feedback, and deferred/support copy visually distinct
- keep request identity and placement copy grouped without changing any data or action behavior

### 3.2 RequestResultPanelPlaceholder
Target file:
- `client/features/request-builder/components/RequestResultPanelPlaceholder.tsx`

Applied wrapper/class additions:
1. Add `workspace-detail-panel__header-copy` to the existing header-copy container inside `.workspace-detail-panel__header`.
2. Add a new header meta cluster below the descriptive copy:
   - `workspace-detail-panel__header-meta`
   - reuse `request-work-surface__badges` for chip-style grouping
3. In that header meta cluster, show:
   - tab source chip
   - active result tab chip
   - execution status chip or no-execution/running chip
4. For the `response` and `execution-info` tab bodies, split the current flat content into:
   - `workspace-detail-panel__result-stack`
   - `workspace-detail-panel__result-summary`
   - `workspace-detail-panel__result-support`

Expected shape:
- `workspace-detail-panel__result-stack` is the outer group for summary + support blocks
- `workspace-detail-panel__result-summary` contains the outcome row and primary `KeyValueMetaList`
- `workspace-detail-panel__result-support` contains bounded preview/execution-support notes, stage-summary list, and secondary readiness copy

Intent:
- make response/execution surfaces read top-down with clearer "summary first, support second" rhythm
- expose header meta without moving ownership away from the existing tabs or result detail sections

## 4. Applied CSS Follow-Up
Target file:
- `client/app/shell/material-theme.css`

Add only minimal companion styling for the new wrappers:
- `.request-work-surface__header-copy`
- `.request-builder-core__identity-support`
- `.request-builder-core__command-intro`
- `.request-builder-core__command-status-list`
- `.request-builder-core__command-support`
- `.workspace-detail-panel__header-copy`
- `.workspace-detail-panel__header-meta`
- `.workspace-detail-panel__result-stack`
- `.workspace-detail-panel__result-summary`
- `.workspace-detail-panel__result-support`

Styling intent:
- use the existing request-builder / observation support-container language already present in `material-theme.css`
- prefer `display: grid`, existing `--m3-space-*` spacing, and the current support-card borders/backgrounds
- keep the new wrappers visually consistent with `shared-readiness-note`, `request-builder-core__identity`, `request-builder-core__command-area`, and existing detail-section surfaces
- do not introduce new color tokens or new interaction states for this slice

## 5. Current Validation State
Latest validation on 2026-03-22:
1. `npm.cmd run typecheck` - passed
2. `npm.cmd run test:node` - passed, including a static M3-F3 wrapper/CSS shape guard for the two TSX files and `material-theme.css`
3. user-verified non-sandbox local `npm.cmd run test:ui` - passed the then-current full UI suite
4. `npm.cmd run check` - passed in this sandbox
5. direct sandbox reruns of `npm.cmd run check:m3f3-gate` and `npm.cmd run test:ui` - still environment-blocked by esbuild worker startup
6. direct in-app inspection - not completed in this sandbox

If a future contributor wants local confirmation outside the sandbox, use:
1. `npm.cmd run check:m3f3-gate`
   Expected result: exit code `0` and `Gate status: gate_clear`
2. `npm.cmd run check`
   Expected result: exit code `0`
3. `npm.cmd run test:ui`
   Expected result for the current repo state: `Test Files  11 passed (11)` and `Tests  52 passed (52)`

## 6. If Tooling Fails Again
- If a contributor reruns the gate locally and it reports `gate_clear`, do not re-scope M3-F3; use this note to confirm the intended wrapper/CSS shape that is already in code.
- If sandboxed tooling still reports an environment-bound transform failure, request the local command set above and compare the result there instead of reopening roadmap or feature scope discussion.
- If a standalone unsandboxed `npm.cmd run test:ui` rerun passes while sandbox reruns still fail, keep the local result as the authoritative verification signal for that turn.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether one tiny extra wrapper will be needed after direct local UI inspection, but the current intended patch should start with the classes listed above only.
- **확실하지 않음:** whether any companion CSS beyond grouping/layout refinements will be needed once the TSX wrappers land.
- **확실하지 않음:** whether live refresh on these two files is fully healthy because the latest sandbox gate re-check returned env_blocked_transform before direct UI inspection could happen.
