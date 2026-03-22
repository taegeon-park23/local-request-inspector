# T039 - Workspace Authoring Localization Pass

- **Purpose:** Extend the T037/T038 i18n baseline across the workspace authoring chrome so the explorer, request-tab shell, and request-builder authoring surface can render Korean client-owned copy without widening into observation-panel or backend-payload translation.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `task-038-environments-and-scripts-route-localization-pass.md`, `../architecture/client-i18n-foundation.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T039 delivered the next bounded Korean localization slice after T038. The workspace explorer, request tab shell, and request-builder authoring chrome now render client-owned copy through the shared i18n layer, including request authoring section labels, params/headers/body/auth/scripts surface copy, and explorer-owned authored-resource transfer messaging.

## 2. Delivered Scope
### Completed
- added a dedicated workspace-route message catalog and merged it into the shared `en`/`ko` catalog
- translated workspace explorer header copy, tree kind labels, starter/persisted chips, action labels, preview advisory text, and explorer-owned transfer-status messaging
- translated request tab shell empty-state copy and the visible new-request affordance
- translated request-builder authoring copy for the workspace surface, including empty states, header copy, badges, save/run helper copy, request location/environment support copy, editor-tab labels, params/headers/body/auth section copy, and lazy scripts fallback copy
- translated the request-bound scripts editor surface and key/value row labels while preserving existing English ARIA coverage where that contract was already relied on
- added Korean workspace smoke coverage so the translated authoring chrome can be exercised without changing English-default test determinism

### Explicitly Still Deferred
- request result-panel and execution-observation copy
- captures, history, and mocks route internals
- backend payload translation or locale-aware API negotiation
- broad ARIA-label localization across the full workspace and observation surfaces in one pass
- runtime enum/status token translation where CSS or test contracts still depend on English tokens

## 3. Guardrails Kept
1. The slice stayed client-only.
2. No backend API, storage schema, or runtime DTO changed.
3. English remains the deterministic default locale in existing UI tests.
4. Workspace authoring and explorer-owned helper copy were translated, but right-hand observation/result copy was deliberately left for a later bounded slice.
5. The request builder's visible labels now localize through the shared catalog, while high-risk ARIA/test contracts remain selectively stable in English.

## 4. Definition Of Done
This task is complete because all of the following are now true:
- workspace explorer chrome and client-generated authored-resource transfer messaging render through the shared i18n layer
- request tab shell and request-builder authoring chrome render through the shared i18n layer
- the request-bound scripts editor surface participates in the same shared catalog
- Korean smoke coverage exists for workspace authoring chrome
- docs/tracking reflect this bounded workspace-localization follow-up and its deferred observation-surface boundary

## 5. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `git -c safe.directory=C:/dev/local-request-inspector diff --check` passed in this sandbox on 2026-03-23 with only line-ending conversion warnings outside the diff body.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight still failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory remains 11 test files / 58 tests unless additional local-only test edits are introduced before rerun.

## 6. Recommended Follow-Up Direction
- Keep future localization work bounded to one coherent observation or management surface at a time.
- The strongest next translation candidates are the workspace result panel or the Captures / History / Mocks observation routes, but they should stay separate from backend-payload or broad ARIA-contract work.
- Continue using `client-i18n-foundation.md` as the canonical baseline so later slices extend shared catalogs rather than introducing new ad hoc literals.

## 7. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
