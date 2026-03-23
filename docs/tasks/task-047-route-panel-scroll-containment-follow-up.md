# T047 - Route Panel Scroll Containment Follow-Up

- **Purpose:** Apply the bounded shell overflow fix that follows T044 so route-local panel content scrolls inside the main work surface rather than extending the page background beyond the app shell.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-044-single-panel-route-tabs-layout.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../prd/overview.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T047 is a narrow UX follow-up to T044. The shell height contract now anchors viewport sizing at `.shell-layout`, the route-panel body and active panel surfaces explicitly opt into internal overflow handling, and the old viewport-based minimum panel height is removed so long route content scrolls only inside the main work surface.

## 2. Delivered Scope
### Completed
- removed the duplicated `min-height: 100vh` shell stack so viewport sizing is owned by the top-level `.shell-layout`
- switched the shell to a fixed `100vh` / `100dvh` height contract with hidden outer overflow to avoid exposing extra page background
- added `min-height: 0` and explicit overflow handling to the shell body, shell content, route-panel body, and active route-panel surface
- removed the old `.shell-route-panels__panel > .shell-panel { min-height: calc(100vh - 8.5rem); }` viewport coupling in favor of content-sized panels with internal scroll
- added a layout regression test that pins the scroll-containment CSS contract for the shell and route panels
- linked this UX follow-up back to T044 in tracking

### Explicitly Still Deferred
- broader responsive shell redesign beyond the existing route-panel tab layout
- virtualized panel content or bespoke scroll-shadow treatments
- changing route semantics, state ownership, or route-tab persistence behavior

## 3. Guardrails
1. The slice remains client-only.
2. T044's route-local tab semantics and inactive-panel state preservation stay intact.
3. The fix is limited to viewport/overflow ownership and does not reopen broader shell architecture.
4. Verification stays within repo-available checks plus the existing local rerun handoff policy if sandbox execution is blocked.

## 4. Definition Of Done
This task is complete when:
- the shell viewport height is owned by `.shell-layout` rather than a duplicated `body` / `#root` / `.shell-layout` min-height stack
- long route content scrolls inside `.shell-content` or the active route panel surface instead of extending the whole page
- the old route-panel viewport `min-height` formula is removed
- a regression test covers the scroll-containment contract
- docs/tracking clearly identify this slice as a T044 follow-up

## 5. Validation Results
- `npm run lint:client -- client/app/router/AppRouter.test.tsx` passed in this sandbox on 2026-03-23.
- `npm run test:ui -- AppRouter.test.tsx` passed in this sandbox on 2026-03-23.
- `npm run typecheck` passed in this sandbox on 2026-03-23.

## 6. Implementation Notes
- `client/app/shell/shell.css` now treats `html`, `body`, and `#root` as height carriers while `.shell-layout` owns the viewport lock and outer overflow clipping.
- `client/app/shell/material-theme.css` now gives the route-panel stack a `minmax(0, 1fr)` body, clips inactive panel overflow, and lets only the active `.shell-panel` scroll vertically.
- `client/app/router/AppRouter.test.tsx` now reads the shell CSS sources directly to pin the scroll-containment contract and prevent the viewport-coupled `min-height` rule from returning.
- Merge-recovery follow-up on 2026-03-23: the floating-explorer layout no longer uses viewport-coupled `min-height` formulas for its dock, explorer sheet, or main/detail surfaces, so overflow stays inside the shell after header height is consumed by `.shell-layout`.
- Design follow-up on 2026-03-23: the floating explorer now behaves like an overlay drawer again, so the main/detail panes keep their own width while the drawer expands over the workspace instead of permanently narrowing the work surface.
- Design follow-up on 2026-03-23: workspace explorer actions now refocus the main authoring surface immediately after creating or opening a request so explorer interaction restores the expected main-surface scroll and editing context.
- Design follow-up on 2026-03-23: scrollbars are now globally slimmer inside the client shell so long workspace, explorer, and detail surfaces keep a lighter visual footprint.

## 7. Recommended Follow-Up Direction
- If later UX work expands this area, keep future changes bounded to one concern such as mobile safe-area spacing, scroll-shadow affordances, or route-panel sticky subheaders rather than reopening full shell layout redesign.
