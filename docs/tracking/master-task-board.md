# Master Task Board
- **Purpose:** Provide the canonical current execution status for delivery work that is still operationally relevant.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-24
- **Related Documents:** `priority-roadmap.md`, `progress-status.md`, `m3-f3-implementation-handoff.md`, `request-stage-script-linkage-lane-comparison.md`, `settings-mutation-lane-comparison.md`, `../architecture/request-stage-linked-reusable-script-reference-preconditions.md`, `../architecture/request-environment-resolution-summary-contract.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../tasks/task-034-post-t033-resolution-summary-contract.md`, `../tasks/task-064-request-stage-saved-script-attach-by-copy.md`, `../tasks/task-065-request-stage-saved-script-library-assist-route-bridge.md`, `../tasks/task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, `../tasks/task-067-settings-mutation-lane-comparison.md`, `../tasks/task-068-client-owned-interface-preferences-settings-baseline.md`, `../tasks/task-069-route-panel-default-presentation-settings-preference.md`, `../tasks/task-070-shell-density-settings-preference.md`, `../tasks/task-071-post-t070-priority-review-and-linked-script-promotion.md`, `../tasks/task-072-request-stage-linked-reusable-script-reference-baseline.md`, `../prd/overview.md`
- **Update Rule:** Update when an implementation task lands, a verification status changes, or the next active work changes.

## Status Legend
- `todo`: defined but not started
- `doing`: actively in progress
- `blocked`: waiting on a non-sandbox dependency or product decision
- `done`: completed, including local-verification handoff when sandbox limits are the only remaining issue

## Current Register
| ID | Title | Status | Notes |
| --- | --- | --- | --- |
| T001-T018 | Foundation, planning, schema, UX, QA, tooling, and milestone preparation | done | Core architecture, storage, shell, QA, and delivery-preparation work are complete. |
| T019 | Server-backed pre-import preview | done | Current authored-resource import preview/confirm flow is shipped. |
| T024 | M3-F3 implementation handoff | done | The applied request-builder/result-panel patch and local verification handoff are documented. |
| T026 | M3-F3 validation environment blocker triage | done | Remaining `esbuild` startup failure is classified as a sandbox-local verification limit. |
| T027-T062 | Workspace, localization, settings, and environment execution baselines | done | `/environments`, `/scripts`, `/settings`, request environment resolution, and result/history follow-ups are shipped. |
| T063-T066 | Request-stage reusable-script narrowing and copy baseline | done | Lane comparison, attach-by-copy, route bridge, and linked-reference contract narrowing are complete. |
| T067-T070 | Client-owned `/settings` preference slices | done | Navigation rail, route panel default, and shell density preferences are shipped. |
| T071 | Post-T070 priority review and linked-script promotion | done | Promoted `T072` as the next bounded implementation slice. |
| T072 | Request-stage linked reusable-script reference baseline | done | Linked bindings, read-only linked-stage UI, broken-link run blocking, detach-to-copy, export blocking, and regression coverage landed on 2026-03-24. |

## Current State
- **Current active implementation:** none.
- **Most recent landed implementation:** `T072`.
- **Highest-priority next step:** none auto-promoted in this pass; choose a new bounded task explicitly before resuming implementation.
- **Verification baseline:** `npm.cmd run check` and `npm.cmd run test:node` passed on 2026-03-24.
- **Sandbox-local handoff:** `npm.cmd run test:ui` is still blocked inside Codex by `sandbox_esbuild_transform_blocked` / `spawn EPERM`; run it locally outside the sandbox when UI verification is required.

## Operational Notes
- Linked saved-script request stages are now part of the shipped request-builder baseline.
- Saved-request export and workspace authored-resource export intentionally reject linked request-stage bindings until a future task owns linked-request transfer semantics.
- Future environment observation work should start from `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, and `../tasks/task-034-post-t033-resolution-summary-contract.md`.
- Future request-stage script work should start from `request-stage-script-linkage-lane-comparison.md`, `../tasks/task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, and the landed `T072` baseline.
- Future `/settings` work should stay inside client-owned interface preferences unless a new narrowing task explicitly reopens broader runtime-default or storage-admin scope.
