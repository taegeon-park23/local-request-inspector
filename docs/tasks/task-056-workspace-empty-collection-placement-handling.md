# T056 - Workspace Empty Collection Placement Handling

- **Purpose:** Make empty-collection save placement explicit in the canonical Workspace request builder so users understand that the first save will create the default request group, without reopening broader collection/request-group management or workspace architecture scope.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-052-workspace-request-group-creation-and-save-placement-controls.md`, `task-053-workspace-request-placement-helper-refactor.md`, `task-054-workspace-request-group-rename-and-empty-delete-ui.md`, `task-055-workspace-collection-crud-ui.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T056 closes the next narrow follow-up left intentionally open after `T055`:
- empty collections no longer appear to contain a persisted request group in the request builder
- selecting an empty collection now explains that the first save will create the default `General` request group
- the request-group picker is disabled while the selected collection only has this pending placeholder group
- save payloads keep the expected canonical collection placement plus request-group name, but omit a request-group id until the server creates the real group

This slice stays intentionally narrow. It does not add automatic non-default group creation, collection nesting, or broader save-flow redesign.

## 2. Delivered Scope
### Completed
- marked empty-collection request-group placement options as pending creation rather than persisted
- updated the request-builder placement helper surface so route-local UI can distinguish pending request groups from real canonical groups
- changed workspace request-builder placement support copy to explain first-save request-group creation for empty collections
- disabled the request-group selector while the selected collection only exposes a pending placeholder group
- kept save payload behavior compatible by sending collection placement plus request-group name without a request-group id for empty collections
- added focused regression coverage for empty-collection placement messaging, disabled request-group selection, and save payload expectations
- updated task/tracking docs so the empty-collection placement follow-up is no longer listed as an open workspace gap

### Explicitly Still Deferred
- full removal of `folderName` / `requestFolderName` compatibility aliases at T056 time (closed later by `T057`)
- detached-draft result-panel polish after explicit saved-request deletion
- authored-resource environment/script bundle expansion
- any broader request-placement redesign beyond the canonical `Saved Requests > General` default

## 3. Guardrails
1. Empty collections must remain canonical saved-tree nodes; this task must not reintroduce working-tab mirroring into the explorer.
2. The placeholder request-group option is explanatory only until save; it must not masquerade as a persisted request-group id.
3. The default placement contract remains `Saved Requests > General` unless the user explicitly selects another collection.
4. Any sandbox-blocked UI verification must be handed off with exact local commands per `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- selecting an empty collection shows first-save request-group creation guidance
- the request-group selector disables while an empty collection only exposes the placeholder default group
- saving from an empty collection preserves collection placement and default request-group naming without fabricating a request-group id client-side
- regression tests cover both the UI guidance and the save payload contract
- task/tracking docs no longer treat empty-collection placement handling as an open follow-up from `T055`

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
  - Expected success signal: Vitest starts normally and the targeted workspace assertions pass, including the first-save placement copy for empty collections, the disabled request-group selector for pending placeholder groups, and the save payload assertion that omits `requestGroupId` until the server creates the real group.
  - Manual UI confirmation:
    - open `/workspace`
    - create or select an empty collection
    - start a new request draft and choose that collection in the save-placement controls
    - confirm the support note explains first-save creation of `General`
    - confirm the request-group selector is disabled until a real group exists
    - save the request and confirm it lands inside the selected collection under `General`

## 6. Implementation Notes
- `client/features/request-builder/request-placement.ts` now exposes a `pendingCreation` hint plus a shared helper for detecting placeholder request-group options.
- `client/features/workspace/components/WorkspacePlaceholder.tsx` now marks empty collections with a pending default request-group option instead of treating that fallback like a persisted group.
- `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx` now explains first-save group creation, labels the placeholder option accordingly, and disables request-group selection while the group is still pending creation.
- `client/shared/i18n/workspace-route-messages.ts` and `client/features/workspace/components/WorkspacePlaceholder.test.tsx` now cover the new placement messaging and empty-collection payload expectations.

## 7. Recommended Follow-Up Direction
- Keep future workspace follow-up narrow:
  - full alias cleanup for `folderName` / `requestFolderName`
  - detached-draft result-panel polish after explicit saved-request deletion
  - authored-resource environment/script bundle expansion

