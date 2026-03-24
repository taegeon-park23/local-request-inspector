# T027 - Placeholder Route MVP For Environments, Scripts, And Settings

- **Purpose:** Replace the remaining top-level placeholder routes at `/environments`, `/scripts`, and `/settings` with bounded MVP surfaces backed by persisted resources and runtime diagnostics.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-010-frontend-workspace-shell-implementation-plan.md`, `task-012-script-editor-and-automation-ux.md`, `task-017-developer-environment-and-tooling-baseline.md`, `../architecture/internal-api-contracts.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T027 replaces the last true top-level placeholder routes with bounded MVP implementations. `/environments` now manages persisted workspace environment records with masked secret handling and default-environment enforcement. `/scripts` now manages persisted standalone saved scripts plus read-only system templates without introducing request-stage attachment or reference semantics. `/settings` now exposes a diagnostics-first read-only surface backed by a new runtime-status endpoint instead of remaining a generic placeholder.

## 2. Why This Task Matters Now
- The repo still had three real top-level placeholder routes even though the rest of the workspace shell had already moved to persisted or query-backed flows.
- Leaving those routes as placeholders made the navigation shell look more complete than the actual route inventory.
- A bounded route-level MVP is lower risk than jumping directly to environment-run binding, top-bar environment selection, or shared-script reference semantics.

## 3. Scope
### Included
- persisted environment CRUD routes and client query/mutation wiring
- persisted standalone saved-script CRUD routes and read-only system template routes
- runtime diagnostics endpoint plus read-only settings route cards
- route-level list/detail/detail-panel surfaces for `/environments`, `/scripts`, and `/settings`
- server/resource tests and client route tests for the new surfaces

### Explicitly Deferred
- top-bar environment selector wiring
- request execution environment resolution
- top-level Scripts attachment/link/reference behavior for request stages
- settings mutation or preference persistence
- environment/script/settings import-export scope expansion

## 4. Definition Of Done
This task is done when all of the following are true:
- `/environments`, `/scripts`, and `/settings` render real feature surfaces instead of generic placeholder copy
- environments and scripts use workspace-scoped persisted resources with CRUD coverage
- settings uses a dedicated diagnostics endpoint without introducing settings mutation scope
- validation covers lint, typecheck, Node seam tests, route tests, and tracking updates

## 5. Outputs
- environment resource persistence and HTTP routes
- saved-script persistence and template HTTP routes
- runtime-status diagnostics HTTP route
- three route-level MVP surfaces plus route tests
- tracking updates in `../tracking/`

## 6. Implementation Notes
### 6.1 Shared backend and resource layer
- Added `environment` and `script` as first-class resource kinds and schema-version participants in the storage manifest layer.
- Added environment default-enforcement helpers so one environment remains default whenever the workspace has at least one environment record.
- Added runtime-status snapshot support for the new settings diagnostics endpoint.

### 6.2 Environments
- Implemented:
  - `GET /api/workspaces/:workspaceId/environments`
  - `POST /api/workspaces/:workspaceId/environments`
  - `GET /api/environments/:environmentId`
  - `PATCH /api/environments/:environmentId`
  - `DELETE /api/environments/:environmentId`
- Secret rows are read back as masked records only:
  - raw secret values are not echoed in read responses
  - secret rows expose `hasStoredValue`
  - updates use `replacementValue`
  - clears use `clearStoredValue`
- The route now supports create/edit/delete, inline validation, variable-row editing, and default badge movement.

### 6.3 Scripts
- Implemented:
  - `GET /api/workspaces/:workspaceId/scripts`
  - `POST /api/workspaces/:workspaceId/scripts`
  - `GET /api/scripts/:scriptId`
  - `PATCH /api/scripts/:scriptId`
  - `DELETE /api/scripts/:scriptId`
  - `GET /api/script-templates`
  - `GET /api/script-templates/:templateId`
- The route now supports:
  - blank standalone saved-script creation
  - template-seeded draft creation
  - persisted edit/delete flow
  - stage filtering and template browsing
- Request-stage attachment and live shared-reference behavior remain intentionally out of scope.

### 6.4 Settings
- Implemented `GET /api/settings/runtime-status`.
- The route now surfaces:
  - app shell/build availability
  - storage readiness/bootstrap status
  - runtime connection health
  - local command catalog
  - route/path hints
- Settings remains read-only and deliberately avoids preference persistence.

## 7. Validation
Validated in this sandbox on 2026-03-22:
- `npm.cmd run lint:client` -> passed
- `npm.cmd run lint:cjs` -> passed
- `npm.cmd run typecheck` -> passed
- `npm.cmd run test:node` -> passed
- `npm.cmd run check` -> passed

Direct sandbox rerun result:
- `npm.cmd run test:ui` -> blocked before Vitest transform work with `sandbox_esbuild_transform_blocked` / `spawn EPERM`

Local verification handoff:
1. Run `npm.cmd run test:ui`
2. Expected result for the current repo state: exit code `0`, `Test Files  11 passed (11)`, and `Tests  52 passed (52)`
3. The new suites that should appear in that successful run are:
   - `client/features/environments/components/EnvironmentsPlaceholder.test.tsx`
   - `client/features/scripts/components/ScriptsPlaceholder.test.tsx`
   - `client/features/settings/components/SettingsPlaceholder.test.tsx`

## 8. Handoff Checklist
- [x] persisted environment CRUD is implemented and covered by tests
- [x] persisted standalone saved-script CRUD plus read-only templates are implemented and covered by tests
- [x] settings diagnostics route is implemented and covered by tests
- [x] deferred scope boundaries are documented explicitly
- [x] board, roadmap, and progress docs are updated

## 9. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: QA / Verification Agent

## 10. Closure Decision
T027 is complete as a bounded implementation task. The remaining follow-up space is no longer "replace placeholder routes"; it is narrower deferred work such as environment selection/run wiring, request-stage script linkage semantics, or settings mutation scope. If full UI confirmation is needed beyond this sandbox, use the local command handoff above instead of reopening T027 as blocked.

