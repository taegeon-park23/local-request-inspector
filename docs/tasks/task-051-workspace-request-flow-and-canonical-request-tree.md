# T051 - Workspace Request Flow And Canonical Request Tree Promotion

- **Purpose:** Redesign the Workspace request flow around a canonical persisted request tree and a separate working-tab set, promote `Collection > Request Group > Request` into the primary saved-resource structure, and align storage, API, import/export, and workspace UI documentation with that model.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-003-ux-information-architecture-and-workspace-flows.md`, `task-007-shared-domain-schema-and-naming-conventions.md`, `task-008-internal-api-contract-design.md`, `task-010-frontend-workspace-shell-implementation-plan.md`, `task-015-import-export-strategy.md`, `task-019-server-backed-pre-import-preview.md`, `task-039-workspace-authoring-localization-pass.md`, `task-040-workspace-result-panel-localization-pass.md`, `task-050-workspace-management-focused-overlay-and-content-preservation.md`, `../architecture/overview.md`, `../architecture/domain-model.md`, `../architecture/shared-schema.md`, `../architecture/internal-api-contracts.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`, `../architecture/request-builder-mvp.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T051 redefines the Workspace request surface as two separate lanes instead of one mixed explorer model:
- the explorer is now the canonical persisted request tree
- the main tab strip is now the working set of open authoring sessions
- the canonical saved hierarchy is now `Collection > Request Group > Request`

This change promotes collections and request groups into first-class persisted resources, adds a canonical request-tree endpoint, upgrades authored-resource bundle transfer to v2 with collection/request-group membership, removes the workspace sticky explorer summary assumption introduced in `T050`, and fixes the delete-vs-close mismatch that previously let workspace tabs and explorer items drift out of sync.

## 2. Delivered Scope
### Completed
- promoted `Collection` and `Request Group` to first-class persisted resource kinds in storage metadata and workspace reconciliation
- defined canonical workspace defaults as `Saved Requests > General`
- normalized legacy saved-request records that only carried `collectionName` and optional `folderName` into first-class collection/request-group records
- added canonical request-placement helpers and stable id generation for collections and request groups
- added `GET /api/workspaces/:workspaceId/request-tree` plus collection/request-group CRUD routes and explicit saved-request `GET`/`DELETE` routes
- updated request normalization so saved requests now carry `collectionId`, `requestGroupId`, `collectionName`, and `requestGroupName`, while `folderName` remains only as a compatibility alias
- upgraded authored-resource bundle transfer to schema version 2 with `collections`, `requestGroups`, `requests`, and `mockRules`
- upgraded bundle import planning and workspace import execution so legacy request-only bundles are normalized into default or migrated collection/request-group resources before request import
- rebuilt the workspace explorer around the canonical tree instead of fixture-like mixed request rows
- removed the workspace sticky selected-summary card and replaced it with a non-sticky inline selection breadcrumb plus a stacked explorer header that does not collapse into vertical text on narrow overlay widths
- kept main tab close (`X`) as close-only and introduced explicit saved-request deletion inside the explorer
- changed saved-request deletion so explorer tree entries are removed while open saved tabs become detached drafts instead of being implicitly destroyed
- added request-builder compatibility updates so active tabs, drafts, save/run payloads, and result-panel placement rendering all prefer `requestGroupName` over the old folder-only alias
- updated task/tracking and canonical PRD/architecture docs to treat request groups, the request tree endpoint, and the explorer-vs-working-tab split as the new source of truth

### Explicitly Still Deferred
- request-group creation/editing UI inside the explorer
- moving Environments or standalone Scripts into authored-resource bundle scope
- nested request groups or root-level saved requests
- removal of all `folderName` compatibility aliases from legacy request-builder internals in one breaking pass
- route-local mock import promotion or broader external interoperability work

## 3. Guardrails
1. The canonical saved hierarchy is one level only: `Collection > Request Group > Request`.
2. The explorer is a persisted-resource navigator, not a mirror of open drafts or replay tabs.
3. Main-tab close remains a pure close action; deletion must stay explicit.
4. Legacy `folderName` and `requestFolderName` aliases may remain temporarily for compatibility, but new storage/API contracts prefer `requestGroupName`.
5. If sandbox restrictions block verification, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- workspace saved-request placement is canonicalized around collection and request-group ids
- the workspace explorer renders a persisted tree instead of a mixed saved/draft representation
- workspace tab close no longer implies saved-request deletion
- explicit saved-request deletion removes the explorer leaf while preserving open work as a detached draft
- authored-resource bundle import/export includes collection and request-group resources in the canonical schema
- canonical PRD, architecture, and tracking docs describe the new workspace model consistently

## 5. Validation Results
- Passed in this change set:
  - `node -c server.js`
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
  - `npm.cmd run lint:cjs`
  - `node storage/resource/authored-resource-bundle.test.js`
  - `node storage/resource/authored-resource-import-plan.test.js`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and the targeted workspace-shell assertions pass, including the canonical explorer breadcrumb, persisted-tree-only rendering, and explicit delete/detached-draft behavior.
  - Manual UI confirmation:
    - open `/workspace`
    - verify the explorer header stays in a stacked layout instead of collapsing into vertical text
    - verify the explorer shows only saved collections, request groups, and requests
    - verify `X` on an open tab only closes the tab
    - verify explicit delete in the explorer removes the saved request from the tree while any open tab for that request stays editable as a detached draft
  - If the command passes, treat `T051` as fully verified with no additional repo-side follow-up.
  - If the command fails, inspect the workspace placeholder and shell tests before reopening scope.

## 6. Implementation Notes
- `server.js` now owns request-placement reconciliation, collection/request-group CRUD, request-tree assembly, legacy request normalization, and authored-resource bundle v2 normalization.
- `storage/resource/request-placement-record.js` is the canonical placement helper seam for default names, stable ids, and validation.
- `client/features/workspace/workspace-request-tree.api.ts` is now the canonical client seam for workspace explorer tree data and explicit saved-request delete.
- `client/features/workspace/components/WorkspaceExplorer.tsx` now renders the canonical tree directly and uses explicit export/delete actions on request leaves.
- `client/features/workspace/components/WorkspacePlaceholder.tsx` now opens saved tabs from the canonical tree, fetches real saved-request detail, and detaches open tabs on explicit delete.
- `client/features/request-builder/request-builder.api.ts`, `client/features/request-builder/hooks/useRequestBuilderCommands.ts`, `client/features/request-builder/state/request-draft-store.ts`, `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx`, and `client/features/request-builder/components/RequestResultPanelPlaceholder.tsx` now prefer canonical request-group placement fields while keeping compatibility aliases.
- `client/features/request-builder/state/request-draft-store.ts` and `client/features/workspace/state/workspace-shell-store.ts` now guard optional placement writes so exact-optional typing stays aligned while detached-draft and save flows preserve canonical collection/request-group identity.
- `T050` remains valid for Environments and Scripts, but its Workspace-specific sticky-summary assumption is superseded by this task.

## 7. Recommended Follow-Up Direction
- If workspace follow-up continues after T051, keep it bounded to one next concern such as request-group management UI, result-panel card tuning under the new detached-draft semantics, or authored-resource bundle expansion for environments/scripts instead of reopening another broad workspace explorer redesign.

