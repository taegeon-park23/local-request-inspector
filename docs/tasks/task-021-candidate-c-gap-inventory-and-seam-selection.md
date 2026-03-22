# T021 - Candidate C Gap Inventory And Seam Selection

- **Purpose:** Narrow Candidate C from broad packaging-polish language into repo-grounded packaging/startup gap candidates and identify whether any concrete verification seam is strong enough for later promotion.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-018-delivery-milestone-plan.md`, `task-019-server-backed-pre-import-preview.md`, `task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tracking/candidate-c-promotion-readiness.md`, `../tracking/candidate-c-gap-inventory.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T021 takes Candidate C as the next documentation-only narrowing step after `T020` and turns broad packaging-polish language into a concrete inventory of shipped seams and remaining gap candidates. The result documents what is already covered by `check:app`, `/api/app-shell-status`, the built-shell-aware `/app` fallback, and the S26 wrapper layer, then keeps Candidate C parked because no narrowly justified packaging implementation task emerges from the current repo truth.

## 2. Why This Task Matters Now
- After `T020`, Candidate C still had a readiness note but no grounded inventory of actual packaging/startup gaps.
- Contributors still had to rediscover which Candidate C issues were already covered, which were only environment noise, and which were still too broad to promote safely.
- A concrete inventory reduces future speculation and keeps later Candidate C discussion aligned with the current shipped verification baseline.

## 3. Input Sufficiency Check
The current planning and implementation package is sufficient to complete T021 because the repo already defines:
- script-level packaging and startup verification in `package.json`, `scripts/check-app-shell.mjs`, `scripts/run-vite.mjs`, and `scripts/run-vitest.mjs`
- esbuild sandbox classification in `scripts/esbuild-sandbox-compat.mjs`
- built-shell-aware `/app` fallback behavior and `/api/app-shell-status` in `server.js`
- current hold-state and re-entry rules in `../tracking/post-m3-reactivation-guide.md`

Repository re-check before closing T021 confirmed:
- Candidate C still had a readiness note but no inventory of concrete packaging/startup gap candidates
- the current repo already exposes the main missing-built-shell and sandbox-blocked states explicitly
- no narrowly justified packaging implementation seam emerges yet beyond documentation and future monitoring

## 4. Definition Of Done
This task is done when all of the following are true:
- `../tracking/candidate-c-gap-inventory.md` exists
- Candidate C is narrowed to concrete repo-grounded gap candidates instead of broad packaging language
- already-covered packaging/startup seams are separated from broad or uncertain future ideas
- tracking docs align on `T021` as a completed documentation task rather than a new implementation promotion

## 5. Outputs
- `../tracking/candidate-c-gap-inventory.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required tracking, package/script, and server startup-verification seams were re-read before closing T021.
- Candidate C is now backed by both a readiness note and a concrete gap inventory.
- The inventory confirms that the repo already surfaces its main missing-built-shell and esbuild-sandbox states clearly, and that no narrow Candidate C implementation task is justified yet.

## 7. Key Decisions
1. T021 is satisfied as a documentation and backlog-shaping task, not as packaging implementation.
2. Candidate C remains parked at the implementation level after T021.
3. Missing-built-shell discoverability and sandbox-blocked build/test visibility are already covered by the shipped verification baseline.
4. No current Candidate C gap is narrow enough to justify a new implementation task; the only potentially cleaner future direction is a more unified machine-readable readiness seam, and that remains **확실하지 않음** rather than promotion-ready.

## 8. Open Questions
1. Whether a future Candidate C gap will be product-facing or only environment-facing remains **확실하지 않음**.
2. Whether a later Candidate C follow-up would be a machine-readable readiness seam or another packaging/status improvement remains **확실하지 않음**.
3. Whether the current esbuild restriction will eventually stop dominating Candidate C discussion remains **확실하지 않음**.

## 9. Handoff Checklist
- [x] `T021` task file exists and is linked from tracking docs
- [x] Candidate C gap inventory exists
- [x] board, roadmap, and progress docs can treat T021 as closed
- [x] post-M3 reactivation guidance points to the new Candidate C inventory reference

## 10. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Architecture Agent

## 11. Closure Decision
T021 can be closed as **done** at the planning/documentation level. Candidate C is now narrowed to a concrete packaging/startup inventory, but no packaging implementation should start until one missing verification seam is real enough to justify later promotion.
