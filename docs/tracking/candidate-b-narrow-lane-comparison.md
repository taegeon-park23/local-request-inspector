# Candidate B Narrow Lane Comparison

- **Purpose:** Compare the two currently plausible narrow Candidate B lanes directly so future contributors can decide whether one is ready for deeper narrowing without reopening broad migration-engine discussion.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-b-gap-inventory.md`, `candidate-b-promotion-readiness.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`
- **Status:** active reference
- **Update Rule:** Update when either Candidate B lane changes materially, when one lane is promoted, or when a third narrower Candidate B lane replaces this comparison.

## 1. Compared Lanes
### Lane 1 - Runtime metadata older schema blocks startup
- Focuses on `storage/runtime/sqlite-runtime-storage.js`.
- Targets runtime metadata compatibility when a local runtime DB reports an older schema version that is no longer `read-compatible` or `bootstrap-recoverable`.
- Would require a bounded startup-time write-upgrade or another equally explicit runtime recovery step.

### Lane 2 - Authored-resource bundle older schema cannot be upgraded on import
- Focuses on `storage/resource/authored-resource-bundle.js`, `storage/resource/authored-resource-import-plan.js`, and the workspace bundle import flow in `server.js`.
- Targets bundle or bundled-resource versions that classify as `migration-needed` during authored-resource import.
- Would require a bounded import-time upgrade path before current request/mock-rule records are written.

## 2. Repo-Grounded Baseline
- Runtime metadata currently accepts `read-compatible` and `bootstrap-recoverable` states, then writes expected metadata values during bootstrap.
- Runtime metadata throws and stops startup for `migration-needed`, `unsupported-version`, and malformed cases.
- Authored-resource bundle import already validates bundle kind/schema and per-resource kind/schema, and it already rejects `migration-needed`, `unsupported-version`, and malformed cases before any import plan is executed.
- `T019` now means authored-resource import already has a preview/confirm seam, but preview is still based on current supported bundle/resource shapes only.
- The existing tests cover both failure families as classification seams, not as upgrade transforms.

## 3. Direct Comparison
| Criteria | Lane 1 - Runtime metadata startup write-upgrade | Lane 2 - Authored-resource import migration-needed handling |
| --- | --- | --- |
| User-facing or operator-facing pain | Potentially severe if it happens, because startup can fail. Today this is only a plausible future case, not a currently blocked shipped workflow. | More directly user-facing if schema evolution happens, because import is an explicit workflow and `migration-needed` bundles currently hard-stop before use. |
| Narrowness of scope | Narrow at the file level, but semantically sensitive because it mutates startup-critical runtime state. | Narrower overall because it stays inside one JSON import seam and current request/mock bundle scope. |
| Overlap with shipped baseline | Some overlap with current bootstrap-recoverable logic, but a true write-upgrade would be a new class of startup mutation. | Some overlap with current bundle validation and `T019` preview/confirm flow, but the missing piece is still specific: handling `migration-needed` before commit. |
| Validation feasibility | Good Node seam coverage is possible, but correctness is harder to prove because bootstrap-time mutations affect app startup behavior. | Good Node seam and import-lane API coverage is possible without touching blocked `M3-F3` surfaces. |
| Operational risk | Higher. A bad runtime upgrade can affect local startup and may require manual recovery. | Lower. Import-time handling is bounded to one user action and one payload, not to the app bootstrap path. |
| Risk of duplicated or confusing logic | Lower duplication risk because runtime metadata is already centrally owned, but failure semantics are harder to communicate safely. | Moderate duplication risk if upgrade logic drifts from current validation, but it can stay inside the server-owned import seam. |
| Likelihood of scope creep | Moderate to high. Startup migration can easily expand into broader runtime upgrade policy, rollback, or repair tooling. | Moderate. Import migration can still sprawl into general backward-compatibility promises if not pinned to one versioned transform. |
| Need for a concrete blocked scenario before promotion | Very high. Promoting bootstrap-time mutation without a real blocked upgrade story would be speculative. | High, but slightly lower than Lane 1 because import is already a user-invoked workflow and the lane is less operationally sensitive. |

## 4. Lane-Specific Notes
### Lane 1 - Runtime metadata older schema blocks startup
- This remains plausible, but it is still the weaker next lane because the repo does not show a concrete operator-facing failure beyond synthetic compatibility tests.
- The current shipped model already draws a clear line between safe bootstrap recovery and stop-with-error behavior.
- A startup write-upgrade would need a tighter contract around rollback, partial failure, and operator recovery than the repo currently documents.
- That makes this lane more sensitive than its small code footprint suggests.

### Lane 2 - Authored-resource bundle older schema cannot be upgraded on import
- This remains the stronger future Candidate B direction because it stays inside an existing authored-resource import seam, uses server-owned validation, and avoids startup-critical mutation.
- `T019` makes the seam cleaner rather than broader: preview and confirm already exist, so a future import-time migration would stay inside the same workspace import flow.
- Even so, it is still not promotion-ready today because the repo does not yet define one concrete versioned transform contract.
- The current bundle layer distinguishes `migration-needed` clearly, but there is no real older schema sample, no selected bundle-vs-resource upgrade boundary, and no decision yet on how preview should present an upgraded import result.

## 5. Decision
- Lane 2 remains the stronger future Candidate B lane.
- Lane 1 remains parked as the more operationally sensitive alternative.
- No new Candidate B implementation task should be created from this comparison alone.
- Candidate B should stay parked until one lane has:
  1. one concrete blocked compatibility scenario,
  2. one explicit transform contract,
  3. one bounded validation plan that does not rely on speculative upgrade behavior.

## 6. What Would Change This Decision Later
- Promote Lane 2 first if a real authored-resource bundle version transition appears and the repo can define one bounded import-time transform without broadening current request/mock bundle ownership.
- Revisit Lane 1 only if runtime metadata evolution creates a real startup-blocking local-upgrade path that cannot be handled by current bootstrap recovery or clearer operator guidance.
- Use `candidate-b-import-migration-approach-decision.md` before any future authored-resource import migration proposal so Lane 2 starts from one chosen approach rather than from a broad transform solution space.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether the first justified Candidate B task would upgrade bundle schema, bundled-resource schema, or both together.
- **확실하지 않음:** whether future import-time migration would need preview-specific upgraded-name or upgraded-shape messaging beyond the current summary-level `T019` contract.
- **확실하지 않음:** whether runtime metadata pressure would surface first as a need for a true write-upgrade or only as a need for better operator recovery guidance.
