# T015 - Import/Export Strategy Reconciliation

- **Purpose:** Reconcile the canonical backlog with the import/export and compatibility work already landed in S20-S24, document the current authored-resource transfer baseline, and park broader interoperability as future strategy work rather than missing implementation.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-004-persistence-strategy-decision.md`, `task-007-shared-domain-schema-and-naming-conventions.md`, `task-010-frontend-workspace-shell-implementation-plan.md`, `../architecture/persistence-strategy.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T015 is no longer a greenfield import/export design task. The repo already ships authored-resource bundle export/import for saved requests and mock rules, a create-new-identity import policy, resource/runtime schema markers, compatibility classification helpers, and read-compatible legacy handling. This task closes the backlog mismatch by documenting that shipped baseline, clarifying what remains out of scope, and redefining future interoperability as a later backlog concern rather than current missing work.

## 2. Why This Task Matters Now
- The canonical board still listed T015 as `todo`, which no longer matches the post-S24 implementation baseline.
- T018 milestone planning needs an accurate answer for what is already done versus what remains future-facing.
- Without a reconciliation document, contributors could reopen or duplicate authored-resource transfer work that is already landed.

## 3. Input Sufficiency Check
The current planning and implementation package is sufficient to complete T015 because it already defines:
- the JSON-resource and SQLite-runtime lane split in `../architecture/persistence-strategy.md`
- the canonical resource naming and compatibility vocabulary in shared schema and naming docs
- post-S20 implementation notes in `task-010-frontend-workspace-shell-implementation-plan.md`
- authored-resource bundle import/export seams in the current server/client implementation and low-level tests

Repository re-check before closing T015 confirmed:
- `docs/tasks/task-015-import-export-strategy.md` did **not** yet exist
- the canonical board still marked T015 as `todo`
- the repo already exposes workspace-level and single-resource bundle export, workspace import, compatibility validation, and import accept/reject summaries for saved requests and mock rules
- broader cURL/OpenAPI/Postman ingestion is still absent and remains **확실하지 않음** in timing

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/tasks/task-015-import-export-strategy.md` exists
- the shipped authored-resource bundle baseline is documented accurately
- future interoperability and write-time migration-engine work are explicitly deferred
- tracking docs are updated so T015 is no longer presented as missing baseline implementation

## 5. Outputs
- `task-015-import-export-strategy.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required persistence, schema, shell-follow-up, and tracking documents were re-read before closing T015.
- The repo already supports authored-resource-lane transfer for saved requests and mock rules through workspace-level and single-resource bundle export plus workspace-level import.
- The shipped import path uses a safe create-new-identity policy, keeps runtime history/captures/execution artifacts out of transfer scope, and returns bounded accept/reject summaries with imported-name previews.
- Compatibility handling already covers explicit resource/runtime schema markers, migration-needed versus unsupported-version classification, and read-compatible legacy bundle/resource paths without adding a write-time migration engine.
- T015 is therefore narrowed to strategy reconciliation and future backlog definition rather than new implementation work.

## 7. Key Decisions
1. T015 is satisfied as a documentation and reconciliation task, not as a fresh implementation task.
2. Current supported import/export scope is authored-resource transfer for saved requests and mock rules only.
3. Runtime artifacts such as execution history and captured requests remain intentionally excluded from transfer scope.
4. Broader interoperability such as cURL/OpenAPI/Postman import remains deferred and should not be implied as near-term committed work.
5. A write-time migration engine is not part of the current baseline; the existing read-compatible checks and migration-needed classification are sufficient for the shipped scope.

## 8. Open Questions
1. When broader external interoperability should be promoted remains **확실하지 않음**.
2. Whether future authored-resource bundles should include additional resource kinds beyond saved requests and mock rules remains **확실하지 않음**.
3. The point at which write-time migration becomes justified instead of read-compatible classification remains **확실하지 않음**.

## 9. Handoff Checklist
- [x] T015 task file exists and is linked from tracking docs
- [x] shipped authored-resource bundle scope is documented
- [x] deferred interoperability and migration-engine work are recorded
- [x] board, roadmap, and progress docs can treat T015 as closed

## 10. Recommended Owner
- Primary: Architecture Agent
- Secondary reviewer: Product / Documentation Agent

## 11. Closure Decision
T015 can be closed as **done** at the planning/documentation level. Future interoperability or broader resource-transfer work should re-enter the backlog as separate optional follow-ups rather than reopening T015 as if baseline import/export were still missing.
