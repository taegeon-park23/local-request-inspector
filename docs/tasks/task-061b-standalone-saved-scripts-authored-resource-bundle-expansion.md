# T061B - Standalone Saved Scripts Authored-Resource Bundle Expansion

- **Purpose:** Extend the current workspace authored-resource bundle so standalone saved scripts participate in export, import preview, and import flows without reopening environment transfer semantics.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-015-import-export-strategy.md`, `task-058-workspace-navigation-only-explorer-and-main-surface-management.md`, `task-060-workspace-saved-resource-manager-ergonomics-refinement.md`, `task-061a-authored-resource-bundle-expansion-narrowing.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/internal-api-contracts.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T061A` fixed the next authored-resource expansion lane to **standalone saved scripts first**. `T061B` implements that lane by expanding the workspace-level authored-resource bundle to carry standalone saved scripts alongside collections, request groups, saved requests, and mock rules.

This slice stays bounded to workspace bundle import/export preview and confirm flows. It does not add environment transfer, request-stage shared-script references, or a broader authored-resource migration engine.

## 2. Scope
### Included
- add saved scripts to workspace authored-resource bundle export
- add saved scripts to authored-resource import preview and confirm
- extend bundle summary counts, rejection kinds, and imported-name previews to include saved scripts
- update Workspace transfer UI copy so bundle summaries mention saved scripts
- keep single-request and single-mock-rule export flows unchanged unless they need explicit empty `scripts` arrays for schema consistency
- add low-level bundle/import-plan regression coverage and bounded Workspace UI regression coverage

### Explicitly Excluded
- environment authored-resource transfer
- request-stage script attachment/reference semantics
- route-local `/scripts` import/export UI separate from workspace bundle flow
- write-time migration-engine work beyond bounded bundle compatibility handling

## 3. Interface / Contract Changes
- `AuthoredResourceBundleExport` gains a `scripts` array of standalone persisted saved scripts.
- `AuthoredResourceBundleImportResult` and preview summary gain saved-script acceptance and count fields.
- Workspace resource bundle server endpoints keep the same URLs, but exported/imported payloads now include saved scripts.
- The authored-resource bundle schema version is expected to advance so new exports always include the `scripts` lane while older bundle imports remain read-compatible.

## 4. Implementation Notes
- Workspace bundle export should include `listWorkspaceSavedScriptRecords(workspaceId)`.
- Import preview/confirm should treat saved scripts like other authored resources: new identity on import, name-collision suffixing, and bounded validation rejection.
- Compatibility handling should continue to accept older bundles that do not yet include `scripts`.
- Workspace manager copy should mention saved scripts in preview/import/export summaries, but the explorer remains navigation-only.

## 5. Validation Plan
- `node storage/resource/authored-resource-bundle.test.js`
- `node storage/resource/authored-resource-import-plan.test.js`
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`
- `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

If the UI test command is blocked by the sandbox, record the exact local rerun handoff and expected success signal here before marking the task done.

## 6. Open Questions
- **확실하지 않음:** Whether a later follow-up should add single saved-script bundle export from `/scripts` or keep standalone scripts transferable only through the workspace bundle lane.

## 7. Completion Criteria
- workspace bundle export/import preview/import support saved scripts
- bundle summaries and imported preview names include saved-script outcomes
- older bundles without `scripts` remain importable
- tracking docs and task notes reflect the bounded saved-scripts-first implementation lane

## 8. Delivered Output
- bumped the authored-resource bundle schema to `v3` so workspace exports now include standalone saved scripts alongside collections, request groups, saved requests, and mock rules
- extended bundle validation/import planning so older bundles without `scripts` still import while newer bundles can preview/import accepted saved scripts with collision-safe renaming and summary counts
- updated workspace transfer client contracts and main-surface manager messaging so export/import preview/import summaries surface saved-script counts and imported-name previews
- kept single-request and single-mock-rule export flows bounded by returning explicit empty `scripts` arrays for schema consistency rather than widening route-local transfer UX
- added low-level bundle/import-plan regression coverage plus Workspace UI regression coverage for saved-script export/import preview/import behavior

## 9. Validation Results
### Passed in this sandbox
- `node storage/resource/authored-resource-bundle.test.js`
- `node storage/resource/authored-resource-import-plan.test.js`
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `node -c server.js`

### Sandbox-blocked local rerun handoff
- Command:
  - `npm.cmd run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
- Sandbox failure:
  - `esbuild` helper preflight was blocked with `sandbox_esbuild_transform_blocked (spawn EPERM)` before Vite/Vitest transform work could start.
- Expected success signal when run locally:
  - Vitest starts normally instead of failing at the preflight wrapper.
  - `WorkspacePlaceholder.test.tsx` passes the saved-script bundle export/import preview/import assertions, including the `/scripts` route refresh after import.
  - `ScriptsPlaceholder.test.tsx` and `AppRouter.test.tsx` continue to pass without authored-resource regressions.
