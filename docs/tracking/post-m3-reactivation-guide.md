# Post-M3 Reactivation Guide

- **Purpose:** Provide the canonical hold-state and reactivation rules for work after `M3-F1` / `M3-F2`, so contributors know when to wait, when to retry `M3-F3`, and when an optional backlog item is narrow enough to promote.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `m3-f3-implementation-handoff.md`, `candidate-a-promotion-readiness.md`, `candidate-a-gap-inventory.md`, `candidate-a-narrow-candidate-comparison.md`, `candidate-b-promotion-readiness.md`, `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `candidate-c-gap-inventory.md`, `../architecture/material-3-adoption-plan.md`, `../tasks/task-010-frontend-workspace-shell-implementation-plan.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md`, `../tasks/task-022-post-t021-priority-review.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`
- **Status:** active reference
- **Update Rule:** Update when the official `M3-F3` gate result changes, when an optional backlog item becomes narrowly promotable, or when the current post-M3 hold state changes.

## 1. Current Hold-State Summary
- `M3-F3` is no longer gated; the official `npm run check:m3f3-gate` procedure now reports `gate_clear`.
- `../tasks/task-019-server-backed-pre-import-preview.md` is landed as the bounded Candidate A delivery for the current workspace authored-resource import flow.
- `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md` is landed as the bounded Candidate B documentation follow-up for compatibility-gap narrowing.
- `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md` is landed as the bounded Candidate C documentation follow-up for packaging/startup gap inventory.
- `../tasks/task-022-post-t021-priority-review.md` is landed as the latest explicit no-promotion review after the Candidate B/C narrowing passes.
- `../tasks/task-023-candidate-b-import-migration-approach-decision.md` is landed as the latest Candidate B approach-decision pass for the stronger authored-resource import lane.
- `M3-F3` should now be treated as the active next implementation slice before any additional parked backlog is reconsidered.
- Use `m3-f3-implementation-handoff.md` when resuming `M3-F3` so the active slice starts from the exact pending request-builder/result-panel wrapper patch instead of from a fresh scope audit.
- Candidate B and Candidate C remain parked.
- No additional post-M3 implementation promotion should start until one reactivation trigger in this guide is satisfied.
- `T010` remains closed, and post-S26 work must not reopen shell route, provider, state-boundary, or ownership scope.

## 2. Why Each Item Is Blocked, Active, Or Parked
### M3-F3
- `M3-F3` is no longer gate-blocked because the official repo-native check, `npm run check:m3f3-gate`, now reports `gate_clear`.
- The latest direct run confirms that `typecheck`, build preflight, UI test preflight, root HTML, and real Vite TSX module transforms for `/app/bootstrap/main.tsx`, `RequestWorkSurfacePlaceholder.tsx`, and `RequestResultPanelPlaceholder.tsx` all pass in this environment.
- Dev-server startup or root HTML alone still would not have been enough, but the official gate now has the stronger success signal needed to revisit TSX presentation cleanup safely.

### Candidate A - Additional Authored-Resource Tooling
- The shipped authored-resource baseline already covers workspace-level import plus workspace-level and single-resource export for saved requests and mock rules.
- Import uses a create-new-identity policy and keeps runtime artifacts out of scope.
- One narrow Candidate A follow-up is now landed as `../tasks/task-019-server-backed-pre-import-preview.md`, which adds a server-backed no-write preview plus explicit confirm/cancel flow for the current workspace import surface.
- Broader Candidate A extensions are still too broad or under-scoped to promote safely without duplicating landed behavior.
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
- The current reactivation trigger is already satisfied: `npm run check:m3f3-gate` reports `gate_clear`.
- Continue using the same gate procedure before any future TSX presentation follow-up beyond the current `M3-F3` slice.
- Do not treat Vite port binding, root HTML `200`, or manual expectation as enough to bypass the official gate in later retries.

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
- **확실하지 않음:** whether live refresh on the gated request-builder and active-observation TSX files is fully healthy even after the gate now clears in this environment.
- **확실하지 않음:** which next authored-resource gap, if any, will become narrow enough to justify promotion without re-scoping the current shipped baseline.
- **확실하지 않음:** when compatibility pressure will be strong enough to justify a write-time migration engine instead of the current classification-only approach.
- **확실하지 않음:** whether a future packaging gap will be environmental, product-facing, or distribution-facing once the current sandbox limitation is no longer the main blocker.

## 7. Canonical Decision
- Treat `M3-F3` as the active next bounded implementation slice now that the official repo-native gate clears.
- Keep `../tasks/task-019-server-backed-pre-import-preview.md` closed as the only landed post-M3 Candidate A follow-up so far.
- Keep `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md` closed as the Candidate B documentation narrowing step, not as migration-engine implementation.
- Keep `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md` closed as the Candidate C documentation narrowing step, not as packaging implementation.
- Keep `../tasks/task-022-post-t021-priority-review.md` closed as the latest no-promotion decision record rather than as a new implementation track.
- Keep `../tasks/task-023-candidate-b-import-migration-approach-decision.md` closed as the Candidate B approach-decision step, not as migration implementation.
- Keep Candidate B, Candidate C, and any additional Candidate A work parked until one of the reactivation triggers above is satisfied.
- Keep the current state as "one narrow next step plus clear parking rules," not "search for anything left to implement."
