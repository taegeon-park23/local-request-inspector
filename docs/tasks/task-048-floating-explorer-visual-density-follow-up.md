# T048 - Floating Explorer Visual-Density Follow-Up

- **Purpose:** Tighten the floating explorer overlay so route-level explorer drawers read as lightweight controls instead of competing header cards, while increasing first-screen item density across the Workspace, History, Captures, Mocks, Environments, and Scripts routes.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-043-shell-density-and-collapsible-navigation-refinement.md`, `task-047-route-panel-scroll-containment-follow-up.md`, `../tracking/master-task-board.md`, `../prd/overview.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T048 is a one-slice follow-up focused on the floating explorer presentation after T047 restored overlay containment. The drawer itself stayed functionally correct, but the toggle, intro blocks, filters, and list cards still consumed too much vertical attention. This slice rebalances responsibility between the floating overlay control, the drawer panel, and the main/detail surfaces so the explorer remains available without visually dominating the desktop work area.

## 2. Root Cause
The prior floating implementation mixed three concerns into one heavy visual stack:
1. the overlay toggle inherited the same card/button mass as larger panel actions
2. the drawer wrapper and explorer shell used generous width/padding that limited useful content width while still reading as a large attached block
3. multiple routes repeated tall intro cards, roomy filter blocks, and verbose list rows, which reduced visible list density and amplified route-to-route drift

## 3. Scope
### In Scope
- simplify the floating explorer toggle into a smaller independent control
- retune `.shell-route-panels__floating-overlay`, `.shell-route-panels__floating-explorer-slot`, and `.shell-route-panels__floating-explorer` so the drawer stays out of layout width calculations while improving usable content width
- reduce intro/header height in the explorer surfaces for `Workspace`, `History`, `Captures`, `Mocks`, `Environments`, and `Scripts`
- keep search/filter affordances but reduce duplicated top spacing so more rows appear above the fold
- unify explorer card density around title + key state + compact metadata, with truncation/title-tooltip behavior for long values
- add DOM-structure regression coverage for the floating overlay wrapper contract and compact explorer wrappers

### Explicitly Out Of Scope
- route-state ownership or feature semantics changes
- new navigation patterns beyond the current floating explorer drawer
- deep detail-panel redesign
- virtualization or mobile-specific drawer redesign beyond existing responsive behavior

## 4. Target Routes
- `/workspace`
- `/history`
- `/captures`
- `/mocks`
- `/environments`
- `/scripts`

## 5. Acceptance Criteria
This task is complete when all of the following are true:
- the floating explorer toggle no longer reads like a header card attached to the drawer
- opening the drawer does not reserve layout width, and the usable drawer content width is larger than before within the overlay budget
- default explorer intros collapse to title + short description + key chips/actions only
- filter/search blocks remain available but take less vertical space than the prior baseline
- explorer cards across the target routes use compact spacing and prioritize title, state badges, and key metadata over long prose
- long URL/path/summary strings are truncated consistently with title-based full-value exposure
- the drawer still scrolls internally when open and does not reintroduce page-level overflow
- the task is registered in tracking as a bounded one-slice follow-up

## 6. Verification Criteria
- **Toggle distraction reduction:** verify the floating toggle appears as a small standalone control and not as the first card inside the explorer group
- **Top-area height reduction:** compare the explorer intro + filters stack against the previous desktop presentation and confirm less vertical space is consumed before the first list item
- **First-screen card count increase:** confirm more explorer cards are visible in the initial viewport for the densest routes, especially `/history`
- **Truncation consistency:** confirm long request labels, URL/path values, summaries, and script/environment metadata clamp consistently while exposing full text through `title`
- **Drawer scroll integrity:** confirm the floating drawer keeps internal scrolling in the open state without shifting main/detail panel sizing

## 7. Validation Results
- `npm run test:ui -- client/app/router/AppRouter.test.tsx` passed in this sandbox on 2026-03-23.
- `npm run typecheck` passed in this sandbox on 2026-03-23.
- Browser screenshot capture was attempted conceptually for this task but the browser screenshot tool is not available in this environment, so no in-repo image artifact could be recorded here.

## 8. Implementation Notes
- Shared CSS contracts now cover compact explorer intros, slimmer filter blocks, tighter card spacing, and single-line truncation behavior across route explorers.
- The floating overlay now exposes explicit DOM markers for the overlay wrapper, toggle, slot, and drawer so regression tests can assert that the control stays separated from the drawer block.
- Workspace, History, Captures, Mocks, Environments, and Scripts explorer rows now apply title-based full-value exposure for long strings instead of letting cards grow vertically.
