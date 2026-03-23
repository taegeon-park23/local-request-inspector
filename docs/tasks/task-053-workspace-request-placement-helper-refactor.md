# T053 - Workspace Request Placement Helper Refactor

- **Purpose:** Consolidate duplicated Workspace request-placement normalization logic into one shared helper so canonical `Collection > Request Group > Request` placement stays consistent across request-builder, workspace shell, and result-panel flows without changing product behavior.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-052-workspace-request-group-creation-and-save-placement-controls.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T053 closes one bounded internal follow-up after `T051` and `T052`:
- introduce a shared request-placement helper for collection/request-group alias handling
- remove repeated placement formatting and fallback logic from request-builder/workspace surfaces
- keep save, open, draft, and result-panel placement rendering behavior unchanged

This task is intentionally a refactor slice. It does not add new Workspace behavior, storage contracts, or route-level UX.

## 2. Delivered Scope
### Completed
- added `client/features/request-builder/request-placement.ts` as the shared placement helper module
- consolidated placement-field creation, request-group alias reads, placement replacement, and path formatting in that helper
- refactored request-builder API mapping, draft-store placement commits, workspace shell tab save state, workspace request-tree fallback shaping, and result-panel placement rendering to use the shared helper
- removed several route-local placement helpers and repeated default-group fallback branches
- kept existing canonical placement semantics from `T051` and `T052` unchanged while reducing drift risk for future request-group CRUD work
- updated tracking docs so this refactor is recorded as a completed internal follow-up

### Explicitly Still Deferred
- request-group rename/delete UI
- collection CRUD
- full removal of `folderName` compatibility aliases
- authored-resource environment/script bundle expansion

## 3. Guardrails
1. No backend API or persisted storage contract changed in this slice.
2. No new Workspace behavior is introduced; the goal is consistency and maintainability only.
3. Compatibility aliases such as `folderName` remain in place until a dedicated cleanup task removes them repo-wide.

## 4. Definition Of Done
This task is complete when:
- placement normalization lives in one shared helper instead of multiple feature-local copies
- request save/open/draft/result flows still compile and lint cleanly
- tracking docs reflect the refactor as a completed internal follow-up

## 5. Validation Results
- Passed in this change set:
  - `node -c server.js`
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
- Not rerun in this change set:
  - targeted UI suites from `T052`
  - reason: this slice changes internal placement helpers only and does not intentionally alter Workspace behavior; the existing local UI rerun handoff from `T052` still applies if visual regression confirmation is needed outside the sandbox.

## 6. Implementation Notes
- `client/features/request-builder/request-placement.ts` is now the canonical client helper for placement-field creation, placement replacement, request-group alias reads, and placement-path formatting.
- request-builder and workspace modules now consume that helper instead of reimplementing collection/request-group fallback logic.
- the result panel now formats saved placement labels through the same helper path used by other workspace surfaces.

## 7. Recommended Follow-Up Direction
- Keep future workspace follow-up narrow and behavior-oriented:
  - request-group rename/delete UI
  - collection CRUD
  - full alias cleanup for `folderName` / `requestFolderName`
