# T048 - Floating Explorer Visual Cleanup and Content Visibility

- **Purpose:** Tighten the floating explorer overlay hierarchy and establish a shared compact-density contract so the Workspace, History, Captures, Mocks, Environments, and Scripts explorers show more useful content on first paint without breaking panel-only scroll containment.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-047-route-panel-scroll-containment-follow-up.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../prd/overview.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T048 is the integrated follow-up after T047. It keeps the floating toggle as a distinct overlay control, separates drawer chrome from route content, shrinks top-of-explorer intro/search density, reduces card height and vertical stacking, and promotes a shared explorer density contract across the six floating-explorer routes.

## 2. Scope
### Target Routes
- `/workspace`
- `/history`
- `/captures`
- `/mocks`
- `/environments`
- `/scripts`

### Completed
- redefined the floating branch in `client/features/shared-section-placeholder.tsx` so overlay control, drawer surface, and main/detail layout wrappers have distinct responsibilities
- refreshed `client/app/shell/material-theme.css` with shared floating toggle, drawer width, compact spacing, header-height, search-height, list-gap, and card-min-height contracts
- tightened explorer intro/header composition so each route exposes a compact one-line hint before the list rather than a large explanatory block
- reduced explorer card height/padding, moved meta emphasis toward inline priority data, and added ellipsis or line-clamp behavior for longer copy
- widened usable drawer content on desktop and kept the compact overlay behavior on `@media (max-width: 900px)`
- added DOM-structure regression coverage for the shared floating hierarchy and one compact explorer structure assertion for each targeted route
- documented the root cause and expected outcome in tracking for future follow-up work

### Explicitly Still Deferred
- route-specific copy rewrites beyond compacting the existing intros
- virtualization, sticky list subheaders, or richer animated drawer choreography
- broader shell layout changes beyond the floating explorer density contract

## 3. Root Cause
The follow-up is scoped around one combined root cause: **overlay control hierarchy clutter + oversized explorer header + dense cards + insufficient usable drawer width + shared explorer density contract 부재**.

## 4. Expected Result
The expected UX outcome is: **정돈된 toggle, compact explorer, 더 많은 visible items, 요약형 텍스트, route 공통 explorer density contract, panel-only scroll 유지**.

## 5. Visual Verification Criteria
- the toggle button reads as a lightweight overlay control instead of as another drawer card
- the drawer header and content are visually separated
- intro/search chrome is shorter so more cards are visible on the first viewport
- selected-card core metadata stays identifiable without layout spillover
- long URL/path/summary text truncates safely instead of widening cards or breaking layout
- opening the drawer still keeps scroll ownership inside panel surfaces rather than the page background

## 6. Validation Results
- `npm run lint:client -- --fix` was not needed; repo validation uses the standard lint/typecheck/test commands.
- Targeted UI validation: `npm run test:ui -- client/app/router/AppRouter.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx client/features/captures/components/CapturesPlaceholder.test.tsx client/features/history/components/HistoryPlaceholder.test.tsx client/features/mocks/components/MocksPlaceholder.test.tsx client/features/environments/components/EnvironmentsPlaceholder.test.tsx client/features/scripts/components/ScriptsPlaceholder.test.tsx`
- Static validation: `npm run typecheck`
- Manual/browser follow-up target: compare desktop and sub-900px overlay states and confirm compact list density plus panel-only scroll.

## 7. Implementation Notes
- Shared CSS contract now lives in `client/app/shell/material-theme.css` so feature-local explorer routes only keep route-specific exceptions.
- `client/features/shared-section-placeholder.tsx` now prevents the floating toggle from inheriting drawer-card treatment by keeping it outside the drawer wrapper.
- Workspace, History, Captures, Mocks, Environments, and Scripts explorers now share the compact intro/filter structure through common class names, while route-local actions and copy remain feature-owned.
- Route tests intentionally assert explorer header/search/list/card structure so future refactors do not silently grow the top chrome again.
