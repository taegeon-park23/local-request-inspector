# T001 Architecture Overview

- **Purpose:** Define the target architecture, module boundaries, responsibilities, data flow, and security boundaries for evolving Local Request Inspector into a local-first API workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `../prd/overview.md`, `domain-model.md`, `migration-plan.md`, `../tasks/task-001-foundation-architecture.md`
- **Status:** done
- **Update Rule:** Update when architecture decisions, open questions, or module boundaries materially change.

## 1. Goal
The target system should evolve from the current single-file Express + single-page HTML prototype into a modular local-first application that supports:
- inbound request capture and inspection
- outbound API request authoring and execution
- reusable workspaces, collections, templates, and environments
- scriptable pre-request / post-response / test execution
- endpoint-based mock simulation
- durable history and developer-friendly debugging

This document intentionally avoids overcommitting on implementation framework choices when evidence is insufficient. Any unconfirmed decision is marked **확실하지 않음**.

## 2. Current-State Findings From Codebase
### 2.1 Backend Structure Today
Current backend is a single `server.js` file with mixed responsibilities:
- static asset serving
- SSE connection management (`/events`)
- raw body capture middleware
- global mock configuration mutation (`/__inspector/mock`)
- asset metadata listing (`/__inspector/assets`)
- outbound request execution (`/__inspector/execute`)
- VM-based callback execution
- wildcard request capture and response generation

### 2.2 Frontend Structure Today
Current frontend is a single `public/index.html` page with:
- layout, styles, markup, and application logic in one file
- Materialize CSS + Ace Editor loaded from CDN
- a capture list panel
- a global mock settings form
- a request form + callback editor + execution log area
- hard-coded script templates and DOM-driven state management

### 2.3 Current Capture / Mock / Script Patterns
- **Inbound capture:** all non-inspector routes pass through a wildcard handler, which pushes request snapshots over SSE to connected clients.
- **Mocking:** one mutable global `mockConfig` object determines the same response for all captured routes.
- **Script execution:** the server executes user-provided callback code via `vm.runInContext`, exposing `fetch`, `fs.promises`, `path`, `Blob`, `FormData`, `URLSearchParams`, and `response`.

## 3. Architectural Direction
### 3.1 Proposed Top-Level Runtime Shape
The future application should be organized into five logical layers:

1. **Client Workspace UI**
   - request editor, collections tree, history explorer, capture inspector, mock rule editor, environment manager, script editor
2. **Application API Layer**
   - HTTP/SSE API consumed by the workspace UI for CRUD, execution, streaming, and diagnostics
3. **Core Domain Services**
   - request execution, capture pipeline, mock rule evaluation, template management, environment resolution, history persistence
4. **Sandbox / Execution Runtime**
   - isolated runner for pre-request, post-response, and test scripts with explicit limits
5. **Persistence Layer**
   - local storage for workspaces, collections, environments, mock rules, history, templates, and settings

### 3.2 Proposed Repository-Level Module Boundaries
This is a target module layout, not yet a committed stack implementation:

- `client/`
  - workspace shell
  - editors / viewers
  - feature modules for requests, history, environments, mocks, captures, scripts
- `server/`
  - routes/controllers
  - event streaming
  - request execution adapters
  - mock handling entrypoints
- `core/`
  - domain models
  - use cases / services
  - validation and policy logic
- `sandbox/`
  - isolated script execution runtime and policies
- `storage/`
  - repositories and serialization adapters
- `shared/`
  - cross-layer DTOs, schemas, and type definitions
- `docs/architecture/`
  - ongoing design records

### 3.3 Responsibility Separation
#### Client Workspace UI
- render and edit persisted resources
- display execution results, captures, diffs, and logs
- invoke APIs without embedding business rules that belong in domain services
- manage transient UI state only

#### Application API Layer
- receive validated commands and queries from UI
- stream capture/execution updates
- translate domain errors into stable API responses
- avoid direct persistence logic in route handlers where possible

#### Core Domain Services
- own request lifecycle orchestration
- resolve environment variables and templates
- apply mock matching logic
- map execution outputs into history records
- normalize inbound captured requests

#### Sandbox / Execution Runtime
- run user scripts with explicit input/output contracts
- enforce timeout, capability, and resource limits
- return structured logs, errors, and test results

#### Persistence Layer
- store durable user-managed data and execution snapshots
- support local-first offline behavior
- remain swappable enough to enable T004 storage decision work

## 4. Target Capability Modules
### 4.1 Capture Module
Responsibilities:
- subscribe UI to inbound captured request events
- normalize request data from actual HTTP requests
- optionally persist selected or all captures
- support replay/export hooks later

Keep from current system:
- SSE-based streaming can remain as an early transport because it already fits one-way capture updates.

Likely replace / refactor:
- global in-memory client list ownership should move to a dedicated event-stream service
- wildcard route should emit structured `CapturedRequest` records rather than anonymous ad hoc objects

### 4.2 Request Execution Module
Responsibilities:
- execute outbound HTTP requests from saved or unsaved request definitions
- apply environment resolution, auth injection, serialization rules, and timeout/cancellation policies
- emit structured `ExecutionHistory` / `ExecutionResult`

Keep from current system:
- native Node `fetch` is a viable baseline execution primitive for HTTP requests.

Likely replace / refactor:
- direct route-level execution logic in `/__inspector/execute`
- ad hoc body conversion logic embedded in controller code

### 4.3 Mock Engine Module
Responsibilities:
- evaluate inbound requests against ordered mock rules
- return endpoint-specific responses with optional delay and scenario state
- surface match diagnostics to UI/history

Keep from current system:
- the idea of responding directly from the local server stays valid.

Likely replace / refactor:
- single mutable `mockConfig`
- one-size-fits-all response behavior

### 4.4 Script Automation Module
Responsibilities:
- support `pre-request`, `post-response`, and `test` script kinds
- provide controlled runtime context (`request`, `response`, `env`, `console`, etc.)
- return structured log/test outputs

Keep from current system:
- JavaScript as the user automation language is still aligned with the PRD.

Likely replace / refactor:
- running arbitrary callback code directly inside the main server process
- exposing `fs.promises` and path access without a policy layer

### 4.5 Workspace / Resource Management Module
Responsibilities:
- CRUD for workspaces, collections, folders, requests, environments, templates, and settings
- indexing for list/search/filter operations
- import/export hooks

Current gap:
- no persistence or managed resource model exists today

## 5. Proposed Data Flow
### 5.1 Inbound Request Flow
1. Incoming HTTP request reaches local server.
2. Capture middleware / ingress service normalizes request data.
3. Mock engine checks for matching `MockRule`.
4. Capture event is published to stream and optionally persisted.
5. Matching response is returned, or fallback response policy is applied.
6. UI receives event through SSE (or later alternative transport if needed).

### 5.2 Outbound Execution Flow
1. User selects or edits a `Request` in the workspace UI.
2. Environment and template variables are resolved.
3. Optional `pre-request` script runs in sandbox.
4. Request executor sends HTTP request.
5. Response is normalized into `ExecutionResult`.
6. Optional `post-response` script runs.
7. Optional `test` script evaluates assertions.
8. `ExecutionHistory` record is persisted and streamed back to the UI.

### 5.3 Saved Resource Flow
1. User creates/updates a workspace resource.
2. API layer validates incoming payloads against shared schemas.
3. Domain service applies naming, reference, and ownership rules.
4. Persistence layer stores the updated resource.
5. UI receives success response and refreshes indexed views.

## 6. Security Boundaries
### 6.1 Boundary A — UI vs Application API
- The client should never be the source of truth for execution policy.
- Validation should happen on the server/application side before persistence or execution.

### 6.2 Boundary B — Application API vs Sandbox Runtime
- User scripts should not execute inside general route/controller context long-term.
- Sandbox runner should be isolated with explicit capabilities and timeout.
- File system and outbound network access policies remain **확실하지 않음** and require follow-up in T005.

### 6.3 Boundary C — Domain Services vs Persistence
- Repository interfaces should hide file/DB implementation details.
- Domain objects should not depend directly on storage engine details.

### 6.4 Boundary D — Capture/Mock Ingress vs Saved Workspace Data
- Live inbound traffic should be separated from persisted user-authored resources.
- `CapturedRequest` should not be treated as the same entity as a saved `Request`, though conversion/import between them should be possible later.

## 7. What Can Be Preserved vs Replaced
### 7.1 Preserve Candidates
- Express as a temporary host runtime is acceptable for early phases.
- SSE is acceptable for near-term inbound capture streaming.
- Node `fetch` can remain the HTTP execution baseline.
- The current focus on local-first, server-driven execution remains valid.

### 7.2 Replace / Re-architect Candidates
- single-file backend organization
- single-file frontend organization
- hard-coded script templates in UI source
- global mock configuration object
- direct VM execution in the server process
- untyped ad hoc request/capture/result payloads
- DOM-string-based rendering for request history cards

## 8. Architectural Assumptions
1. The application remains local-first and primarily single-user.
2. Saved resources must survive restarts.
3. Workspace resources and execution history should be queryable independently.
4. The architecture should allow phased migration instead of a big-bang rewrite.
5. Frontend framework choice is deferred to T006.

## 9. Open Questions
1. Persistence implementation (JSON, SQLite, hybrid) is **확실하지 않음**.
2. Whether the UI stays browser-only or becomes desktop-packaged is **확실하지 않음**.
3. Exact sandbox isolation mechanism (worker, child process, vm2-like alternative, etc.) is **확실하지 않음**.
4. Whether execution history and captured requests share one physical store is **확실하지 않음**.
5. Whether SSE remains sufficient once richer bi-directional execution telemetry is added is **확실하지 않음**.

## 10. T001 Outputs That Feed Later Tasks
- **T003:** use module boundaries and flows to define information architecture and workspace layout.
- **T004:** use persistence boundary and entity list to decide storage strategy.
- **T005:** use security boundary and execution flow sections to specify sandbox policy.
- **T006:** use client/server layering and phased migration direction to choose frontend shell strategy.
- **T007:** use the domain module breakdown and entity list to finalize canonical schemas.
- **T008:** use the data flow and boundary definitions to derive stable internal APIs.
