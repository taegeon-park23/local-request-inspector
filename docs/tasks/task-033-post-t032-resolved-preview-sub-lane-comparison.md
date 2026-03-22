# T033 - Post-T032 Resolved-Preview Sub-Lane Comparison

- **Purpose:** Narrow the deferred richer resolved-preview UX lane after `T032` into directly comparable sub-lanes so future contributors do not reopen authoring feedback, result/history summaries, and summary-copy polish as one blended environment theme.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-030-request-environment-selection-and-runtime-resolution.md`, `task-031-post-t030-priority-and-candidate-a-refresh.md`, `task-032-post-t030-environment-follow-up-lane-comparison.md`, `../architecture/request-environment-selection-and-resolution.md`, `../architecture/request-builder-mvp.md`, `../tracking/environment-follow-up-lane-comparison.md`, `../tracking/resolved-preview-sub-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../tracking/post-m3-reactivation-guide.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T033 narrows the stronger future environment lane selected by `T032`. It compares the remaining resolved-preview sub-lanes directly and still does not promote implementation automatically. The strongest future narrow lane is now a post-run bounded resolution summary carried consistently in the active request result panel and persisted history. Pre-run unresolved-feedback tiering and explorer/readability copy remain parked because they reopen broader validation or authored-summary questions too quickly.

## 2. Why This Task Matters Now
- `T032` already chose richer resolved-preview UX over top-bar selector work and environment transfer, but it still left multiple different sub-lanes inside that one bucket.
- Without one more narrowing pass, future contributors could still reopen the area as a broad “finish environment UX” theme.
- A sub-lane comparison is lower risk than promoting a partially defined implementation task that mixes validation semantics, runtime observation copy, and saved-request summary polish.

## 3. Definition Of Done
This task is done when all of the following are true:
- the remaining resolved-preview sub-lanes are compared directly using current repo truth
- one strongest future narrow lane is identified without promoting implementation automatically
- board, roadmap, progress, and reactivation docs point to the same sub-lane decision
- pre-run unresolved-feedback tiering and explorer/readability copy remain explicitly parked

## 4. Outputs
- this task record
- `../tracking/resolved-preview-sub-lane-comparison.md`
- tracking alignment in `../tracking/`

## 5. Key Decisions
1. T033 is a planning/tracking task, not a feature task.
2. No new implementation task is promoted in this pass.
3. Inside the richer resolved-preview area, the strongest future narrow lane is post-run bounded resolution summary in request-result and history surfaces.
4. Pre-run unresolved-feedback tiering remains parked because the current baseline only detects unresolved placeholders during server-owned execution, so a credible pre-run lane would reopen validation-tier semantics and likely need a new preview/validation contract.
5. Explorer/readability copy remains parked because it is narrower but weaker, and it risks mixing authored-request summaries with runtime-observation language before the stronger result/history observation gap is settled.

## 6. Handoff Checklist
- [x] resolved-preview sub-lanes compared directly
- [x] strongest future narrow lane identified without implementation promotion
- [x] tracking docs aligned
- [x] pre-run tiering and explorer/readability copy remain explicitly parked

## 7. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Architecture Agent

## 8. Closure Decision
T033 is complete as a narrowing pass. If a future environment follow-up is actually requested, it should start from post-run bounded resolution summary in the request result panel and persisted history rather than from pre-run validation-tier work or saved-request summary polish.
