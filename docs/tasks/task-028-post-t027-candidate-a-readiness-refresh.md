# T028 - Post-T027 Candidate A Readiness Refresh

- **Purpose:** Refresh Candidate A readiness and gap-inventory guidance after `T027` made `/environments` and top-level `/scripts` real persisted workflow surfaces instead of placeholders.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-019-server-backed-pre-import-preview.md`, `task-027-placeholder-route-mvp.md`, `../tracking/candidate-a-promotion-readiness.md`, `../tracking/candidate-a-gap-inventory.md`, `../tracking/candidate-a-narrow-candidate-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../tracking/post-m3-reactivation-guide.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T028 refreshes Candidate A documentation after `T027` changed an important repo truth: environments and standalone saved scripts are no longer placeholder routes or planning seams. They are now first-class persisted workflow objects. That change does not automatically promote any new Candidate A implementation task, but it does invalidate older readiness language that treated those resource kinds as blocked only because they were not real workflow objects yet.

## 2. Why This Task Matters Now
- Candidate A guidance still contained stale placeholder assumptions after `T027` landed.
- Those stale assumptions would distort the next authored-resource prioritization review by understating current repo capability.
- The repo needed one explicit no-promotion refresh that says "workflow object exists now" is not the same as "transfer lane is now narrowly ready."

## 3. Definition Of Done
This task is done when all of the following are true:
- Candidate A readiness docs no longer describe `/environments` or top-level `/scripts` as placeholder surfaces
- environment/script transfer gaps are reclassified using the current repo truth
- tracking docs state that `T027` does not automatically promote environment/script authored-resource transfer
- no new Candidate A implementation task is promoted in this pass

## 4. Outputs
- this task record
- refreshed Candidate A tracking notes
- board, roadmap, progress, and reactivation alignment

## 5. Key Decisions
1. Environments and standalone saved scripts are now real persisted workflow objects, not placeholder-only routes.
2. Their authored-resource transfer gaps therefore move out of the "blocked by missing first-class resource type" bucket.
3. That change still does not justify immediate promotion because transfer scope for those resource kinds remains too broad and under-specified.
4. Candidate A still has no new promoted implementation task after this refresh.
5. `T019` remains the only landed Candidate A implementation follow-up, and Candidate 2 remains parked.

## 6. Reclassification Result
- Environment transfer is now `real but broad` rather than `real but blocked by missing first-class resource type`.
- Standalone saved-script transfer is now `real but broad` rather than `real but blocked by missing first-class resource type`.
- The main reason they stay unpromoted is now transfer-boundary ambiguity:
  - secret handling and default-environment semantics for environments
  - request-bound versus standalone script boundaries, plus template exclusion rules, for scripts

## 7. Handoff Checklist
- [x] Candidate A docs updated for post-`T027` repo truth
- [x] tracking docs aligned with the refreshed no-promotion state
- [x] no new Candidate A task promoted automatically

## 8. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Product / Documentation Agent

## 9. Closure Decision
T028 is complete as a planning/tracking refresh. It keeps Candidate A guidance honest after `T027` without widening into environment/script transfer implementation. Future Candidate A proposals can now assume environments and standalone saved scripts are real workflow objects, but they still must define one narrow authored-resource transfer contract before promotion.
