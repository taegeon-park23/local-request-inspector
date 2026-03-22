# T041 - Captures Observation Route Localization Pass

- **Purpose:** Extend the T037-T040 i18n baseline across the Captures observation route so client-owned observation chrome can render Korean without widening into History or Mocks route internals, backend payload translation, or runtime status-token localization.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `task-038-environments-and-scripts-route-localization-pass.md`, `task-039-workspace-authoring-localization-pass.md`, `task-040-workspace-result-panel-localization-pass.md`, `../architecture/client-i18n-foundation.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T041 delivered the next bounded Korean localization slice after T040. The Captures route now renders client-owned observation copy through the shared i18n layer, including sidebar copy, filter labels, route-local empty states, capture-detail section titles and labels, replay-bridge actions, compact timeline chrome, and a Korean smoke test that exercises the localized route without changing English-default contracts.

## 2. Delivered Scope
### Completed
- added a dedicated `capturesRoute` catalog branch to a new shared observation-route message catalog for `en` and `ko`
- localized capture-route sidebar copy, search/filter labels, connection-health helper copy, and route-local empty states
- localized capture-detail section titles, labels, replay-bridge actions, compact timeline chrome, and deferred-detail callout copy
- localized client-owned fallback helper text such as observation-source label and component-owned storage/preview/status summaries when runtime data does not provide them
- added Korean smoke coverage for the Captures route while keeping the broader English-default UI suite deterministic

### Explicitly Still Deferred
- History and Mocks observation-route internals
- backend payload translation or locale-aware API negotiation
- broad ARIA-label localization across the whole app in one pass
- execution/mock/transport status token localization where CSS or test contracts still depend on English runtime values
- translation import/export tooling

## 3. Guardrails Kept
1. The slice stayed client-only.
2. No backend API, storage schema, or runtime DTO changed.
3. English remains the deterministic default locale in existing UI tests.
4. Runtime-provided values such as `mockOutcome`, `scopeLabel`, `requestSummary`, `bodyHint`, `storageSummary`, `responseSummary`, and timeline entry content remain unchanged in this pass.
5. The Captures route now localizes client-owned chrome and fallback text only; History and Mocks observation-route localization remain separate future slices.

## 4. Definition Of Done
This task is complete because all of the following are now true:
- the Captures route renders client-owned sidebar/detail/timeline copy through the shared i18n layer
- route-local empty states, bridge actions, and compact-timeline chrome localize through shared catalogs
- English-default capture tests keep their current contracts
- Korean smoke coverage exists for the localized Captures route
- docs/tracking reflect this bounded observation-route localization follow-up and its remaining deferred boundaries

## 5. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `git -c safe.directory=C:/dev/local-request-inspector diff --check` passed in this sandbox on 2026-03-23 after the T041 edits.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight still failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 60 tests.

## 6. Recommended Follow-Up Direction
- Keep future localization work bounded to one coherent observation route at a time.
- The strongest next translation candidates are the History or Mocks observation routes, but they should stay separate from backend-payload or broad ARIA-contract work.
- Continue using `client-i18n-foundation.md` as the canonical baseline so later slices extend shared catalogs rather than introducing new ad hoc literals.

## 7. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
