# Post-M3 Reactivation Guide

- **Purpose:** Provide the canonical hold-state and reactivation rules for work after `M3-F1` / `M3-F2`, so contributors know when extra local confirmation of `M3-F3` is needed and when an optional backlog item is narrow enough to promote.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-23
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `m3-f3-implementation-handoff.md`, `candidate-a-promotion-readiness.md`, `candidate-a-gap-inventory.md`, `candidate-a-narrow-candidate-comparison.md`, `candidate-b-promotion-readiness.md`, `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `candidate-c-gap-inventory.md`, `environment-follow-up-lane-comparison.md`, `../architecture/material-3-adoption-plan.md`, `../architecture/request-environment-selection-and-resolution.md`, `../tasks/task-010-frontend-workspace-shell-implementation-plan.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md`, `../tasks/task-022-post-t021-priority-review.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`, `../tasks/task-025-post-m3-f3-closure-priority-review.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-028-post-t027-candidate-a-readiness-refresh.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`
- **Status:** active reference
- **Update Rule:** Update when the official `M3-F3` gate result changes, when an optional backlog item becomes narrowly promotable, or when the current post-M3 hold state changes.

## 1. Current Hold-State Summary
- M3-F3 now has its bounded request-builder/result-panel wrapper patch applied in code.
- `npm.cmd run typecheck` passed on 2026-03-22 after that patch landed.
- A user-verified non-sandbox local `npm.cmd run test:ui` passed the then-current full UI suite on 2026-03-22.
- A same-day `npm.cmd run check` rerun in this sandbox passed.
- Direct sandbox reruns of `npm.cmd run check:m3f3-gate` and `npm.cmd run test:ui` still hit environment-level esbuild worker startup failure.
- `../tasks/task-027-placeholder-route-mvp.md` is landed: `/environments` and `/scripts` now expose persisted route-level management surfaces, and `/settings` now exposes a diagnostics-first runtime-status surface.
- `../tasks/task-028-post-t027-candidate-a-readiness-refresh.md` is landed: Candidate A guidance now reflects that environments and standalone saved scripts are real workflow objects after `T027`, but transfer work for those resource kinds is still not narrowly promotable.
- `../tasks/task-029-request-environment-selection-and-resolution-plan.md` is landed: the next request-builder environment follow-up is now bounded to request-level selector plus server-owned run-time resolution rather than top-bar global state.
- `../tasks/task-030-request-environment-selection-and-runtime-resolution.md` is landed: the request-level selector and server-owned runtime resolution baseline are now implemented, so future environment follow-up should not reopen that boundary as if it were still planning-only.
- `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md` is landed: the post-`T030` review confirms that the new request/runtime environment coupling does not automatically justify environment transfer or top-bar selector promotion, and that Candidate A still has no cleaner narrow next task than the parked `/mocks`-local import lane.
- `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md` is landed: richer resolved-preview UX is now the strongest future environment lane, while top-bar selector and environment transfer remain parked.
- `../tasks/task-019-server-backed-pre-import-preview.md` is landed as the bounded Candidate A delivery for the current workspace authored-resource import flow.
- ../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md is landed as the bounded Candidate B documentation follow-up for compatibility-gap narrowing.
- ../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md is landed as the bounded Candidate C documentation follow-up for packaging/startup gap inventory.
- ../tasks/task-022-post-t021-priority-review.md is landed as the latest explicit no-promotion review after the Candidate B/C narrowing passes.
- ../tasks/task-023-candidate-b-import-migration-approach-decision.md is landed as the latest Candidate B approach-decision pass for the stronger authored-resource import lane.
- ../tasks/task-025-post-m3-f3-closure-priority-review.md is landed as the latest explicit no-promotion review after `M3-F3` closure.
- ../tasks/task-026-m3-f3-validation-environment-blocker-triage.md is landed as the blocker-triage follow-up confirming that the remaining official-closeout failure is environment-level rather than one more repo-side wrapper/config gap.
- `M3-F3` is now treated as landed in tracking; future sandbox-blocked confirmation should use local command handoff rather than reopen the slice as blocked.
- Use `m3-f3-implementation-handoff.md` when future contributors need local confirmation of the landed wrapper/result-panel patch.
- Candidate B and Candidate C remain parked.
- No additional post-M3 implementation promotion should start automatically; use the reactivation rules below when a new narrow follow-up is actually requested.
- `T010` remains closed, and post-S26 work must not reopen shell route, provider, state-boundary, or ownership scope.

## 2. Why Each Item Is Blocked, Active, Or Parked
### M3-F3
- M3-F3 is no longer blocked by implementation scope; the intended request-builder/result-panel wrapper patch is now applied in code.
- The latest available evidence confirms that `npm.cmd run typecheck` passes, a user-verified non-sandbox `npm.cmd run test:ui` pass exists, and same-day `npm.cmd run check` passes in this sandbox.
- `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md` now confirms that the repo already applies direct esbuild preflight classification, config-loader runner enforcement, Windows `net use` patching, fail-fast wrapper messaging, and transformed-module gate probes, so the remaining blocker should not be treated as one more hidden repo-side fix opportunity.
### Candidate A - Additional Authored-Resource Tooling
- The shipped authored-resource baseline already covers workspace-level import plus workspace-level and single-resource export for saved requests and mock rules.
- Import uses a create-new-identity policy and keeps runtime artifacts out of scope.
- One narrow Candidate A follow-up is now landed as `../tasks/task-019-server-backed-pre-import-preview.md`, which adds a server-backed no-write preview plus explicit confirm/cancel flow for the current workspace import surface.
- Broader Candidate A extensions are still too broad or under-scoped to promote safely without duplicating landed behavior.
- `T025` confirms that the strongest remaining parked Candidate A lane is still Candidate 2, the `/mocks`-local import entrypoint, but that lane remains too ambiguous because import ownership is still workspace-level and mixed-bundle.
- `T028` confirms that environments and standalone saved scripts are now real workflow objects after `T027`, but that change still does not narrow authored-resource transfer enough to justify promotion.
- `T029` fixed the implementation boundary, and `T030` now lands that request-builder follow-up without promoting Candidate A transfer work or top-bar selector work.
- `T031` confirms that `T030` makes environment transfer more concrete but still broader than one narrow task because request-reference persistence, missing-reference handling, and run/history environment metadata now also belong to the future contract.
- `T032` confirms that the strongest future environment lane is resolved-preview refinement, not shell-level selector work or environment transfer.
- Use `candidate-a-promotion-readiness.md` before proposing Candidate A so the gap is measured against the shipped request/mock bundle baseline and current authored-resource boundaries.
- Use `candidate-a-gap-inventory.md` before proposing Candidate A so the proposal starts from a concrete current gap rather than from generic future-tooling language.
- Use `candidate-a-narrow-candidate-comparison.md` to understand why Candidate 2 stayed parked and why Candidate 1 won before `T019` was created.

### Candidate B - Later Write-Time Migration-Engine Work
- The current shipped scope is covered by read-compatible, bootstrap-recoverable, migration-needed, and unsupported-version classification helpers.
- No current product or schema pressure shows that a write-time migration engine is needed now.
- Promoting this work early would create future-proofing complexity without a clear near-term user-facing benefit.
- Use `candidate-b-promotion-readiness.md` before proposing Candidate B so write-time migration work starts from one blocked compatibility seam rather than from generic future-proofing language.
- Use `candidate-b-gap-inventory.md` before proposing Candidate B so the decision starts from concrete runtime-versus-authored-resource lane evidence. The current stronger future lane is authored-resource import handling for `migration-needed` bundle/resource versions, but it remains parked.
- Use `candidate-b-narrow-lane-comparison.md` before proposing Candidate B so the authored-resource import lane is re-checked against the runtime startup lane before anyone proposes a future Candidate B implementation task.
- Use `candidate-b-import-migration-approach-decision.md` before proposing Candidate B through the authored-resource import lane so that future discussion starts from one chosen bundle-level normalization framing rather than from multiple migration approaches.

### Candidate C - Packaging Polish
- The repo already ships bounded packaging and startup verification through `check:app`, the `/api/app-shell-status` seam, the built-shell-aware `/app` fallback, and the S25/S26 wrapper messaging.
- The remaining known pain is the environment-bound esbuild restriction, not a newly identified packaging gap with a scoped fix.
- Promoting packaging polish now would likely duplicate landed checks rather than unlock clearly missing delivery readiness.
- Use `candidate-c-promotion-readiness.md` before proposing Candidate C so packaging work starts from one missing verification seam rather than from environment noise or broad distribution ideas.
- Use `candidate-c-gap-inventory.md` before proposing Candidate C so packaging work starts from concrete shipped-gap evidence rather than from broad readiness language.

## 3. Exact Reactivation Triggers
### M3-F3
- `M3-F3` does not require reactivation in tracking; the slice is already landed.
- If later contributors want extra confirmation and the sandbox blocks the needed lane, request local commands with expected results instead of reopening `M3-F3` as a blocked task.
- Recommended local command set:
  1. `npm.cmd run check:m3f3-gate` -> expect exit code `0` and `Gate status: gate_clear`
  2. `npm.cmd run check` -> expect exit code `0`
  3. `npm.cmd run test:ui` -> expect `Test Files  8 passed (8)` and `Tests  49 passed (49)` for the current repo state
- Use `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md` before proposing any extra repo-side blocker work so later contributors start from the confirmed preflight boundary.
### Additional Candidate A Work Beyond T019
- Promote further Candidate A work only when a concrete authored-resource UX or transfer gap is documented tightly enough to become one bounded task beyond `T019`.
- The promoted scope must be narrower than "improve import/export" and must not duplicate either the current saved-request/mock-rule bundle baseline or the new `T019` dry-run preview direction.
- A promotion should identify the exact missing flow, affected resource kind, validation path, and non-goals before any implementation task is created.
- Use `candidate-a-promotion-readiness.md` as the canonical narrowing note before writing or promoting any further Candidate A task.
- Use `candidate-a-gap-inventory.md` as the current evidence list before deciding that a gap is real, still broad, blocked by a missing first-class resource type, or plausibly narrow enough to revisit.
- Use `candidate-a-narrow-candidate-comparison.md` before reopening Candidate 2 or any later replacement candidate.

### Candidate B - Later Write-Time Migration-Engine Work
- Promote Candidate B only when compatibility pressure becomes concrete, such as real schema evolution that cannot be handled by the current read-compatible or migration-needed classification.
- The promotion must show why classification alone is no longer sufficient and what user or product risk justifies write-time migration.
- Do not promote migration-engine work as generic future-proofing.
- Use `candidate-b-promotion-readiness.md` before writing any Candidate B task so the scope is pinned to one lane and one blocked compatibility scenario.
- Use `candidate-b-gap-inventory.md` before writing any Candidate B task so one concrete compatibility lane is chosen explicitly.
- Use `candidate-b-narrow-lane-comparison.md` before writing any Candidate B task so the chosen lane is justified against the parked alternative rather than against broad migration-engine language.

### Candidate C - Packaging Polish
- Promote Candidate C only when a concrete release-readiness, packaging, or startup gap is documented that the current `check:app`, build/test wrappers, and `/api/app-shell-status` flow do not already cover.
- The trigger must be a real missing verification or delivery seam, not the already known environment-bound esbuild limitation by itself.
- Do not promote packaging polish just because it is one of the few remaining backlog buckets.
- Use `candidate-c-promotion-readiness.md` before writing any Candidate C task so the scope stays inside one concrete startup or packaging seam.
- Use `candidate-c-gap-inventory.md` before writing any Candidate C task so the current shipped coverage is re-checked before anyone proposes a future Candidate C implementation task.

## 4. Re-Entry Checklist
Before promoting any post-M3 work:
1. Re-read `../tasks/task-010-frontend-workspace-shell-implementation-plan.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, and `../architecture/material-3-adoption-plan.md`.
2. Confirm the current shipped baseline in code so the new work does not duplicate landed behavior.
3. Confirm that the validation path is real, bounded, and executable in the current environment.
4. Confirm the scope is narrow enough for one reviewable task rather than a broad future-facing theme.
5. Confirm the work does not reopen T010 shell scope or mix semantic changes with visual-system work.
6. Update `master-task-board.md`, `priority-roadmap.md`, and `progress-status.md` together when the hold state changes or a task is promoted.

## 5. Promotion Rules
- Do not promote more than one post-M3 workstream at once.
- Do not use vague "nice to have" language as the main reason to activate work.
- Do not treat dev-server startup alone as `M3-F3` readiness.
- Prefer one tightly scoped task over a broad umbrella follow-up.
- Prefer work with a credible validation path over work that is merely available.
- If the decision is still ambiguous after the checklist, keep the work parked and record the reason instead of forcing promotion.

## 6. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether live refresh on the gated request-builder and active-observation TSX files is fully healthy because the latest sandbox gate re-check returned env_blocked_transform before direct inspection could happen.
- **확실하지 않음:** which next authored-resource gap, if any, will become narrow enough to justify promotion without re-scoping the current shipped baseline.
- **확실하지 않음:** when compatibility pressure will be strong enough to justify a write-time migration engine instead of the current classification-only approach.
- **확실하지 않음:** whether a future packaging gap will be environmental, product-facing, or distribution-facing once the current sandbox limitation is no longer the main blocker.

## 7. Canonical Decision
- Treat `M3-F3` as landed in tracking. When sandbox restrictions block later confirmation, use local command handoff rather than holding the slice open.
- Keep `../tasks/task-019-server-backed-pre-import-preview.md` closed as the only landed post-M3 Candidate A follow-up so far.
- Keep `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md` closed as the Candidate B documentation narrowing step, not as migration-engine implementation.
- Keep `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md` closed as the Candidate C documentation narrowing step, not as packaging implementation.
- Keep `../tasks/task-022-post-t021-priority-review.md` closed as the historical no-promotion decision from the pre-closure `M3-F3` state.
- Keep `../tasks/task-023-candidate-b-import-migration-approach-decision.md` closed as the Candidate B approach-decision step, not as migration implementation.
- Keep `../tasks/task-025-post-m3-f3-closure-priority-review.md` closed as the latest no-promotion decision record after `M3-F3` closure.
- Keep `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md` closed as the blocker-boundary confirmation step, not as a new packaging or toolchain workstream.
- Keep `../tasks/task-027-placeholder-route-mvp.md` closed as the bounded implementation step that removed the remaining top-level placeholder routes without promoting selector, linkage, or settings-mutation scope.
- Keep `../tasks/task-029-request-environment-selection-and-resolution-plan.md` closed as the planning boundary for the now-landed request-level environment slice.
- Keep `../tasks/task-030-request-environment-selection-and-runtime-resolution.md` closed as the bounded implementation baseline for request-level selector plus server-owned resolution, not as a trigger to promote top-bar selector work or authored-resource transfer expansion.
- Keep `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md` closed as the latest no-promotion refresh after `T030`, not as a trigger to search for a new implementation task just because the environment baseline is more realistic now.
- Keep `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md` closed as the current narrowing note for deferred environment work, not as an automatic promotion of resolved-preview implementation.
- Keep Candidate B, Candidate C, and any additional Candidate A work parked until one of the reactivation triggers above is satisfied.
- Do not create another post-M3-F3 closure review task automatically from sandbox-only verification churn; use `T025` as the current closure-state review.
- Keep the current state as "one narrow next step plus clear parking rules," not "search for anything left to implement."
