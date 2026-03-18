# Master Task Board

- **Purpose:** Provide the canonical backlog and execution status for project preparation and delivery.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
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
| T001 | Foundation architecture and domain model | Define target module boundaries, core domain entities, persistence candidates, and migration approach from the current monolith. | P0 | done | Unlocks nearly every downstream implementation decision and reduces high-risk rework. | PRD summary alignment | Architecture decision doc, domain model draft, migration outline | Architecture Agent | Premature stack choices, unresolved storage/security trade-offs | Architecture package completed and now feeds T004/T005/T006/T007/T008 |
| T002 | Delivery documentation and tracking system | Establish PRD summary, roadmap, board, task docs, and collaboration rules. | P0 | done | Enables coordinated execution and clean handoff before feature work. | None | `docs/` structure, AGENTS, workflow guidance | Product / Documentation Agent | Docs can drift if not maintained | Created in this change set |
| T003 | UX information architecture and workspace flows | Define top-level navigation, panel layout, request editing flow, and key user journeys. | P0 | todo | Prevents frontend rewrite churn and aligns storage/API decisions with user flow. | T001 | IA doc, screen map, user journey notes | Product + UX / Architecture | Could be blocked by unresolved desktop/web scope | Focus on MVP flows first |
| T004 | Persistence strategy decision | Decide between JSON-file, SQLite, or hybrid persistence for collections, history, environments, and mock rules. | P0 | todo | Affects repositories, import/export, backup, and migration complexity. | T001 | Storage decision memo, pros/cons, initial schema approach | Architecture Agent | Rework if chosen too late | May become an ADR |
| T005 | Script execution safety model | Define sandbox runner boundaries, allowed APIs, timeouts, and execution lifecycle. | P0 | todo | Current VM model is high risk; must be re-scoped before advanced automation work. | T001 | Execution model design, threat notes, API surface proposal | Architecture + Security-minded Engineer | Underestimated local-security risk | Coordinate with T008/T012 |
| T006 | Frontend stack and application shell decision | Select target frontend framework/tooling and define shell structure for the new workspace UI. | P0 | todo | Needed before frontend modularization or editor integration work begins. | T001, T003 | Stack decision doc, shell structure plan | Architecture / Frontend Lead | Tooling churn, overdesign | Keep scope focused on maintainability |
| T007 | Shared domain schema and naming conventions | Define canonical models for Request, Collection, Environment, History, MockRule, ScriptTemplate, and execution results. | P0 | doing | Ensures cross-team consistency in APIs, storage, and UI. | T001 | Schema doc, glossary, field conventions | Architecture Agent | Naming drift across docs/code | Shared schema and naming draft created; follow-up inputs prepared for T004/T005/T008 |
| T008 | Internal API contract design | Specify service endpoints/events for saved requests, history, mock rules, execution, and captures. | P1 | todo | Required before implementation of modular services and UI integration. | T001, T007 | API contract doc, route catalog | Backend / Architecture | Rework if persistence or UX changes | Consider SSE/WebSocket needs |
| T009 | Workspace persistence bootstrap | Implement initial storage layer and repository scaffolding. | P1 | todo | First concrete code milestone after architecture decisions. | T004, T007 | Storage module scaffold, sample data path | Backend Engineer | Technical debt if done before contracts settle | Not ready yet |
| T010 | Frontend workspace shell implementation plan | Break the UI rewrite into implementation slices with route/state/component boundaries. | P1 | todo | Makes large frontend work incremental and reviewable. | T003, T006, T007 | Frontend implementation plan | Frontend Lead | Scope explosion | Planning-only before coding |
| T011 | Request builder MVP design | Detail params, headers, body, auth, environment resolution, and validation behaviors. | P1 | todo | Defines the central user workflow and influences shared schemas. | T003, T007 | Feature spec, edge cases, acceptance criteria | Product + Frontend/Backend | Complex format support may balloon | Keep MVP constrained |
| T012 | Script editor and automation UX spec | Specify Monaco integration level, script types, autocomplete context, and logs panel behavior. | P1 | todo | Ensures the “VS Code-like” requirement is translated into implementable scope. | T003, T005, T006, T007 | Script UX spec, capability matrix | Product + Frontend + Architecture | Ambiguous expectation on editor intelligence | Clarify acceptable level |
| T013 | Mock engine rules spec | Define rule matching, priority, scenario state, delays, and management UI expectations. | P1 | todo | Needed to evolve beyond the current single global mock config. | T007, T008 | Mock engine spec | Backend + Product | Matcher scope can become too broad | Start with simple matchers |
| T014 | History / inspector behavior spec | Define captured request storage, filters, replay, diff, and unified/unified-not timeline behavior. | P1 | todo | Central to the product identity and impacts storage and event design. | T003, T007, T008 | Inspector behavior doc | Product + Backend + Frontend | Data volume and UX complexity | Confirm MVP boundary |
| T015 | Import/export strategy | Define JSON format, migration compatibility, and future cURL/OpenAPI/Postman import seams. | P2 | todo | Valuable, but can follow core architecture and storage decisions. | T004, T007 | Import/export design note | Architecture / Product | Format lock-in if done ad hoc | Keep extensible |
| T016 | Testing and QA strategy | Define validation layers, smoke tests, integration tests, and planning for script/mocking verification. | P1 | todo | Prevents fragile refactor and missing regression coverage. | T001, T006, T008 | QA strategy doc, initial test matrix | QA / Senior Engineer | Hard to add late | Planning before implementation |
| T017 | Developer environment and tooling baseline | Decide linting, formatting, test runner, local data directory conventions, and developer scripts. | P1 | todo | Increases productivity once implementation begins. | T006 | Tooling baseline doc | Frontend/Backend Lead | Bike-shedding | Keep minimal but effective |
| T018 | Delivery milestone plan | Convert backlog into phased milestones with readiness gates and review checkpoints. | P1 | todo | Needed once P0 architecture decisions stabilize. | T001-T007 | Milestone plan | Delivery Agent | Shifts if P0 scope changes | Revisit after architecture |

## Current Focus
- **Active highest-priority task:** `T007 - Shared domain schema and naming conventions`
- T001 architecture outputs are now being converted into canonical schema and naming inputs for T004, T005, and T008.

## Blockers Snapshot
- No blocking issue for documentation setup.
- Implementation work remains blocked by unresolved architecture, storage, and execution-model decisions.
