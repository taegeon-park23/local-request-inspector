# Candidate B Gap Inventory

- **Purpose:** Provide a grounded inventory of current Candidate B compatibility gaps so future contributors can start from concrete blocked seams rather than from broad migration-engine language.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-b-promotion-readiness.md`, `candidate-b-narrow-lane-comparison.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`
- **Status:** active reference
- **Update Rule:** Update when the shipped compatibility baseline changes or when a Candidate B gap is promoted, closed, or reclassified.

## 1. Current Baseline Snapshot
- The shipped repo already classifies compatibility states for runtime metadata and authored-resource bundles.
- Runtime metadata can proceed when it is `read-compatible` or `bootstrap-recoverable`.
- Authored-resource bundle import accepts current-schema and explicitly supported read-compatible legacy shapes.
- The shipped behavior rejects `migration-needed`, `unsupported-version`, and malformed compatibility cases instead of performing write-time upgrades.
- Low-level Node seam tests already verify the current classification and rejection behavior.

## 2. Classification Model
- `already covered`: the current shipped compatibility behavior already handles the case sufficiently.
- `real but broad`: a real future need exists, but the gap is still too umbrella-shaped to justify one bounded task.
- `plausible narrow future promotion candidate`: the gap is real, lane-specific, user/operator meaningful, and testable enough that it could justify one later task.
- `확실하지 않음`: current repo truth is not strong enough to classify the gap confidently.

## 3. Concrete Observed Gap Candidates
### Gap 1 - Missing runtime metadata bootstrap
- **Affected seam:** Runtime metadata bootstrap in `storage/runtime/sqlite-runtime-storage.js`
- **Why it might matter:** missing metadata should not brick an otherwise recoverable local runtime lane.
- **What is already shipped that overlaps:** `ensureMetadataCompatibility()` already accepts `bootstrap-recoverable` and writes expected metadata values back during startup.
- **Evidence from repo/docs:** `storage/runtime/sqlite-runtime-storage.js`, `storage/shared/compatibility.js`, `../tasks/task-015-import-export-strategy.md`
- **Classification:** `already covered`

### Gap 2 - Runtime metadata older schema blocks startup
- **Affected seam:** Runtime metadata compatibility when an existing local runtime DB reports an older schema version.
- **Why it might matter:** a future app version could encounter an older runtime lane that is no longer safe for direct reads/writes, which would block startup until the user resets or upgrades data.
- **What is already shipped that overlaps:** the repo already distinguishes `migration-needed` from `unsupported-version` and fails clearly rather than writing blindly.
- **Evidence from repo/docs:** `storage/runtime/sqlite-runtime-storage.js`, `storage/runtime/sqlite-runtime-storage.test.js`, `storage/shared/constants.js`
- **Classification:** `plausible narrow future promotion candidate`

### Gap 3 - Authored-resource bundle older schema cannot be upgraded on import
- **Affected seam:** Authored-resource bundle import for saved requests and mock rules.
- **Why it might matter:** future older exported bundles that classify as `migration-needed` cannot currently be upgraded during import, even if the transform could be safe and bounded.
- **What is already shipped that overlaps:** bundle import already validates kind/schema, supports explicit read-compatible legacy paths, and rejects unsupported upgrade-required bundles cleanly.
- **Evidence from repo/docs:** `storage/resource/authored-resource-bundle.js`, `storage/resource/authored-resource-bundle.test.js`, `../tasks/task-015-import-export-strategy.md`
- **Classification:** `plausible narrow future promotion candidate`

### Gap 4 - Unified multi-lane migration engine across runtime and authored resources
- **Affected seam:** Resource lane plus runtime lane together.
- **Why it might matter:** a future product could want one upgrade platform across all persisted data.
- **What is already shipped that overlaps:** current compatibility helpers already normalize the vocabulary, and lane-specific behavior is explicit.
- **Evidence from repo/docs:** `storage/shared/compatibility.js`, `candidate-b-promotion-readiness.md`
- **Classification:** `real but broad`

### Gap 5 - Recovery guidance for compatibility failures
- **Affected seam:** Operator-facing handling of compatibility failures.
- **Why it might matter:** current hard-stop errors may eventually need clearer recovery guidance before or instead of true write-time migration.
- **What is already shipped that overlaps:** compatibility errors already expose state and code details, and planning docs already distinguish migration-needed from unsupported-version.
- **Evidence from repo/docs:** `storage/shared/compatibility.js`, `candidate-b-promotion-readiness.md`, `../tasks/task-015-import-export-strategy.md`
- **Classification:** `real but broad`

## 4. Promotion-Ready Characteristics For Plausible Narrow Candidates
### Runtime metadata older schema blocks startup
- This stays inside one runtime lane and one bootstrap seam.
- It would be meaningfully different from "build a migration engine" because it targets one startup-blocking metadata/version transition only.
- A likely validation path would use Node seam tests around metadata compatibility and bootstrap behavior without depending on `M3-F3`.
- The main risk is operational sensitivity: startup-time write logic is harder to undo if the migration is wrong.

### Authored-resource bundle older schema cannot be upgraded on import
- This stays inside one authored-resource import seam and one JSON payload family.
- It would be meaningfully different from "support old versions generally" because it targets import-time handling for a known `migration-needed` classification.
- A likely validation path would use authored-resource bundle seam tests and import-lane API tests without depending on `M3-F3`.
- It avoids startup-critical runtime mutation and is currently the stronger future Candidate B lane.

## 5. Still-Too-Broad Categories
- "Build a migration engine for everything."
- Unified resource-lane plus runtime-lane upgrade orchestration.
- Broad recovery wizards or general upgrade UX without one blocked lane.
- Future-proofing work that is not tied to one real compatibility failure.

## 6. Recommendation
- One Candidate B lane is stronger than the others, but no implementation task should be created in this pass.
- The stronger future direction is authored-resource import handling for `migration-needed` bundle/resource versions because it is lane-specific, JSON-based, and less operationally risky than startup-time runtime mutation.
- Use `candidate-b-narrow-lane-comparison.md` before any future Candidate B promotion so the stronger lane is re-tested against the runtime metadata alternative rather than treated as assumed.
- Use `candidate-b-import-migration-approach-decision.md` before any future Candidate B promotion so the stronger authored-resource lane starts from one chosen migration framing rather than from multiple competing approach families.
- Runtime metadata write-upgrade remains a plausible future lane, but it should stay parked until a concrete blocked local-upgrade scenario exists.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether authored-resource import migration will still be the best first Candidate B lane once real schema evolution occurs.
- **확실하지 않음:** whether runtime metadata handling would first need write-upgrade logic or simply clearer recovery/reporting.
- **확실하지 않음:** whether future compatibility pressure will stay lane-local or eventually force a broader cross-lane strategy.
