# T055 - Workspace Collection CRUD UI

- **Purpose:** Add the next bounded collection-management controls in the canonical Workspace explorer so users can create, rename, and delete empty collections without reopening empty-collection placement handling, nested tree behavior, or another workspace explorer redesign.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-052-workspace-request-group-creation-and-save-placement-controls.md`, `task-053-workspace-request-placement-helper-refactor.md`, `task-054-workspace-request-group-rename-and-empty-delete-ui.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T055 closes the next narrow workspace follow-up after `T054`:
- the canonical explorer now supports collection creation
- existing collections can now be renamed from the explorer
- empty collections can now be deleted from the explorer
- active drafts and open tabs keep their collection-placement copy aligned after collection rename/delete

This slice stays intentionally narrow. It does not add nested collections, non-empty collection deletion, or a broader pass over empty-collection save-placement UX.

## 2. Delivered Scope
### Completed
- added collection create, rename, and empty-delete actions to the canonical workspace explorer
- added inline collection composition UI that mirrors the bounded request-group composer pattern
- kept collection deletion disabled while a collection still contains request groups and surfaced an explicit empty-collection requirement message in the explorer
- synchronized active draft placement copy and open-tab placement copy after collection rename so save-placement messaging updates immediately
- synchronized active draft placement copy and open-tab placement copy back to the canonical default placement after collection deletion
- added collection CRUD client helpers for the existing server collection API surface
- updated collection rename handling on the server so persisted saved-request display placement stays aligned with renamed collections
- added focused regression coverage for collection create/rename/delete behavior
- updated tracking docs so this slice becomes the latest landed workspace follow-up

### Explicitly Still Deferred
- empty-collection placement UX beyond the current fallback semantics at T055 time (closed later by `T056`)
- auto-provisioning request groups when a user intentionally wants a new empty collection to become an active save target
- full removal of `folderName` / `requestFolderName` compatibility aliases
- detached-draft result-panel polish after explicit saved-request deletion
- authored-resource environment/script bundle expansion

## 3. Guardrails
1. The explorer remains a canonical persisted tree only; it must not become a mirror of open drafts.
2. Collection delete remains limited to empty collections in this slice.
3. Renaming or deleting a collection must not silently close working tabs.
4. Any sandbox-blocked UI verification must be handed off with exact local commands per `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- the workspace explorer can create a collection
- the workspace explorer can rename a collection
- the workspace explorer can delete an empty collection
- active drafts and open tabs keep their collection-placement copy aligned after rename/delete
- request-group-bearing collections remain visibly undeletable
- task/tracking docs reflect the new completed follow-up boundary

## 5. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
  - `node -c server.js`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
  - Result: the repo-local `test:ui` wrapper still stops before Vitest transform work begins because the Codex sandbox blocks the `esbuild` helper process with `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and the targeted workspace assertions pass, including collection creation in the explorer, collection rename propagating into draft placement messaging, and empty-collection delete falling back to the canonical default placement.
  - Manual UI confirmation:
    - open `/workspace`
    - create a new collection from the explorer
    - rename a non-default collection and confirm the draft save-placement note updates immediately
    - delete an empty collection and confirm the draft falls back to `Saved Requests / General`
    - verify delete stays disabled for any collection that still contains request groups

## 6. Implementation Notes
- `client/features/workspace/components/WorkspaceExplorer.tsx` now renders bounded collection create/rename/delete controls alongside the existing request-group controls.
- `client/features/workspace/components/WorkspacePlaceholder.tsx` now owns collection create/rename/delete mutations and synchronizes placement updates back into draft/tab stores.
- `client/features/request-builder/state/request-draft-store.ts` and `client/features/workspace/state/workspace-shell-store.ts` now expose collection-placement sync helpers in addition to the existing request-group sync helpers.
- `client/features/workspace/workspace-request-tree.api.ts` now exposes client helpers for collection create/update/delete.
- `server.js` now keeps saved-request display placement aligned when a collection is renamed.
- `client/shared/i18n/workspace-route-messages.ts` and `client/features/workspace/components/WorkspacePlaceholder.test.tsx` now include the copy and regression coverage needed for collection CRUD explorer flows.

## 7. Recommended Follow-Up Direction
- Keep future workspace follow-up narrow:
  - empty-collection placement handling
  - full alias cleanup for `folderName` / `requestFolderName`
  - detached-draft result-panel polish after explicit saved-request deletion
  - environment/script authored-resource bundle expansion

