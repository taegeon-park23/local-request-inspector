# T042 - History Observation Route Localization Pass

- **Purpose:** Extend the T037-T041 i18n baseline across the History observation route so client-owned observation chrome can render Korean without widening into Mocks internals, backend payload translation, or runtime status-token localization.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `task-038-environments-and-scripts-route-localization-pass.md`, `task-039-workspace-authoring-localization-pass.md`, `task-040-workspace-result-panel-localization-pass.md`, `task-041-captures-observation-route-localization-pass.md`, `../architecture/client-i18n-foundation.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T042 delivered the next bounded Korean localization slice after T041. The History route now renders client-owned observation copy through the shared i18n layer, including sidebar copy, filter labels, route-local empty states, detail/timeline chrome, replay-bridge actions, component-owned fallback helper text, and a Korean smoke test that exercises the localized route without changing English-default contracts.

## 2. Delivered Scope
### Completed
- localize History route sidebar copy, filter labels, and route-local empty states
- localize History detail headers, replay-bridge chrome, summary-card titles/descriptions, result-tab labels, timeline chrome, and deferred-detail copy
- localize component-owned fallback helper text such as preview-size, request-input, auth/body-mode, response-preview-policy, and execution-error fallback strings
- add bounded Korean smoke coverage for the History route while keeping existing English-default tests stable

### Explicitly Still Deferred
- Mocks observation-route internals
- backend payload translation or locale-aware API negotiation
- broad ARIA-label localization across the whole app in one pass
- runtime enum/status token localization where CSS or test contracts still depend on English values
- translation import/export tooling

## 3. Guardrails Kept
1. The slice must stay client-only.
2. No backend API, storage schema, or runtime DTO should change.
3. English remains the deterministic default locale in existing UI tests.
4. Runtime-provided values such as `executionOutcome`, `transportOutcome`, `testOutcome`, `sourceLabel`, `requestSnapshotSummary`, `responseSummary`, `consoleSummary`, `testsSummary`, `errorCode`, `errorSummary`, `stageSummaries`, and `timelineEntries` remain unchanged in this pass.
5. History localization should remain separate from the Mocks route and from broader runtime-token translation work.

## 4. Definition Of Done
This task is complete because all of the following are now true:
- the History route renders client-owned sidebar/detail/timeline copy through the shared i18n layer
- route-local empty states, replay-bridge actions, and compact timeline chrome localize through shared catalogs
- English-default history tests keep their current contracts
- Korean smoke coverage exists for the localized History route
- docs/tracking reflect this bounded observation-route localization follow-up and its remaining deferred boundaries

## 5. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `git -c safe.directory=C:/dev/local-request-inspector diff --check` passed in this sandbox on 2026-03-23 after the T042 edits.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight still failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 61 tests.

## 6. Recommended Follow-Up Direction
- Keep future localization work bounded to one coherent observation route at a time.
- The strongest next translation candidate is now the Mocks observation route, but it should stay separate from backend-payload or broad ARIA-contract work.
- Continue using `client-i18n-foundation.md` as the canonical baseline so later slices extend shared catalogs rather than introducing new ad hoc literals.

## 7. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
