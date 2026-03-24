# PRD Overview and Delivery Preparation Summary

- **Purpose:** Reframe the upgrade PRD into an execution-ready summary for planning and task tracking.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
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
- Backend is a single Express server.
- Frontend is a single HTML page with inline scripts.
- Captured inbound requests are streamed via SSE.
- Mock response behavior is globally configured, not endpoint-specific.
- A server-side JavaScript callback runner executes user code in a VM sandbox.
- Request templates are hard-coded in the frontend rather than stored as user-managed resources.

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
- Current codebase is extremely small and monolithic.
- There is no established frontend framework, storage layer, or test framework yet.
- Current script execution model grants powerful local capabilities but requires security redesign.
- The PRD mentions VS Code-like intelligence, but exact acceptable implementation level is **확실하지 않음**.

## 7. Assumptions
1. The product remains a locally run developer tool rather than a hosted service.
2. A significant refactor is acceptable if it improves maintainability and enables the roadmap.
3. Initial persistence may use local file storage or SQLite; final storage choice is not yet fixed.
4. Monaco Editor or equivalent is acceptable for the “JS editor like VS Code” requirement.
5. Team values delivery readiness and architecture clarity before large-scale implementation.

## 8. Open Questions
1. Preferred long-term frontend stack is **확실하지 않음**.
2. Preferred persistence layer (JSON files vs SQLite) is **확실하지 않음**.
3. Expected operating systems and packaging strategy (plain Node app vs desktop wrapper) are **확실하지 않음**.
4. Exact security posture for script execution and file system access is **확실하지 않음**.
5. Whether Postman collection compatibility is MVP or post-MVP is **확실하지 않음**.
6. Whether inbound and outbound request histories must share a unified timeline in MVP is **확실하지 않음**.

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

