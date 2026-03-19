# Master Task Board

- **Purpose:** Provide the canonical backlog and execution status for project preparation and delivery.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-20
- **Related Documents:** `priority-roadmap.md`, `../prd/overview.md`, `../tasks/task-001-foundation-architecture.md`
- **Update Rule:** Update status, dependencies, notes, and outputs whenever task state changes.

## Status Legend
- `todo`: defined but not started
- `doing`: actively in progress
- `blocked`: cannot proceed due to unresolved dependency or decision
- `done`: completed and handoff-ready

## Canonical Backlog
| ID | Title | Description | Priority | Status | Rationale / Purpose | Dependencies | Deliverables | Recommended Role | Risks | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T001 | Foundation architecture and domain model | Define target module boundaries, core domain entities, persistence candidates, and migration approach from the current monolith. | P0 | done | Unlocks nearly every downstream implementation decision and reduces high-risk rework. | PRD summary alignment | Architecture decision doc, domain model draft, migration outline | Architecture Agent | Premature stack choices, unresolved storage/security trade-offs | Completed through architecture overview, domain model, and migration docs |
| T002 | Delivery documentation and tracking system | Establish PRD summary, roadmap, board, task docs, and collaboration rules. | P0 | done | Enables coordinated execution and clean handoff before feature work. | None | `docs/` structure, AGENTS, workflow guidance | Product / Documentation Agent | Docs can drift if not maintained | Created in this change set |
| T003 | UX information architecture and workspace flows | Define top-level navigation, panel layout, request editing flow, and key user journeys. | P0 | done | Prevents frontend rewrite churn and aligns storage/API decisions with user flow. | T001 | IA doc, screen map, user journey notes | Product + UX / Architecture | Could be blocked by unresolved desktop/web scope | MVP flows documented in IA and workspace-flows docs |
| T004 | Persistence strategy decision | Decide between JSON-file, SQLite, or hybrid persistence for collections, history, environments, and mock rules. | P0 | done | Affects repositories, import/export, backup, and migration complexity. | T001 | Storage decision memo, pros/cons, initial schema approach | Architecture Agent | Rework if chosen too late | Hybrid direction documented; feeds T009 bootstrap |
| T005 | Script execution safety model | Define sandbox runner boundaries, allowed APIs, timeouts, and execution lifecycle. | P0 | done | Current VM model is high risk; must be re-scoped before advanced automation work. | T001 | Execution model design, threat notes, API surface proposal | Architecture + Security-minded Engineer | Underestimated local-security risk | Canonical capability/redaction model now feeds T008/T012 |
| T006 | Frontend stack and application shell decision | Select target frontend framework/tooling and define shell structure for the new workspace UI. | P0 | done | Needed before frontend modularization or editor integration work begins. | T001, T003 | Stack decision doc, shell structure plan | Architecture / Frontend Lead | Tooling churn, overdesign | React/Vite-style SPA shell and lazy editor guidance documented |
| T007 | Shared domain schema and naming conventions | Define canonical models for Request, Collection, Environment, History, MockRule, ScriptTemplate, and execution results. | P0 | done | Ensures cross-team consistency in APIs, storage, and UI. | T001 | Schema doc, glossary, field conventions | Architecture Agent | Naming drift across docs/code | Shared schema and naming docs now act as canonical references |
| T008 | Internal API contract design | Specify service endpoints/events for saved requests, history, mock rules, execution, and captures. | P1 | done | Required before implementation of modular services and UI integration. | T001, T007 | API contract doc, route catalog | Backend / Architecture | Rework if persistence or UX changes | SSE-first contract and stage/event naming documented |
| T009 | Workspace persistence bootstrap | Implement initial storage layer and repository scaffolding. | P1 | done | First concrete code milestone after architecture decisions. | T004, T007 | Storage module scaffold, sample data path | Backend Engineer | Technical debt if done before contracts settle | Storage scaffold and redacted runtime bootstrap are present |
| T010 | Frontend workspace shell implementation plan | Break the UI rewrite into implementation slices with route/state/component boundaries. | P1 | done | Makes large frontend work incremental and reviewable. | T003, T006, T007, T011-T017 | Frontend implementation plan, first-PR handoff | Frontend Lead | Scope explosion | Completed with shell-first slice plan, state boundaries, and first implementation PR scope |
| T011 | Request builder MVP design | Detail params, headers, body, auth, environment resolution, and validation behaviors. | P1 | done | Defines the central user workflow and influences shared schemas. | T003, T007 | Feature spec, edge cases, acceptance criteria | Product + Frontend/Backend | Complex format support may balloon | Request builder MVP scope, tab model, and save/run boundaries documented |
| T012 | Script editor and automation UX spec | Specify Monaco integration level, script types, autocomplete context, and logs panel behavior. | P1 | done | Ensures the “VS Code-like” requirement is translated into implementable scope. | T003, T005, T006, T007 | Script UX spec, capability matrix | Product + Frontend + Architecture | Ambiguous expectation on editor intelligence | Request-bound stage-aware UX, diagnostics, and reusable-script boundaries documented |
| T013 | Mock engine rules spec | Define rule matching, priority, scenario state, delays, and management UI expectations. | P1 | done | Needed to evolve beyond the current single global mock config. | T007, T008 | Mock engine spec | Backend + Product | Matcher scope can become too broad | MVP matcher/priority/diagnostics spec now documented with defer seams for scenarios/scripts |
| T014 | History / inspector behavior spec | Define captured request storage, filters, replay, diff, and unified/unified-not timeline behavior. | P1 | done | Central to the product identity and impacts storage and event design. | T003, T007, T008 | Inspector behavior doc | Product + Backend + Frontend | Data volume and UX complexity | Captures/history split, replay bridge, diff scope, and labeling model documented |
| T015 | Import/export strategy | Define JSON format, migration compatibility, and future cURL/OpenAPI/Postman import seams. | P2 | todo | Valuable, but can follow core architecture and storage decisions. | T004, T007 | Import/export design note | Architecture / Product | Format lock-in if done ad hoc | Keep extensible |
| T016 | Testing and QA strategy | Define validation layers, smoke tests, integration tests, and planning for script/mocking verification. | P1 | done | Prevents fragile refactor and missing regression coverage. | T001, T006, T008 | QA strategy doc, initial test matrix | QA / Senior Engineer | Hard to add late | MVP verification layers, smoke set, and regression guards documented |
| T017 | Developer environment and tooling baseline | Decide linting, formatting, test runner, local data directory conventions, and developer scripts. | P1 | done | Increases productivity once implementation begins. | T006, T009, T016 | Tooling baseline doc, task handoff | Frontend/Backend Lead | Bike-shedding | Completed with tooling baseline, fixture/bootstrap guidance, and CI-friendly script catalog |
| T018 | Delivery milestone plan | Convert backlog into phased milestones with readiness gates and review checkpoints. | P1 | todo | Needed once P0 architecture decisions stabilize. | T001-T007 | Milestone plan | Delivery Agent | Shifts if P0 scope changes | Revisit after architecture |

## Current Focus
- **Active highest-priority next step:** Post-S11 refinement: persistence connection refinement, history real data, richer diagnostics, scripts execution, mocks CRUD/evaluation, and captures real data.
- S1 is implemented with the new client bootstrap, route/provider scaffold, persistent shell regions, component coverage, and a conservative legacy coexistence seam.
- S2 is implemented with the `/workspace` explorer scaffold, in-memory request tree, request tab registry shell, tab focus/close behavior, active work-surface placeholder, and contextual result-panel placeholder.
- S3 is implemented with per-tab request draft state, method/url authoring, params/headers/body/auth core editors, scripts placeholder, dirty tab indicators, and a still-separated observation panel seam.
- S4 is implemented with a typed runtime-events adapter seam, synthetic normalized capture feed, shell-level connection health, and a `/captures` list/detail/timeline skeleton that keeps mock outcome vocabulary separate from authoring state.
- S5 is implemented with props-only shared result/detail primitives, a refactored request observation placeholder, and a refactored captures observation surface that reuse tabs, summary sections, empty callouts, and family-aware badges without changing feature state ownership.
- S6 is implemented with a feature-local `/history` observation store, synthetic execution history fixtures, shared-primitive-based result composition tabs, compact stage summaries, and explicit execution/transport/test outcome family separation that remains independent from captures and request drafts.
- S7 is implemented with a feature-local /mocks rule-management store, synthetic rule fixtures, a shared-primitive-based list/detail skeleton, local New Rule draft entrypoint, and explicit separation between authored rule state and runtime mock outcome vocabulary.
- S8 is implemented with an explicit replay bridge layer, capture/history-to-draft normalization, edit-first Open Replay Draft entrypoints, and new workspace replay tabs that hydrate authoring state without mutating observation records.
- S9 is implemented with stage-aware request-bound script drafts, a lazy-loaded Scripts editor surface for Pre-request/Post-response/Tests, per-tab script persistence, and explicit separation from execution/history/captures observation state.
- S10 is implemented with smoke/readiness copy refinement across workspace, captures, history, mocks, replay, and scripts, keeping authoring and observation surfaces legible without widening feature scope.
- S11 is implemented with actual request save/run wiring, storage-backed saved request refresh in the workspace explorer, active-tab run observation in the right-hand result panel, and continued separation between authoring draft state and observation result state.

## Blockers Snapshot
- T010 shell slices S1-S11 are now landed. Remaining work moves to follow-up persistence/data/diagnostics work rather than more shell scaffolding.
- Architecture, schema, safety, persistence, request-builder, script-UX, mock-rule, history/inspector, QA, tooling, and shell-slicing inputs are now documented.




