# T009 - Workspace Persistence Bootstrap

- **Purpose:** Turn the hybrid persistence decision into an initial storage scaffold for JSON-backed resources and SQLite-backed runtime artifacts.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-004-persistence-strategy-decision.md`, `task-005-script-execution-safety-model.md`, `task-006-frontend-stack-and-application-shell-decision.md`, `task-008-internal-api-contract-design.md`, `../architecture/persistence-bootstrap.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T009 converts the storage direction from T004 into concrete bootstrap code and documentation. The focus is not on complete persistence implementation, but on creating the first resource/runtime storage boundaries, migration/version metadata, and repository seams that later tasks can build on safely.

## 2. Why This Task Matters Now
- T011 needs a concrete place where request resources can eventually be saved without mixing them with runtime records.
- T012 needs runtime persistence boundaries that enforce redacted-only output assumptions.
- T014 needs a runtime schema starting point for captures/history behavior and filtering.
- T017 needs a baseline data-root convention and bootstrap entrypoint for local developer workflows.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T009 because it already defines:
- hybrid JSON + SQLite direction in `../architecture/persistence-strategy.md`
- resource/runtime entity split in `../architecture/shared-schema.md`
- redacted-only runtime persistence expectation in `../architecture/script-execution-safety-model.md`
- transport/storage separation in `../architecture/internal-api-contracts.md`
- frontend and UX follow-up consumers in T003/T006 outputs

Remaining items such as exact secret backend choice and long-term retention defaults are still **확실하지 않음**, but they do not block a bootstrap scaffold.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/persistence-bootstrap.md` exists.
- a storage bootstrap scaffold exists under `storage/`.
- JSON resource storage boundaries are visible in code.
- SQLite runtime bootstrap schema exists in code.
- version/migration metadata strategy is represented in the scaffold.
- follow-up inputs for T011, T012, T014, and T017 are summarized.

## 5. Outputs
- `../architecture/persistence-bootstrap.md`
- `../../storage/` scaffold
- tracking updates in `../tracking/`

## 6. Current Progress
- Required persistence, schema, safety, API, and frontend planning documents were re-read before starting T009.
- JSON resource storage, SQLite runtime storage, repository registry, migration SQL, and data-root helpers were scaffolded under `storage/`.
- The runtime bootstrap explicitly records redacted-only persistence mode and leaves secret/raw-value persistence out of scope.
- T009 outputs are sufficient to hand off to T011, T012, T014, T017, and later implementation work.

## 7. Open Questions
1. The final secret backend remains **확실하지 않음**.
2. Runtime retention defaults remain **확실하지 않음**.
3. The long-term migration runner strategy beyond the bootstrap SQL file remains **확실하지 않음**.
4. Whether `Folder` persists as a first-class file or nested metadata in early implementation remains **확실하지 않음**.

## 8. Handoff Checklist
- [x] T009 task file exists and is linked from tracking docs
- [x] persistence bootstrap architecture doc exists
- [x] storage scaffold exists under `storage/`
- [x] JSON resource and SQLite runtime boundaries are visible in code
- [x] redacted-only runtime persistence is reflected in code/comments/docs
- [x] T011 / T012 / T014 / T017 handoff inputs are summarized

## 9. Recommended Owner
- Primary: Backend Engineer
- Secondary reviewer: Architecture Agent

## 10. Closure Decision
T009 can be closed as **done** at the bootstrap/scaffold level. Remaining work belongs to entity-specific repository implementation, retention policy refinement, secret backend decisions, and downstream feature tasks.
