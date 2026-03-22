# T010 - Frontend Workspace Shell Implementation Plan

- **Purpose:** Define the incremental implementation plan for the React + Vite + TypeScript frontend shell so the team can begin coding with clear route, shell, provider, state, and slice boundaries.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-006-frontend-stack-and-application-shell-decision.md`, `task-011-request-builder-mvp-design.md`, `task-012-script-editor-and-automation-ux-spec.md`, `task-013-mock-engine-rules-spec.md`, `task-014-history-inspector-behavior-spec.md`, `task-016-testing-and-qa-strategy.md`, `task-017-developer-environment-and-tooling-baseline.md`, `../architecture/frontend-workspace-shell-implementation-plan.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T010 translates the approved shell direction, feature specs, QA strategy, and tooling baseline into a small-slice implementation plan for the new frontend. The output defines the recommended `client/` structure, top-level route baseline, provider stack, shell composition order, app/server/local state ownership boundaries, shared primitive timing, replay bridge sequencing, and an incremental PR plan from first shell bootstrap through smoke-ready MVP shell slices.

## 2. Why This Task Matters Now
- The project now has enough architecture, feature, QA, and tooling guidance to begin implementation, but still needs a shell-first delivery plan that avoids a one-shot rewrite.
- Implementation work needs a stable answer for what the **first** frontend PR should be and how later request/capture/history/mock work should stack on top of it.
- T016 and T017 both explicitly defer shell/feature decomposition details to T010.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T010 because it already defines:
- the React + Vite + TypeScript shell direction, `client/app` / `client/features` / `client/shared` boundaries, and state-management preferences in `../architecture/frontend-stack-and-shell.md`
- request-builder behavior, replay bridge constraints, and save-vs-run separation in `../architecture/request-builder-mvp.md`
- script-tab, diagnostics, and Monaco lazy-load constraints in `../architecture/script-editor-and-automation-ux.md`
- mock outcome vocabulary and mocks feature scope in `../architecture/mock-engine-rules-spec.md`
- captures/history split, shared detail/result expectations, and replay authoring boundaries in `../architecture/history-and-inspector-behavior.md`
- test ownership and regression priorities in `../architecture/testing-and-qa-strategy.md`
- scripts, fixtures, bootstrap, and `client/` layout baseline in `../architecture/developer-environment-and-tooling-baseline.md`

Repository re-check before starting confirmed:
- T001-T017 planning artifacts required by this task already exist
- T010-specific task and architecture documents did **not** yet exist
- tracking docs correctly listed T010 as the next ready planning task
- the live repo still consists of the legacy `server.js` + `public/index.html` prototype plus storage bootstrap code, so T010 must plan a staged migration rather than assume a pre-existing client shell

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/frontend-workspace-shell-implementation-plan.md` exists
- the recommended `client/app`, `client/features`, and `client/shared` structure is documented
- top-level routes, shell regions, provider boundaries, and state ownership rules are documented
- an incremental PR slicing sequence is documented down to the first implementation PR
- T016/T017-aligned test ownership and tooling adoption timing are summarized
- defer items and **확실하지 않음** items are recorded
- tracking docs are updated to reflect T010 completion and implementation readiness

## 5. Outputs
- `../architecture/frontend-workspace-shell-implementation-plan.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required PRD, shell, request-builder, script, mock, history/inspector, QA, and tooling documents were re-read before defining T010.
- T010 now defines a shell-first, route-light implementation plan with clear `client/` boundaries, provider/state ownership rules, an ordered feature rollout, and a ten-slice PR sequence.
- The plan explicitly identifies S1 as the first implementation PR: new client bootstrap + provider scaffold + top-level routes + shell placeholders + minimal component coverage.
- **Implementation follow-up (2026-03-18):** S1 is now delivered in code with the React + Vite + TypeScript client bootstrap, persistent shell region placeholders, provider seams, route skeleton, component tests, and a conservative `/app` coexistence entrypoint that leaves the legacy prototype intact.
- **Implementation follow-up (2026-03-18):** S2 is now delivered in code with a `/workspace` explorer/sidebar scaffold, in-memory collection/folder/request tree, request tab registry shell, active-tab switching and close fallback behavior, empty-state handling, and explicit authoring-vs-observation placeholder surfaces ready for S3.
- **Implementation follow-up (2026-03-19):** S3 is now delivered in code with per-tab request draft state separated from the workspace tab registry, method/url authoring controls, params/headers/body/auth core editors, scripts placeholder copy, dirty tab indicators, and a still-placeholder observation panel ready for S4 runtime events and captures seams.
- **Implementation follow-up (2026-03-19):** S4 is now delivered in code with a typed runtime-events adapter seam, normalized capture observation fixtures, shell-level connection health wiring, and a `/captures` list/detail/timeline skeleton that keeps mock outcome vocabulary separate from request authoring state and leaves shared result/detail primitives for S5.
- **Implementation follow-up (2026-03-19):** S5 is now delivered in code with props-only shared result/detail primitives, a refactored request observation placeholder, and a refactored captures observation surface that reuse tabs, summary sections, empty callouts, and family-aware badges without moving feature state into shared layers.
- **Implementation follow-up (2026-03-19):** S6 is now delivered in code with a feature-local history observation store, synthetic execution history fixtures, shared-primitive-based Response/Console/Tests/Execution Info composition, compact execution stage summaries, and explicit execution/transport/test outcome family separation that stays isolated from captures and request drafts.
- **Implementation follow-up (2026-03-19):** S7 is now delivered in code with a feature-local mocks management store, synthetic mock-rule fixtures, a /mocks list/detail skeleton, a local-only New Rule draft shell, and explicit separation between authored rule state (Enabled/Disabled) and runtime mock outcome vocabulary.
- **Implementation follow-up (2026-03-19):** S8 is now delivered in code with an explicit replay bridge layer, capture/history-to-draft normalization, Open Replay Draft entrypoints in both observation surfaces, and new workspace replay tabs that hydrate authoring state without mutating observation records.
- **Implementation follow-up (2026-03-19):** S9 is now delivered in code with a stage-aware Scripts authoring surface, lazy-loaded editor boundary, per-tab pre-request/post-response/tests draft content, and explicit separation between request-bound script authoring state and execution/history/captures observation state.
- **Implementation follow-up (2026-03-20):** S10 is now delivered in code with smoke/readiness copy refinement across workspace, captures, history, mocks, replay, and scripts, improving empty/degraded/loading/deferred messaging without widening feature scope.
- **Implementation follow-up (2026-03-20):** S11 is now delivered in code with actual request definition save wiring, active-tab run wiring, storage-backed workspace explorer refresh, separate run observation state for the active request tab, and maintained separation between authoring drafts and observation results.
- **Implementation follow-up (2026-03-20):** S12 is now delivered in code with real /history query wiring against the SQLite runtime lane, persisted execution list/detail loading, run-to-history visibility via query invalidation, and maintained separation between active request-tab result state and history observation state.
- **Implementation follow-up (2026-03-20):** S13 is now delivered in code with real /captures query wiring against persisted runtime capture records, query-driven capture list/detail loading, runtime-event-triggered refresh against canonical capture queries, and maintained separation between captures observation state and request draft/history state.
- **Implementation follow-up (2026-03-20):** S14 is now delivered in code with richer bounded diagnostics across the active request result panel, persisted history detail, and persisted captures detail, while keeping family-aware outcome badges and authoring-versus-observation state boundaries intact.
- **Implementation follow-up (2026-03-20):** S15 is now delivered in code with bounded pre-request/post-response/tests script execution in the run lane, structured redacted stage summaries in the active request result panel, and persisted script diagnostics summaries in history while keeping request authoring state separate from runtime observation state.
- **Implementation follow-up (2026-03-20):** S16 is now delivered in code with persisted mock-rule CRUD, query-driven /mocks management UI, enabled/priority-based inbound mock evaluation, and capture-side mock outcome summaries that remain separate from authored rule state.
- **Implementation follow-up (2026-03-20):** S17 is now delivered in code with clarified request create/update persistence semantics, replay draft save stabilization, persisted-first workspace explorer ordering, predictable persisted mock-rule ordering, and bounded runtime request snapshot linkage metadata that keeps resource and runtime lanes distinct.
- **Implementation follow-up (2026-03-21):** S18 is now delivered in code with refined inbound-capture vs persisted-history request snapshot wording, clearer bounded/truncated/redacted preview policy copy, tighter selection fallback after filter/refresh changes, and better cross-surface summary consistency without merging observation state ownership.
- **Implementation follow-up (2026-03-21):** S19 is now delivered in code with wording and diagnostics polish across request result, scripts, captures, history, mocks, replay cues, and workspace authoring copy, aligning bounded/redacted/deferred messaging without changing semantics or state ownership.
- **Implementation follow-up (2026-03-21):** S20 is now delivered in code with authored resource-lane import/export for saved request definitions and mock rules, a safe create-new-identity import policy, workspace explorer import/export entrypoints, and explicit exclusion of runtime history/captures artifacts from transfer scope.
- **Implementation follow-up (2026-03-21):** S21 is now delivered in code with explicit resource/runtime schema markers, deterministic resource manifest and JSON serialization helpers, stricter authored-resource bundle validation, runtime metadata compatibility checks, and low-level storage seam tests without changing save/run/history/captures/mocks/import-export behavior.
- **Implementation follow-up (2026-03-21):** S22 is now delivered in code with bounded repo/tooling cleanup: split lint/test scripts, CommonJS-aware ESLint overrides, normalized Node seam-test entrypoints, `.mjs` Vite/Vitest config files, and a safer Vitest startup path that now fails later at TS transform `esbuild` boundaries instead of config-load `EPERM`.
- **Implementation follow-up (2026-03-21):** S23 is now delivered in code with single-resource authored bundle export for saved requests and mock rules, clearer import accept/reject summaries, bounded imported-name previews, and continued exclusion of runtime history/captures/execution artifacts from transfer scope.
- **Implementation follow-up (2026-03-21):** S24 is now delivered in code with explicit compatibility classification helpers for resource manifests, authored-resource bundles, and runtime metadata, plus migration-needed vs unsupported-version seam handling and additional low-level storage tests without adding a destructive migration engine.
- **Implementation follow-up (2026-03-22):** S25 is now delivered in code with clearer dev/build/serve script taxonomy, a built-shell-aware `/app` fallback and `/api/app-shell-status` seam, `/app` build-base alignment for the React shell, and a lightweight README/check flow that makes local startup and packaging verification easier without changing feature semantics.
- **Implementation follow-up (2026-03-22):** S26 is now delivered in code with a shared esbuild sandbox-compatibility preflight helper, fail-fast bounded wrapper messaging for `build:client` and `test:ui`, `check:app` compatibility reporting, and script-level Node seam coverage that narrows the remaining Windows/sandbox transform blocker without changing feature semantics.
- **Implementation follow-up (2026-03-22):** A Material 3 adoption plan now exists in `../architecture/material-3-adoption-plan.md`, and the initial token/theme rollout now includes shell chrome, shared primitive reskinning, and a first-pass request-builder / observation-surface materialization without changing authoring-vs-observation or family-aware status semantics.
- **Implementation follow-up (2026-03-22):** The next Material 3 continuation keeps the rollout visual-only: route-role cues now appear in the navigation rail, shell and card hierarchy use stronger token-driven tonal separation, and request-builder / observation / management surfaces continue converging on the same M3 foundation without changing feature ownership or runtime semantics.
- **Implementation follow-up (2026-03-22):** A further visual-only pass now adds role-specific navigation-rail treatment and stronger authoring-vs-observation-vs-management accent bars across shell panels and detail surfaces, while leaving request, history, captures, mocks, replay, and scripts behavior unchanged.
- **Implementation follow-up (2026-03-22):** The app shell now also carries an explicit top-bar surface-role legend so Material 3 styling reinforces the product’s authoring vs observation vs management model even before deeper per-feature control refactors land.
- **Implementation follow-up (2026-03-22):** Another CSS-only Material 3 pass now differentiates authoring vs observation vs management tab rails and section headers more clearly, using role-specific tonal treatments while leaving feature-local state and behavior untouched.
- **Implementation follow-up (2026-03-22):** Workspace, Captures, History, and Mocks headers now expose explicit role strips in feature-level UI, so the Material 3 rollout reinforces authoring, observation, and management boundaries beyond the shell chrome itself.
- **Implementation follow-up (2026-03-22):** History and Mocks detail/contextual panels now carry the same explicit role-strip treatment as their list and route headers, so observation versus management boundaries stay visible deeper into the shell without changing feature semantics.
- **Implementation follow-up (2026-03-22):** Workspace explorer request rows now distinguish starter seeds from persisted saved requests with row-level method/resource chips, so authoring density improves without changing explorer ownership or saved-request semantics.
- **Implementation follow-up (2026-03-22):** Captures, History, and Mocks list rows now surface one more bounded chip-level cue (scope, snapshot source, fixed delay) so Material 3 density improves in list exploration without widening feature semantics.
- **Implementation follow-up (2026-03-22):** Workspace, Captures, History, and Mocks rows now also carry lightweight left-edge accent cues keyed to resource kind, snapshot source, outcome family, or authored rule state, keeping the visual hierarchy denser without collapsing the underlying semantic families.
- **Implementation follow-up (2026-03-22):** Captures, History, and Mocks detail cards now expose role-specific Material 3 tonal treatments for bridge, snapshot, storage, outcome, evaluation, and deferred sections, improving information hierarchy without changing data ownership or behavior.
- **Implementation follow-up (2026-03-22):** Shared detail/meta primitives and workspace collection/folder tree nodes now use stronger Material 3 container hierarchy and list/timeline density, so authoring and observation surfaces feel more coherent even while request-builder TSX-specific refactors remain blocked by sandbox refresh issues.
- **Implementation follow-up (2026-03-22):** Shell nav active states now follow authoring/observation/management role color more consistently, and shared empty/readiness surfaces now read as Material 3 supporting containers rather than plain helper text, again without changing feature semantics.
- **Implementation follow-up (2026-03-22):** Shared badge rows, preview blocks, status-detail lists, and timeline/list summaries now use denser Material 3 spacing and supporting-container treatment, improving scanability without requiring request-builder TSX changes.
- **Implementation follow-up (2026-03-22):** Workspace, Captures, History, and Mocks list selection states now use role-specific Material 3 hover/selected treatment, and shared focus-visible styling is stronger for row/button shells, improving scanability without changing feature ownership.
- **Implementation follow-up (2026-03-22):** Filter strips, action groups, and summary-grid layouts across captures/history/mocks/request surfaces now use clearer Material 3 supporting containers and responsive grid rhythm, improving control hierarchy without changing feature behavior.

## 7. Key Decisions
1. The frontend rewrite should proceed **shell-first with incremental feature slices**, not route-first and not all-at-once.
2. The first implementation PR should establish only the new client bootstrap, provider stack, route scaffold, and persistent shell regions.
3. Request builder should be implemented early, but only after shell and tab-state scaffolding exist.
4. `Captures`, `History`, and `Mocks` should start as list/detail skeletons before richer diagnostics composition lands.
5. Shared result/detail primitives should be introduced after repeated use appears, not front-loaded into the first shell PR.
6. Replay should first be connected only after both authoring and observation seams are real, so it becomes an explicit bridge rather than hidden shared state.

## 8. Open Questions
1. Whether the final router choice remains React Router or a lighter route mechanism is **확실하지 않음**.
2. The exact coexistence/cutover method between the legacy prototype and the new client shell is **확실하지 않음**.
3. The precise timing for richer shared result-panel primitives beyond placeholders is **확실하지 않음**.
4. The final Monaco load boundary and whether some panel layout state should be globally persisted in MVP remain **확실하지 않음**.
5. Whether `Environments`, `Scripts`, and `Settings` remain placeholder sections for longer than other features is **확실하지 않음**.

## 9. Handoff Checklist
- [x] T010 task file exists and is linked from tracking docs
- [x] frontend workspace shell implementation plan architecture doc exists
- [x] shell regions, route baseline, provider stack, and state boundaries are documented
- [x] shared primitive timing, replay bridge timing, and heavy-surface defer strategy are documented
- [x] incremental PR slices and first implementation PR scope are documented
- [x] T016/T017-aligned testing/tooling adoption guidance is summarized

## 10. Recommended Owner
- Primary: Frontend Lead
- Secondary reviewers: Backend Lead + QA / Senior Engineer

## 11. Closure Decision
T010 can stay closed as **done** at the planning/documentation level, and the linked implementation slices S1-S26 are now landed. The next work should move to optional future resource tools, bounded packaging polish only if needed, and later migration-engine work rather than widening the shell itself.

Implementation follow-up note, 2026-03-22: the active request observation panel now uses stronger Material 3 supporting-container treatment for outcome rows, stage summary items, and bounded preview blocks so the latest tab execution reads as a distinct observation surface without changing request-run semantics.
Implementation follow-up note, 2026-03-22: captures/history/mocks filter strips, summary-grid cards, and action groups now use clearer per-surface accent treatment so observation and management detail stacks stay visually distinct without changing any resource or runtime semantics.
Implementation follow-up note, 2026-03-22: captures/history timeline rows, preview blocks, and detail metadata lists now use stronger per-surface Material 3 preview and list treatment so observation and management detail stacks scan more clearly without changing feature behavior.
Implementation follow-up note, 2026-03-22: tab rails, badge clusters, and empty-state callouts now use stronger Material 3 supporting-container hierarchy so active observation/detail stacks remain easier to scan without changing any authoring or runtime semantics.
Implementation follow-up note, 2026-03-22: shell panels and section/detail headers now use stronger Material 3 container rhythm and role-aware background treatment so top-level, observation, and management surfaces read more clearly without changing any route or state ownership semantics.
Implementation follow-up note, 2026-03-22: sidebar filter strips now use responsive auto-fit columns and unbounded compact-field width inside the filter container, fixing narrow-width label overlap without changing any filter semantics.
Implementation follow-up note, 2026-03-22: top bar and navigation rail now use clearer Material 3 supporting-container density and responsive topbar stacking, improving shell scanability without changing any route or state semantics.
Implementation follow-up note, 2026-03-22: shell-content column balance and navigation rail rhythm now use tighter Material 3 spacing and width constraints, improving sidebar/main/detail scanability without changing any route or state ownership semantics.
Implementation follow-up note, 2026-03-22: top-level explorer and observation lists now use stronger Material 3 list-container rhythm and row min-height/line-height tuning, improving vertical scanability without changing any list or selection semantics.
Implementation follow-up note, 2026-03-22: shared detail sections and key-value metadata rows now use tighter Material 3 card padding and two-column metadata rhythm on larger widths, improving detail scanability without changing any observation or management semantics.
Implementation follow-up note, 2026-03-22: request tab strip cards now use tighter Material 3 tab-card spacing, active-state treatment, and close-target sizing, improving request-shell scanability without changing any tab semantics.
Implementation follow-up note, 2026-03-22: request-builder authoring header strip, command area, and script-editor supporting surfaces now use stronger Material 3 container rhythm, reducing one of the main remaining non-materialized authoring seams without changing any request semantics.
Implementation follow-up note, 2026-03-22: the active request observation panel could not be patched at the TSX markup level because the sandbox refresh issue still blocks that file, but result-panel tabs, bounded preview, and execution-stage summaries now use narrower CSS-only selectors for stronger Material 3 observation hierarchy without changing run semantics.
Implementation follow-up note, 2026-03-22: keyboard-visible interactive affordances and badge/callout density now use stronger Material 3 focus and line-height treatment, improving accessibility polish without changing any feature semantics.
Implementation follow-up note, 2026-03-22: shared panel tabs, status badges, and empty callouts now use tighter Material 3 alignment, typography, and badge-dot spacing at the CSS layer, improving shared primitive scanability while the remaining TSX markup-level work stays blocked by sandbox refresh errors.
Implementation follow-up note, 2026-03-22: request-builder command notes, editor/stage tab rails, and script helper/example surfaces now use stronger authoring-tone Material 3 hierarchy at the CSS layer, improving the remaining request-builder scanability without changing any request or observation semantics.
Implementation follow-up note, 2026-03-22: request-builder card headers/body stacks and active observation detail headers/actions now use stronger Material 3 spacing and supporting-container treatment at the CSS layer, improving authoring-vs-observation hierarchy while TSX markup-level refactors remain blocked by sandbox refresh errors.
Implementation follow-up note, 2026-03-22: request-builder and active observation copy blocks now use tighter Material 3 line-height, heading rhythm, and action-badge emphasis at the CSS layer, improving the last remaining readable hierarchy without changing request, history, or capture semantics.
Implementation follow-up note, 2026-03-22: the React shell, legacy prototype, and bounded /app fallback page now share the same imported favicon/brand mark, and the shell top bar uses that mark directly without changing any authoring, observation, or runtime semantics.












