# Priority Roadmap

- **Purpose:** Show the current delivery sequence after candidate and hold-state planning docs were retired.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `progress-status.md`, `m3-f3-implementation-handoff.md`, `request-stage-script-linkage-lane-comparison.md`, `settings-mutation-lane-comparison.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../tasks/task-034-post-t033-resolution-summary-contract.md`, `../tasks/task-064-request-stage-saved-script-attach-by-copy.md`, `../tasks/task-065-request-stage-saved-script-library-assist-route-bridge.md`, `../tasks/task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, `../tasks/task-067-settings-mutation-lane-comparison.md`, `../tasks/task-068-client-owned-interface-preferences-settings-baseline.md`, `../tasks/task-069-route-panel-default-presentation-settings-preference.md`, `../tasks/task-070-shell-density-settings-preference.md`, `../tasks/task-071-post-t070-priority-review-and-linked-script-promotion.md`, `../tasks/task-072-request-stage-linked-reusable-script-reference-baseline.md`, `../prd/overview.md`
- **Update Rule:** Update when the next implementation slice changes or when the verification baseline changes.

## Roadmap Snapshot
1. Foundation and shell preparation through `T018` are complete.
2. Authored-resource preview, M3 verification handoff, and placeholder-route baselines through `T030` are complete.
3. Environment follow-up narrowing, reusable-script narrowing, and client-owned settings preferences through `T071` are complete.
4. `T072` is complete and is now the latest landed implementation.
5. No additional implementation slice is auto-promoted right now.

## Current Sequencing Rules
- Keep future request-stage script work additive to the `T072` linked-binding baseline.
- Keep future `/settings` work inside client-owned interface preferences unless a new task explicitly reopens broader scope.
- Keep future environment observation work bounded to the already narrowed post-`T030` lane docs.
- Treat sandbox-only `esbuild` startup failures as local-verification handoff cases, not as open implementation blockers.

## Immediate Next Step
- If implementation resumes, define one new bounded task first and add it to `master-task-board.md` before coding.
- If UI verification is needed, run `npm.cmd run test:ui` outside the Codex sandbox and expect the Vitest suite to start normally without `sandbox_esbuild_transform_blocked` or `spawn EPERM`.

## Deferred Areas
- Linked-request authored-resource transfer remains deferred beyond export blocking.
- Broader interoperability work such as cURL, OpenAPI, and Postman import remains deferred from the current authored-resource baseline.
- Packaging or startup polish remains deferred unless a new repo-owned gap appears outside the known sandbox-only `esbuild` limitation.
