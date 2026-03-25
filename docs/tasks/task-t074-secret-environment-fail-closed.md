# T074 Secret Environment Fail-Closed Policy

- **Purpose:** Introduce a bounded secret-storage seam, stop ordinary environment records from carrying raw secret values, and fail closed when secret replacement writes are attempted without a secure backend.
- **Created:** 2026-03-25
- **Last Updated:** 2026-03-25
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../architecture/request-environment-selection-and-resolution.md`, `../architecture/script-execution-safety-model.md`
- **Status:** doing
- **Update Rule:** Update when scope, blockers, or verification status change.

## Scope
- Add a first-class secret policy seam instead of letting environment routes write replacement values into ordinary JSON records.
- Fail closed on secret replacement writes when no secure backend is available.
- Keep plain environment variable resolution working while secret-backed placeholders remain unavailable until a secure backend exists.

## In Scope
- Environment create/update policy checks for secret replacement writes.
- Environment record normalization that strips raw secret material from the ordinary persisted shape.
- Runtime environment-resolution behavior that does not resolve secret-backed placeholders from ordinary environment records.
- Node/API regression coverage for the new fail-closed behavior.
- User-facing copy cleanup where the shipped environment baseline or secret policy messaging was stale.

## Out Of Scope
- Shipping a real secure keychain or encrypted secret backend.
- Full UI redesign for environment editing.
- Reworking non-proprietary import/export formats.

## Verification Plan
- `npm.cmd run check`
- `npm.cmd run test:node`
- User-managed local `npm.cmd run test:ui` only if a final UI confirmation is needed outside Codex

## Progress
- Added `server/environment-secret-policy-service.js` so environment routes can reject secret replacement writes through an explicit `secret_storage_unavailable` contract.
- Updated the ordinary environment record shape so secret-backed rows persist write-only metadata instead of raw replacement values.
- Updated runtime resolution to keep plain variables resolvable while secret-backed placeholders stay unavailable until a secure backend is introduced.
- Added Node seam coverage for the fail-closed route behavior and updated environment record/resolution assertions to match the new contract.
- Cleaned up stale environment summaries and route copy so shipped request-level runtime resolution is no longer described as deferred.

## Current Verification Status
- `npm.cmd run check` passed on 2026-03-25.
- `npm.cmd run test:node` passed on 2026-03-25.
- Codex still cannot rerun `npm.cmd run test:ui`; sandboxed esbuild startup remains blocked by `spawn EPERM`.

## Remaining Work
- Decide whether diagnostics or settings should surface the secure-backend limitation more explicitly.
- Decide whether legacy persisted secret-bearing environment rows need an explicit migration/reporting seam beyond the new fail-closed runtime behavior.
