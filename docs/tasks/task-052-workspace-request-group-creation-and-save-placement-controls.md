# T052 - Workspace Request Group Creation And Save Placement Controls

- **Purpose:** Add the first bounded request-group management UI inside the canonical Workspace explorer and connect new/existing drafts to explicit `Collection > Request Group` save-placement controls without reopening broader workspace CRUD or layout redesign.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-050-workspace-management-focused-overlay-and-content-preservation.md`, `task-039-workspace-authoring-localization-pass.md`, `task-040-workspace-result-panel-localization-pass.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T052 closes the next narrow workspace follow-up after `T051`:
- the canonical explorer can now create persisted request groups inside an existing collection
- the request builder now exposes explicit save-placement controls for collection and request group
- save payloads now carry the selected canonical placement instead of relying only on default placement seeding

This slice stays intentionally narrow. It does not add collection CRUD, request-group rename/delete, or another workspace-wide visual redesign.

## 2. Delivered Scope
### Completed
- added client API helpers for request-group create/update/delete so Workspace can start consuming the new request-group CRUD surface introduced in `T051`
- added inline request-group creation UI to the canonical workspace explorer under each collection node
- kept the explorer header in the stacked layout introduced in `T051` while adding the new group action without reintroducing vertical text collapse
- added request-builder save-placement controls for `Save collection` and `Save request group`
- added draft-local placement updates so changing the selected request group immediately updates save-placement messaging before save
- ensured new request saves include `collectionId`, `collectionName`, `requestGroupId`, `requestGroupName`, and compatibility alias `folderName`
- added workspace-scoped copy and styling for managed collection/request-group nodes, inline composers, and save-placement controls
- added regression coverage for request-group creation and save-placement persistence
- updated workspace request-group rename handling on the server so future rename UI will also keep related saved-request display names aligned

### Explicitly Still Deferred
- collection creation, rename, and delete UI
- request-group rename and delete UI
- clearing or moving drafts into empty collections with no request groups
- full removal of `folderName` compatibility aliases
- environment/script authored-resource bundle expansion

## 3. Guardrails
1. The explorer remains a canonical persisted tree only; it must not become a mirror of open drafts.
2. Save-placement controls affect request-definition save semantics only; they do not change the close-only meaning of workspace tabs.
3. Request-group creation is limited to existing collections in this slice.
4. Any sandbox-blocked UI verification must be handed off with exact local commands per `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- the workspace explorer can create a request group inside an existing collection
- new drafts show explicit collection/request-group save-placement controls
- changing the selected request group updates draft save-placement messaging
- save payloads carry the selected canonical placement fields
- task/tracking docs reflect the new follow-up boundary

## 5. Validation Results
- Passed in this change set:
  - `node -c server.js`
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
  - Result: the repo-local `test:ui` wrapper still stops before Vitest transform work begins because the Codex sandbox blocks the `esbuild` helper process with `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and the targeted workspace assertions pass, including inline request-group creation and save-placement persistence into the request save payload.
  - Manual UI confirmation:
    - open `/workspace`
    - create a request group under `Saved Requests`
    - open a new request draft
    - verify `Save collection` and `Save request group` controls are visible
    - switch the request group and confirm the placement note updates immediately
    - save the request and confirm it appears under the chosen request group after refresh

## 6. Implementation Notes
- `client/features/workspace/components/WorkspaceExplorer.tsx` now renders managed collection and request-group nodes plus an inline request-group composer.
- `client/features/workspace/components/WorkspacePlaceholder.tsx` now owns the request-group create mutation and passes canonical placement options into the request builder.
- `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx` now exposes explicit save-placement controls and draft-local placement updates.
- `client/features/request-builder/state/request-draft-store.ts` now supports placement updates separate from save commits.
- `client/shared/i18n/workspace-route-messages.ts` and `client/app/shell/material-theme.css` now include the copy and styling needed for request-group creation and placement controls.
- `server.js` now updates saved-request display placement metadata when a request group is renamed so later request-group management UI does not introduce stale display names.

## 7. Recommended Follow-Up Direction
- Keep future workspace follow-up narrow:
  - request-group rename/delete UI
  - collection CRUD
  - full `folderName` alias removal
  - empty-collection placement handling
