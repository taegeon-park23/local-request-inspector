# T072 - Request-Stage Linked Reusable-Script Reference Baseline

- **Purpose:** Implement the first bounded linked reusable-script reference slice for request stages without reopening authored-resource bundle expansion, runtime-default settings, or broader script-library redesign.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-012-script-editor-and-automation-ux-spec.md`, `task-064-request-stage-saved-script-attach-by-copy.md`, `task-065-request-stage-saved-script-library-assist-route-bridge.md`, `task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, `task-071-post-t070-priority-review-and-linked-script-promotion.md`, `../architecture/request-stage-linked-reusable-script-reference-preconditions.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** todo
- **Priority:** P1

## 1. Summary
`T072` is the first implementation slice for live reusable-script linkage after the copy-based (`T064`) and discovery-bridge (`T065`) baseline. This slice should let one request stage link to one saved script by id, keep the stage read-only while linked, use the current saved-script source during execution, and expose clear broken-link and detach-to-copy behavior.

## 2. Included Scope
- discriminated request-stage script binding model with `inline` and `linked` modes
- request builder UI to attach a saved script as a live link for the active stage
- linked-state read-only editor chrome with:
  - linked saved-script label
  - open saved script action
  - detach-to-copy action
- request save/load support for linked stage bindings
- run-lane usage of current linked saved-script source
- saved-script rename refresh by id
- saved-script delete -> explicit broken-reference state
- export blocking for:
  - single saved-request bundle export when the request has linked stage bindings
  - workspace authored-resource bundle export when any saved request has linked stage bindings

## 3. Explicitly Deferred
- authored-resource import/export support for linked request-stage bindings
- automatic inclusion/remap of referenced saved scripts during bundle export/import
- linked plus local override hybrid state
- live editing of saved-script source inside the request-stage editor
- history/result contract expansion beyond additive linked-state metadata if absolutely needed
- environment/runtime-default settings changes

## 4. Proposed Definition Of Done
This task is done when all of the following are true:
- at least one request stage can switch between `inline` and `linked` modes
- linked stages render as read-only and point to a saved script by id
- saving and reopening a request preserves linked stage bindings
- running a request uses the current linked saved-script source when the link is healthy
- deleting a linked saved script produces an explicit broken-reference state instead of silently inlining old source
- request export and workspace bundle export refuse linked requests with clear user-facing messaging

## 5. Validation Expectations
- request-draft store tests for discriminated stage binding state
- request-builder UI tests for attach / linked read-only / detach-to-copy / broken-reference behavior
- run-lane tests confirming current linked saved-script source is used
- saved-script rename/delete regression tests
- bundle export tests confirming linked requests are rejected with clear reason labels
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- relevant node seam tests plus bounded `test:ui` handoff if sandbox blocks Vitest

## 6. Assumptions
- The first linked-reference slice is allowed to persist linked stage bindings in saved requests.
- Export blocking is acceptable as the bounded stop line until a later bundle task explicitly owns linked-request transfer semantics.
- Broken linked stages should block successful `Run` until the user repairs or detaches the stage. If this assumption changes later, document it explicitly before implementation.

## 7. Open Questions
- **확실하지 않음:** whether broken-link state should block the whole request immediately or allow stage-level partial execution with a visible degraded warning.
- **확실하지 않음:** whether linked-state metadata should surface inside history/result in this first slice or remain authoring-only.
- **확실하지 않음:** whether detach-to-copy should preserve a persisted provenance hint after converting back to `inline` mode.
