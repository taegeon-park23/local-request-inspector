# T018 - Delivery Milestone Plan

- **Purpose:** Convert the post-S26 remaining work into phased milestones with readiness gates and review checkpoints so contributors can continue from an accurate, non-shell-reopening sequence.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-010-frontend-workspace-shell-implementation-plan.md`, `task-015-import-export-strategy.md`, `task-019-server-backed-pre-import-preview.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/post-m3-reactivation-guide.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T018 replaces the old pre-shell milestone placeholder with a post-S26 delivery plan. The result formalizes that T010 remains closed, T015 is a completed reconciliation task, `M3-F1` and `M3-F2` are landed, and later post-M3 work must respect the repo-native transform gate plus the parked optional backlog rules instead of reopening shell scope casually.

## 2. Why This Task Matters Now
- The current roadmap and board were still anchored to a pre-shell sequence even though S1-S26 are landed.
- The repo needs a milestone order that keeps visual-only follow-up work separate from feature-semantic or shell-ownership changes.
- Contributors need explicit gates for the remaining TSX-markup blocker so visual polish does not silently widen scope.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T018 because it already defines:
- the shell closure and post-S26 follow-up boundaries in `task-010-frontend-workspace-shell-implementation-plan.md`
- the current Material 3 baseline and rollout guardrails in `../architecture/material-3-adoption-plan.md`
- the reconciled import/export baseline in `task-015-import-export-strategy.md`
- the canonical execution status in `../tracking/master-task-board.md` and `../tracking/progress-status.md`

Repository re-check before closing T018 confirmed:
- `docs/tasks/task-018-delivery-milestone-plan.md` did **not** yet exist
- the canonical board still marked T018 as `todo`
- the active follow-up direction had already shifted to Material 3 visual-only polish
- optional future resource-tooling, migration-engine, and packaging work was already being described as separate from shell continuation

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/tasks/task-018-delivery-milestone-plan.md` exists
- the milestone order and review gates are documented
- active follow-up work and optional future backlog are clearly separated
- tracking docs are updated so T018 no longer appears as pending milestone planning

## 5. Outputs
- `task-018-delivery-milestone-plan.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required shell, Material 3, tracking, and import/export reconciliation documents were re-read before closing T018.
- T018 now defines a milestone order that starts with documentation reconciliation, then moves to Material 3 visual-only continuation, and keeps optional future work parked until a later promotion gate.
- The milestone plan explicitly protects shell closure, feature ownership, and state-boundary stability while sequencing `M3-F1`, `M3-F2`, and the final `M3-F3` TSX presentation slice.
- Implementation follow-up: `M3-F1`, `M3-F2`, and `M3-F3` are now landed in tracking, `../tracking/post-m3-reactivation-guide.md` is now the canonical hold-state and re-entry reference for later post-M3 promotion, Candidate A has since been narrowed and landed as `task-019-server-backed-pre-import-preview.md`, and Candidate B and Candidate C remain parked.

## 7. Milestone Sequence
### Milestone 1 — Backlog Reconciliation and Task Closure
- Close the stale backlog gap by delivering T015 and T018 task docs plus aligned tracking updates.
- Exit criteria: board, roadmap, and progress docs all agree that T010 stays closed, T015 is reconciled, and T018 is complete.

### Milestone 2 — Material 3 Continuation, CSS-First
- Execute `M3-F1` first, focused on placeholder/secondary routes and remaining shell affordances.
- Execute `M3-F2` second, focused on contrast, focus-visible, supporting-container rhythm, spacing/density, and empty/deferred/disabled readability.
- Exit criteria: both slices remain visual-only and existing save/run/history/captures/mocks/scripts/replay semantics are unchanged.

### Milestone 3 — TSX Presentation Refinement And Local Verification Handoff
- Land `M3-F3` as presentation-only refinement for the request-builder and active request observation wrapper hierarchy.
- If later verification is blocked by the sandbox, request exact local commands plus expected results instead of reopening the slice as blocked/deferred.
- Exit criteria: `M3-F3` lands as presentation-only refinement and any remaining sandbox-only confirmation is documented as local-verification handoff rather than as an active blocker.

### Milestone 4 — Optional Future Backlog Parking
- Keep additional authored-resource tooling beyond `T019`, later write-time migration-engine work, and packaging polish explicitly out of the active sequence.
- Promote any of those items only through a later milestone/priority update rather than folding them into Material 3 follow-up by accident.

## 8. Key Decisions
1. T018 is satisfied as a planning/documentation task in this change set.
2. Material 3 follow-up remains limited to bounded visual-only slices, including the now-landed `M3-F3` TSX wrapper refinement.
3. Sandbox-blocked verification should be handled through local command handoff rather than by keeping `M3-F3` unresolved in tracking.
4. Optional future work remains backlog parking, except where later narrowing explicitly promotes one bounded task such as `T019`.

## 9. Open Questions
1. Whether future contributors will still want extra local confirmation of the landed `M3-F3` slice remains **확실하지 않음**.
2. Whether light-theme activation or restrained-motion refinement should be promoted after `M3-F2` remains **확실하지 않음**.
3. Whether optional resource-tooling or packaging polish will be justified soon enough to become a milestone rather than backlog parking remains **확실하지 않음**.

## 10. Handoff Checklist
- [x] T018 task file exists and is linked from tracking docs
- [x] milestone order and review gates are documented
- [x] active versus optional follow-up work is separated cleanly
- [x] `M3-F3` has an explicit repo-native gate and bounded re-entry rule
- [x] board, roadmap, and progress docs can treat T018 as closed

## 11. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Product / Documentation Agent

## 12. Closure Decision
T018 remains closed as **done** at the planning/documentation level. `M3-F1`, `M3-F2`, and `M3-F3` are landed in tracking, `T019` is now landed as the bounded Candidate A follow-up, and the remaining optional backlog stays parked unless the current tracking docs plus `../tracking/post-m3-reactivation-guide.md` justify a later reactivation.
