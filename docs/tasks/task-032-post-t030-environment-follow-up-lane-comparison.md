# T032 - Post-T030 Environment Follow-Up Lane Comparison

- **Purpose:** Narrow the remaining deferred environment follow-up space after `T030` into directly comparable lanes so future contributors do not reopen top-bar selector, resolved-preview, and transfer work as one blended theme.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-029-request-environment-selection-and-resolution-plan.md`, `task-030-request-environment-selection-and-runtime-resolution.md`, `task-031-post-t030-priority-and-candidate-a-refresh.md`, `../architecture/request-environment-selection-and-resolution.md`, `../tracking/environment-follow-up-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../tracking/post-m3-reactivation-guide.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T032 compares the three remaining environment-related follow-up lanes that still appear after `T030`: richer resolved-preview UX, top-bar global selector work, and environment transfer. The result is a narrowing decision, not an implementation promotion. Richer resolved-preview UX is the strongest future lane if priorities later require one more environment task, while top-bar selector work and environment transfer remain parked because they reopen broader ownership and contract questions.

## 2. Why This Task Matters Now
- `T031` explicitly kept the repo in a no-promotion state after `T030`, but it did not yet compare the deferred environment lanes against each other.
- Without one comparison note, later contributors could still reopen “environment follow-up” as a vague umbrella instead of one bounded lane.
- A lane comparison is lower risk than promoting another implementation task just because the request-level environment baseline is now more realistic.

## 3. Definition Of Done
This task is done when all of the following are true:
- the remaining deferred environment lanes are compared directly using current repo truth
- one strongest future lane is identified without promoting implementation automatically
- board, roadmap, progress, and reactivation docs point to the same comparison result
- top-bar selector and environment transfer remain explicitly parked

## 4. Outputs
- this task record
- `../tracking/environment-follow-up-lane-comparison.md`
- tracking alignment in `../tracking/`

## 5. Key Decisions
1. T032 is a planning/tracking task, not a feature task.
2. No new implementation task is promoted in this pass.
3. Richer resolved-preview UX is the strongest future environment lane because it can build on `T030` without changing request-level ownership.
4. Top-bar global selector work remains parked because it reopens shell-level state precedence and explicit-request semantics.
5. Environment transfer remains parked because it still needs a narrower contract around secret/default behavior and imported request references.

## 6. Handoff Checklist
- [x] deferred environment lanes compared directly
- [x] strongest future lane identified without implementation promotion
- [x] tracking docs aligned
- [x] top-bar selector and environment transfer remain explicitly parked

## 7. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Architecture Agent

## 8. Closure Decision
T032 is complete as a narrowing pass. The repo now has one canonical comparison for deferred environment follow-up work: richer resolved-preview UX is the strongest future lane if another environment task is ever requested, while top-bar selector and environment transfer stay parked.
