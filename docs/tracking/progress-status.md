# Progress Status

- **Purpose:** Provide a short operational snapshot of what just landed, what is verified, and what still needs explicit promotion.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `m3-f3-implementation-handoff.md`, `request-stage-script-linkage-lane-comparison.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../tasks/task-034-post-t033-resolution-summary-contract.md`, `../tasks/task-067-settings-mutation-lane-comparison.md`, `../tasks/task-068-client-owned-interface-preferences-settings-baseline.md`, `../tasks/task-069-route-panel-default-presentation-settings-preference.md`, `../tasks/task-070-shell-density-settings-preference.md`, `../tasks/task-071-post-t070-priority-review-and-linked-script-promotion.md`, `../tasks/task-072-request-stage-linked-reusable-script-reference-baseline.md`, `../prd/overview.md`
- **Update Rule:** Update after each landed implementation slice or verification-state change.

## Current Snapshot
- `T072` is landed.
- Request-stage scripts now support persisted `inline` and `linked` bindings.
- The Scripts tab can link a stage to a saved script, show read-only linked-state UI, surface broken links, and detach a link back to an inline copy.
- Run now resolves the current saved-script source by id and blocks cleanly when the link is missing or mismatched.
- Saved-request export and workspace authored-resource export now return `409` when any linked request-stage binding remains.

## Verification
- `npm.cmd run check` passed on 2026-03-24.
- `npm.cmd run test:node` passed on 2026-03-24.
- `npm.cmd run test:ui` is still sandbox-blocked on 2026-03-24 before Vitest transform startup with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local handoff command: `npm.cmd run test:ui` outside the Codex sandbox.
- Expected local success signal: the Vitest UI lane starts and the full suite passes without the sandbox-only esbuild startup error.

## Current Next Action
- No new implementation task is active.
- If work resumes, define and track one new bounded task before coding.

## Notes For Next Contributor
1. Read `../prd/overview.md`.
2. Read `master-task-board.md` and `priority-roadmap.md`.
3. Read `../tasks/task-072-request-stage-linked-reusable-script-reference-baseline.md` for the shipped linked-script baseline and local UI-verification handoff.
4. Use `request-stage-script-linkage-lane-comparison.md` and `../tasks/task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md` before proposing more request-stage script work.
5. Use `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, and `../tasks/task-034-post-t033-resolution-summary-contract.md` before proposing more environment observation work.
