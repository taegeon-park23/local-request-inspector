# T020 - Candidate B Gap Inventory And Lane Selection

- **Purpose:** Narrow Candidate B from a broad "later migration-engine work" bucket into repo-grounded compatibility gap candidates and identify the strongest future lane without promoting speculative implementation.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-015-import-export-strategy.md`, `task-018-delivery-milestone-plan.md`, `task-019-server-backed-pre-import-preview.md`, `../tracking/candidate-b-promotion-readiness.md`, `../tracking/candidate-b-gap-inventory.md`, `../tracking/candidate-c-promotion-readiness.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T020 takes Candidate B as the next documentation workstream after `T019` and narrows it into concrete compatibility-gap inventory rather than broad migration-engine language. The result documents the shipped classification-first baseline, inventories the real compatibility gaps that still exist, identifies the strongest future Candidate B lane, and keeps implementation parked until a later promotion decision is justified.

## 2. Why This Task Matters Now
- After `T019`, no implementation-ready post-M3 task was active by default.
- Candidate B had a readiness note, but contributors still had to rediscover which concrete compatibility gaps were real and which lane might justify later promotion.
- The remaining parked candidates also benefited from more symmetric documentation so future promotion decisions would not reopen vague backlog themes.

## 3. Input Sufficiency Check
The current planning and implementation package is sufficient to complete T020 because the repo already defines:
- the current authored-resource transfer and compatibility baseline in `task-015-import-export-strategy.md`
- the post-M3 hold-state and promotion rules in `../tracking/post-m3-reactivation-guide.md`
- the shipped compatibility helpers in `storage/shared/compatibility.js`
- runtime metadata compatibility enforcement in `storage/runtime/sqlite-runtime-storage.js`
- authored-resource bundle compatibility enforcement in `storage/resource/authored-resource-bundle.js`

Repository re-check before closing T020 confirmed:
- Candidate B was still parked and had no concrete gap inventory document yet
- the current runtime and authored-resource compatibility seams are classification-first, not write-upgrade-first
- Candidate C still relied on board/guide notes rather than a dedicated readiness document

## 4. Definition Of Done
This task is done when all of the following are true:
- `../tracking/candidate-b-gap-inventory.md` exists
- Candidate B is narrowed to concrete repo-grounded gap candidates instead of broad migration-engine language
- one stronger future Candidate B lane is identified without promoting implementation prematurely
- remaining parked candidates are documented more clearly where that improves re-entry quality
- tracking docs align on `T020` as a completed documentation task rather than a new implementation promotion

## 5. Outputs
- `../tracking/candidate-b-gap-inventory.md`
- `../tracking/candidate-c-promotion-readiness.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required PRD, task, tracking, compatibility, runtime storage, authored-resource bundle, and packaging-check documents were re-read before closing T020.
- Candidate B is now backed by both a readiness note and a concrete gap inventory.
- Candidate C now has a dedicated readiness note so packaging polish can be evaluated against the shipped baseline rather than against vague backlog momentum.
- `T020` keeps implementation parked while making future promotion decisions materially easier and less repetitive.

## 7. Key Decisions
1. T020 is satisfied as a documentation and backlog-shaping task, not as migration-engine implementation.
2. Candidate B remains parked at the implementation level even after T020.
3. The strongest future Candidate B direction is currently authored-resource import handling for `migration-needed` bundle/resource versions, because it stays inside one JSON import seam and avoids startup-critical runtime mutation.
4. Runtime metadata write-upgrade remains a plausible later lane, but it is more operationally sensitive and should not be promoted before a concrete blocked scenario exists.
5. Candidate C should stay parked and use a dedicated readiness note before any packaging work is proposed.

## 8. Open Questions
1. Whether authored-resource import migration handling will still be the strongest Candidate B lane when real compatibility pressure appears remains **확실하지 않음**.
2. Whether runtime metadata evolution will eventually force a startup-time write-upgrade path remains **확실하지 않음**.
3. Whether Candidate C will ever need product-facing packaging work beyond the current environment-bound esbuild limitation remains **확실하지 않음**.

## 9. Handoff Checklist
- [x] `T020` task file exists and is linked from tracking docs
- [x] Candidate B gap inventory exists
- [x] Candidate C readiness note exists
- [x] board, roadmap, and progress docs can treat T020 as closed
- [x] post-M3 reactivation guidance points to the new Candidate B / Candidate C references

## 10. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Architecture Agent

## 11. Closure Decision
T020 can be closed as **done** at the planning/documentation level. Candidate B is now the best-documented future parked workstream, but no write-time migration implementation should start until one concrete blocked compatibility lane is promoted through a later decision.
