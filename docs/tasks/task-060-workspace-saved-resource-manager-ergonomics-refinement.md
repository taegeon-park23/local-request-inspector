# T060 - Workspace Saved-Resource Manager Ergonomics Refinement

- **Purpose:** Reorganize the main-surface saved-resource manager into clearer section-scoped cards so transfer, collection, request-group, and saved-request actions remain usable after the Workspace explorer became navigation-only.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-058-workspace-navigation-only-explorer-and-main-surface-management.md`, `task-059-workspace-detached-draft-result-panel-polish.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/workspace-flows.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T058` correctly moved CRUD and authored-resource transfer out of the explorer, but the first saved-resource manager pass still behaved like one large mixed form. Transfer preview state, collection CRUD, request-group CRUD, and saved-request actions all reported through one status lane and one dense surface.

`T060` refines that manager into four clearer lanes:
- authored-resource transfer
- collections
- request groups
- saved request actions

## 2. Delivered Scope
### Completed
- reorganized `WorkspaceResourceManagerPanel` into explicit section cards instead of one mixed management surface
- added section-scoped context/meta lists for selected collection, request-group, active tab, and save placement
- split manager status reporting into scoped callouts for transfer, collections, request groups, and saved request actions
- kept active draft placement as context only, without turning manager selection into implicit draft-placement mutation
- preserved import preview / confirm / cancel flow inside the transfer section instead of sharing generic CRUD status space
- updated Workspace placeholder wiring so each mutation writes to the correct manager status lane
- preserved the navigation-only explorer rule while making the main-surface manager easier to scan and act from

### Explicitly Still Deferred
- broader workspace visual redesign beyond the saved-resource manager cards/callouts
- authored-resource transfer implementation for scripts or environments
- server/storage changes to bundle scope or canonical tree structure

## 3. Guardrails
1. CRUD/import-export must remain on the main surface; this task must not move mutation controls back into the explorer.
2. Manager selection state is for management context only and must not silently rewrite draft placement.
3. The canonical `Collection > Request Group > Request` saved tree remains unchanged.
4. If UI verification is sandbox-blocked, local rerun handoff must follow `AGENTS.md`.

## 4. Definition Of Done
This task is complete when:
- the saved-resource manager renders explicit transfer, collection, request-group, and saved-request sections
- each section owns its own status/callout messaging instead of reusing one shared transfer status area
- the manager remains usable without explorer-side CRUD controls
- transfer preview/confirm/cancel flow still works from the main surface
- detached drafts and saved-request-backed tabs present clearly different action affordances inside the request section

## 5. Implementation Notes
- `WorkspaceResourceManagerPanel.tsx` now owns the sectioned layout and the scoped status contract.
- `WorkspacePlaceholder.tsx` now publishes a scoped manager-status map instead of a single shared transfer status object.
- `workspace-route-messages.ts` now includes manager context labels/values and detached-draft-specific request-section copy.
- `material-theme.css` now styles detached callouts plus section-local manager status/action layout.

## 6. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`
- `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx client/features/request-builder/components/RequestBuilderCommands.test.tsx`

## 7. Local Verification Handoff
- If the targeted `test:ui` command is sandbox-blocked, run it outside Codex.
- Expected success signal:
  - Vitest starts normally.
  - Workspace manager tests confirm collection/request-group/request actions still work from the main surface.
  - Import preview/confirm/cancel stays bound to the transfer section while CRUD status stays scoped to the correct card.

## 8. Validation Results
- Passed in this change set:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint:client`
  - `node -c server.js`
- Sandbox-blocked in this change set:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx client/features/request-builder/components/RequestBuilderCommands.test.tsx`
  - Result: the repo-local `test:ui` wrapper stopped before Vitest transform work began because the Codex sandbox blocked the `esbuild` helper process with `sandbox_esbuild_transform_blocked (original: EPERM)` / `spawn EPERM`.
- Interpretation:
  - If the local rerun passes, treat `T060` as fully verified.
  - If the local rerun fails, inspect `WorkspacePlaceholder.test.tsx` around the manager section flows and the scoped manager status wiring in `WorkspacePlaceholder.tsx` / `WorkspaceResourceManagerPanel.tsx`.
