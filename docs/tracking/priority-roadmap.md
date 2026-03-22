# Priority Roadmap

- **Purpose:** Explain sequencing logic and show which work should happen first, next, and later.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
- **Related Documents:** `master-task-board.md`, `post-m3-reactivation-guide.md`, `m3-f3-implementation-handoff.md`, `candidate-a-promotion-readiness.md`, `candidate-a-gap-inventory.md`, `candidate-a-narrow-candidate-comparison.md`, `candidate-b-promotion-readiness.md`, `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `candidate-c-gap-inventory.md`, `environment-follow-up-lane-comparison.md`, `resolved-preview-sub-lane-comparison.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md`, `../tasks/task-022-post-t021-priority-review.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`, `../tasks/task-025-post-m3-f3-closure-priority-review.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-028-post-t027-candidate-a-readiness-refresh.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../prd/overview.md`, `../tasks/task-001-foundation-architecture.md`
- **Update Rule:** Update when priorities, dependencies, or milestone assumptions change.

## Priority Principles
Tasks are prioritized using these criteria:
1. Does the work determine direction for multiple downstream tasks?
2. Is it a dependency for architecture, data contracts, or implementation structure?
3. Does it reduce major uncertainty or security risk early?
4. Does it improve the efficiency of all later work?
5. Can it create clear handoff boundaries for other contributors?

## Execution Order Summary
### Phase A — Preparation and Direction Setting
1. **T002** Delivery documentation and tracking system — complete
2. **T001** Foundation architecture and domain model — complete
3. **T007** Shared domain schema and naming conventions — complete
4. **T004** Persistence strategy decision — complete
5. **T005** Script execution safety model — complete
6. **T003** UX information architecture and workspace flows — complete
7. **T006** Frontend stack and application shell decision — complete

### Phase B — Implementation Planning and Bootstrap
8. **T008** Internal API contract design — complete
9. **T011** Request builder MVP design — complete
10. **T012** Script editor and automation UX spec — complete
11. **T013** Mock engine rules spec — complete
12. **T014** History / inspector behavior spec — complete
13. **T016** Testing and QA strategy — complete
14. **T017** Developer environment and tooling baseline — complete
15. **T010** Frontend workspace shell implementation plan — complete
16. **T009** Workspace persistence bootstrap — complete

### Phase C — Post-S26 Reconciliation
17. **T015** Import/export strategy reconciliation — complete
18. **T018** Delivery milestone plan — complete

### Phase D — Active Follow-Up
19. **M3-F1** Material 3 visual-only pass for placeholder/secondary surfaces and remaining shell affordances
20. **M3-F2** Material 3 visual-only accessibility, contrast, focus, and density polish
21. **M3-F3** TSX presentation refinement plus local-verification handoff

### Phase E — Promoted Post-M3 Follow-Up
22. **T019** Server-backed pre-import preview for the current saved-request/mock-rule authored-resource bundle scope — complete
23. **T020** Candidate B gap inventory and lane selection — complete
24. **T021** Candidate C gap inventory and seam selection — complete
25. **T022** Post-T021 priority review — complete
26. **T023** Candidate B import migration approach decision — complete
27. **T024** M3-F3 implementation handoff — complete
28. **T025** Post-M3-F3 closure priority review — complete
29. **T026** M3-F3 validation environment blocker triage — complete

### Phase F — Placeholder Route MVP
30. **T027** Placeholder route MVP for `/environments`, `/scripts`, and `/settings` — complete

### Phase G — Post-T027 Readiness Refresh
31. **T028** Post-T027 Candidate A readiness refresh — complete

### Phase H — Request Environment Resolution Planning
32. **T029** Request environment selection and resolution plan — complete

### Phase I — Request Environment Implementation
33. **T030** Request environment selection and runtime resolution — complete

### Phase J — Post-T030 Readiness Refresh
34. **T031** Post-T030 priority and Candidate A refresh — complete

### Phase K — Environment Follow-Up Lane Narrowing
35. **T032** Post-T030 environment follow-up lane comparison — complete

### Phase L — Resolved-Preview Sub-Lane Narrowing
36. **T033** Post-T032 resolved-preview sub-lane comparison — complete

### Phase M — Parked Optional Future Work
37. Additional authored-resource tooling beyond `T019` and the current saved-request/mock-rule bundle scope
38. Later write-time migration-engine work if compatibility pressure justifies it
39. Bounded packaging polish only if a delivery milestone identifies a concrete readiness gap

## Why T001 Is First
`T001` is the first execution task because it has the highest leverage:
- It clarifies the product’s target architecture before coding begins.
- It defines core entities needed by storage, APIs, UI, and automation.
- It exposes risky trade-offs early, especially around modularization and refactor depth.
- It reduces the chance of rework across frontend, backend, and persistence efforts.

## What Must Be True Before Major Implementation Starts
- Core domain entities are defined.
- High-level architecture is documented.
- Storage direction is chosen or narrowed to a decision-ready short list.
- Script execution model constraints are explicit.
- Frontend shell strategy is selected.

## Near-Term Ready Queue
Recently completed foundation work:
- `T001` Foundation architecture and domain model
- `T007` Shared domain schema and naming conventions
- `T004` Persistence strategy decision
- `T005` Script execution safety model
- `T003` UX information architecture and workspace flows
- `T006` Frontend stack and application shell decision
- `T008` Internal API contract design
- `T009` Workspace persistence bootstrap
- `T011` Request builder MVP design
- `T012` Script editor and automation UX spec
- `T013` Mock engine rules spec
- `T014` History / inspector behavior spec
- `T016` Testing and QA strategy
- `T017` Developer environment and tooling baseline
- `T010` Frontend workspace shell implementation plan
- `T015` Import/export strategy reconciliation
- `T018` Delivery milestone plan

Ready to start now:
- M3-F1 and M3-F2 are landed; keep them closed as visual-only slices
- `M3-F3` is landed in tracking: its bounded wrapper/CSS patch is applied in code, a user-verified non-sandbox `npm.cmd run test:ui` passed the then-current full UI suite on 2026-03-22, and same-day `npm.cmd run check` passed in this sandbox
- `T027` is landed: `/environments` and `/scripts` now expose persisted resource-management surfaces, and `/settings` now exposes a diagnostics-first read-only runtime-status surface
- `T028` is landed: Candidate A guidance now reflects that environments and standalone saved scripts are real workflow objects after `T027`, but no new authored-resource transfer task is promoted automatically from that fact
- `T029` is landed: the next request-builder environment slice is now bounded to request-level selector plus server-owned run-time resolution rather than top-bar global state
- `T030` is landed: request drafts and saved requests now persist `selectedEnvironmentId`, the workspace request header now exposes request-level environment selection, and runtime execution/history now carry server-owned environment resolution metadata without widening into top-bar selector scope
- `T031` is landed: `T030` does not automatically promote environment transfer, top-bar selector work, or another parked candidate, and the environment-transfer lane is now explicitly treated as more concrete but still too broad because request-reference and run/history coupling now matter
- `T032` is landed: richer resolved-preview UX is now the strongest future environment lane if another environment task is later requested, while top-bar selector work and environment transfer remain parked
- `T033` is landed: inside the richer resolved-preview lane, post-run bounded resolution summary is now the strongest future narrow lane, while pre-run unresolved-feedback tiering and explorer/readability copy remain parked
- `T024` remains the canonical exact-patch reference plus local-verification handoff record for what landed in `M3-F3`, so future contributors can resume validation without repeating the scope audit
- `T025` is landed: the repo now records one current post-M3-F3 closure review, and that review still promotes no new implementation task
- `T026` is landed: blocker triage confirmed that the current repo already covers the main wrapper/config mitigations, so future sandbox-blocked confirmation should be requested locally rather than reopened as repo-side packaging work
- T019 is landed: the workspace import surface now performs a server-backed no-write preview before explicit confirm and preserves the existing request/mock bundle import semantics after commit
- T020 is landed: Candidate B now has a concrete gap inventory and stronger future lane without promoting migration implementation prematurely
- T021 is landed: Candidate C now has a concrete packaging/startup gap inventory without promoting packaging implementation prematurely
- T022 is landed: the repo now records an explicit no-promotion decision after T021 instead of implying that another implementation task should follow automatically
- T023 is landed: the stronger Candidate B authored-resource import lane now has a chosen future approach, but it still lacks one explicit transform contract and remains parked
- No additional post-M3 implementation task is activated automatically in this pass; `T025` confirms that Candidate A remains the strongest parked area but its remaining `/mocks`-local import lane is still too ambiguous, while Candidate B/C also remain parked
- Use `post-m3-reactivation-guide.md` before promoting any parked post-M3 work so the decision is based on the documented gate and promotion triggers rather than ad hoc momentum
- Use `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md` before proposing any extra repo-side blocker work so the next contributor starts from the confirmed preflight boundary instead of retrying already-landed runner or Windows-specific mitigations

## Deferred / Lower Priority Notes
- Additional authored-resource tooling beyond `T019` remains parked because the repo already ships saved-request/mock-rule bundle transfer, and the remaining gaps are either already covered, blocked by missing first-class resource types, or still too broad.
- Use `candidate-a-promotion-readiness.md`, `candidate-a-gap-inventory.md`, and `candidate-a-narrow-candidate-comparison.md` before proposing any Candidate A work beyond `T019`.
- Candidate 2 remains parked after `T019` because `/mocks` still exports current authored rules locally but import ownership is still workspace-level and mixed-bundle, so a route-local import entrypoint would still risk broadening scope.
- Broader cURL/OpenAPI/Postman interoperability remains deferred beyond the current authored-resource transfer baseline.
- Write-time migration-engine work remains parked because read-compatible classification already covers the shipped scope and no stronger compatibility pressure is documented yet.
- Use `candidate-b-promotion-readiness.md`, `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, and `candidate-b-import-migration-approach-decision.md` before proposing Candidate B so any future migration-engine task is tied to one blocked compatibility seam and one chosen approach rather than to broad future-proofing. The current stronger future lane is authored-resource import handling for `migration-needed` bundle/resource versions with a future preference for bundle-level normalization before import planning, but it remains parked and still does not justify a new implementation task yet.
- Packaging polish remains parked because S25/S26 already landed the current repo-native packaging/startup checks, and the remaining esbuild limitation is environment-bound rather than a newly scoped delivery gap.
- Use `candidate-c-promotion-readiness.md` and `candidate-c-gap-inventory.md` before proposing Candidate C so packaging work starts from the current shipped verification baseline and concrete gap evidence instead of from the already documented environment-bound limitation.
- Top-bar environment selection, pre-run unresolved-feedback tiering, explorer/readability copy propagation, top-level script attachment/reference semantics, settings mutation, and environment/script import-export expansion remain deferred beyond `T030`; do not treat them as part of placeholder-route cleanup or request-level environment baseline completion anymore.
- Use `resolved-preview-sub-lane-comparison.md` after `environment-follow-up-lane-comparison.md` before proposing further environment-observation work so future scope starts from the current strongest sub-lane rather than from a broad “better resolved preview” theme.
