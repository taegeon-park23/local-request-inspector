# T059 - Workspace Detached Draft Result-Panel Polish

- **Purpose:** Clarify the post-delete detached-draft state in the Workspace builder, result panel, and saved-resource manager so users can tell the difference between an open working tab and a canonical saved request after explicit deletion.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-051-workspace-request-flow-and-canonical-request-tree.md`, `task-058-workspace-navigation-only-explorer-and-main-surface-management.md`, `task-060-workspace-saved-resource-manager-ergonomics-refinement.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T058` moved saved-resource management into the main workspace surface, but explicit saved-request deletion still left the surviving working tab visually ambiguous. After deletion, the tab correctly stayed open as a detached draft, yet the builder, result panel, and manager did not explain that state clearly enough.

`T059` closes that gap by making detached state explicit in all three places that matter:
- request builder
- result panel
- saved-resource manager

## 2. Delivered Scope
### Completed
- added a detached-draft badge and detached-state banner to the request builder
- added a detached-state banner and detached source copy to the result panel
- kept execution snapshot linkage and saved-placement metadata separate from the current tab identity
- changed the saved-resource manager request section so detached drafts no longer expose persisted export/delete actions
- replaced generic draft guidance with detached-specific resave guidance after explicit saved-request deletion
- added a shared detached-tab helper so builder, result panel, and manager read the same state contract
- added regression coverage for deleting a saved request while keeping the tab open as a detached draft

### Explicitly Still Deferred
- richer detached-draft response/result-panel polish beyond copy and section-state clarity
- authored-resource bundle expansion beyond the current saved-request/mock-rule scope
- environment/script transfer implementation work

## 3. Guardrails
1. Explicit saved-request deletion must still remove only the canonical tree leaf, not force-close the open tab.
2. Explorer selection must remain separate from detached working-tab state.
3. Detached state remains a client-only presentation/state refinement; no server API or storage contract changes are introduced here.
4. If UI verification is sandbox-blocked, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- deleting a saved request keeps the tab open as a detached draft
- the builder shows detached-state guidance and restore-by-save messaging
- the result panel shows detached-state guidance without losing historical execution snapshot context
- the saved-resource manager hides persisted request actions for detached drafts and replaces them with resave guidance
- regression coverage confirms the explorer leaf is removed while the detached draft remains editable

## 5. Implementation Notes
- `client/features/request-builder/request-tab-state.ts` now centralizes detached-tab detection so builder, result panel, and manager do not duplicate `sourceKey` parsing.
- `RequestWorkSurfacePlaceholder.tsx` now renders a detached-state badge/banner and reuses the current save placement for restore guidance.
- `RequestResultPanelPlaceholder.tsx` now distinguishes detached drafts from generic drafts in source copy and adds a detached-state banner ahead of the tabbed result content.
- `WorkspaceResourceManagerPanel.tsx` now treats detached drafts as a separate request-manager state and withholds persisted export/delete controls when the active tab no longer maps to a saved request leaf.

## 6. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`
- `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx client/features/request-builder/components/RequestBuilderCommands.test.tsx`

## 7. Local Verification Handoff
- If the targeted `test:ui` command is sandbox-blocked, run it outside Codex.
- Expected success signal:
  - Vitest starts normally.
  - Workspace tests confirm that deleting a saved request removes the explorer leaf but keeps the working tab open.
  - The builder, result panel, and manager all show detached-draft-specific guidance instead of generic saved-request actions.

## 8. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
  - `node -c server.js`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx client/features/request-builder/components/RequestBuilderCommands.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Interpretation:
  - If the local rerun passes, treat `T059` as fully verified.
  - If the local rerun fails, inspect the detached-draft assertions in `WorkspacePlaceholder.test.tsx` plus the new builder/result-panel detached copy before reopening scope.
