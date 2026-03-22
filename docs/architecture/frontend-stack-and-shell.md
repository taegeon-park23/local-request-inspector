# Frontend Stack and Application Shell Decision

- **Purpose:** Compare realistic frontend stack options and define the recommended application shell for the local-first API workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `overview.md`, `internal-api-contracts.md`, `ux-information-architecture.md`, `workspace-flows.md`, `script-execution-safety-model.md`, `../tasks/task-006-frontend-stack-and-application-shell-decision.md`
- **Status:** done
- **Update Rule:** Update when the recommended frontend stack, shell boundaries, or state-management strategy materially change.

## 1. Decision Goal
Choose a frontend stack and shell shape that fits this product's real needs:
- local-first developer tooling
- desktop-like multi-panel workspace UX
- heavy client-side interaction with editors, inspectors, and result panes
- SSE-driven runtime updates
- minimal need for SEO or public web delivery
- future compatibility with a desktop wrapper if packaging changes later

This decision should optimize for maintainability and feature delivery, not for public-site concerns that the product does not currently have.

## 2. Current Frontend Constraints
The current UI is a single `public/index.html` file with inline styles, inline logic, CDN-loaded Materialize CSS, and Ace editor setup. This causes several concrete limits:
- layout, data flow, and feature logic are tightly coupled in one document
- DOM-driven state makes it hard to manage request tabs, multiple detail panels, and runtime streams
- there is no modular routing, reusable component boundary, or typed client contract layer
- editor integration is limited to the current Ace setup and cannot naturally scale to Monaco-like UX
- SSE updates, request forms, mock settings, and capture history all coexist without clear feature boundaries

In short, the current structure is acceptable for a prototype but not for a multi-panel workbench.

## 3. Decision Criteria
The chosen stack should score well on:
1. **Desktop-like SPA ergonomics** for complex in-browser tooling
2. **Component modularity** for shell, panels, editors, and inspectors
3. **Typed API integration** with the T008 contract layer
4. **Editor friendliness** for Monaco and other heavy client-side widgets
5. **SSE/event integration** without unusual framework friction
6. **Testability and tooling maturity** for T017 and later implementation
7. **Future desktop-wrapper compatibility** without forcing SSR-specific assumptions
8. **Low conceptual overhead** for a small local-tool codebase

## 4. Candidate Stack Comparison
### 4.1 Option A — React + Vite + TypeScript
**Strengths**
- Excellent fit for a client-heavy SPA/workbench product
- Fast local development and simple bundling
- Works well with Monaco, split panes, and tabbed shells
- Easy to pair with TanStack Query for API/server state and Zustand for app/UI state
- Minimal SSR assumptions, which fits a local tool
- Easy to package later inside Electron or Tauri

**Weaknesses**
- Routing, data fetching, and shell conventions must be assembled deliberately rather than inherited from a full framework
- Team must choose its own state and component conventions

**Fit assessment**
This is the strongest match for the current product shape.

### 4.2 Option B — React + Next.js + TypeScript
**Strengths**
- Strong defaults for file-based routing, build tooling, and app organization
- Mature React ecosystem and good DX
- Could still host a client-heavy shell

**Weaknesses**
- SSR, server components, and deployment-oriented features are not core needs for a local-first workbench
- Adds conceptual overhead around rendering modes that do not materially help the product
- Electron/Tauri compatibility is still possible, but the framework solves more web-app problems than this tool currently has

**Fit assessment**
Viable, but heavier than necessary for MVP and likely to create avoidable complexity.

### 4.3 Option C — Lightweight SPA framework (e.g. Vue + Vite or SvelteKit/Vite)
**Strengths**
- Can deliver excellent SPA performance and solid component ergonomics
- Smaller API surface in some cases
- Good fit for local tools in principle

**Weaknesses**
- Would introduce a larger framework shift relative to the React/Monaco-heavy ecosystem most commonly used for IDE-like web tooling
- Less direct alignment with the likely downstream availability of editor, docking, and query-state examples in this repo's planning context
- Adds decision churn because the repo has no existing frontend convention to justify choosing an alternate ecosystem

**Fit assessment**
Reasonable in theory, but not the most conservative choice for planning continuity.

## 5. SSR vs SPA Decision
### 5.1 Does this product need SSR?
**Recommended answer: no, not for MVP or near-term architecture.**

Reasons:
- The product is a local developer tool, not a search-indexed public site.
- Most views are interactive work surfaces rather than content pages.
- Monaco, request builders, result panes, and SSE-driven inspectors are naturally client-side concerns.
- Server-side rendering does not materially simplify the local Express-backed product model already documented in T001/T008.

### 5.2 Is a single-page application structure more appropriate?
**Recommended answer: yes.**

A SPA shell is better aligned with:
- persistent workspace context
- tabbed request editing
- side-by-side panels
- live execution/capture updates
- client-managed docking, resizing, and transient UI state

The frontend should therefore be treated as a client-rendered application shell consuming the internal API and event streams.

## 6. Recommended Stack
### 6.1 MVP Recommendation
**React + Vite + TypeScript** with the following baseline approach:
- **React** for component composition and ecosystem support
- **Vite** for fast local development and straightforward bundling
- **TypeScript** for shared DTO alignment with T007/T008 artifacts
- **TanStack Query** for server state, list/detail fetching, and invalidation
- **Zustand** for global app/workspace state and cross-panel coordination
- **React Router** only if URL-addressable shell views are needed beyond a minimal tab shell; otherwise keep routing intentionally lightweight in MVP
- **Monaco Editor** loaded lazily where script or JSON-heavy editing requires it

### 6.2 Why this direction is preferred
This option best matches the product's actual constraints:
- it supports a desktop-like shell without SSR overhead
- it aligns well with heavy client-side editing and inspection surfaces
- it keeps future Electron/Tauri wrapping open
- it minimizes framework complexity while still giving strong long-term maintainability

## 7. Application Shell Design
### 7.1 Shell Objective
The shell should host multiple long-lived work surfaces while preserving context between editing and runtime inspection.

### 7.2 Recommended Layout Regions
Recommended shell layout, aligned to T003:
- **Top app bar**
  - workspace selector
  - environment selector
  - global search / command entry
  - run/cancel status
  - connection/runtime health
- **Primary navigation rail**
  - Workspace
  - Captures
  - History
  - Mocks
  - Environments
  - Scripts
  - Settings
- **Section explorer sidebar**
  - collection tree
  - capture list
  - execution history list
  - mock list
  - environment list
  - script/template list
- **Main work surface**
  - request editor tabs
  - detail editors
  - full-page inspectors when appropriate
- **Contextual result/detail panel**
  - response detail
  - logs and tests
  - match diagnostics
  - timeline and metadata

### 7.3 Shell Behavior Principles
- The shell should keep global context stable while only the explorer and work surface change per section.
- Request editing should remain tab-oriented rather than route-jump-heavy.
- Runtime detail panels should be reusable across `Workspace`, `Captures`, and `History` views.
- Layout should assume resizable/collapsible panels even if the first implementation is simpler.

## 8. State Ownership Model
### 8.1 Global App State
Use global app state for data that must coordinate across the shell:
- selected workspace
- selected environment
- open tabs and focused work surface
- active filters shared across a section
- runtime connection status
- ephemeral command-palette or layout preferences

### 8.2 Server State
Use a server-state layer for data fetched or synchronized from the backend:
- workspaces, collections, requests, environments, scripts, mock rules
- execution history detail and capture detail queries
- section lists with filters/search/pagination
- mutation invalidation and refetch behavior

### 8.3 Ephemeral UI State
Keep local component state for view-only concerns:
- unsaved form edits before explicit save/apply
- panel collapse/expand toggles
- selected tabs inside a detail pane
- temporary compare selections
- draft input inside filter controls

### 8.4 Boundary Rule
If state must survive navigation across multiple features, it likely belongs in app state or server state. If state only matters while one panel is open, keep it local.

## 9. Routing Need Level
### 9.1 MVP Recommendation
Use **lightweight client-side routing**, not a route-heavy app from day one.

Recommended minimum route model:
- `/workspace`
- `/captures`
- `/history`
- `/mocks`
- `/environments`
- `/scripts`
- `/settings`

Optional nested identifiers may be added for deep links later, such as:
- `/history/:executionId`
- `/captures/:capturedRequestId`
- `/requests/:requestId`

### 9.2 Why not over-index on routing early?
Many primary interactions are panel and tab changes inside one persistent shell, not full page transitions. The app should not force every editor interaction to become a route decision prematurely.

## 10. Component and Module Boundary Draft
### 10.1 Top-Level Client Structure
Recommended `client/` boundary draft:
- `app/`
  - application bootstrap
  - top-level providers
  - shell layout
  - router setup
- `features/workspace/`
  - collections tree
  - request tabs
  - request detail/editor
- `features/captures/`
  - capture list
  - capture detail inspector
  - replay entrypoints
- `features/history/`
  - history list
  - execution detail
  - test/log/timeline panels
- `features/mocks/`
  - mock list
  - mock rule editor
  - diagnostics views
- `features/environments/`
  - environment list/detail
  - variable and secret metadata editors
- `features/scripts/`
  - script list/detail
  - template browsing
  - capability help surfaces
- `shared/ui/`
  - reusable panels, tabs, tables, badges, layout primitives
- `shared/api/`
  - client DTO bindings and query functions
- `shared/state/`
  - shell/global state stores

### 10.2 App Shell vs Feature Boundary
- `app/` owns layout, providers, and cross-feature shell state.
- `features/*` own user workflows and feature-specific views.
- `shared/*` owns reusable but domain-neutral pieces.
- The shell should not contain request-builder or history-specific business logic.

## 11. SSE and Runtime Update Integration
The frontend must treat runtime streams as first-class inputs.
Recommended pattern:
- keep CRUD/list/detail queries in the standard server-state layer
- maintain SSE subscriptions in a dedicated runtime integration module
- update focused views using event-aware invalidation or lightweight append/update stores
- avoid pushing raw SSE event parsing deep into feature components

This keeps `Captures`, `History`, and execution status updates consistent with T008 without coupling each screen directly to transport concerns.

## 12. Feature Placement Inside the Shell
### 12.1 Script Editor
- live inside request tabs for stage-specific editing
- also available in the `Scripts` feature for reusable script assets and templates
- lazy-load Monaco or equivalent heavy editor dependencies

### 12.2 Request Builder
- lives in the `Workspace` feature
- owns the central work surface for method/URL/body/auth/script/test editing
- connects to shared result panels rather than embedding all diagnostics inline

### 12.3 Capture Inspector
- lives in the `Captures` feature
- reuses shared detail panel patterns for raw request, normalized request, and replay actions

### 12.4 History Panel
- lives in the `History` feature
- should reuse response/log/test/timeline presentation primitives that also appear after direct execution from the request builder

## 13. Testing, DX, and Maintainability Considerations
### 13.1 Why this recommendation is productive
React + Vite + TypeScript gives:
- fast local feedback loops
- straightforward unit/component/integration test setup later
- broad ecosystem support for Monaco, split panels, data tables, and query patterns
- a maintainable path for feature-module separation

### 13.2 Why this recommendation is maintainable
- no forced SSR/server-component model to mentally juggle
- easy mapping between T003 shell concepts and real component boundaries
- easier onboarding for future contributors than a handcrafted vanilla SPA grown from `index.html`

## 14. MVP Recommendation vs Deferred Choices
### 14.1 Recommend Now
- React + Vite + TypeScript
- SPA-style persistent shell
- lightweight client-side routing
- TanStack Query for server state
- Zustand for app-wide client state
- lazy-loaded heavy editors
- shell-first module boundaries under `app/`, `features/`, and `shared/`

### 14.2 Defer for Later
- exact design-system/UI library choice
- exact docking/resizable layout library
- whether desktop wrapping uses Electron or Tauri
- whether advanced route-deep-link behavior is required for every panel
- whether SSR/hybrid rendering is ever needed for non-core screens

## 15. Open Questions
1. Whether the eventual packaged app uses Electron, Tauri, or stays browser-only is **확실하지 않음**.
2. Whether React Router is necessary in MVP or a smaller shell-state approach is enough is **확실하지 않음**.
3. Whether a full component library such as MUI should be used or a lighter/headless mix is **확실하지 않음**.
4. Whether Monaco should be loaded route-level, panel-level, or editor-instance-level is **확실하지 않음**.

## 16. Handoff Notes
### For T011 - Request Builder MVP Design
- assume the request builder lives as a tabbed work surface inside the `Workspace` feature
- detail field-level behavior against the recommended top bar + explorer + work surface + result panel shell

### For T012 - Script Editor and Automation UX Spec
- assume stage-aware script editing exists both in request context and in reusable script management views
- design capability messaging and diagnostics around lazy-loaded heavy editor surfaces

### For T014 - History / Inspector Behavior Spec
- assume `Captures` and `History` remain separate top-level sections inside one persistent shell
- design shared detail/result components so capture replay and execution review feel related without collapsing into one screen too early

### For T017 - Developer Environment and Tooling Baseline
- set tooling expectations around a TypeScript + Vite + React client
- plan linting, test setup, aliasing, and developer scripts around `client/app`, `client/features`, and `client/shared` boundaries
