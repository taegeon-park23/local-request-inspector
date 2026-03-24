# T064 - Request-Stage Saved-Script Attach By Copy

- **Purpose:** Add one bounded reusable-script flow to the request builder by letting users copy a saved script into the active request stage without reopening linked-reference semantics.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-012-script-editor-and-automation-ux-spec.md`, `task-063-post-t062-request-stage-script-linkage-lane-comparison.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/script-editor-and-automation-ux.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T063` narrowed the next reusable-script follow-up lane to attach-by-copy. `T064` is the landed implementation for that decision. The request-stage script editor now loads compatible saved scripts for the active stage, copies one selected saved script into the active request-owned stage source, and shows a lightweight `Copied from saved script` provenance hint without introducing request-stage linkage ids or live synchronization semantics.

## 2. Landed Scope
### Included
- stage-aware saved-script attach UI inside the request-stage script editor
- active-stage compatibility filtering against persisted saved scripts
- explicit copy action that replaces the active stage source with the selected saved script source
- preserved normal dirty/save/run behavior after copy
- lightweight per-stage provenance hint through `Copied from saved script`
- focused request-builder regression coverage for copy-only behavior

### Explicitly Excluded
- linked reusable-script reference ids or live synchronization
- editing a saved script through the request-stage editor
- unlink/detach/version management flows
- request import/export or bundle contract changes
- broader `/scripts` route redesign

## 3. Implementation Notes
- `RequestScriptsEditorSurface` now queries the saved-script library on demand and shows only scripts whose `scriptType` matches the active request stage.
- Copy remains request-owned immediately after insertion. Request save payloads still serialize only request-stage source, not reusable-script linkage metadata.
- Stage compatibility is enforced by filtering the picker instead of offering cross-stage conversion.
- Provenance stays client-local and lightweight. It helps users understand where the current stage source came from without changing canonical saved-request contracts.

## 4. Validation Results
- Passed: `npm.cmd run typecheck`
- Passed: `npm.cmd run lint:client`
- Sandbox-blocked: `npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

### Local Verification Handoff
Run this command locally:

```powershell
npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/app/router/AppRouter.test.tsx
```

Expected success signal:
- Vitest starts normally instead of failing during `esbuild` transform preflight.
- `RequestBuilderCommands.test.tsx` passes the new attach-by-copy assertions:
  - only stage-compatible saved scripts are listed for the active stage
  - `Copy into stage` writes the saved script source into the active editor
  - the `Copied from saved script` hint renders after copy
- Existing workspace and router assertions continue to pass without regression.

If the command fails:
- request-builder failures should be investigated first in `client/features/request-builder/components/RequestBuilderCommands.test.tsx`
- esbuild preflight failures in this sandbox are environment-level and should not reopen repo-side scope by themselves

## 5. Completion Criteria
- users can attach one compatible saved script to the active stage by copy
- the copied script becomes editable request-bound source immediately
- no live reusable-script linkage metadata is added to saved request contracts
- docs/tracking reflect that the copy lane is implemented while linked references remain deferred
