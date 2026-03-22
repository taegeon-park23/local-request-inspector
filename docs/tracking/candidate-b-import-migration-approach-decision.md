# Candidate B Import Migration Approach Decision

- **Purpose:** Narrow the stronger Candidate B lane into one concrete authored-resource import migration approach so future contributors can judge promotion readiness from one bounded framing rather than from a broad solution space.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-b-promotion-readiness.md`, `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`, `../../storage/resource/authored-resource-bundle.js`, `../../storage/resource/authored-resource-import-plan.js`
- **Status:** active reference
- **Update Rule:** Update when the authored-resource import migration lane changes materially, when one concrete transform contract is documented, or when Candidate B is promoted beyond the current parked state.

## 1. Current Stronger Lane
- The stronger future Candidate B lane remains authored-resource import handling for bundle or bundled-resource versions that currently classify as `migration-needed`.
- Today that lane stops inside `storage/resource/authored-resource-bundle.js` before `prepareAuthoredResourceImport()` runs.
- The current repo does not define a versioned upgrade transform yet; it only classifies, accepts read-compatible shapes, or rejects unsupported upgrade-required shapes.

## 2. Current Repo Seam
- `parseAuthoredResourceBundleText()` parses raw JSON and calls `validateAuthoredResourceBundlePayload()`.
- `validateAuthoredResourceBundlePayload()` rejects bundle-level or bundled-resource compatibility states that are not `read-compatible`.
- `prepareAuthoredResourceImport()` assumes the bundle already passed current compatibility validation and only handles request/mock-rule naming, rejection aggregation, and summary creation.
- `server.js` preview and commit routes both call the same parse-plus-prepare seam, so any future migration handling should avoid duplicating logic between preview and commit.

## 3. Compared Approach Families
### Approach A - Bundle-level server normalization before current import planning
- Parse the raw bundle JSON into a loose payload, inspect bundle/resource schema versions, and apply one bounded upgrade transform on the server before the current validation-and-import-planning seam runs.
- After normalization, the existing validation, preview, confirm, and import-planning flow would continue to operate on one current-shape payload.

### Approach B - Per-resource upgrade inside import planning callbacks
- Allow older bundle/resource versions to pass deeper into the import path, then upgrade individual request or mock-rule entries during `prepareAuthoredResourceImport()` callbacks.
- This would push migration semantics into callback-specific request/mock-rule handling rather than one earlier normalization seam.

### Approach C - Reporting-only improvement over current `migration-needed` rejection
- Keep import rejection behavior, but provide richer reporting or guidance when a bundle or bundled resource is classified as `migration-needed`.
- This would improve operator clarity but would not actually unblock authored-resource import for older schema shapes.

## 4. Direct Comparison
| Criteria | Approach A - Bundle-level normalization | Approach B - Per-resource upgrade in import planning | Approach C - Reporting-only improvement |
| --- | --- | --- | --- |
| Fit with current server-owned truth | Strong. Keeps schema handling server-owned and centralized before preview/confirm/commit use the payload. | Weaker. Moves migration logic into request/mock-rule callbacks that currently assume already-supported shapes. | Strong for clarity only, but it does not solve the blocked import lane. |
| Scope narrowness | Narrow enough if limited to one bundle/resource version contract. | Looks narrow but risks spreading upgrade logic across bundle parsing, callbacks, and summary generation. | Narrow, but no longer a true Candidate B write-time migration step. |
| Overlap with shipped seams | Reuses current parse, preview, and import-planning seams after one bounded normalization step. | Requires reshaping current seam boundaries because `prepareAuthoredResourceImport()` is not designed as a migration stage today. | Overlaps current rejection messaging more than migration handling. |
| Validation path | Cleanest. Low-level Node seam tests can prove raw legacy payload -> normalized current payload -> unchanged preview/commit planning. | Harder. Would need mixed callback and route tests to prove request/mock-rule handling stays in sync. | Easy to test, but it is closer to operator guidance than to the stronger Candidate B lane. |
| Risk of scope creep | Moderate, but controllable if pinned to one legacy bundle/resource contract. | Higher. Can easily turn into per-resource migration infrastructure. | Lower, but it can distract from the actual blocked import lane by relabeling guidance as migration work. |
| Preview/confirm fit after `T019` | Best fit. Preview and commit can continue sharing one authoritative post-normalization plan. | Weaker. Preview and commit would each need to trust callback-level upgrade behavior deeper in the import path. | Works with current preview only as better rejection explanation, not as true unblocking. |

## 5. Decision
- **Approach A** is the strongest future framing for the authored-resource import migration lane.
- The future seam should be a **server-owned bundle-level normalization step before current validation/import planning**, not a per-resource callback migration stage.
- **Approach B** stays parked because it is more likely to leak migration semantics into request/mock-rule callbacks and widen the lane into general import-planning infrastructure.
- **Approach C** stays parked as a possible operator-guidance refinement, not as the primary Candidate B migration direction.

## 6. Why Candidate B Still Stays Parked
- The repo still does not define one real blocked legacy bundle sample or one explicit transform contract.
- It is still **확실하지 않음** whether the first justified transform should upgrade:
  - bundle-level metadata only,
  - bundled request/mock-rule schema only,
  - or one paired bundle-plus-resource contract.
- The current server seam clearly rejects `migration-needed`, but it does not yet specify what upgraded preview output should promise if normalization changes names, shapes, or warnings before confirm.
- Without one explicit contract, promoting implementation now would likely reopen broad migration-engine scope instead of one bounded import transform.

## 7. What Would Make This Promotable Later
1. One concrete authored-resource bundle or bundled-resource version transition appears in repo truth.
2. The repo documents one exact transform contract from that legacy shape into the current request/mock-rule bundle shape.
3. The transform stays inside the current workspace import surface and the current saved-request/mock-rule bundle scope.
4. Validation can remain primarily Node seam tests plus bounded import-route coverage, without depending on `M3-F3`.
5. Preview stays summary-level and advisory rather than turning into a per-record migration inspection platform.

## 8. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether the first justified transform would normalize bundle metadata, bundled resource records, or both together.
- **확실하지 않음:** whether preview would need one new migration warning summary category beyond the current accept/reject/rename vocabulary.
- **확실하지 않음:** whether a future real legacy sample will make reporting-only guidance sufficient for one release before true import-time normalization is needed.

## 9. Recommendation
- Keep Candidate B parked after this approach-decision pass.
- Use this note before any future Candidate B implementation proposal so the authored-resource import lane starts from one chosen approach, not from three competing migration framings.
- Do not create a new implementation task until one explicit transform contract exists.
