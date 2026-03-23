# T057 - Request Group Alias Cleanup

- **Purpose:** Remove `folderName` / `requestFolderName` from canonical client and server response contracts so saved-request, result-panel, and history flows use `requestGroupName` consistently, while still reading legacy alias input during normalization.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-053-workspace-request-placement-helper-refactor.md`, `task-056-workspace-empty-collection-placement-handling.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/internal-api-contracts.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T057 closes the remaining alias-cleanup follow-up after the canonical Workspace request-tree work:
- canonical client types now use `requestGroupName` only
- server responses no longer emit `folderName` or `requestFolderName`
- result-panel and history consumers no longer branch across duplicate request-group aliases
- legacy saved-request input and import normalization still read `folderName` so older data stays compatible

This slice stays intentionally narrow. It does not remove legacy read-time fallback from the server, change stored resource ids, or reopen broader workspace placement UX.

## 2. Delivered Scope
### Completed
- removed `folderName` from canonical request placement, draft, tab, saved-request, and workspace tree client types
- removed `requestFolderName` from canonical execution/history client types
- updated request-builder, workspace result-panel, and history consumers to read only `requestGroupName`
- renamed the result-panel saved-placement i18n key to `savedInCollectionRequestGroup`
- stopped server response shaping from re-emitting `folderName` on saved requests, request snapshots, request-tree leaves, and execution/history payloads
- kept legacy server normalization reading `input.folderName` / persisted `record.folderName` so old data still upgrades into `requestGroupName`
- refreshed shared test fixtures and workspace/history regression expectations so payloads and snapshots no longer include the alias fields
- updated task/tracking docs so alias cleanup is no longer listed as an open workspace follow-up

### Explicitly Still Deferred
- detached-draft result-panel polish after explicit saved-request deletion
- authored-resource environment/script bundle expansion
- any later removal of legacy read-time fallback once stored data migration pressure clearly drops to zero

## 3. Guardrails
1. Canonical API and client contracts should emit `requestGroupName` only after this task.
2. Legacy read compatibility may remain on the server for old persisted resources, request imports, and older clients that still send `folderName`.
3. This task must not change collection/request-group ids, delete migration helpers, or reopen workspace save-flow behavior.
4. Any sandbox-blocked UI verification must be handed off with exact local commands per `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- client request/history/result/workspace types no longer expose `folderName` / `requestFolderName`
- server responses stop re-emitting those aliases while still accepting them as legacy input
- focused workspace/history regressions assert the new canonical payload shape
- task/tracking docs treat alias cleanup as completed rather than deferred

## 5. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
  - `node -c server.js`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
  - Result: the repo-local `test:ui` wrapper still stops before Vitest transform work begins because the Codex sandbox blocks the `esbuild` helper process with `spawn EPERM`.
- Local verification handoff:
  - Run `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/app/router/AppRouter.test.tsx` outside the Codex sandbox.
  - Expected success signal: Vitest starts normally and the targeted assertions pass, including saved-request payloads without `folderName`, history/result placement rendering through `requestGroupName`, and the workspace explorer/request-builder flows continuing to resolve canonical request-group placement correctly.
  - Manual UI confirmation:
    - open `/workspace` and save a request into an explicit request group
    - confirm network payloads and visible save-placement copy keep only the request-group wording
    - run the request and confirm the result panel placement/linkage still renders correctly
    - open `/history` and confirm saved placement still renders without any regression in linked request copy

## 6. Implementation Notes
- `client/features/request-builder/request-placement.ts` is now a request-group-only helper on the client side.
- `client/features/request-builder/request-builder.api.ts`, `client/features/request-builder/request-draft.types.ts`, `client/features/request-builder/request-tab.types.ts`, `client/features/history/history.types.ts`, and `client/features/workspace/workspace-request-tree.api.ts` now expose canonical request-group fields only.
- `client/features/request-builder/components/RequestResultPanelPlaceholder.tsx` and `client/features/history/components/HistoryPlaceholder.tsx` now read canonical placement/linkage without alias fallback.
- `server.js` still reads legacy `folderName` inputs during normalization, but canonical saved-request, request-snapshot, request-tree, and history/result payloads no longer emit alias fields.
- `client/shared/test/setup.ts`, workspace placeholder regression tests, and history placeholder tests now reflect the canonical alias-free payload shape.

## 7. Recommended Follow-Up Direction
- Keep future workspace follow-up narrow:
  - detached-draft result-panel polish after explicit saved-request deletion
  - authored-resource environment/script bundle expansion
  - optional later removal of server-side legacy read fallback once compatibility pressure clearly no longer justifies it
