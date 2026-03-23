# T054 - Workspace Request Group Rename And Empty Delete UI

- **Purpose:** Add the next bounded request-group management controls in the canonical Workspace explorer so users can rename a persisted request group and delete an empty request group without reopening broader collection CRUD, nested tree behavior, or another workspace layout redesign.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-052-workspace-request-group-creation-and-save-placement-controls.md`, `task-053-workspace-request-placement-helper-refactor.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T054 closes the next narrow workspace follow-up after `T052` and `T053`:
- the canonical explorer now supports request-group rename actions
- empty request groups can now be deleted directly from the explorer
- open drafts and open tabs that reference a renamed or deleted group now keep their placement copy aligned without mutating unrelated workspace state

This slice stays intentionally narrow. It does not add collection CRUD, non-empty request-group deletion, nested groups, or another workspace explorer redesign.

## 2. Delivered Scope
### Completed
- added request-group rename and empty-delete actions to managed request-group nodes in the canonical workspace explorer
- added inline rename composition UI that reuses the same bounded composer pattern introduced for request-group creation
- disabled request-group deletion when the group still contains persisted requests and surfaced an explicit empty-group requirement message in the explorer
- synchronized active draft placement copy and open-tab placement copy after request-group rename so save messaging updates immediately
- synchronized active draft placement copy and open-tab placement copy back to the canonical default placement after request-group deletion
- preserved the stacked explorer header layout from `T051` and the focused overlay behavior from `T050` without reintroducing the earlier sticky selected-summary card
- added request-group rename/delete copy in both English and Korean catalogs
- added focused regression coverage for request-group rename and empty-delete behavior
- updated tracking docs so this slice becomes the latest landed workspace follow-up

### Explicitly Still Deferred
- collection create, rename, and delete UI
- moving or auto-provisioning drafts into collections that have no request groups
- deleting non-empty request groups
- full removal of `folderName` / `requestFolderName` compatibility aliases
- authored-resource environment/script bundle expansion

## 3. Guardrails
1. The explorer remains a canonical persisted tree only; it must not become a mirror of open drafts.
2. Request-group delete remains limited to empty groups in this slice.
3. Renaming or deleting a request group must not silently close working tabs.
4. Any sandbox-blocked UI verification must be handed off with exact local commands per `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- the workspace explorer can rename a request group
- the workspace explorer can delete an empty request group
- active drafts and open tabs keep their save-placement copy aligned after rename/delete
- request-group delete is visibly unavailable for non-empty groups
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
  - Expected success signal: Vitest starts normally and the targeted workspace assertions pass, including request-group rename propagating into draft placement messaging and empty-group delete falling back to the canonical default placement.
  - Manual UI confirmation:
    - open `/workspace`
    - create a temporary request group under `Saved Requests`
    - open a new request draft and select that group in `Save request group`
    - rename the request group from the explorer and confirm the save-placement note updates immediately
    - delete an empty request group and confirm the draft falls back to `Saved Requests / General`
    - verify delete stays disabled for any request group that still contains saved requests

## 6. Implementation Notes
- `client/features/workspace/components/WorkspaceExplorer.tsx` now renders bounded request-group rename and empty-delete controls plus inline rename composition state.
- `client/features/workspace/components/WorkspacePlaceholder.tsx` now owns request-group rename/delete mutations and synchronizes placement updates back into draft/tab stores.
- `client/features/request-builder/state/request-draft-store.ts` and `client/features/workspace/state/workspace-shell-store.ts` now expose request-group placement sync helpers for non-destructive placement-copy updates.
- `client/shared/i18n/workspace-route-messages.ts` and `client/app/shell/material-theme.css` now include the copy and layout support needed for the new explorer actions.
- `client/features/workspace/components/WorkspacePlaceholder.test.tsx` now covers rename/delete placement synchronization behavior.

## 7. Recommended Follow-Up Direction
- Keep future workspace follow-up narrow:
  - collection CRUD
  - empty-collection placement handling
  - full alias cleanup for `folderName` / `requestFolderName`
  - detached-draft result-panel polish after explicit saved-request deletion
