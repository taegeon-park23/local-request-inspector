# T031 - Post-T030 Priority And Candidate A Refresh

- **Purpose:** Re-evaluate the next-step promotion decision after `T030` and refresh Candidate A guidance now that environments are not only route-level workflow objects but also request-linked run-time actors.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-019-server-backed-pre-import-preview.md`, `task-027-placeholder-route-mvp.md`, `task-028-post-t027-candidate-a-readiness-refresh.md`, `task-029-request-environment-selection-and-resolution-plan.md`, `task-030-request-environment-selection-and-runtime-resolution.md`, `../architecture/request-environment-selection-and-resolution.md`, `../tracking/candidate-a-promotion-readiness.md`, `../tracking/candidate-a-gap-inventory.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T031 refreshes the repo's next-step decision after `T030` landed request-level environment selection and server-owned run-time resolution. The result is still a no-promotion decision. `T030` makes environments more central to real request execution, but that change does not automatically justify top-bar selector work, richer resolved-preview UX, or environment authored-resource transfer. Instead, it makes the remaining environment-transfer question more obviously broad because the future contract would now have to cover secret/default semantics plus request-reference persistence, missing-reference handling, and run/history metadata expectations.

## 2. Why This Task Matters Now
- `T028` refreshed Candidate A after `T027`, but it did so before environments became request-linked execution inputs.
- `T030` changed the repo truth enough that contributors could reasonably misread it as a signal to promote environment transfer or top-bar selector work next.
- The repo needed one explicit post-`T030` review so the new environment baseline narrows follow-up expectations instead of widening them by implication.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T031 because the repo already defines:
- the route-level environment baseline in `task-027-placeholder-route-mvp.md`
- the post-`T027` Candidate A refresh in `task-028-post-t027-candidate-a-readiness-refresh.md`
- the request-level environment boundary in `task-029-request-environment-selection-and-resolution-plan.md`
- the landed request-level environment/runtime implementation in `task-030-request-environment-selection-and-runtime-resolution.md`
- the current Candidate A narrowing notes in `../tracking/candidate-a-promotion-readiness.md` and `../tracking/candidate-a-gap-inventory.md`

Repository re-check before closing T031 confirmed:
- `T030` is now the latest landed implementation task
- environments now affect request draft persistence, save/run validation, server-owned placeholder resolution, and history/result metadata
- that new coupling makes environment transfer more concrete but not more narrowly promotable
- Candidate 2 (`/mocks`-local import entrypoint) remains the strongest parked narrow Candidate A lane
- Candidate B and Candidate C still lack stronger promotion triggers than the existing parked state

## 4. Definition Of Done
This task is done when all of the following are true:
- the repo explicitly records whether `T030` changes the next promotion decision
- Candidate A guidance reflects that environments are now request-linked run-time actors rather than only route-level workflow objects
- board, roadmap, progress, and reactivation docs align on the same post-`T030` no-promotion conclusion
- no new implementation task is promoted automatically from `T030`

## 5. Outputs
- this task record
- Candidate A guidance refresh in `../tracking/`
- board, roadmap, progress, and reactivation alignment

## 6. Key Decisions
1. T031 is satisfied as a planning/tracking task, not as feature implementation.
2. No new implementation task is promoted in this pass.
3. `T030` is the implemented baseline for request-level environment selection and server-owned resolution; it does not imply that top-bar selector work or richer resolved-preview UX is unfinished baseline work.
4. Environment authored-resource transfer remains `real but broad`, and is now broader in one important way than it looked in `T028`: any future transfer contract would need to define how request `selectedEnvironmentId` references, missing imported environment references, secret/default behavior, and run/history environment labels should behave after transfer.
5. Standalone saved-script transfer remains `real but broad`; `T030` does not narrow template or request-bound-script ownership questions.
6. Candidate 2, the `/mocks`-local import entrypoint for the current bundle scope, remains the strongest parked narrow future Candidate A lane.
7. Candidate B and Candidate C remain parked.

## 7. Open Questions
1. Whether a future authored-resource environment-transfer task can be narrowed without reopening too much request/run/history coupling remains **확실하지 않음**.
2. Whether top-bar selector work will ever become narrower than the current request-level baseline rather than reopening broader environment state remains **확실하지 않음**.
3. Whether Candidate 2 will become cleanly local enough to promote before any future environment-transfer lane becomes narrow remains **확실하지 않음**.

## 8. Handoff Checklist
- [x] T031 task file exists and is linked from tracking docs
- [x] Candidate A docs reflect post-`T030` environment coupling
- [x] board, roadmap, progress, and reactivation docs all state that no new implementation task is promoted after `T030`
- [x] Candidate B and Candidate C remain explicitly parked

## 9. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Product / Documentation Agent

## 10. Closure Decision
T031 can be closed as **done** at the planning/tracking level. `T030` completes the intended request-level environment baseline, but it does not automatically justify another implementation task. The repo should remain in an explicit no-promotion state after this review, with future environment follow-up staying parked until one narrower task boundary is documented more defensibly than the current options.
