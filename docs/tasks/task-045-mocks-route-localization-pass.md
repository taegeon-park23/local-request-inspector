# T045 - Mocks Route Localization Pass

- **Purpose:** Extend the existing client i18n baseline across the Mocks route internals so client-owned management and observation-adjacent copy can render Korean without widening into backend payload or status-token localization.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `task-041-captures-observation-route-localization-pass.md`, `task-042-history-observation-route-localization-pass.md`, `../architecture/client-i18n-foundation.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T045 finishes the remaining top-level route-local Korean translation gap by converting the Mocks route chrome, empty states, detail tabs, authored-rule actions, helper summaries, and contextual-panel copy to the shared `t()` message catalog model.

## 2. In Scope
- localize client-owned Mocks route sidebar, filter labels, empty states, detail headers, detail tabs, authored-rule action labels, contextual notes, and helper-generated authored-rule summaries
- add English/Korean message keys to the shared route catalog
- add Korean smoke coverage for the Mocks route
- refresh tracking and i18n architecture notes

## 3. Out Of Scope
- backend payload translation
- `Enabled` / `Disabled` / `Mocked` runtime-family token localization
- broad ARIA-wide localization across the rest of the app
- import/export tooling changes

## 4. Implementation Notes
- Extended `client/shared/i18n/observation-route-messages.ts` with a new `mocksRoute` branch for route-local copy and helper string builders.
- Reworked `client/features/mocks/components/MocksPlaceholder.tsx` so tabs, filter options, helper summaries, action labels, and contextual cards read from the shared i18n catalog instead of embedded English literals.
- Added Korean smoke coverage to `client/features/mocks/components/MocksPlaceholder.test.tsx`.
- Corrected a Korean route-summary typo in `client/shared/i18n/messages.ts` while touching the locale catalog.

## 5. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `npm.cmd run test:ui`

## 6. Validation Results
- `npm.cmd run typecheck` — passed in sandbox on 2026-03-23
- `npm.cmd run lint:client` — passed in sandbox on 2026-03-23
- `npm.cmd run test:ui` — sandbox-blocked by `sandbox_esbuild_transform_blocked` / `spawn EPERM`; use local rerun handoff per `AGENTS.md`
