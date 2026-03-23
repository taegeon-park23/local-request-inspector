# T048 - Floating Explorer Density And Visibility Refresh

- **Purpose:** Reduce floating explorer visual weight, increase first-screen list visibility, and define a shared density contract without reopening the T047 scroll-containment slice.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-047-route-panel-scroll-containment-follow-up.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../prd/overview.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T048 is a focused UI follow-up to T047. The floating explorer now treats the toggle as an independent overlay control, compresses route intro/search/list spacing, clamps long card text, and keeps list-first visibility higher across workspace, history, captures, mocks, environments, and scripts while preserving the panel-only scroll contract.

## 2. Delivered Scope
### Completed
- redefined the floating drawer control hierarchy so the toggle reads as a lightweight overlay control instead of a header card
- added a shared floating explorer header pattern with one-line summary treatment and optional action/meta slots
- tightened floating explorer wrapper, panel, list, and card spacing to improve usable width and vertical density
- applied consistent truncation via clamp/ellipsis plus `title` fallbacks for long route-specific labels, URLs, summaries, and previews
- reduced default card disclosure to a compact three-layer pattern: title, key state, and one-line supporting meta
- used route-specific width clamps only for workspace/history while keeping other floating explorers on a narrower shared default width
- added DOM regression coverage for the route wrapper marker, compact floating header presence, and title-based truncation affordance
- documented this slice separately from T047 under the root cause label `floating explorer visual density and content visibility debt`

### Explicitly Still Deferred
- any change to feature ownership, route semantics, or backend data shape
- virtualization, sticky list subheaders, or responsive mobile redesign beyond current floating explorer rules
- deeper WorkspaceExplorer TSX restructuring outside the requested target file scope

## 3. Density Contract
The shared floating explorer contract for this slice is:
1. Header summary stays visually secondary and clamps to one line by default.
2. Search/filter blocks remain compact enough that the list starts quickly after the header.
3. Explorer cards target a compact minimum height and expose only one supporting body line plus one meta line.
4. Long values truncate inside the card and reveal full content through `title` only.
5. Selected-card emphasis comes from border/background treatment rather than extra stacked content height.
6. Opening the drawer must still preserve the T047 panel-only scroll contract.

## 4. Definition Of Done
This task is complete when:
- the floating explorer toggle reads as an independent overlay control
- introductory explorer copy does not occupy more height than the visible list in the default state
- one viewport shows more identifiable list items than before
- long text no longer forces card layout breakage
- drawer-open behavior still keeps scrolling bounded to panel surfaces
- task/tracking docs separate density/visibility debt from the earlier scroll-containment fix

## 5. Validation Results
- `npm run test:ui -- client/app/router/AppRouter.test.tsx`
- `npm run typecheck`
- Browser screenshot verification was attempted conceptually but the required browser-container tool was not available in this environment, so final visual confirmation remains a manual local follow-up.

## 6. Implementation Notes
- Shared layout/density rules live in `client/app/shell/material-theme.css` and `client/features/shared-section-placeholder.tsx` so future explorer routes inherit the same compact structure.
- Route-local files only keep their content-specific summaries, badges, and truncation attributes.
- Width policy is intentionally split: workspace/history keep a slightly wider clamp because their rows carry higher information density, while captures/mocks/environments/scripts stay on the tighter shared width.
- The T047 scroll-containment contract remains unchanged and is still covered by the existing measured-layout tests.

## 7. Local Visual Verification Handoff
If local browser validation is needed, open the app and confirm:
- the floating explorer toggle no longer reads like a panel header card
- the header/search area is visibly shorter before the first list card
- more cards are visible on first paint than before
- long URL/path/summary text truncates instead of stretching the card
- drawer open/close still leaves scrolling inside the explorer/main/detail panels only
