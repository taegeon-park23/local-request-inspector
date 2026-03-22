# Candidate B Promotion Readiness

- **Purpose:** Capture the current shipped compatibility baseline and define when later write-time migration-engine work becomes narrow enough to promote, so contributors do not reopen broad migration work from vague future-proofing language.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-010-frontend-workspace-shell-implementation-plan.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`
- **Status:** active reference
- **Update Rule:** Update when compatibility states, schema-version handling, or the promotion criteria for write-time migration work change.

## 1. Current Shipped Baseline
- The repo already ships explicit compatibility classification helpers in `storage/shared/compatibility.js`.
- The current compatibility vocabulary is:
  - `read-compatible`
  - `bootstrap-recoverable`
  - `migration-needed`
  - `unsupported-version`
  - `malformed-data`
- Runtime metadata compatibility is enforced in `storage/runtime/sqlite-runtime-storage.js`.
- Authored-resource bundle compatibility is enforced in `storage/resource/authored-resource-bundle.js`.
- Current shipped behavior uses classification and bounded rejection, not write-time upgrade transforms.

## 2. What Already Works Today
- Runtime metadata can proceed when it is `read-compatible`.
- Runtime metadata can also proceed when it is `bootstrap-recoverable`; missing metadata is re-written with expected current values during bootstrap.
- Authored-resource bundle import accepts the current bundle/resource schema and read-compatible legacy unversioned resource records.
- Authored-resource bundle import rejects `migration-needed`, `unsupported-version`, and malformed schema cases instead of trying to upgrade them in place.
- Low-level seam tests already cover the shipped classification behavior for runtime metadata and authored-resource bundles.

## 3. Current Boundaries
- There is no general write-time migration engine for runtime storage, resource bundles, or persisted resource files.
- There is no user-facing migration workflow, step-by-step upgrader, or recovery assistant beyond the current bounded error/classification output.
- There is no multi-version upgrade planner across resource lane and runtime lane together.
- Current behavior intentionally prefers:
  - bootstrap missing metadata safely
  - read compatible legacy shapes where already supported
  - reject older/newer unsupported versions clearly
  - defer destructive or write-upgrade logic

## 4. Gap Categories
### Runtime write-upgrade gap
- A future gap could appear if runtime metadata or runtime tables need a version transition that can no longer be handled by bootstrap plus current compatibility checks.
- This is not active today because current runtime compatibility still resolves into read-compatible, bootstrap-recoverable, or explicit hard-stop states.

### Authored-resource write-upgrade gap
- A future gap could appear if authored-resource bundle import needs to accept an older schema version that currently resolves to `migration-needed`.
- This is not active today because the shipped import baseline is intentionally narrow and rejects unsupported upgrade-required bundles.

### Operator guidance gap
- A future gap could appear if current compatibility errors become too opaque for recovery and the repo needs a clearer operator-facing recovery path before a real engine exists.
- This is still broader than a migration engine by itself and should not be conflated automatically with write-time upgrade logic.

### Broad platform migration initiative
- This includes umbrella ideas like "support schema migration everywhere" or "build a full upgrade system for all persisted data."
- This remains too broad and should stay parked.

## 5. Promotion Criteria
A future Candidate B promotion should generally require all of the following:
1. One clearly named blocked compatibility scenario that current classification cannot handle safely.
2. A single primary lane: runtime metadata/bootstrap, authored-resource import, or another specifically named persistence seam.
3. Clear user or operator impact, not just abstract future-proofing.
4. A narrow write-upgrade action that can be tested through low-level Node seam tests without reopening shell or `M3-F3` work.
5. Explicit non-goals that prevent the task from turning into a broad multi-lane migration platform.

## 6. Non-Promotion Examples
- "Build a migration engine for the app."
- "Support all older versions automatically."
- "Add better upgrade handling everywhere."
- "Make import/export backward compatible forever."
- "Prepare for future schema changes" without one concrete blocked seam.

## 7. Re-Entry Checklist
Before proposing Candidate B:
1. Confirm which current compatibility state is failing a real workflow.
2. Confirm the problem is not already handled by `read-compatible` or `bootstrap-recoverable`.
3. Confirm the problem cannot be solved by clearer rejection or operator guidance alone.
4. Confirm the scope stays inside one named persistence seam.
5. Confirm low-level Node seam validation is enough to prove correctness.
6. Update `master-task-board.md`, `priority-roadmap.md`, and `progress-status.md` together if Candidate B is ever promoted.

## 8. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** which lane would justify Candidate B first if compatibility pressure appears later.
- **확실하지 않음:** whether the first justified follow-up would be a true write-time migration step or a smaller recovery/reporting task instead.
- **확실하지 않음:** when authored-resource schema evolution will exceed the current read-compatible plus reject-and-stop model.
- **확실하지 않음:** when runtime metadata evolution will require more than bootstrap-recoverable defaults.

## 9. Recommendation
- Candidate B should remain parked after this readiness pass.
- The current repo truth still supports classification-first handling rather than write-time migration.
- Revisit Candidate B only when one concrete compatibility seam becomes blocked enough that classification and bounded rejection are no longer sufficient.
- Use `candidate-b-gap-inventory.md` before any future promotion decision so Candidate B starts from one concrete lane and not from a generic migration-engine idea.
- Use `candidate-b-narrow-lane-comparison.md` before any future promotion decision so the runtime startup lane and authored-resource import lane are compared directly before anyone proposes a future Candidate B implementation task.
- Use `candidate-b-import-migration-approach-decision.md` before any authored-resource import migration proposal so the stronger lane starts from one chosen approach instead of from a broad migration solution space.
