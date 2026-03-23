# Request Builder MVP

- **Purpose:** Define the MVP product behavior for creating, editing, saving, running, and inspecting requests inside the local-first API workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
- **Related Documents:** `ux-information-architecture.md`, `workspace-flows.md`, `frontend-stack-and-shell.md`, `internal-api-contracts.md`, `persistence-bootstrap.md`, `../tasks/task-011-request-builder-mvp-design.md`
- **Status:** done
- **Update Rule:** Update when MVP scope, request field coverage, or save/run/result boundaries materially change.

## 1. Goal
The request builder is the core MVP work surface. It should let a user:
- create a new request
- edit an existing saved request
- duplicate a request
- save a request into a collection/request group
- run a saved or unsaved request
- inspect response, logs, and tests after execution

This document intentionally defines a constrained MVP rather than a full Postman-equivalent surface.

## 2. MVP Boundary
### In scope
- tabbed request editing inside the `Workspace` feature
- method + URL editing
- query params
- headers
- body editing for a limited MVP set
- basic auth modes needed for common API work
- environment variable resolution for URL/headers/body
- save / duplicate / run / rerun flows
- result panel with response, console summary, tests summary, and execution metadata
- dirty state and unsaved-change handling

### Deferred from MVP
- OAuth2 full authorization flows
- GraphQL-specific editor mode
- advanced cookie management UI
- full multipart asset management workflow
- schema-driven body generation
- request version history / branching UX

## 3. Core Product Principles
1. **Authoring and execution are related but not identical workflows.**
2. **Save and run use different storage lanes.** Saved request definitions go to JSON resource storage; execution outcomes go to SQLite runtime storage.
3. **Unsaved requests are still runnable.** Saving is not required before execution.
4. **The request editor shows intent; the result panel shows observation.**
5. **MVP prioritizes common REST API tasks over exhaustive protocol coverage.**

## 4. Tabbed Work Surface Model
Each open request lives in a work-surface tab.
Recommended tab contents:
- tab label: request name or `Untitled Request`
- dirty-state indicator
- method badge
- close action

Each request tab contains:
- **Request header strip**
  - request name
  - collection/request-group placement summary
  - save / duplicate / run actions
- **Primary editor tabs**
  - Params
  - Headers
  - Body
  - Auth
  - Pre-request Script *(present but detailed UX deferred to T012)*
  - Post-response Script *(present but detailed UX deferred to T012)*
  - Tests *(present but detailed UX deferred to T012)*
- **Result panel tabs**
  - Response
  - Console
  - Tests
  - Execution Info

## 5. Supported MVP Request Fields
### 5.1 Required base fields
- `method`
- `url`

### 5.2 Optional editable fields
- request `name`
- `description`
- `collectionId`
- `requestGroupId`
- query params
- headers
- body
- auth config
- selected script references / inline draft script content
- tags *(optional if cheap; otherwise defer)*

## 6. Field Matrix
| Area | MVP Support | Notes |
| --- | --- | --- |
| Method | GET, POST, PUT, PATCH, DELETE | Enough for common API work |
| URL | full URL with variable placeholders | Required for all runs |
| Query Params | key/value rows with enable toggle | Serialized into URL before run |
| Headers | key/value rows with enable toggle | Duplicate/conflict behavior validated lightly |
| Body: JSON | supported | default rich text/code editing path |
| Body: Text | supported | plain text request bodies |
| Body: x-www-form-urlencoded | supported | key/value table |
| Body: multipart/form-data | limited support | basic key/value/file row concept only; full upload UX deferred |
| Body: binary/raw file | deferred | not MVP |
| GraphQL mode | deferred | not MVP |
| Auth: none | supported | default |
| Auth: bearer token | supported | direct token or variable-backed |
| Auth: basic auth | supported | username/password input |
| Auth: API key | supported | header or query placement |
| Auth: OAuth2 full flow | deferred | not MVP |

## 7. Create / Edit / Duplicate / Save / Run Flows
### 7.1 Create
1. User clicks `New Request`.
2. System opens a new tab with default method `GET` and empty URL.
3. Default title is `Untitled Request` until named or saved.
4. Empty-state guidance prompts entry of URL or selection of collection placement.

### 7.2 Edit
1. User opens a saved request from the collection tree or search results.
2. Request definition loads into a request tab.
3. User changes fields; tab becomes dirty.
4. Run can happen before re-save.

### 7.3 Duplicate
1. User chooses `Duplicate` from request header or list action.
2. System opens a new unsaved tab prefilled with the original request.
3. Name defaults to `Copy of <original name>` until changed.
4. Duplicate remains disconnected from the original until saved as a new resource.

### 7.4 Save
1. User clicks `Save` on a new or dirty request.
2. If the request has no name, the system requires a name before save.
3. New drafts preseed placement to `Saved Requests > General`; users may change that placement before save.
4. Saved definition is written to the resource storage lane.
5. Save success clears dirty state but does not change runtime history.

### 7.5 Run
1. User clicks `Run` from the request header.
2. Current editor state, selected environment, and selected scripts are packaged as execution input.
3. Request is executed even if unsaved.
4. Execution metadata and results are written to the runtime storage lane.
5. Result panel focuses on the latest run.

## 8. Save vs Run Storage Lanes
### 8.1 Save lane
Save persists a **request definition**:
- name
- collection/request-group ownership
- method / URL / params / headers / body / auth definition
- script bindings or editable script references
- description and metadata

Save target:
- JSON resource storage under the workspace resource lane

### 8.2 Run lane
Run persists an **execution observation**:
- execution status
- selected environment reference
- response summary/detail preview
- redacted logs and test results
- execution timestamps and error information

Run target:
- SQLite runtime storage under the runtime artifact lane

### 8.3 UX explanation rule
The UI should explain this difference clearly:
- **Save** updates what the request *is*
- **Run** records what happened when the request *was executed*

## 9. Environment Resolution
### 9.1 Resolution targets
Environment variables apply to:
- URL
- query params
- headers
- body
- auth inputs

### 9.2 MVP behavior
- variable syntax remains the existing template-style convention documented elsewhere
- resolution happens before execution
- request editor can show a resolved preview without exposing secret raw values
- unresolved variables block run only when they affect required execution fields materially

### 9.3 User feedback
- unresolved variables should be flagged near the relevant field and in run validation
- secret-backed variables should be shown as masked/resolved, not printed raw

## 10. Request Detail View vs Execution Result View
### 10.1 Request detail view
The request detail/editor view shows authored intent:
- editable fields
- collection placement
- environment selection
- validation state
- save state / dirty state

### 10.2 Execution result view
The result panel shows runtime observation:
- status code
- response headers/body preview
- redacted console/log summary
- test summary
- duration and timing metadata
- execution errors / cancellation outcome

These views must not be collapsed into one ambiguous surface. The editor is not the source of truth for runtime artifacts.

## 11. Result Panel Scope
### 11.1 Response tab
MVP shows:
- status code
- elapsed time summary
- response headers
- pretty/raw response body preview
- response size if available *(optional if cheap)*

### 11.2 Console tab
MVP shows:
- redacted log lines or structured summaries from execution stages
- warning/error emphasis

### 11.3 Tests tab
MVP shows:
- pass/fail summary
- per-test name and message
- link to script stage context later via T012

### 11.4 Execution Info tab
MVP shows:
- execution id
- environment used
- started/completed timestamps
- cancellation / timeout outcome if relevant

## 12. Validation Rules
### 12.1 Pre-save validation
- request name required for save
- canonical collection/request-group placement required for save, with new drafts defaulting to `Saved Requests > General`
- method required
- URL required

### 12.2 Pre-run validation
- method required
- URL required
- malformed headers blocked
- malformed JSON body blocked when body type is JSON
- unresolved required variables flagged
- unsupported body/auth combinations blocked with clear error

### 12.3 Non-blocking warnings
- duplicate headers may warn but not always block
- empty body on non-GET methods should not automatically block
- auth/body tabs with unused values may warn but still allow save

## 13. Dirty State and Unsaved Changes
### 13.1 Dirty triggers
A request becomes dirty when any authored field changes after the last save or last loaded persisted state.

### 13.2 MVP handling
- dirty indicator on tab label
- save button state changes when dirty
- closing a dirty tab should prompt confirmation
- running a dirty request does not clear dirty state

### 13.3 Unsaved request handling
- unsaved requests may run
- unsaved requests may be duplicated
- unsaved requests cannot be placed in search/index results as saved resources until saved

## 14. Collection / Request Group Placement and Naming
### 14.1 Naming
- new requests default to `Untitled Request`
- first save requires a user-visible name
- duplicate requests should auto-prefix with `Copy of ...`

### 14.2 Placement
- collection and request group are both required in the canonical save model
- new drafts should default to `Saved Requests > General` unless the user changes placement before save
- request header should display current collection/request-group placement once saved

### 14.3 Search / Filter Relationship
- saved requests appear in workspace search and collection tree filters
- unsaved request tabs do not become indexed saved resources
- search can open saved request definitions into tabs; it does not search execution results from inside the request builder itself

## 15. Replay Relationship
Replay should connect to the request builder in two allowed ways:
1. **Open replay as editable request draft**
2. **Run replay immediately**

MVP default remains **확실하지 않음**, but the request builder must support both pathways eventually. T014 should decide which becomes the default primary action.

## 16. Empty State and Error State
### 16.1 Empty states
- new empty request tab prompts URL entry and optional environment selection
- empty result panel explains that output appears after run
- empty body/auth tabs should explain when the current method/body type makes them relevant

### 16.2 Error states
- validation errors should anchor to the field/tab involved
- execution errors should appear in the result panel, not overwrite the authored request definition
- save errors and run errors should be distinct in wording because they affect different storage lanes

## 17. Defer List
- OAuth2 full flow
- GraphQL tab
- binary file body mode
- deep cookie management
- advanced request versioning/history inside the editor
- schema-aware request body helpers
- full multipart asset workflow beyond basic support

## 18. Open Questions
1. The default canonical save placement is now `Saved Requests > General`; future open questions should focus on how users create and manage additional request groups, not whether a default placement exists.
2. Whether replay defaults to `edit first` or `run immediately` is **확실하지 않음**.
3. Whether draft persistence survives app restart automatically in MVP is **확실하지 않음**.
4. Whether multipart support includes real file attachment UX in MVP or only a placeholder/basic row model is **확실하지 않음**.

## 19. Handoff Notes
### For T012 - Script Editor and Automation UX Spec
- use the request builder tab structure and result-panel boundaries from this doc
- keep script tabs stage-aware and clearly distinct from response/result tabs

### For T014 - History / Inspector Behavior Spec
- treat replay as a bridge into the request builder, not a replacement for execution history detail
- keep request editor intent and execution observation distinct when connecting replay/history views

### For Implementation Work
- implement request editor state separately from execution result state
- preserve separate persistence lanes for save (JSON resources) and run (SQLite runtime artifacts)
- keep validation, save errors, and run errors distinct in code and UI

