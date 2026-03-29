# Progress Status

- **Purpose:** Provide a compact live snapshot without requiring contributors to read archived task history by default.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-30
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update after each active-task status change or verification-state change.

## Current Snapshot
- No bounded task is currently active. The next implementation step must start from one newly promoted task, while broader UI verification remains user-managed unless a new bounded slice is explicitly defined.
- `T120` is archived after applying the same route-local medium-width pane-tier guard to `/captures`, `/history`, and `/mocks`, moving those observation routes into stacked surface/detail tabs earlier and auto-collapsing the explorer once on stacked entry so medium-width observation surfaces remain readable at `1100px` without reopening the broader route-panel architecture.
- `T119` is archived after applying the same route-local medium-width pane-tier guard to `/workspace`, moving the focused-overlay workspace into stacked surface/detail tabs earlier and auto-collapsing the explorer once on stacked entry so the authoring surface remains readable at `1100px` without reopening the broader route-panel architecture.
- Broader UI verification remains user-managed unless a new bounded slice explicitly changes that rule.
- `T118` is archived after adding a route-local medium-width guard for environments and scripts so those focused-overlay routes enter stacked surface/detail tabs earlier, auto-collapse the explorer once on stacked entry, and keep management surfaces readable at `1100px` without reopening the broader route-panel architecture.
- `T117` is archived after restructuring environment variable editing rows into clearer primary/secondary/content regions, moving secret replacement controls into an explicit support editor block, clamping long environments/scripts explorer support lines, tightening script template copy/preview readability, and updating focused environments/scripts route coverage for the new row/readability markers.
- `T116` is archived after aligning settings copy/detail surfaces with the shared support-block grammar: command/path copy cards now render copied values inside bounded preview blocks, preference helper content and secret-policy notes use support blocks, and settings sidebar/detail sections now read as explicit supporting-tier surfaces with focused route coverage.
- `T115` is archived after aligning environments and scripts management/detail surfaces with the shared support-block grammar: management cards now keep actions in shared action bars, readiness and mutation feedback render inside bounded support blocks, and secondary summary/guidance/template sections render as explicit supporting-tier detail surfaces with focused route coverage.
- `T114` is archived after reframing persisted capture/history/mock preview payloads and summary lists into bounded support-preview blocks, tightening long-content readability without reopening layout or hierarchy work, and updating focused observation-route coverage for the new preview container contract.
- `T113` is archived after aligning capture, history, and mock-rule detail surfaces around the shared supporting-tier grammar: secondary persistence/outcome/timeline notes now render as supporting `DetailViewerSection`s, persisted response/test/execution metadata uses bounded support blocks, and observation vs management color treatment stays consistent with the route role without reopening layout or breakpoint work.
- `T112` is archived after binding `@monaco-editor/react` to the local `monaco-editor` instance inside the shared script Monaco setup, eliminating the runtime mismatch that broke worker requests and caused the request-scripts editor to drop usability after click. Playwright smoke on 2026-03-29 confirmed that both `사전 요청` and `테스트` stages keep textarea focus after click and brief idle time, and normal typing now updates Monaco content without console errors.
- `T111` is archived after rebalancing the request-scripts two-column layout so the guidance card no longer stretches into excessive blank space, stabilizing inline Monaco editor focus across debounced draft sync flushes, containing observation header badges within the detail-panel width, and adding focused editor/result-panel coverage plus static-shape guard updates for the new containment hook.
- `T110` is archived after rebalancing workspace detail/context hierarchy so inheritance and container-run secondary content render as lighter supporting sections, tightening request and batch result panel preview density with support blocks instead of equal-weight nested cards, and adding focused component coverage for the new detail/context structure.
- `T109` is archived after introducing explicit shared scroll-owner wrappers for explorer/main/detail panes, moving route-panel vertical overflow containment off direct `.shell-panel` selectors, containing tab-rail horizontal overscroll, and updating shared shell tests to target the new pane scroll-owner contract.
- `T108` is archived after promoting the workspace runner into a contextual run surface with dedicated configuration/request-selection tiers, moving the contextual `Run Selected` action into that panel, recasting the saved-resource manager as a lighter companion management surface, and adding focused component coverage for the runner plus updated manager structure.
- `T107` is archived after removing double-click request pinning from the workspace explorer, adding explicit request pin actions plus row-scoped overflow menus for destructive cleanup, and aligning explorer copy/component coverage with the safer row-action model.
- `T106` is archived after adding responsive floating-pane tiers to `RoutePanelTabsLayout`, keeping detail visible beside the main surface on desktop widths, collapsing main/detail into a stacked tab lane below the medium breakpoint, and updating shared shell tests to expect the new desktop-wide focused-overlay behavior.
- `T105` is archived after consolidating shared workspace/request-builder layout primitives into `material-theme.css`, introducing shared `SegmentedControl`/`DialogFooter`/overflow action-menu primitives, reducing the workspace header to one visible top-level `New Request` CTA, stabilizing request key/value multipart rows and create-sheet row recipes, and adding focused component coverage for the new header/tab-shell/settings layouts.
- `T104` was explicitly dropped by user reprioritization on 2026-03-29. The historical task doc is not present in the repo, so the carried-forward title remains **확실하지 않음**.
- `T103` is archived after introducing a Monaco-backed shared script editor surface, stage-aware completion/diagnostic profiles, forbidden-token warning markers, linked-stage read-only preview rendering, and save/run flush registration so Request Builder + `/scripts` both persist the latest script text reliably.
- `T102` is archived after converting the tab shell into a browser-style one-line rail with horizontal overflow scrolling, moving search/bulk-close controls to a dedicated toolbar, removing in-rail `새 요청/빠른 요청` actions, and adding left-side pin icons for preview/pinned tabs across request and overview sources.
- `T101` is archived after removing redundant selected-item explorer summary cards across management/observation routes and deleting the workspace explorer selection summary line while preserving list workflows.
- `T100` is archived after adding backend-unavailable error classification and deduplicating repeated workspace degraded detail lines while preserving resource-specific diagnostics for non-transport failures.
- `T099` is archived after introducing shared localized transport-error messaging (`backend_unavailable`/`invalid_api_response`) across workspace, settings, environments, scripts, mocks, captures, history, and request-builder save/run status flows.
- `T098` is archived after introducing shared frontend API response parsing, classifying backend-unavailable/proxy failures into deterministic actionable errors, and removing duplicated per-module parser seams.
- `T097` is archived after expanding runner inputs (selection/order/environment/iteration/data-file), wiring run-history visibility, and aligning collection/request-group batch payload composition with CLI-friendly server run contracts.

## Verification
- Playwright smoke confirmed `/captures`, `/history`, and `/mocks` switch to stacked route-panel tabs with the explorer collapsed at `1100px` on 2026-03-30.
- Playwright smoke confirmed `/workspace` switches to stacked route-panel tabs with the explorer collapsed at `1100px` on 2026-03-30.
- Playwright smoke confirmed `/environments` and `/scripts` switch to stacked route-panel tabs with the explorer collapsed at `1100px` on 2026-03-30.
- Focused environments/scripts route coverage was updated for management-row/readability markers on 2026-03-30.
- Focused settings route coverage was updated for support-block and supporting-section markers on 2026-03-30.
- Focused environments/scripts route coverage was updated for management/detail support-block markers on 2026-03-30.
- Focused captures/history/mocks route coverage was updated for bounded preview support-block markers on 2026-03-30.
- Playwright smoke confirmed script-editor focus retention plus typing on 2026-03-29.
- `npm.cmd run lint` passed on 2026-03-30.
- `npm.cmd run typecheck` passed on 2026-03-30.
- `npm.cmd run test:node` passed on 2026-03-30.
- Direct Codex-side vitest execution for focused environments/scripts route tests was blocked on 2026-03-30 by local PowerShell execution policy (`npx`) and a Vite/esbuild `spawn EPERM` when retried via `npm.cmd exec -- vitest run ...`.
- Agents must not rerun `npm.cmd run test:ui` or `npm run test:ui` from Codex.
- If UI full-suite verification is needed, instruct the user to run `npm.cmd run test:ui` locally and treat that result as authoritative.

## Next Contributor Rule
1. Read `../prd/overview.md`.
2. Read `master-task-board.md` and `priority-roadmap.md`.
3. Read `completed-work-summary.md` only when archived context is needed.
4. Promote exactly one new bounded task before starting implementation.

