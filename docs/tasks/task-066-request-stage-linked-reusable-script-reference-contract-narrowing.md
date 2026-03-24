# T066 - Request-Stage Linked Reusable-Script Reference Contract Narrowing

- **Purpose:** Narrow the future linked reusable-script reference space after `T064` and `T065` so any later promotion starts from one explicit contract boundary instead of reopening broad request-stage script semantics.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-012-script-editor-and-automation-ux-spec.md`, `task-063-post-t062-request-stage-script-linkage-lane-comparison.md`, `task-064-request-stage-saved-script-attach-by-copy.md`, `task-065-request-stage-saved-script-library-assist-route-bridge.md`, `../architecture/request-stage-linked-reusable-script-reference-preconditions.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T064` and `T065` closed the copy-based and discovery-only reusable-script follow-ups. The only meaningful remaining script-reuse lane is linked reusable-script references, but that lane is still too broad unless its request-model, rename/delete, execution, and transfer semantics are narrowed first. `T066` fixes that boundary by defining one explicit future contract frame and by documenting what remains deferred.

## 2. Why This Task Matters Now
- `master-task-board.md` and `priority-roadmap.md` now explicitly keep linked reusable-script references parked after `T065`.
- `T012` and `request-builder-mvp.md` still mention request-stage script references at a product level, but they do not define the future storage or lifecycle contract.
- Without a narrowed contract, any future implementation request risks mixing live linkage, detach-by-copy, inline overrides, delete fallbacks, and bundle behavior into one oversized slice.

## 3. Decision
If linked reusable-script references are ever promoted later, they should start from this bounded contract frame:
- use a discriminated stage binding model rather than bolting linkage fields onto the existing inline-source shape
- allow only two stage modes:
  - `inline`
  - `linked`
- in `linked` mode, the request-stage binding should keep:
  - `savedScriptId`
  - `savedScriptNameSnapshot`
  - `scriptType`
  - `linkedAt` or equivalent display snapshot metadata
- do **not** allow mixed linked-plus-inline override state in the first linked-reference slice
- request-stage editing of linked source should stay read-only until the user explicitly detaches to copy
- saved-script rename should refresh display labels by id without detaching the request-stage binding
- saved-script delete should move the stage into an explicit `broken reference` state rather than silently inlining the last known source
- execution should use the currently linked saved-script source; it should not execute a stale hidden snapshot when the link is healthy

## 4. Explicitly Deferred
- actual linked-reference implementation
- request-stage detach-to-copy UI
- broken-reference resolution UX beyond the required future states
- authored-resource bundle rules for linked requests and referenced saved scripts
- environment or history/result contract changes tied to linked script references

## 5. Outputs
- `../architecture/request-stage-linked-reusable-script-reference-preconditions.md`
- tracking updates in `../tracking/`

## 6. Validation
This was a planning/documentation task only.
- validated consistency between this task doc, the new architecture note, `request-stage-script-linkage-lane-comparison.md`, `master-task-board.md`, and `priority-roadmap.md`
- no runtime or client/server code change is required to complete `T066`

## 7. Recommended Next Step
- Do not auto-promote linked reusable-script implementation just because `T066` exists.
- If linked references are explicitly requested later, start from `../architecture/request-stage-linked-reusable-script-reference-preconditions.md` and keep the first implementation slice limited to one stage-binding contract plus broken-link and detach boundaries.
