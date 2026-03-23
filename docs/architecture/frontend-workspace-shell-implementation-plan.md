# T010 Frontend Workspace Shell Implementation Plan

- **Purpose:** Define an implementation-ready, review-friendly plan for replacing the legacy single-page frontend with a React + Vite + TypeScript workspace shell using small, testable slices.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
- **Related Documents:** `frontend-stack-and-shell.md`, `request-builder-mvp.md`, `script-editor-and-automation-ux.md`, `mock-engine-rules-spec.md`, `history-and-inspector-behavior.md`, `testing-and-qa-strategy.md`, `developer-environment-and-tooling-baseline.md`, `../tasks/task-010-frontend-workspace-shell-implementation-plan.md`
- **Status:** done
- **Update Rule:** Update when shell boundaries, route strategy, slice sequencing, or shared primitive assumptions materially change.

## 1. Goal
T010 converts the previously approved frontend direction into an implementation sequence that a team can execute through small PRs.

The plan must:
- preserve the T006 shell-first direction
- keep request authoring separate from runtime observation
- expose clean feature seams for `Workspace`, `Captures`, `History`, and `Mocks`
- map state ownership and test ownership before implementation begins
- avoid a one-shot frontend rewrite that is hard to review or validate

## 2. Current State at Implementation Start
The repository still starts from a prototype frontend/runtime shape:
- `server.js` serves a single Express runtime and static assets
- `public/index.html` remains the only frontend entrypoint
- capture streaming, request execution, global mock configuration, and callback/script authoring all coexist in the legacy surface
- there is no real `client/` application yet

T010 therefore plans a staged transition toward a new frontend structure rather than assuming the shell already exists.

## 3. Planning Principles
1. **Shell-first, feature-second.** Build the durable app frame and provider seams before deep feature behavior.
2. **Light route baseline, not route-heavy from day one.** Use the minimum route map needed to stabilize section ownership.
3. **Shared primitives before repeated detail screens.** Introduce result/detail/diagnostic primitives once at least two features can use them.
4. **Feature slices should be independently reviewable.** Every PR should have a narrow acceptance surface.
5. **Authoring state and observation state stay separate.** Request builder tabs are not history/capture detail state.
6. **Heavy surfaces stay lazy.** Monaco/script editing and advanced diff remain deferred until the surrounding shell is stable.
7. **QA ownership should be visible in the slice plan.** Each slice must naturally map to component, integration, and smoke coverage from T016.

## 4. Recommended `client/` Structure
```text
client/
  app/
    bootstrap/
    providers/
    router/
    shell/
  features/
    workspace/
    request-builder/
    captures/
    history/
    mocks/
    environments/
    scripts/
    settings/
    runtime-events/
  shared/
    api/
    contracts/
    state/
    ui/
    diagnostics/
    layout/
    utils/
    test/
```

## 4.1 Directory responsibilities
### `client/app`
Owns:
- application bootstrap
- top-level providers
- route registration
- persistent shell chrome
- section-level composition only

Must not own:
- request-builder business rules
- capture/history query logic
- mock-specific forms

### `client/features`
Owns:
- feature-specific routes/views
- feature stores/selectors when they do not belong globally
- feature query hooks and command hooks
- feature-specific list/detail/editor behavior

### `client/shared`
Owns:
- typed API client and event adapters
- reusable state helpers
- shared UI primitives
- result/detail/diagnostic primitives reused across features
- test utilities and common fixtures/adapters

## 5. Route Baseline
## 5.1 Minimum route map
The minimum route baseline should be:
- `/workspace`
- `/captures`
- `/history`
- `/mocks`
- `/environments`
- `/scripts`
- `/settings`

## 5.2 Why route baseline is still lightweight
The shell should be **shell-first with route-backed top-level sections**, not a deep nested route architecture from the first PR.

Recommended posture:
- routes identify the active top-level work area
- tabs, explorer selection, detail panes, and request draft state remain mostly in app/feature state
- do not encode every subpanel or tab into URLs during early slices

## 5.3 Routing decision
**Recommended direction:** route-light, shell-first.

Reasoning:
- T006 already favors a persistent shell over page-jump-heavy interaction
- many interactions are explorer selection, panel switching, tab switching, and detail opening within the same shell
- deep route design would create premature churn before request builder, captures, history, and mocks stabilize

**확실하지 않음:** whether MVP eventually needs richer deep-linking inside request-builder tabs or history detail views.

## 6. Shell Layout Implementation Stages
## 6.1 Shell anatomy
The persistent shell should be built in this order:
1. app bootstrap
2. providers
3. shell chrome
4. navigation rail
5. explorer/sidebar container
6. main work surface
7. contextual detail/result panel

## 6.2 App bootstrap
Responsibilities:
- mount React app
- initialize router
- initialize provider tree
- load app-level CSS/theme reset
- choose legacy vs new shell entry if coexistence is temporarily needed

## 6.3 Providers
Initial provider stack should be limited to:
- router provider
- TanStack Query provider
- shell/workspace app-state provider via Zustand-backed stores or wrappers
- runtime-events integration provider/adaptor

Defer from initial provider stack:
- feature-specific provider proliferation
- complex plugin registries
- desktop packaging abstractions

## 6.4 Shell chrome
Shell chrome should establish:
- top bar / title / workspace context area
- global run/cancel status placeholder
- global runtime connection status placeholder
- stable panel regions without feature-specific content coupling

## 6.5 Navigation rail
Navigation rail should own:
- active top-level section state via route
- persistent navigation labels/icons
- section switching among Workspace, Captures, History, Mocks, Environments, Scripts, Settings

## 6.6 Explorer / sidebar container
The explorer/sidebar container is a shell region, but its contents are feature-owned.

Examples:
- `Workspace`: collections/tree/explorer
- `Captures`: list + filter controls
- `History`: list + filters
- `Mocks`: rules list + create button

The shell owns sizing/placement; the feature owns list/filter semantics.

## 6.7 Main work surface
The main work surface should host:
- request editor tabs and request builder views for `Workspace`
- capture detail for `Captures`
- execution detail for `History`
- mock editor/list-detail views for `Mocks`
- resource/editor views for other sections later

## 6.8 Contextual detail/result panel
The contextual detail/result panel should be introduced as a shell region early, but initially populated only by simple placeholders.

This region eventually hosts:
- request execution result primitives
- history detail adjunct panels
- capture diagnostics/detail viewers
- mock diagnostics summaries

The panel exists before all detail content exists so layout contracts stabilize early.

## 7. State Ownership Model
## 7.1 Three ownership classes
### App state
Use global app state only for shell-wide coordination such as:
- selected workspace
- active shell section when not purely route-derived
- open request tabs metadata
- active request tab id
- global runtime connection status
- panel visibility / docking mode if shared across features

### Server state
Use TanStack Query for:
- workspaces, collections, requests, environments, scripts, mock rules
- captures lists/detail queries
- history lists/detail queries
- create/update/delete mutations
- invalidation after save/run/replay/mutation actions

### Local UI state
Keep local component/feature state for:
- form field drafts not yet committed to shared app state
- temporary filter input text
- local split-pane sizing if not reused elsewhere
- disclosure state, modal state, panel tab selection

## 7.2 Zustand / TanStack Query boundary mapping
**Zustand should own client coordination state.**
Examples:
- request tab registry
- current tab identity
- selected capture/history row when needed for cross-panel coordination
- shell-level panel expansion and active detail panel tab

**TanStack Query should own fetched/mutated server state.**
Examples:
- request resource lists and detail
- history detail result payloads
- captures list polling/stream-hydrated cache state
- mock rule list/detail

## 7.3 Thin shell/workspace orchestration policy
Use one thin orchestration store for shell/workspace UI state that must coordinate across otherwise separate features without becoming a second source of truth for server data or drafts.

The orchestration layer may own:
- floating explorer open/collapsed state when the same explorer/main/detail tab pattern is reused across multiple routes
- workspace result-panel visibility and the currently active result sub-tab
- the next shell auto-focus target after high-signal transitions such as explorer selection or request run completion
- route-panel selection when a workflow needs to move the user from explorer to authoring or from authoring to observation

The orchestration layer must not own:
- request draft field values
- saved environment/script records
- execution/history/capture payloads already owned by TanStack Query or feature-local runtime stores
- feature-specific validation logic

Interaction policy:
1. Explorer selection in `Workspace` should move the user back to the main authoring surface so the newly selected request opens in the work area immediately.
2. Request run completion in `Workspace` should move the user to the result panel and default the active result sub-tab to `response`.
3. `RequestResultPanelPlaceholder` should consume the shared orchestration state for its active tab instead of maintaining isolated local tab state.
4. `Environments` and `Scripts` should reuse the same route-panel/open-state pattern so explorer-first management routes behave consistently with each other.

## 7.4 Anti-pattern to avoid
Do not put server-fetched resource records into long-lived Zustand stores just to share them across components. Keep canonical server data in Query caches and derive view state around it.

## 8. Request Builder Tab State vs Execution Result State
## 8.1 Separation principle
Request authoring state and execution observation state must remain separate from the first implementation slices.

### Request builder tab state includes
- tab identity
- draft request fields
- dirty/saved status
- selected subtab such as Params/Headers/Body/Auth/Scripts
- active environment selection for the draft context

### Execution result state includes
- latest execution summary linked to a request tab or execution id
- response/result panel content
- console/test/Execution Info summaries
- cancellation/timeout/blocked outcome display

## 8.2 Why this must be explicit
This prevents:
- history detail from mutating request drafts
- replay from silently replacing current editor state
- UI models that collapse runtime diagnostics into generic request status

## 8.3 Replay bridge rule
Replay should first connect in a dedicated bridge layer that converts a capture/history source into a new or explicit request-builder draft context. It should not reuse capture/history detail state directly as editable tab state.

## 9. Feature Boundaries
## 9.1 Workspace feature
Owns:
- collection/resource explorer content
- request tabs registry UI wiring
- request open/save/select flows
- request-builder entry composition

## 9.2 Request Builder feature
Owns:
- request editing forms
- per-tab draft state adapters
- save/run entrypoints
- inline result hook-up for the active draft
- script-tab handoff into lazy editor surfaces later

## 9.3 Captures feature
Owns:
- capture list and filters
- capture detail view
- capture replay entrypoint
- live SSE-fed updates presentation

## 9.4 History feature
Owns:
- execution history list and filters
- history detail composition
- response/log/tests/execution-info detail integration
- history-side replay bridge entrypoint

## 9.5 Mocks feature
Owns:
- mock rules list
- enable/disable and rule status summaries
- mock editor flows
- diagnostics entrypoints tied to capture/runtime results

## 9.6 Runtime Events feature/support module
Owns:
- SSE subscription and event normalization
- mapping incoming runtime events into Query invalidation/cache updates or shell signals
- connection health status exposure to the shell

This module is not a user-facing section, but it is a dedicated seam needed for T008/T014/T016.

## 10. Shared Presentation Primitives
## 10.1 Introduce these after shell skeleton, before repeated detail work
Candidate shared primitives:
- `StatusBadge`
- `PanelTabs`
- `DetailViewerSection`
- `KeyValueMetaList`
- `JsonTextViewer` / `CodeBlockViewer`
- `ResultPanelShell`
- `DiagnosticsSummaryBlock`
- `EmptyStateCallout`
- `ConnectionStatusChip`

## 10.2 Why introduce them mid-early
These primitives become valuable as soon as at least two features need them:
- request result panel + history detail
- capture detail + history detail
- mock diagnostics + execution diagnostics

Do **not** try to perfect the final shared primitive catalog in the very first shell PR.

## 10.3 UI model guardrail
Model these status families explicitly in shared UI/view-model code rather than one generic enum:
- transport outcome
- execution outcome
- mock outcome
- script diagnostics summary
- test diagnostics summary

This prevents the collapse that T014/T016 explicitly warn against.

## 11. Lazy-Loaded Heavy Surfaces
## 11.1 Monaco and script-heavy surfaces
The shell plan should treat Monaco-class editing as lazy-loaded and feature-gated:
- do not include Monaco in the first shell/bootstrap PR
- do not make request builder depend on Monaco for the basic request form
- first implement script-tab placeholders and loading seams
- only later add Monaco-backed editing in the script-focused slice

## 11.2 Additional deferred heavy surfaces
Also defer from early slices:
- advanced diff viewers
- complex docking/resizing systems
- rich persisted layout customization
- unified timeline experimentation

## 12. SSE and Runtime Update Integration
## 12.1 Integration direction
SSE should connect through a dedicated runtime-events adapter layer, not directly inside feature list components.

## 12.2 Data-flow recommendation
1. shell boots and runtime-events adapter starts when appropriate
2. adapter parses/normalizes event payloads
3. adapter updates connection health state for shell chrome
4. adapter invalidates or incrementally updates feature caches
5. `Captures`, `History`, and active execution-result surfaces react through their normal feature boundaries

## 12.3 Ownership implications
- shell chrome may read connection status
- `Captures` owns capture list/detail rendering
- `History` owns execution detail rendering
- request builder may consume execution result updates tied to the active request context
- no feature should parse raw SSE transport text on its own

## 13. Existing Prototype and New Shell Coexistence Strategy
## 13.1 Recommended coexistence approach
Use a **temporary dual-entry migration seam**, not a flag day rewrite.

Recommended direction:
- keep legacy `public/index.html` available while early shell slices are not feature-complete
- add the new client shell in parallel under the future `client/` path/build pipeline
- switch server static serving only when the new shell can at least replace the old top-level navigation/boot path safely

## 13.2 Why this is safer
This lowers risk while:
- enabling small frontend infrastructure PRs
- avoiding one giant review that mixes tooling, shell, request builder, captures, and mocks all at once
- keeping a fallback path during the earliest shell slices

**확실하지 않음:** whether the migration seam is best expressed as a temporary alternate entry path, a dev-only toggle, or a final cutover branch once the shell skeleton is stable.

## 14. Shell Skeleton vs Feature Implementation Boundary
### 14.1 Shell skeleton includes
- app bootstrap
- provider stack
- route registration
- top bar
- nav rail
- empty explorer region
- empty work surface region
- empty detail/result panel region
- section placeholders for route targets

### 14.2 Feature implementation begins when a slice adds
- real list/query logic
- real draft/editor behavior
- replay logic
- diagnostics composition
- save/run/mutation behavior

This boundary is important because the first PR should establish durable composition seams without mixing too much product logic.

## 15. Recommended Feature Order
## 15.1 Order
1. shell skeleton + route/provider scaffold
2. workspace explorer + request-tab shell skeleton
3. request builder MVP core
4. captures list/detail skeleton with SSE adapter
5. shared detail/result primitives
6. history list/detail skeleton using shared result primitives
7. mock rules list/detail skeleton
8. replay bridge integration
9. script-tab lazy editor path
10. refinement / empty states / smoke-hardening

## 15.2 Why this order is safest
- request builder should not be too late because it is the core product surface
- however, request builder should not come before shell and state scaffolding, or it will grow into a second prototype
- captures can land before history detail sophistication because live observation validates shell/event seams early
- shared result/detail primitives are best introduced once both request result and capture/history surfaces justify them
- mocks can follow once list/detail scaffolding and status models exist
- replay should connect after both observation surfaces and request-draft creation seams are real

## 16. Incremental PR Slicing Plan
## 16.1 Slice table
| Slice | Goal | Main outputs | Primary tests |
| --- | --- | --- | --- |
| S1 | Client bootstrap + shell skeleton | `client/app` bootstrap, providers, route skeleton, shell chrome placeholders | component |
| S2 | Workspace explorer + request tab shell | workspace route composition, empty explorer, tab registry shell, tab-state store | component |
| S3 | Request builder core MVP | method/url/params/headers/body/auth basic forms, save/run placeholders or real commands as feasible | component + integration |
| S4 | Runtime events seam + captures skeleton | SSE adapter, capture list/detail skeleton, connection status chip | integration + component |
| S5 | Shared result/detail primitives | status badges, panel tabs, detail viewers, result panel shell, diagnostics summary blocks | component |
| S6 | History skeleton + result composition | history list/detail with shared result primitives, execution-info/tests/logs shells | integration + component |
| S7 | Mocks skeleton | mocks route, list/detail shell, rule status rendering, create/edit placeholders | component |
| S8 | Replay bridge | capture/history replay to request draft, explicit edit-first behavior | integration + component |
| S9 | Scripts lazy editor path | script-tab loading boundary, Monaco seam, diagnostics-aware placeholders | component + smoke |
| S10 | Smoke/readiness refinement | empty states, degraded-state copy, narrow smoke path wiring | smoke + component |

## 16.2 First implementation PR recommendation
**Recommended first PR:** S1 only.

That first PR should include:
- React app bootstrap
- route scaffold for the minimum top-level routes
- provider scaffold
- persistent shell layout regions
- section placeholders with stable labels
- minimal component tests for shell navigation and region rendering

It should **not** include:
- full request builder logic
- SSE wiring
- history/capture detail logic
- Monaco integration
- broad shared primitive catalog

## 16.3 Why S1 is the right first PR
It delivers the most leverage with the least behavioral risk:
- proves the new client app can mount
- stabilizes route/section ownership
- gives later feature PRs a durable home
- keeps the review focused on composition and boundaries rather than feature correctness

## 17. Slice-Level Test Ownership
## 17.1 Component ownership
Use component tests early for:
- shell composition
- nav rail labels and active-route behavior
- placeholder section rendering
- panel/tab primitives
- status family rendering rules

## 17.2 Integration ownership
Use integration tests as soon as features gain real data wiring for:
- request run/save interactions
- SSE-to-feature cache updates
- history detail data composition
- replay draft creation
- mutation invalidation behavior

## 17.3 Smoke ownership
Reserve smoke for a thin, later layer once enough vertical behavior exists:
- app boots to workspace shell
- request can open/run
- capture arrives and replay opens request builder
- history detail renders response/log/tests summary

## 17.4 Acceptance rule per slice
A slice is ready to merge when:
- its primary shell/feature boundary is explicit
- its test ownership is documented and minimally exercised
- it does not expand undocumented behavior from T011–T017
- it leaves the next slice easier rather than more coupled

## 18. Shared Primitive Introduction Timing
### 18.1 Do not front-load all primitives
The first shell PR should use simple local placeholder components where needed.

### 18.2 Introduce shared primitives when repetition appears
The recommended inflection point is after:
- request builder has a result area, and
- either captures or history has detail rendering needs

At that point, introduce shared primitives in one dedicated slice instead of copy/pasting status/detail/result blocks into multiple features.

## 19. Replay Bridge Introduction Timing
Replay should first be connected in **S8**, after:
- request-builder draft creation is stable
- captures detail exists
- history detail exists or is at least compositionally stable

This ordering avoids premature coupling between observation surfaces and authoring surfaces.

## 20. T017 Script Adoption Timing
T017's recommended scripts should not all land in the first shell PR.

Recommended adoption sequence:
- **S1**: `dev`, `lint`, `typecheck`, `test`
- **S4-S6**: `test:integration`, `test:component` if useful as focused loops
- **S8-S10**: `smoke`, `reset:data`, `seed:fixtures` once replay/capture/history flows need deterministic local verification
- preserve `bootstrap:storage` from the existing repo baseline from the beginning

This keeps the first implementation PR small while still aligning with the T017 baseline.

## 21. Dependency Map
| Slice | Depends on | Unlocks |
| --- | --- | --- |
| S1 | T006, T017 | all client feature work |
| S2 | S1, T003, T011 | request authoring navigation |
| S3 | S2, T011, T008 | request authoring execution/save loop |
| S4 | S1, T008, T014, T016 | capture observation seams |
| S5 | S3 and/or S4 | shared result/detail rendering |
| S6 | S4, S5, T014 | history observation flow |
| S7 | S1, T013 | mock management shell |
| S8 | S3, S4, S6, T014 | replay bridge |
| S9 | S3, T012, T017 | script authoring path |
| S10 | S3-S9, T016, T017 | smoke-ready MVP shell |

## 22. Defer Items
The following are intentionally deferred from early shell implementation slices:
- advanced docking/resizable IDE-style layout manager
- deep route-addressable subpanels everywhere
- advanced diff workflows
- unified captures/history timeline
- broad keyboard shortcut system
- Monaco everywhere / JSON editor everywhere
- full design-system formalization before repeated primitives appear

## 23. Open Questions / 확실하지 않음
1. Whether React Router should remain the final route solution or a lighter shell-state approach would be enough for MVP remains **확실하지 않음**, but the plan assumes route-backed top-level sections for clarity.
2. The exact coexistence/cutover mechanism between legacy `public/index.html` and the new client shell remains **확실하지 않음**.
3. The exact point at which history detail becomes rich enough to justify a dedicated shared `ResultPanelShell` beyond placeholders remains **확실하지 않음**.
4. Whether some shell panel sizing/docking state deserves global persistence in MVP remains **확실하지 않음**.
5. The exact Monaco load boundary remains **확실하지 않음**.
6. Whether `Environments`, `Scripts`, and `Settings` need more than placeholder shells before later MVP implementation phases remains **확실하지 않음**.

## 24. Implementation Handoff for the First Real PR
The first implementation task should be framed narrowly as:
- establish `client/app` bootstrap
- add top-level route skeleton for the approved sections
- add provider scaffold for router/query/app state
- render persistent shell regions and section placeholders
- add minimal component tests proving route switching and shell-region presence

If that PR tries to also solve request builder forms, SSE capture lists, Monaco integration, or replay logic, it is probably too large.
