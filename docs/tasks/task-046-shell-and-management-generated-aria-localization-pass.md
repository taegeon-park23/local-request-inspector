# T046 - Shell And Management Generated Aria Localization Pass

- **Purpose:** Extend the existing client i18n baseline across shell route-panel regions plus management/workspace-explorer generated ARIA and action labels so Korean locale coverage can grow without widening into a full app-wide ARIA rewrite.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `task-038-environments-and-scripts-route-localization-pass.md`, `task-039-workspace-authoring-localization-pass.md`, `task-045-mocks-route-localization-pass.md`, `../architecture/client-i18n-foundation.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T046 delivers one bounded cross-route accessibility-adjacent follow-up after T045. The shell route-panel regions, Environments and Scripts generated list/action labels, and Workspace explorer generated authored-resource action labels now localize through the shared i18n layer, while broader request-builder generated ARIA contracts and runtime-owned tokens remain deferred.

## 2. Delivered Scope
### Completed
- localized shell route-panel tab and region ARIA labels
- localized Environments generated ARIA labels for list actions, validation messages, and variable-row controls
- localized Scripts generated ARIA labels for saved-script actions, template list metadata, and editor fields
- localized Workspace explorer generated authored-resource action labels such as import input and open/export request actions
- updated Korean smoke coverage so the landed generated-label contracts are pinned without changing English-default tests

### Explicitly Still Deferred
- broad ARIA-label localization across the whole app in one pass
- request-builder generated ARIA labels such as request tab strip, request key/value row labels, and script-stage field labels
- backend payload translation or locale-aware API negotiation
- runtime enum/status token localization where CSS or test contracts still depend on English values
- translation import/export tooling

## 3. Guardrails Kept
1. The slice stays client-only.
2. No backend API, storage schema, or runtime DTO changes are allowed.
3. English remains the deterministic default locale in existing UI tests.
4. Only client-owned generated labels move in this pass; runtime-owned values and status tokens stay unchanged.
5. Request-builder generated ARIA work remains separate so this task does not overstate full accessibility-contract localization.

## 4. Definition Of Done
This task is complete because all of the following are now true:
- shell route-panel regions render Korean ARIA labels when locale is switched
- Environments and Scripts generated list/action/editor labels render Korean ARIA labels when locale is switched
- Workspace explorer generated authored-resource action labels render Korean ARIA labels when locale is switched
- English-default tests stay deterministic
- docs/tracking reflect this bounded cross-route generated-label follow-up and its remaining deferred boundaries

## 5. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `git -c safe.directory=C:/dev/local-request-inspector diff --check` passed in this sandbox on 2026-03-23 after the T046 edits.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight still failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 63 tests.

## 6. Recommended Follow-Up Direction
- Keep future localization work bounded to one coherent cross-route concern at a time.
- The strongest localization-adjacent follow-up is now request-builder generated ARIA-label localization, but it should stay separate from runtime-token translation and broader app-wide accessibility-contract work.
- Continue using `client-i18n-foundation.md` as the canonical baseline so later slices extend shared catalogs rather than introducing new ad hoc literals.

## 7. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
