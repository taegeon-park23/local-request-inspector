# T072 - Request-Stage Linked Reusable-Script Reference Baseline

- **Purpose:** Implement the first bounded linked reusable-script reference slice for request stages without reopening authored-resource transfer semantics beyond export blocking.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-064-request-stage-saved-script-attach-by-copy.md`, `task-065-request-stage-saved-script-library-assist-route-bridge.md`, `task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, `task-071-post-t070-priority-review-and-linked-script-promotion.md`, `../architecture/request-stage-linked-reusable-script-reference-preconditions.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## Summary
`T072` landed the first live linked reusable-script baseline for request stages. Saved requests can now persist `inline` or `linked` stage bindings, the Scripts tab can link a stage to a saved script, linked stages render as read-only with broken-link feedback, Run resolves the current saved-script source by id, and authored-resource export is blocked while any linked stage binding remains.

## Outputs
- Added discriminated request-stage binding helpers on the client and server.
- Preserved legacy string script payloads by normalizing them to `inline` bindings on read.
- Added request-builder UI for `Link to stage`, `Relink stage`, and `Detach to copy`.
- Added broken-link and stage-mismatch handling that blocks Run but still allows save/load.
- Added single-request and workspace bundle export blocking with explicit `409` responses.
- Added node seam coverage for normalization, run-time linked resolution, and export blocking.
- Updated request-builder UI tests for linked save/load, detach flow, and broken-link handling.
- Synced the static M3-F3 gate with the current result-panel signature.

## Definition Of Done Check
- Request stages can switch between `inline` and `linked` bindings.
- Linked stages render as read-only and show the linked saved-script identity.
- Saving and reopening a request preserves linked stage bindings.
- Running a request uses the current linked saved-script source when the link is healthy.
- Missing or mismatched linked saved scripts produce explicit blocked-run feedback.
- Single saved-request export and workspace bundle export reject linked requests.

## Validation
- `npm.cmd run check` - passed on 2026-03-24.
- `npm.cmd run test:node` - passed on 2026-03-24.
- `npm.cmd run test:ui` - sandbox-blocked on 2026-03-24 before Vitest transform startup with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff: run `npm.cmd run test:ui` outside the Codex sandbox.
- Expected local success signal: the Vitest UI lane starts normally and the full suite passes without `sandbox_esbuild_transform_blocked` or `spawn EPERM`.
- If the local UI run fails with assertion or runtime errors, treat that as a repo regression; if it only fails with the sandbox esbuild startup error inside Codex, treat this task as complete with local handoff per `AGENTS.md`.

## Assumptions
- Linked stage bindings remain request-owned metadata and do not change saved-script persistence ownership.
- Export blocking is the correct stop line until a later task explicitly owns linked-request transfer semantics.
- Broken linked stages should block successful Run until the user repairs or detaches the stage.

## Open Questions
- **확실하지 않음:** whether a later authored-resource transfer task should inline linked scripts during export or carry linked references plus saved-script remapping metadata.
- **확실하지 않음:** whether future history/result surfaces should expose linked-stage provenance beyond the current blocked-run and execution-summary behavior.
