# T064 - Request-Stage Saved-Script Attach By Copy

- **Purpose:** Add one bounded reusable-script flow to the request builder by letting users copy a saved script into the active request stage without reopening linked-reference semantics.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-012-script-editor-and-automation-ux-spec.md`, `task-063-post-t062-request-stage-script-linkage-lane-comparison.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/script-editor-and-automation-ux.md`
- **Status:** todo
- **Priority:** P1

## 1. Summary
`T063` narrowed the next reusable-script follow-up lane to attach-by-copy. `T064` is the implementation-ready follow-up for that decision. It should connect the persisted saved-script library to the active request-stage editor through one explicit copy action while keeping the request-stage model request-owned after insertion.

## 2. Proposed Scope
### Included
- add a stage-aware saved-script attach action from the request-stage script editor
- show only compatible saved scripts for the active stage, or clearly gate mismatched ones
- copy the selected saved script source into the active request-stage editor
- preserve normal dirty/save/run behavior after copy
- show a lightweight provenance hint such as `Copied from saved script`
- add focused request-builder regression coverage

### Explicitly Excluded
- linked reusable-script reference ids or live synchronization
- editing a saved script through the request-stage editor
- unlink/detach/version management flows
- request import/export or bundle contract changes
- broader `/scripts` route redesign

## 3. Implementation Notes
- keep the copied script as ordinary request-bound source immediately after insertion
- do not change server execution contracts or script-history result semantics
- if stage mismatch is allowed for visibility, block copy until the user chooses a compatible stage or explicit conversion path
- request save payloads should remain source-only for stage scripts

## 4. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

If sandbox constraints block `test:ui`, record the exact local rerun handoff and expected success signal here before marking the task done.

## 5. Completion Criteria
- users can attach one compatible saved script to the active stage by copy
- the copied script becomes editable request-bound source immediately
- no live reusable-script linkage metadata is added to saved request contracts
- docs/tracking reflect that the copy lane is implemented while linked references remain deferred
