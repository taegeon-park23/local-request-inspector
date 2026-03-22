# T037 - Client I18n Foundation And Korean Locale Bootstrap

- **Purpose:** Establish the client-side internationalization foundation, add Korean locale support, and create the reusable translation/formatting tools that later surface-by-surface localization work can build on.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `../architecture/client-i18n-foundation.md`, `task-036-button-badge-and-radius-visual-hierarchy-refinement.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../prd/overview.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T037 delivered a bounded i18n foundation for the React shell without widening into full-repo translation churn. The client now has a shared locale provider, `en`/`ko` catalogs, message and formatting helpers, locale persistence, and a first proof-of-use surface covering shell chrome, top-level section headers, and settings diagnostics copy.

## 2. Why This Task Mattered
- The repo previously shipped only hard-coded English strings and had no locale ownership model.
- Korean localization work would otherwise require repeated one-off string rewrites with no stable storage key, formatting helpers, or shared translation API.
- This slice creates a reusable pattern so later localization work can move route by route instead of re-choosing infrastructure each time.

## 3. Delivered Scope
### Completed
- added a client-side i18n provider with browser-locale detection and local persistence
- added shared English and Korean message catalogs with one canonical key shape
- added shared translation plus number/date/list formatting helpers
- translated the shell breadcrumb, runtime-connection label, section labels, summaries, and role labels through the new i18n layer
- translated top-level route section headers for Workspace, Captures, History, Mocks, Environments, Scripts, and Settings
- translated the settings diagnostics route copy and added a bounded locale switcher for QA and later translation work
- updated test helpers so English remains the deterministic default locale in UI tests while Korean-specific smoke coverage can be added explicitly

### Explicitly Still Deferred
- full translation of every route, panel, empty state, and validation message
- backend locale negotiation or translated server payloads
- runtime enum/status badge display translation where CSS contracts still depend on English value tokens
- broad ARIA-label localization across the whole app in one pass
- translation import/export tooling

## 4. Guardrails Kept
1. The slice stayed client-only.
2. No backend API, storage schema, or runtime DTO changed.
3. English remains the fallback locale.
4. Shared translation keys and helpers were introduced before broader string migration.
5. Shell, route headers, and settings were treated as the first proof-of-use surface rather than as the full localization finish line.

## 5. Definition Of Done
This task is complete because all of the following are now true:
- the app has one shared i18n provider with locale read/write persistence
- `en` and `ko` message catalogs exist and share one canonical shape
- shared translation helpers exist for message lookup and formatting
- the shell and a real route surface render through the i18n layer
- Settings exposes a bounded locale switch so later translation QA does not require code edits
- tracking/docs reflect the new foundation and its deferred follow-up scope

## 6. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 56 tests.

## 7. Recommended Follow-Up Direction
- Future localization work should extend `client-i18n-foundation.md` and convert one coherent surface at a time.
- The next useful translation slices are likely route-internal controls and bounded empty-state/validation copy for one feature area at a time rather than another broad shell-only pass.

## 8. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
