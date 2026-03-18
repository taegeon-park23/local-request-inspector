# T007 - Shared Domain Schema and Naming Conventions

- **Purpose:** Define canonical shared schemas and naming rules that downstream architecture, persistence, sandbox, and API design tasks can reuse consistently.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-001-foundation-architecture.md`, `../architecture/shared-schema.md`, `../architecture/naming-conventions.md`, `../architecture/domain-model.md`, `../tracking/master-task-board.md`
- **Status:** doing
- **Priority:** P0

## 1. Summary
T007 converts the T001 domain model into a more execution-ready schema language for follow-up tasks. The goal is to stabilize naming, resource categories, relation patterns, and field-level expectations without prematurely locking storage or framework choices.

## 2. Why This Task Matters Now
- T004 needs clear persisted-resource boundaries and runtime-record distinctions.
- T005 needs stable script, execution, secret, and test-result contracts.
- T008 needs shared DTO naming, event naming, and entity references before API paths and payloads are defined.
- Frontend, backend, and persistence work will drift quickly if naming and schema expectations stay implicit.

## 3. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/shared-schema.md` exists and defines canonical schema rules plus entity-level field drafts.
- `docs/architecture/naming-conventions.md` exists and defines cross-document/code naming conventions.
- `T007` is reflected in the master board and progress status.
- follow-up inputs for T004, T005, and T008 are explicitly summarized.
- unresolved schema decisions are marked **확실하지 않음** rather than being silently assumed.

## 4. Inputs Used
- T001 architecture overview
- T001 domain model
- T001 migration plan
- PRD overview and tracking docs

## 5. Outputs
- `../architecture/shared-schema.md`
- `../architecture/naming-conventions.md`

## 6. Current Progress
- T007 has been started.
- Shared schema draft is being documented based on T001 domain entities and relationships.
- Naming conventions are being normalized for entities, fields, enums, API paths, and events.

## 7. Open Questions
1. Whether `Secret` is a first-class persisted entity or an implementation policy behind `EnvironmentVariable` is **확실하지 않음**.
2. Whether `RequestDraft` should be a persisted entity, transient client model, or versioning strategy is **확실하지 않음**.
3. Whether `CapturedRequest` belongs to a workspace or global local runtime scope is **확실하지 않음**.
4. Whether `ExecutionResult` and `TestResult` are always separately persisted is **확실하지 않음**.

## 8. Handoff Checklist
- [x] T007 task file exists and is linked from tracking docs
- [x] shared schema draft exists
- [x] naming conventions draft exists
- [x] follow-up inputs for T004, T005, and T008 are summarized
- [x] unresolved decisions are called out explicitly

## 9. Recommended Owner
- Primary: Architecture Agent
- Secondary reviewer: Backend / API Design Agent
