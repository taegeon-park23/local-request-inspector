# Priority Roadmap

- **Purpose:** Explain sequencing logic and show which work should happen first, next, and later.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `master-task-board.md`, `../prd/overview.md`, `../tasks/task-001-foundation-architecture.md`
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
2. **T001** Foundation architecture and domain model
3. **T007** Shared domain schema and naming conventions
4. **T004** Persistence strategy decision
5. **T005** Script execution safety model
6. **T003** UX information architecture and workspace flows
7. **T006** Frontend stack and application shell decision

### Phase B — Implementation Planning
8. **T008** Internal API contract design
9. **T011** Request builder MVP design
10. **T012** Script editor and automation UX spec
11. **T013** Mock engine rules spec
12. **T014** History / inspector behavior spec
13. **T016** Testing and QA strategy
14. **T017** Developer environment and tooling baseline

### Phase C — Build Readiness and Delivery Slicing
15. **T010** Frontend workspace shell implementation plan
16. **T009** Workspace persistence bootstrap
17. **T015** Import/export strategy
18. **T018** Delivery milestone plan

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

Ready to start now:
- First frontend implementation PR from the T010 shell bootstrap slice

## Deferred / Lower Priority Notes
- Import/export can wait until schemas stabilize.
- Milestone planning should be refreshed after the main P0 decisions are locked.
