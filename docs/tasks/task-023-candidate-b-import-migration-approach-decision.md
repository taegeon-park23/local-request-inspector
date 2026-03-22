# T023 - Candidate B Import Migration Approach Decision

- **Purpose:** Narrow the stronger Candidate B lane from a general "authored-resource import migration-needed handling" idea into one concrete future approach, without promoting speculative migration implementation.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-015-import-export-strategy.md`, `task-018-delivery-milestone-plan.md`, `task-019-server-backed-pre-import-preview.md`, `task-020-candidate-b-gap-inventory-and-lane-selection.md`, `task-022-post-t021-priority-review.md`, `../tracking/candidate-b-promotion-readiness.md`, `../tracking/candidate-b-gap-inventory.md`, `../tracking/candidate-b-narrow-lane-comparison.md`, `../tracking/candidate-b-import-migration-approach-decision.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T023 takes the stronger future Candidate B lane identified in `T020` and the direct lane comparison from later tracking notes, then narrows that lane into one concrete future approach. The result is a new canonical decision: if Candidate B is ever promoted through the authored-resource import lane, it should prefer one server-owned bundle-level normalization step before the current validation/import-planning seam. T023 still does not promote implementation, because the repo lacks one explicit transform contract and one real blocked legacy bundle scenario.

## 2. Why This Task Matters Now
- Candidate B was already narrowed to one stronger future lane, but contributors still had to rediscover which migration framing best matched the current import seam.
- `T019` made preview and confirm part of the authored-resource import flow, which makes migration framing more important: future logic must not duplicate or split preview/commit behavior.
- A bounded approach-decision pass is lower-risk than opening a speculative migration implementation task.

## 3. Input Sufficiency Check
The current repo truth is sufficient to complete T023 because:
- `storage/resource/authored-resource-bundle.js` already shows where `migration-needed` cases are rejected
- `storage/resource/authored-resource-import-plan.js` already shows which current responsibilities belong to import planning and which do not
- `server.js` preview and commit routes already share one import parse/prepare seam after `T019`
- Candidate B readiness, gap inventory, and lane comparison already established that the authored-resource import lane is stronger than the runtime startup lane

Repository re-check before closing T023 confirmed:
- `migration-needed` bundle or bundled-resource versions still stop before import planning
- preview and commit already depend on one shared server-owned plan
- the repo still lacks a concrete versioned transform contract and real blocked legacy sample

## 4. Definition Of Done
This task is done when all of the following are true:
- `../tracking/candidate-b-import-migration-approach-decision.md` exists
- the stronger authored-resource import lane is narrowed to one chosen future framing
- the chosen framing is justified against at least one plausible alternative
- tracking docs can point future Candidate B discussion to the new approach-decision note
- Candidate B still remains parked unless a real transform contract exists

## 5. Outputs
- `../tracking/candidate-b-import-migration-approach-decision.md`
- tracking updates in `../tracking/`

## 6. Key Decisions
1. T023 is satisfied as a documentation and backlog-shaping task, not as migration implementation.
2. The strongest future Candidate B approach is a server-owned bundle-level normalization step before the current validation/import-planning seam.
3. Per-resource migration inside import callbacks stays parked because it widens the current seam and risks leaking migration logic into request/mock-rule callback behavior.
4. Reporting-only improvements stay parked as possible guidance work, not as the primary migration lane.
5. No new implementation task is promoted in this pass because one explicit transform contract is still missing.

## 7. Open Questions
1. Whether the first justified transform would normalize bundle metadata, bundled resource records, or both together remains **확실하지 않음**.
2. Whether preview would need one new migration summary category beyond the current `T019` summary vocabulary remains **확실하지 않음**.
3. Whether a real blocked legacy bundle case will appear before runtime compatibility pressure resurfaces remains **확실하지 않음**.

## 8. Handoff Checklist
- [x] `T023` task file exists and is linked from tracking docs
- [x] Candidate B now has a canonical approach-decision note for the stronger authored-resource import lane
- [x] board, roadmap, progress, and hold-state docs all keep Candidate B parked after this pass
- [x] no speculative migration implementation task is promoted

## 9. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: Architecture Agent

## 10. Closure Decision
T023 can be closed as **done** at the planning/documentation level. Candidate B is now narrowed through readiness, gap inventory, lane comparison, and one concrete approach decision, but implementation should remain parked until the repo can name one explicit transform contract for a real authored-resource import compatibility transition.
