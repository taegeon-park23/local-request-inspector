# M3-F3 Implementation Handoff

- **Purpose:** Provide the exact pending `M3-F3` patch scope so request-builder and active observation TSX presentation cleanup can resume without rediscovering wrappers, classes, or guardrails.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../architecture/material-3-adoption-plan.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`
- **Status:** active reference
- **Update Rule:** Update only if the exact `M3-F3` wrapper/CSS patch scope changes or once the slice is fully landed.

## 1. Current State
- `M3-F3` is the active next implementation slice.
- The official repo-native gate, `npm run check:m3f3-gate`, now reports `gate_clear`.
- The pending work is still bounded to request-builder and active request observation wrapper hierarchy cleanup plus minimal companion CSS.
- This note exists because one contributor session could update tracking/docs but could not apply the TSX patch due a tool-local refresh failure. Treat that as execution context, not as a repo-level blocker.

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

## 3. Exact Pending TSX Patch
### 3.1 RequestWorkSurfacePlaceholder
Target file:
- `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx`

Pending wrapper/class additions:
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

Pending wrapper/class additions:
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
- make response/execution surfaces read top-down with clearer “summary first, support second” rhythm
- expose header meta without moving ownership away from the existing tabs or result detail sections

## 4. Exact Pending CSS Follow-Up
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

## 5. Validation Order
After the patch lands:
1. `npm run typecheck`
2. rerun `npm run check:m3f3-gate` if the environment changed or if the contributor wants to reconfirm transform health after the TSX edit
3. inspect the request-builder and result-panel surfaces directly in the app if local execution is available

What to verify:
- no TSX ownership/behavior changes, only wrapper hierarchy cleanup
- request-builder header/identity/command copy now reads as distinct groups
- result-panel header meta and response/execution detail now scan as summary-first support-second groupings
- no regression to save/run/result semantics

## 6. If Tooling Fails Again
- If the gate still reports `gate_clear` but a contributor hits a tool-local TSX edit failure again, do not re-scope `M3-F3`.
- Use this handoff note as the canonical exact patch plan and apply the change through another local edit path rather than reopening roadmap or scope discussion.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether one tiny extra wrapper will be needed after direct local UI inspection, but the current intended patch should start with the classes listed above only.
- **확실하지 않음:** whether any companion CSS beyond grouping/layout refinements will be needed once the TSX wrappers land.
- **확실하지 않음:** whether live refresh on these two files is fully healthy even though the official transform gate now clears.
