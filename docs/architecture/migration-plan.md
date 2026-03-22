# T001 Migration Plan

- **Purpose:** Describe a phased migration path from the current prototype architecture to the target modular local-first API workbench architecture.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `overview.md`, `domain-model.md`, `../tasks/task-001-foundation-architecture.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Update Rule:** Update when sequencing, risks, or transition strategy changes.

## 1. Migration Goals
- avoid a risky big-bang rewrite
- preserve the current useful prototype behaviors where practical
- create stable seams for storage, execution, and UI modularization
- sequence work so T003, T004, T005, T006, T007, and T008 can proceed with less uncertainty

## 2. Current Starting Point
The application currently has:
- one backend file (`server.js`)
- one frontend file (`public/index.html`)
- no durable storage for user-authored resources
- no shared typed schemas between frontend and backend
- no isolated script runtime boundary

This means the migration must first create architectural seams before large feature growth happens.

## 3. Phased Transition Strategy
### Phase 0 — Planning Baseline (completed / in progress)
**Goals**
- establish delivery tracking
- document target architecture and domain model
- identify unresolved choices and follow-up tasks

**Key outputs**
- `docs/prd/overview.md`
- tracking docs
- T001 architecture package

**Exit criteria**
- T001 documented and linked
- downstream tasks have clear input expectations

### Phase 1 — Define Canonical Schemas and Storage Direction
**Primary follow-up tasks**
- T007 Shared domain schema and naming conventions
- T004 Persistence strategy decision

**Goals**
- turn the domain draft into stable resource contracts
- decide how persistent data is stored locally
- separate low-volume configuration data from higher-volume runtime records if needed

**Recommended approach**
- introduce `shared/` schema definitions before large implementation changes
- define repository interfaces before choosing final on-disk representation details in code

**Risks**
- over-modeling before MVP needs are constrained
- choosing persistence too late and blocking all implementation

### Phase 2 — Carve Out Backend Service Boundaries
**Primary follow-up tasks**
- T005 Script execution safety model
- T008 Internal API contract design

**Goals**
- split current `server.js` responsibilities into route handlers, services, event stream, and domain logic
- establish sandbox boundaries and request execution contracts
- isolate current wildcard capture / mock response logic behind dedicated services

**Recommended approach**
- keep Express temporarily, but move responsibilities behind service modules
- wrap current capture, execution, mock, and asset listing behavior in service interfaces
- keep SSE as the initial event transport unless T008 determines otherwise

**Preserve during transition**
- existing capture capability
- basic outbound execution using Node `fetch`
- current local server boot flow

**Risks**
- script sandbox redesign can block downstream coding if not scoped tightly
- parallel route and storage changes may create churn without shared schemas first

### Phase 3 — Establish Frontend Workspace Shell
**Primary follow-up tasks**
- T003 UX information architecture and workspace flows
- T006 Frontend stack and application shell decision
- T010 Frontend workspace shell implementation plan

**Goals**
- move from single HTML page to a structured workspace shell
- define areas for collections, editors, results, captures, and settings
- retain current prototype utility while introducing modular UI slices

**Recommended approach**
- choose a frontend stack only after T003 + T006 alignment
- migrate feature-by-feature instead of attempting full parity in one pass
- keep a thin compatibility path for the current prototype until the new shell covers core workflows

**Risks**
- UX design drifting from backend/domain contracts
- delaying stack choice too long and stalling implementation

### Phase 4 — Resource Persistence and Core Feature Migration
**Primary follow-up tasks**
- T009 Workspace persistence bootstrap
- T011 Request builder MVP design
- T012 Script editor and automation UX spec
- T013 Mock engine rules spec
- T014 History / inspector behavior spec

**Goals**
- implement saved requests, collections, environments, and templates
- persist execution history and captured requests based on chosen retention policy
- replace hard-coded template/script behavior with managed resources

**Migration notes**
- first persist user-authored resources before high-volume history if sequence pressure requires it
- convert the current hard-coded script templates into seed or system templates
- replace the single global `mockConfig` with `MockRule` evaluation

### Phase 5 — Harden and Expand
**Primary follow-up tasks**
- T015 Import/export strategy
- T016 Testing and QA strategy
- T017 Developer environment and tooling baseline
- T018 Delivery milestone plan

**Goals**
- improve validation, migration confidence, and delivery readiness
- add import/export seams and broader automated checks
- formalize operational expectations for release-quality work

## 4. Keep / Replace Matrix
| Current element | Keep temporarily | Replace eventually | Notes |
| --- | --- | --- | --- |
| Express server host | Yes | Maybe | Fine as host runtime until proven limiting |
| SSE capture stream | Yes | 확실하지 않음 | Good initial transport for inbound capture events |
| `server.js` monolith | No | Yes | Must split into services/modules |
| `public/index.html` monolith | No | Yes | Must evolve into modular workspace UI |
| Node `fetch` for requests | Yes | Maybe | Good baseline executor |
| global `mockConfig` | No | Yes | Replace with `MockRule` engine |
| in-process VM callback execution | No | Yes | Replace with isolated sandbox runtime |
| hard-coded script templates | No | Yes | Move into managed templates / seeds |

## 5. Risks and Mitigations
### Risk: premature stack commitment
**Mitigation:** keep T006 explicitly dependent on T001/T003 and mark uncertain items.

### Risk: storage decision delays all implementation
**Mitigation:** define repository interfaces and domain schemas before persistence implementation details.

### Risk: sandbox redesign becomes too large
**Mitigation:** split T005 into capability policy, runtime isolation, and API contract decisions if needed.

### Risk: migrating UI and backend simultaneously creates instability
**Mitigation:** maintain stable intermediate APIs and preserve the current executable baseline while carving modules out incrementally.

## 6. Suggested Follow-Up Sequencing After T001
1. T007 — finalize shared domain schema and naming conventions
2. T004 — choose persistence strategy
3. T005 — define script execution safety model
4. T003 — define workspace UX information architecture
5. T006 — choose frontend stack and application shell approach
6. T008 — define internal API contracts

## 7. Blockers / Open Questions
1. Persistence engine remains **확실하지 않음**.
2. Packaging target (web-only vs desktop wrapper) remains **확실하지 않음**.
3. Sandbox isolation mechanism remains **확실하지 않음**.
4. Capture retention defaults and storage scope remain **확실하지 않음**.

## 8. Completion Signal for T001
T001 should be considered handoff-ready when:
- architecture overview is available
- domain model draft is available
- migration phases and risk notes are documented
- tracking docs reflect the task is in progress with documented next actions
