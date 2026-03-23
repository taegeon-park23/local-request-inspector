# T058 - Workspace Navigation-Only Explorer And Main-Surface Resource Management

- **Purpose:** Re-scope the Workspace explorer into a navigation-only saved-tree browser and move collection, request-group, request, and authored-resource management actions into the main workspace surface so traversal and mutation responsibilities no longer compete inside the same panel.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-052-workspace-request-group-creation-and-save-placement-controls.md`, `task-054-workspace-request-group-rename-and-empty-delete-ui.md`, `task-055-workspace-collection-crud-ui.md`, `task-056-workspace-empty-collection-placement-handling.md`, `task-057-request-group-alias-cleanup.md`, `../architecture/workspace-flows.md`, `../architecture/ux-information-architecture.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T051` correctly separated the canonical saved tree from working tabs, but later follow-up slices still let the explorer own too many mutation controls. That blurred the difference between:
- exploring persisted resources
- managing persisted resources
- editing the active request draft

`T058` narrows the workspace again:
- the explorer becomes navigation-only
- collection/request-group/request mutation moves into the main surface
- authored-resource import/export moves into the main surface as part of saved-resource management

## 2. Scope
### In Scope
- remove collection/request-group/request CRUD buttons from the explorer
- remove authored-resource import/export controls from the explorer
- keep saved-request opening inside the explorer as the only active explorer action
- add a main-surface saved-resource management panel for:
  - collection create/rename/delete
  - request-group create/rename/delete
  - saved-request export/delete
  - workspace authored-resource export/import preview/confirm/cancel
- keep request creation in the main surface via the tab shell
- keep request editing in the request builder
- update workspace copy/tests/docs so the explorer is described as navigation-only

### Out Of Scope
- collection/request-group nesting changes
- request builder save contract changes
- new workspace routes or a broad shell redesign
- environment/script management changes

## 3. Guardrails
1. The explorer remains the canonical saved-tree navigator, but not a management surface.
2. Main-tab close stays close-only.
3. Saved-request deletion stays explicit and main-surface-owned.
4. Canonical saved hierarchy remains `Collection > Request Group > Request`.
5. If sandbox restrictions block UI verification, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- the workspace explorer exposes only navigation behavior and saved-tree context
- collection/request-group/request management actions are available from the main workspace surface instead of the explorer
- authored-resource transfer entry points also live in the main workspace surface
- workspace copy/docs describe the explorer as navigation-only
- regression coverage matches the new control locations

## 5. Implementation Notes
- Reuse the existing workspace mutations already centralized in `WorkspacePlaceholder.tsx`; do not reintroduce persistence calls inside the explorer component.
- The main-surface manager may use the active draft placement as a default management context, but it must still be usable without forcing explorer selection.
- Request rename remains the existing request-name edit path in the request builder; this task mainly rehomes saved-request delete/export and collection/group CRUD.

## 6. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`
- `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

## 7. Local Verification Handoff
- If the targeted `test:ui` command is sandbox-blocked, run it outside Codex.
- Expected success signal:
  - Vitest starts normally.
  - Workspace tests confirm explorer navigation still works.
  - Workspace CRUD/import-export tests pass through the main-surface manager instead of explorer buttons.

## 8. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
  - `node -c server.js`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Interpretation:
  - If the local rerun passes, treat `T058` as fully verified.
  - If the local rerun fails, inspect `WorkspacePlaceholder.test.tsx`, `AppRouter.test.tsx`, and the new main-surface manager flow before reopening scope.
