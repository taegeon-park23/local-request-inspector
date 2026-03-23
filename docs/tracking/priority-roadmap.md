# Priority Roadmap

- **Purpose:** Explain sequencing logic and show which work should happen first, next, and later.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
- **Related Documents:** `master-task-board.md`, `post-m3-reactivation-guide.md`, `m3-f3-implementation-handoff.md`, `candidate-a-promotion-readiness.md`, `candidate-a-gap-inventory.md`, `candidate-a-narrow-candidate-comparison.md`, `candidate-b-promotion-readiness.md`, `candidate-b-gap-inventory.md`, `candidate-b-narrow-lane-comparison.md`, `candidate-b-import-migration-approach-decision.md`, `candidate-c-promotion-readiness.md`, `candidate-c-gap-inventory.md`, `environment-follow-up-lane-comparison.md`, `resolved-preview-sub-lane-comparison.md`, `../architecture/request-environment-resolution-summary-contract.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md`, `../tasks/task-022-post-t021-priority-review.md`, `../tasks/task-023-candidate-b-import-migration-approach-decision.md`, `../tasks/task-024-m3-f3-implementation-handoff.md`, `../tasks/task-025-post-m3-f3-closure-priority-review.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-028-post-t027-candidate-a-readiness-refresh.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../tasks/task-034-post-t033-resolution-summary-contract.md`, `../tasks/task-035-compact-shell-header-and-material-icon-usability-refresh.md`, `../tasks/task-036-button-badge-and-radius-visual-hierarchy-refinement.md`, `../architecture/client-i18n-foundation.md`, `../tasks/task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `../tasks/task-038-environments-and-scripts-route-localization-pass.md`, `../tasks/task-039-workspace-authoring-localization-pass.md`, `../tasks/task-040-workspace-result-panel-localization-pass.md`, `../tasks/task-041-captures-observation-route-localization-pass.md`, `../tasks/task-042-history-observation-route-localization-pass.md`, `../tasks/task-043-shell-density-and-collapsible-navigation-refinement.md`, `../tasks/task-044-single-panel-route-tabs-layout.md`, `../tasks/task-045-mocks-route-localization-pass.md`, `../tasks/task-046-shell-and-management-generated-aria-localization-pass.md`, `../prd/overview.md`, `../tasks/task-001-foundation-architecture.md`
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

### Phase M — Resolved-Preview Contract Definition
37. **T034** Post-T033 resolution summary contract — complete

### Phase N — Shell Usability Refresh
38. **T035** Compact shell header and Material icon usability refresh — complete

### Phase O — Control Hierarchy Refinement
39. **T036** Button, badge, and radius visual hierarchy refinement — complete

### Phase P — Client I18n Foundation
40. **T037** Client i18n foundation and Korean locale bootstrap — complete

### Phase Q — First Post-Foundation Route Localization Slice
41. **T038** Environments and Scripts route localization pass — complete

### Phase R — Workspace Authoring Localization Slice
42. **T039** Workspace authoring localization pass — complete

### Phase S — Workspace Result Localization Slice
43. **T040** Workspace result panel localization pass — complete

### Phase T — Captures Observation Localization Slice
44. **T041** Captures observation route localization pass — complete

### Phase U — History Observation Localization Slice
45. **T042** History observation route localization pass — complete

### Phase V — Shell Density And Navigation Refinement
46. **T043** Shell density and collapsible navigation refinement — complete

### Phase W — Single-Panel Route Layout Refinement
47. **T044** Single-panel route tabs layout — complete

### Phase X — Mocks Observation Localization Slice
48. **T045** Mocks route localization pass — complete

### Phase Y — Generated Aria Localization Slice
49. **T046** Shell and management generated ARIA localization pass — complete

### Phase Z — Workspace Result UX Follow-Up
50. **T047** Workspace result panel auto focus and immediate feedback — complete
51. **T048** Floating explorer density and visibility refresh — complete

### Phase AA — Parked Optional Future Work
51. Additional authored-resource tooling beyond `T019` and the current saved-request/mock-rule bundle scope
52. Later write-time migration-engine work if compatibility pressure justifies it
53. Bounded packaging polish only if a delivery milestone identifies a concrete readiness gap

## Why T001 Is First
T001 is the first execution task because it has the highest leverage:
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
- `T009` Workspace persistence bootstrap
- `T011` Request builder MVP design
- `T012` Script editor and automation UX spec
- `T013` Mock engine rules spec
- `T014` History / inspector behavior spec
- `T016` Testing and QA strategy
- `T017` Developer environment and tooling baseline

Ready to start now:
- `T047` is landed: workspace runs now auto-focus the most relevant result tab from shared per-tab command state, restore the single-panel workspace detail panel after run completion, and expose immediate console/test summary feedback without changing execution contracts
- `T048` is landed: floating explorer routes now use a lighter overlay toggle, compact one-line header summaries, tighter search/list spacing, shared truncation rules, and route-aware width clamps that improve first-screen list visibility without reopening the T047 scroll-containment slice
- `T046` is landed: shell route-panel regions plus Environments, Scripts, and Workspace explorer generated ARIA/action labels now localize through the shared i18n layer while request-builder generated ARIA and runtime-owned status-token boundaries remain deferred
- `T045` is landed: the Mocks route sidebar/detail/contextual chrome, route-local empty states, authored-rule action labels, detail-tab labels, and helper-generated authored-rule summaries now localize through the shared i18n layer while preserving backend contracts and runtime-owned status-token boundaries
- `T044` is landed: top-level routes now switch explorer, main surface, and contextual detail through one route-local tab strip, so only one panel occupies the full main region at a time while underlying feature state stays mounted
- `T043` is landed: the shell now uses a true 42px header strip, a flatter runtime-status presentation, a collapsible icon-only navigation rail with preserved accessible route names, and softer shadow-box separation between header/sidebar/main while keeping link accessibility and feature semantics intact
- `T042` is landed: the History route sidebar, filter labels, detail/timeline chrome, replay-bridge actions, result-tab labels, and client-owned fallback text now localize through the shared i18n layer while preserving backend contracts and runtime-owned status token boundaries
- `T041` is landed: the Captures route sidebar, filter labels, detail/timeline chrome, replay-bridge actions, and client-owned fallback text now localize through the shared i18n layer while preserving backend contracts and runtime-owned status token boundaries
- `T040` is landed: workspace result-panel tabs, observation header copy, response/console/tests/execution-info section copy, and client-owned fallback text now localize through the shared i18n layer while preserving backend contracts and runtime-owned status token boundaries
- `T039` is landed: workspace explorer chrome, request tab shell, request-builder authoring copy, request-bound scripts authoring surface, and explorer-owned authored-resource transfer messaging now localize through the shared i18n layer while preserving backend contracts and keeping broader observation-route translation deferred
- `T038` is landed: Environments and Scripts route internals now localize client-owned management copy, empty states, validation text, and primary actions through the shared i18n layer while preserving English-default contracts and leaving runtime payload translation for later slices
- `T037` is landed: the app now has a shared i18n provider with locale persistence, English fallback plus Korean catalogs, translation and formatting helpers, shell and top-level header localization, and a settings locale switch for future translation QA
- `T036` is landed: buttons now use tighter corners and stronger filled affordance, passive badges/chips are flatter and lighter, and shared tabs now use tighter segmented geometry without changing semantics or ownership
- `T035` is landed: the shell header is now compact and route-only, nav monograms are replaced with local SVG icons, and shared primitives plus major route headers/actions now use bounded icon support without changing semantics or ownership

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
- Use `request-environment-resolution-summary-contract.md` after `resolved-preview-sub-lane-comparison.md` before proposing future environment-observation implementation so result/history scope starts from one bounded shared DTO contract.
