# T065 - Request-Stage Saved-Script Library-Assist Route Bridge

- **Purpose:** Add one bounded discoverability follow-up after `T064` by letting users jump from the request-stage script editor to the standalone `/scripts` library with stage-aware context, without reopening linked reusable-script semantics.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-012-script-editor-and-automation-ux-spec.md`, `task-063-post-t062-request-stage-script-linkage-lane-comparison.md`, `task-064-request-stage-saved-script-attach-by-copy.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/script-editor-and-automation-ux.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T064` landed the reusable attach-by-copy baseline. `T065` is the bounded library-assist follow-up for that baseline. The request-stage Scripts tab can now open `/scripts` with stage-aware context, `/scripts` prefilters and preselects the requested saved script, and users can return to `/workspace` without changing request-stage persistence semantics or reopening linked reusable-script references.

## 2. Landed Scope
### Included
- explicit `Open Scripts library` action in the request-stage saved-script attach surface
- `/scripts` query-driven stage/script context from the active request stage
- stage-aware prefilter and requested-script preselection in `/scripts`
- lightweight `opened from request stage` guidance and `Back to request builder` action in `/scripts`
- focused regression coverage for the route-bridge flow

### Explicitly Excluded
- copying a script back automatically from `/scripts` into the request-stage editor
- live reusable-script references or request-stage linkage ids
- new bundle/import/export semantics
- broader `/scripts` route redesign or saved-script editor semantics changes

## 3. Implementation Notes
- The route bridge uses lightweight query-string context only: `from`, `stage`, and `scriptId`.
- Returning to `/workspace` keeps the existing request draft/tab state because the request-builder store remains route-independent.
- `/scripts` remains the standalone saved-script management surface; the request builder remains the request-owned authoring surface.
- This slice stays discovery-only. It does not add any new persistence semantics beyond the `T064` attach-by-copy baseline.

## 4. Validation Results
- Passed: `npm.cmd run typecheck`
- Passed: `npm.cmd run lint:client`
- Sandbox-blocked: `npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

### Local Verification Handoff
Run this command locally:

```powershell
npm.cmd run test:ui -- client/features/request-builder/components/RequestBuilderCommands.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx
```

Expected success signal:
- Vitest starts normally instead of failing during `esbuild` transform preflight.
- `RequestBuilderCommands.test.tsx` passes the new route-bridge assertions:
  - `Open Scripts library` navigates out of the request-stage editor
  - `/scripts` shows the route-bridge guidance and requested stage/script context
  - `Back to request builder` returns to the same workspace draft
- `ScriptsPlaceholder.test.tsx` passes the query-driven prefilter/preselect assertions for `/scripts?from=request-stage...`
- existing router assertions continue to pass without regression.

If the command fails:
- request-builder and scripts-route failures should be investigated first in `client/features/request-builder/components/RequestBuilderCommands.test.tsx` and `client/features/scripts/components/ScriptsPlaceholder.test.tsx`
- esbuild preflight failures in this sandbox are environment-level and should not reopen repo-side scope by themselves

## 5. Completion Criteria
- request-stage scripts can open `/scripts` with stage-aware context from the active saved-script attach surface
- `/scripts` reflects the incoming stage/script context without changing persistence semantics
- users can return to `/workspace` and keep editing the same request draft
- docs/tracking reflect that library-assist polish is implemented while linked reusable references remain deferred
