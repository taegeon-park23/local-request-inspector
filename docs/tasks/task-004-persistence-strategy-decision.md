# T004 - Persistence Strategy Decision

- **Purpose:** Choose a practical local persistence strategy for user-managed resources and runtime artifacts so T005, T008, and T009 can proceed with aligned assumptions.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-007-shared-domain-schema-and-naming-conventions.md`, `../architecture/persistence-strategy.md`, `../architecture/shared-schema.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P0

## 1. Summary
T004 turns the architecture and shared-schema drafts into a storage decision. The focus is not implementation, but a decision-quality comparison of JSON-file, SQLite, and hybrid approaches for a local-first tool with mixed data shapes and retention patterns.

## 2. Why This Task Matters Now
- T005 needs to know how secrets, runtime results, and script outputs are stored or redacted.
- T008 needs to know which storage assumptions shape repository boundaries and API detail/snapshot behavior.
- T009 cannot bootstrap persistence without a chosen direction for low-volume resources and high-volume runtime artifacts.

## 3. T007 Input Validation
T007 is considered sufficient input for T004 because it now provides:
- persisted resource vs runtime artifact distinction
- scope rules (`workspace`, `globalLocalRuntime`, `derivedRuntime`)
- entity-level field drafts for all core entities
- explicit open questions around `Secret`, `RequestDraft`, `CapturedRequest`, and result persistence separation
- naming rules that support stable repository and API contracts

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/persistence-strategy.md` exists.
- JSON-file, SQLite, and hybrid approaches are compared using local-tool criteria.
- a recommended MVP direction is stated, including what is deferred.
- entity-level storage recommendations are documented.
- T005, T008, and T009 follow-up inputs are summarized.
- unresolved items remain marked **확실하지 않음**.

## 5. Outputs
- `../architecture/persistence-strategy.md`

## 6. Current Progress
- Persistence strategy draft completed in `../architecture/persistence-strategy.md`.
- T004 outputs were reviewed and judged sufficient to start T005 script execution safety work.

## 7. Open Questions
1. Whether secrets should live in the same persistence substrate as non-secret workspace resources is **확실하지 않음**.
2. Whether `CapturedRequest` belongs in the same physical store as `ExecutionHistory` is **확실하지 않음**.
3. Whether MVP should persist all runtime artifacts by default or apply bounded retention from day one is **확실하지 않음**.

## 8. Handoff Checklist
- [x] T004 task file exists and is linked from tracking docs
- [x] persistence strategy draft exists
- [x] T007 sufficiency is explicitly recorded
- [x] follow-up inputs for T005, T008, and T009 are summarized
- [x] unresolved decisions remain visible

## 9. Recommended Owner
- Primary: Architecture Agent
- Secondary reviewer: Storage / Backend Engineer
