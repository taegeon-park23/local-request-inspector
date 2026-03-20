# T010 - Frontend Workspace Shell Implementation Plan

- **Purpose:** Define the incremental implementation plan for the React + Vite + TypeScript frontend shell so the team can begin coding with clear route, shell, provider, state, and slice boundaries.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-20
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
T010 can stay closed as **done** at the planning/documentation level, and the linked implementation slices S1-S11 are now landed. The next work should move to follow-up refinement around persistence integration, richer diagnostics, script execution, mocks CRUD/evaluation, and captures real data rather than widening the shell itself.





