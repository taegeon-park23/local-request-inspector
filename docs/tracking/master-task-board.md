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
| T003 | UX information architecture and workspace flows | Define top-level navigation, panel layout, request editing flow, and key user journeys. | P0 | done | Prevents frontend rewrite churn and aligns storage/API decisions with user flow. | T001, T005, T008 | IA doc, screen map, user journey notes | Product + UX / Architecture | Could be blocked by unresolved desktop/web scope | IA and workspace flow docs completed; outputs now feed T006/T011/T012/T014 |
| T004 | Persistence strategy decision | Decide between JSON-file, SQLite, or hybrid persistence for collections, history, environments, and mock rules. | P0 | done | Affects repositories, import/export, backup, and migration complexity. | T001, T007 | Storage decision memo, pros/cons, initial schema approach | Architecture Agent | Rework if chosen too late | Persistence strategy draft completed and now feeds T005/T008/T009 |
| T005 | Script execution safety model | Define sandbox runner boundaries, allowed APIs, timeouts, and execution lifecycle. | P0 | done | Current VM model is high risk; must be re-scoped before advanced automation work. | T001, T004, T008 | Execution model design, threat notes, API surface proposal | Architecture + Security-minded Engineer | Underestimated local-security risk | Safety model is now aligned with T008 execution/event contracts; remaining policy defaults are tracked as follow-up inputs for T009/T012/T013/T014/T016 |
| T006 | Frontend stack and application shell decision | Select target frontend framework/tooling and define shell structure for the new workspace UI. | P0 | done | Needed before frontend modularization or editor integration work begins. | T001, T003, T005, T008 | Stack decision doc, shell structure plan | Architecture / Frontend Lead | Tooling churn, overdesign | Frontend stack and shell direction documented; outputs now feed T011/T012/T014/T017 |
| T007 | Shared domain schema and naming conventions | Define canonical models for Request, Collection, Environment, History, MockRule, ScriptTemplate, and execution results. | P0 | done | Ensures cross-team consistency in APIs, storage, and UI. | T001 | Schema doc, glossary, field conventions | Architecture Agent | Naming drift across docs/code | Shared schema and naming drafts completed and now feed T004/T005/T008 |
| T008 | Internal API contract design | Specify service endpoints/events for saved requests, history, mock rules, execution, and captures. | P1 | done | Required before implementation of modular services and UI integration. | T001, T004, T005, T007 | API contract doc, route catalog | Backend / Architecture | Rework if persistence or UX changes | API contract draft completed with route catalog, DTO families, and SSE-first event guidance |
| T009 | Workspace persistence bootstrap | Implement initial storage layer and repository scaffolding. | P1 | done | First concrete code milestone after architecture decisions. | T004, T005, T007, T008 | Storage module scaffold, sample data path | Backend Engineer | Technical debt if done before contracts settle | Bootstrap scaffold completed with JSON resource storage, SQLite runtime storage, migration metadata, and redacted-only runtime persistence guidance |
| T010 | Frontend workspace shell implementation plan | Break the UI rewrite into implementation slices with route/state/component boundaries. | P1 | todo | Makes large frontend work incremental and reviewable. | T003, T006, T007 | Frontend implementation plan | Frontend Lead | Scope explosion | Planning-only before coding |
| T011 | Request builder MVP design | Detail params, headers, body, auth, environment resolution, and validation behaviors. | P1 | done | Defines the central user workflow and influences shared schemas. | T003, T006, T008, T009 | Feature spec, edge cases, acceptance criteria | Product + Frontend/Backend | Complex format support may balloon | Request builder MVP scope, save/run lane split, validation rules, and result-panel boundaries are now documented |
| T012 | Script editor and automation UX spec | Specify Monaco integration level, script types, autocomplete context, and logs panel behavior. | P1 | todo | Ensures the “VS Code-like” requirement is translated into implementable scope. | T003, T005, T006, T007 | Script UX spec, capability matrix | Product + Frontend + Architecture | Ambiguous expectation on editor intelligence | Clarify acceptable level |
| T013 | Mock engine rules spec | Define rule matching, priority, scenario state, delays, and management UI expectations. | P1 | todo | Needed to evolve beyond the current single global mock config. | T007, T008 | Mock engine spec | Backend + Product | Matcher scope can become too broad | Start with simple matchers |
| T014 | History / inspector behavior spec | Define captured request storage, filters, replay, diff, and unified/unified-not timeline behavior. | P1 | todo | Central to the product identity and impacts storage and event design. | T003, T007, T008 | Inspector behavior doc | Product + Backend + Frontend | Data volume and UX complexity | Confirm MVP boundary |
| T015 | Import/export strategy | Define JSON format, migration compatibility, and future cURL/OpenAPI/Postman import seams. | P2 | todo | Valuable, but can follow core architecture and storage decisions. | T004, T007 | Import/export design note | Architecture / Product | Format lock-in if done ad hoc | Keep extensible |
| T016 | Testing and QA strategy | Define validation layers, smoke tests, integration tests, and planning for script/mocking verification. | P1 | todo | Prevents fragile refactor and missing regression coverage. | T001, T006, T008 | QA strategy doc, initial test matrix | QA / Senior Engineer | Hard to add late | Planning before implementation |
| T017 | Developer environment and tooling baseline | Decide linting, formatting, test runner, local data directory conventions, and developer scripts. | P1 | todo | Increases productivity once implementation begins. | T006 | Tooling baseline doc | Frontend/Backend Lead | Bike-shedding | Keep minimal but effective |
| T018 | Delivery milestone plan | Convert backlog into phased milestones with readiness gates and review checkpoints. | P1 | todo | Needed once P0 architecture decisions stabilize. | T001-T007 | Milestone plan | Delivery Agent | Shifts if P0 scope changes | Revisit after architecture |

## Current Focus
- **Next highest-priority task:** `T012 - Script editor and automation UX spec`
- T011 request builder MVP design is complete and now provides field scope, save/run semantics, and result-panel boundaries for implementation work.
- T009 persistence bootstrap remains the storage-lane baseline for T012, T014, and implementation work.
- T006 frontend stack and shell planning remains the shell baseline for T012, T014, and T017.
- T005 script execution safety planning remains the redaction and runtime-safety baseline for T012, T014, and T016.

## Blockers Snapshot
- No blocking issue for documentation setup.
- Major implementation can start in bounded areas like T009, but several policy defaults and UX decisions remain unresolved for later P1 tasks.
