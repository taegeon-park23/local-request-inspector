# T047 - Route Panel Scroll Containment Follow-Up

- **Purpose:** Apply the bounded shell overflow fix that follows T044 so route-local panel content scrolls inside the main work surface rather than extending the page background beyond the app shell.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-044-single-panel-route-tabs-layout.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../prd/overview.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T047 is a narrow UX follow-up to T044. The shell height contract now anchors viewport sizing at `.shell-layout`, `.shell-content` is re-stretched into a real height-constrained grid container, the floating route-panel 100% chain is fully re-closed, and the explorer behaves as a true overlay drawer so long route content scrolls only inside the main/detail panel surfaces.

## 2. Delivered Scope
### Completed
- removed the duplicated `min-height: 100vh` shell stack so viewport sizing is owned by the top-level `.shell-layout`
- switched the shell to a fixed `100vh` / `100dvh` height contract with hidden outer overflow to avoid exposing extra page background
- redefined `.shell-content` as a stretched `minmax(0, 1fr)` height-constrained grid container so it inherits `.shell-body` height instead of growing to route content natural height
- rebuilt the floating route-panel chain (`.shell-route-panels--floating` through main/detail wrappers) with explicit grid rows, `height: 100%`, `min-height: 0`, and `overflow: hidden` so the 100% containment path does not collapse mid-chain
- separated the floating explorer into an overlay drawer layer with an independent toggle control so opening the drawer no longer reserves layout width or leaves persistent main-surface padding
- removed the old `.shell-route-panels__panel > .shell-panel { min-height: calc(100vh - 8.5rem); }` viewport coupling in favor of content-sized panels with internal scroll
- replaced the CSS source-string regression with layout-contract assertions that compare `getBoundingClientRect().height` across `shell-body`, `main.shell-content`, and the active floating main/detail panel surfaces
- linked this UX follow-up back to T044 in tracking with the updated root-cause and expected-layout contract

### Explicitly Still Deferred
- broader responsive shell redesign beyond the existing route-panel tab layout
- virtualized panel content or bespoke scroll-shadow treatments
- changing route semantics, state ownership, or route-tab persistence behavior

## 3. Guardrails
1. The slice remains client-only.
2. T044's route-local tab semantics and inactive-panel state preservation stay intact.
3. The fix is limited to viewport/overflow ownership, floating drawer containment, and panel-only scrolling; it does not reopen broader shell architecture.
4. Verification stays within repo-available checks plus the existing local rerun handoff policy if sandbox execution is blocked.

## 4. Definition Of Done
This task is complete when:
- the shell viewport height is owned by `.shell-layout` rather than a duplicated `body` / `#root` / `.shell-layout` min-height stack
- `.shell-content` stays within `.shell-body` height and does not lose stretch because of grid-item auto min-size or cross-axis alignment drift
- long route content scrolls inside the active route panel surfaces instead of extending the whole page
- the floating explorer behaves as an overlay drawer instead of reserving main layout space
- the old route-panel viewport `min-height` formula is removed
- a regression test covers the measured layout contract and page-level-scroll regression
- docs/tracking clearly identify this slice as a T044 follow-up

## 5. Validation Results
- Pending refresh in this change set: `npm run test:ui -- client/app/router/AppRouter.test.tsx client/features/workspace/components/WorkspacePlaceholder.test.tsx`.
- Pending refresh in this change set: `npm run typecheck`.
- Browser/DevTools verification target for local follow-up: compare `div.shell-body` and `main.shell-content` computed/bounding heights and confirm that only panel surfaces scroll when the floating explorer drawer opens.

## 6. Implementation Notes
- `client/app/shell/shell.css` continues to treat `html`, `body`, and `#root` as height carriers while `.shell-layout` owns the viewport lock and outer overflow clipping.
- `client/app/shell/material-theme.css` now records the root cause more precisely: `.shell-content` stretch failure, floating panel 100% chain collapse, and drawer overlay/layout-space mixing were the combined reasons page-level overflow returned.
- `client/app/shell/material-theme.css` now closes the floating route-panel containment chain at every wrapper, keeps the overlay drawer out of layout width calculations, and limits vertical scrolling to panel interiors.
- `client/app/router/AppRouter.test.tsx` now asserts measured shell/body/panel height relationships and names the regression explicitly as panel-level scroll rather than page-level scroll.
- `client/features/shared-section-placeholder.tsx` now separates the overlay drawer wrapper from the main/detail layout wrapper so height inheritance no longer depends on an auto-sized mixed-purpose wrapper.
- Browser verification for this slice should compare `div.shell-body` and `main.shell-content` bounding/computed heights directly and confirm that the explorer drawer overlays the content instead of shrinking it.

## 7. Recommended Follow-Up Direction
- If later UX work expands this area, keep future changes bounded to one concern such as mobile safe-area spacing, scroll-shadow affordances, or route-panel sticky subheaders rather than reopening full shell layout redesign.
