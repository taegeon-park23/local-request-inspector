# PRD Overview and Delivery Preparation Summary

- **Purpose:** Reframe the upgrade PRD into an execution-ready summary for planning and task tracking.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Update Rule:** Update when product scope, assumptions, or major sequencing decisions change.

## 1. PRD Purpose
Transform the current local request inspector into a **local-first API workbench** with Postman-like capabilities. The new product direction combines:
- inbound request monitoring
- outbound API request authoring and execution
- request/response automation via JavaScript scripts
- template, collection, and environment management
- mock API simulation
- debugging, history, and workflow productivity features

## 2. Current Product Context
Based on the current repository state:
- Backend is still hosted by a single Express server, but server route registration and runtime seams are now being split into bounded modules under `server/`.
- Frontend now includes a React + Vite + TypeScript app shell served at `/app`, while the legacy `/` route remains as a bounded fallback/prototype lane.
- Captured inbound requests and execution history are persisted through the runtime storage lane and streamed/invalidated through SSE.
- Mock response behavior is endpoint-oriented and persisted as user-managed mock rules rather than one global in-memory toggle.
- Script execution now runs through a bounded child-process runner contract, with worker-thread fallback only for spawn-restricted sandbox environments.
- Requests, collections, request groups, environments, scripts, and mock rules are stored as user-managed resources rather than hard-coded frontend-only artifacts.

## 3. Scope Summary
### In Scope
- Workspace-style API client UX
- Request collections, request groups, and templates
- Environment variable and secret handling
- Smarter JavaScript editing and execution workflow
- History, search, and request replay
- Endpoint-level mock rules
- Import/export foundation for reusable assets

### Out of Scope for Initial Planning / MVP
- Real-time multi-user collaboration
- Cloud-hosted SaaS platform
- Distributed load/performance testing
- Full enterprise auth platform integration

## 4. Core Functional Themes
### A. API Client Workspace
- request editing tabs
- saved request trees with collections and request groups
- auth, params, headers, cookies, body editing
- response viewer, execution history, and a clear separation between persisted request trees and open working tabs

### B. Automation / Script Engine
- pre-request scripts
- post-response scripts
- test scripts
- editor intelligence, logs, and safe execution constraints

### C. Monitoring / Inspector
- inbound request capture
- filtering, search, replay, diff, and event timeline

### D. Mocking
- endpoint-based mock rules
- conditional matching
- delays, scenario state, and response templates

### E. Reusability
- request templates
- script templates
- environment variables
- import/export and future OpenAPI/cURL ingestion

## 5. Non-Functional Requirements
- local-first usage
- modular architecture
- explicit security boundaries for script execution
- persistence for user-managed artifacts
- clear traceability between product scope and engineering work
- resilience for long-running sessions and captured request streams

## 6. Constraints and Known Realities
- `server.js` is still too large even after the ongoing decomposition work, so modularization remains an active delivery concern.
- The codebase now has an established React + Vite + TypeScript client shell and a hybrid persistence baseline, but build/UI verification is still partially sandbox-limited inside Codex.
- Script execution safety has improved materially, but the final capability breadth and UX policy still require explicit documentation follow-up.
- The PRD mentions VS Code-like intelligence, but exact acceptable implementation level is **확실하지 않음**.

## 7. Assumptions
1. The product remains a locally run developer tool rather than a hosted service.
2. A significant refactor is acceptable if it improves maintainability and enables the roadmap.
3. The current persistence baseline is hybrid: authored resources live in local JSON storage and runtime observations live in SQLite-backed runtime storage.
4. Monaco Editor or equivalent is acceptable for the “JS editor like VS Code” requirement.
5. Team values delivery readiness and architecture clarity before large-scale implementation.

## 8. Open Questions
1. Expected operating systems and packaging strategy beyond the current Node server + browser shell baseline (plain Node app vs desktop wrapper) are **확실하지 않음**.
2. The final breadth of script-execution capabilities beyond the current bounded runner contract remains **확실하지 않음**.
3. Whether Postman/OpenAPI/cURL compatibility is MVP or post-MVP remains **확실하지 않음**; the currently implemented transfer baseline is the proprietary authored-resource bundle flow.
4. Whether inbound and outbound request histories must share a unified timeline in MVP remains **확실하지 않음**.

## 9. Planning Implications
The first implementation work should not start with UI polish or feature expansion. The most leveraged first step is to define the target architecture and domain model boundaries because they influence:
- storage choices
- API contracts
- frontend refactor strategy
- script execution safety model
- mock engine design
- history and tracking model

## 10. Readiness Outcome
This PRD summary should be treated as the upstream planning source for all task documents and backlog prioritization.


## 11. Workspace UI V2 Canon After T075
The accepted Workspace UI V2 direction is now staged as a post-`T075` sequence rather than a one-shot shell rewrite.

### Canonical First-Wave UX
- The saved-request explorer is a low-density recursive tree: `Collection > Request Group > nested Request Group > Request`.
- Saved requests open into tab-based authoring with one reusable preview slot plus pinned tabs for durable work.
- `Quick Request` is a session-only tab type that is runnable and editable but not persisted or bundled until explicitly saved as a normal request.
- Create entrypoints move to the workspace header and explorer context surfaces; rename/delete flows are dialog/context driven rather than centered on a main-surface CRUD manager.
- Collection and request-group runs are first-class workspace actions and reuse the existing right-side result panel for batch summaries.

### First-Wave Non-Goals
- no split editors or bottom-dock result shell swap
- no multi-select, drag/drop, or type-ahead tree management
- no tab search or reopen-closed-tab workflow
- no collection/request-group inheritance for auth, variables, or scripts in this wave
- no server-owned `QuickRequest` DTO; quick requests remain client-owned session state