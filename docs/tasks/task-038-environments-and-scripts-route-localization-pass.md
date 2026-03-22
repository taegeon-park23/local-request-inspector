# T038 - Environments And Scripts Route Localization Pass

- **Purpose:** Extend the T037 i18n foundation across the Environments and Scripts route internals so their CRUD, empty-state, and management-boundary copy can participate in Korean localization without widening into full-route or runtime-payload translation.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `../architecture/client-i18n-foundation.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T038 delivered the first bounded post-foundation translation pass after T037. The Environments and Scripts management routes now translate client-owned management copy, empty states, validation text, and action labels through the shared i18n layer while preserving English-default test determinism and leaving server- or fixture-owned runtime strings for later slices.

## 2. Delivered Scope
### Completed
- translated Environments route sidebar, filters, management copy, validation messages, summary cards, metadata labels, and variable-row editing copy
- translated Scripts route sidebar, stage filter, management copy, summary cards, editor labels, and template action copy
- localized visible script-type labels in route-owned chips and selects while leaving underlying enum/storage values unchanged
- kept English ARIA-label and existing API payload contracts stable to avoid broad accessibility-contract churn in the same slice
- added Korean smoke coverage for `/environments` and `/scripts`

### Explicitly Still Deferred
- Workspace internal authoring copy
- Captures / History / Mocks route internals
- backend payload translation, fixture/runtime descriptive strings, or enum-token translation that still affects CSS/data-value contracts
- broad ARIA-label localization across the entire client

## 3. Guardrails Kept
1. The slice stayed client-only.
2. No backend API, storage schema, or runtime DTO changed.
3. English remains the deterministic default locale in existing UI tests.
4. Server- or fixture-owned descriptive strings were left unchanged unless the route itself owned the fallback copy.
5. The slice stayed bounded to two top-level management routes instead of reopening full-repo translation work.

## 4. Definition Of Done
This task is complete because all of the following are now true:
- Environments route static management copy renders through the shared i18n layer
- Scripts route static management copy renders through the shared i18n layer
- Korean smoke coverage exists for both routes
- English-default lint/type behavior remains stable
- tracking reflects the bounded follow-up and local verification handoff

## 5. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `git -c safe.directory=C:/dev/local-request-inspector diff --check` completed on 2026-03-23 with line-ending warnings only and no diff-format errors.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 58 tests.

## 6. Recommended Follow-Up Direction
- Continue localization one coherent surface at a time.
- The strongest next surface is likely Workspace internal authoring copy or the Captures/History/Mocks management-observation routes, but each should remain a separate bounded task.
- Keep using `client-i18n-foundation.md` as the baseline so later slices reuse the same shared catalog and locale-persistence pattern.

## 7. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
