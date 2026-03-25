# UX Information Architecture

- **Purpose:** Define the high-level workspace shell, navigation model, screen responsibilities, and visibility rules for the local-first API workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `overview.md`, `shared-schema.md`, `internal-api-contracts.md`, `script-execution-safety-model.md`, `workspace-flows.md`
- **Status:** done
- **Update Rule:** Update when workspace shell, navigation, or summary/detail responsibilities materially change.

## 1. Goals
This document defines how users should understand and navigate the product before visual implementation starts. It focuses on:
- the top-level navigation structure
- the workspace shell and major panels
- where persisted resources vs runtime observations appear
- how search, replay, execution, scripts, mock rules, environments, and first-run guidance fit together

This is an IA document, not a wireframe or component spec. Exact styling, frontend framework choices, and pixel layout remain out of scope.

## 2. UX Principles
1. **Request work stays central.** The product should feel organized around authoring, running, and iterating on requests.
2. **Runtime observation stays visible but separate.** Captures, executions, and mock activity should be easy to inspect without being confused with saved workspace resources.
3. **Summary first, detail on demand.** Lists should remain scannable while rich debugging detail moves into detail panes and tabs.
4. **Workspace scope must be obvious.** Saved collections, requests, environments, scripts, and mock rules belong to a selected workspace.
5. **Global runtime scope must be labeled.** Captured traffic and live runtime activity may exist outside a workspace association and should be shown as such.
6. **Safety constraints should be legible.** Script capabilities, secret masking, and redacted logs must be discoverable in-context.
7. **First-use flow should reduce blank-screen confusion.** Empty states should guide users toward creating a request, selecting a workspace, or enabling capture/mock features.

## 3. Top-Level Navigation Model
### 3.1 Primary Navigation Areas
Recommended top-level navigation for MVP:
1. **Workspace**
   - canonical saved request tree (`Collection > Request Group > Request`)
   - request editor working tabs
   - explicit saved-resource actions separate from tab close
2. **Captures**
   - inbound request list
   - capture detail and replay
3. **History**
   - execution history list
   - result detail, tests, and logs
4. **Mocks**
   - mock rule list
   - rule editor
   - match diagnostics
5. **Environments**
   - environment list
   - variable / secret metadata management
6. **Scripts**
   - saved scripts
   - script templates
   - capability guidance
7. **Settings**
   - runtime diagnostics
   - client-owned interface preferences first
   - future runtime/security/persistence preferences only after separate narrowing

### 3.2 Navigation Rules
- Navigation should preserve the current workspace context whenever possible.
- Runtime-focused areas (`Captures`, `History`) may expose global-local-runtime views, but they should still allow `workspaceId` filtering where available.
- `Workspace` should be the default landing area after first-run setup because it anchors the primary request-authoring workflow.
- `Scripts` can be reachable both as a top-level section and contextually from the request editor.
- `Mocks`, `Captures`, and `History` should support deep-linkable detail views because they are often opened from search results or notifications.

## 4. Workspace Shell
### 4.1 Shell Structure
Recommended shell regions:
- **Global top bar**
  - active workspace selector
  - environment selector
  - global search entry
  - run/stop status indicator
  - quick actions / command palette trigger
- **Left navigation rail**
  - top-level sections: Workspace, Captures, History, Mocks, Environments, Scripts, Settings
- **Secondary sidebar / explorer**
  - section-specific tree or list
  - collection tree, capture list, history list, mock list, etc.
  - in `Workspace`, the explorer remains low-density but does own thin context entrypoints for create, run, rename, and delete actions
- **Primary content area**
  - editor and focused work surface
- **Contextual detail / result panel**
  - response detail, logs, tests, diagnostics, metadata, inspectors
  - first wave keeps the current right-side panel and switches it between single-request output and collection/request-group batch summaries
- **Bottom status region** *(optional in MVP)*
  - connection state, active execution count, sandbox warnings, background tasks
  - informational only in first wave; result/detail rendering stays in the right-side contextual panel rather than a bottom-dock result shell

### 4.2 Panel Responsibility Table
| Region | Primary Responsibility | Typical Content |
| --- | --- | --- |
| Global top bar | high-level context and quick actions | workspace switcher, environment switcher, search, send/run, cancel, connection health |
| Left navigation rail | mode switch | Workspace, Captures, History, Mocks, Environments, Scripts, Settings |
| Secondary sidebar | persisted-tree or list navigation | saved request tree, capture summaries, execution summaries, mock rules |
| Primary content area | focused editing, inspection, and route-local management | request workbench tabs, quick-request drafting, mock editor, environment editor, execution detail |
| Contextual detail panel | detail and diagnostics | response body, headers, logs, tests, match trace, metadata |

## 5. Information Grouping by Scope
### 5.1 Workspace-Scoped Views
These should clearly belong to the selected workspace:
- collections, request groups, saved requests, and separate request working tabs
- environments and variable metadata
- saved scripts and script templates selected for the workspace
- mock rules
- workspace settings

### 5.2 Global Local Runtime Views
These may need to exist even when workspace ownership is missing or partial:
- inbound captures from the local ingress server
- recent execution activity stream
- connection/runtime health indicators

### 5.3 UX Distinction Rules
- Workspace-scoped screens should show the active workspace name in header breadcrumbs or title.
- Global runtime screens should display a clear label such as `Global Local Runtime` or `All Runtime Activity` until ownership is filtered.
- When a runtime record is associated with a workspace, detail views should expose a link back to that workspace resource.
- Mixed-scope screens should visually separate filters like `All runtime` vs `Current workspace only`.

## 6. Screen Map
| Section | Summary View | Detail / Editor View | Key Secondary Panels |
| --- | --- | --- | --- |
| Workspace | recursive collection tree and saved request navigation | request workbench tabs, quick-request drafting, request metadata editor | response panel, batch summary, test panel, logs, resolved variables |
| Captures | capture list with filters | captured request inspector | raw request, matched mock rule, replay configuration |
| History | execution summary list | execution detail | response, tests, console, stage timeline |
| Mocks | rule list and status indicators | mock rule editor | match diagnostics, scenario state, sample response |
| Environments | environment list | environment editor | variable preview, secret metadata, resolution warnings |
| Scripts | script list/template list | script editor detail | capability guide, lint/diagnostic panel, usage references |
| Settings | diagnostics and preference summary cards | bounded settings detail form | runtime-status cards, local interface preferences, data location hints |

## 7. Summary vs Detail View Rules
### 7.1 Summary Views
Summary views should emphasize scanability, filters, and bulk orientation.
Recommended summary content:
- **Request summaries:** name, method, request-group placement, resolved host preview, tags, modified state
- **Capture summaries:** method, path, receivedAt, status/match outcome, workspace badge if any
- **History summaries:** request name, status, duration, startedAt, environment badge
- **Mock rule summaries:** enabled state, matcher preview, priority, last matched time
- **Script summaries:** name, scriptType, last updated, usage count if available

### 7.2 Detail Views
Detail views should expose the full read/edit/debug surface.
Recommended detail content:
- **Request detail:** params, headers, body, auth, scripts, tests, examples, resolved preview
- **Capture detail:** headers, query, raw body, parsed body, matched mock rule, replay action
- **History detail:** execution stages, response detail, logs, test results, structured errors
- **Mock rule detail:** matchers, response definition, delay, scenario behavior, diagnostics
- **Environment detail:** variable list, secret metadata, binding/resolution warnings
- **Script detail:** code, scriptType, capability notes, diagnostics, usage links

## 8. Search, Filter, and Replay Placement
### 8.1 Global Search
Global search should live in the top bar and target:
- requests
- collections
- captures
- execution histories
- mock rules
- scripts

Exact MVP indexing depth is **확실하지 않음**, but global search should at least help users jump between primary artifacts.

### 8.2 Section Filters
- **Workspace:** tags, collection, modified state, request method, favorites
- **Captures:** method, path, content type, status, matched mock rule, workspace scope, time range
- **History:** execution status, environment, request name, duration range, date range
- **Mocks:** enabled state, matcher type, scenario involvement, workspace
- **Scripts:** script type, template/source, usage status

### 8.3 Replay Exposure
Replay should appear in at least two places:
- capture detail view (`Replay as request`)
- history detail view (`Re-run with same input` or `Duplicate into editor`)

Replay should create a new execution or open a prefilled request editor, depending on user intent. The exact default choice is **확실하지 않음** and should be settled in T011/T014.

## 9. Request Builder IA
### 9.1 Request Builder Structure
The request builder should be the main editor inside the `Workspace` section.
Recommended zones:
- request identity header: name, save state, method, URL, canonical placement, and preview/pinned tab state
- execution controls: send, cancel, environment selector, resolved preview
- primary tabs:
  - Params
  - Headers
  - Body
  - Auth
  - Pre-request Script
  - Post-response Script
  - Tests
  - Metadata / Description *(optional in MVP placement)*
- result panel tabs:
  - Response
  - Console
  - Tests
  - Timeline
  - Variables / Resolution Preview

### 9.2 Unsaved vs Saved State
- Unsaved requests should still be runnable.
- Saved requests should display their collection/request-group location.
- A single-click on a saved request may reuse the preview tab; first edit, explicit pin, replay-now, or double-click should promote that work to a pinned tab.
- `Quick Request` should remain session-only until the user explicitly saves it into a collection/request group.
- Dirty state should be visible in working-tab labels or header metadata, not in the persisted tree itself.
- Request draft persistence is **확실하지 않음** as a separate domain artifact, but the UX should plan for autosave/session restore hooks.

## 10. Environment and Secret UX Considerations
- Environment selection should be visible globally while editing or running requests.
- Request detail should expose a `Resolved preview` mode without showing raw secret values.
- Environment editors should distinguish:
  - plain variables
  - masked secret-backed variables
  - unresolved references / missing bindings
- Secrets should never be displayed in list summaries by default.
- When users inspect logs or execution results, any redacted fields should show clear masking cues rather than silently disappearing.

## 11. Empty-State and First-Use Flow
### 11.1 First Launch
Recommended first-use steps:
1. show workspace creation prompt or auto-create a default local workspace
2. explain the two product pillars:
   - saved workspace resources
   - live runtime observation
3. present quick-start actions:
   - create first request
   - start watching captures
   - create first mock rule
   - import request from cURL *(future-ready, may be disabled if not implemented yet)*

### 11.2 Empty States by Section
- **Workspace empty:** invite creation of the first request or collection
- **Captures empty:** explain how inbound capture works and which local URL/port is being monitored
- **History empty:** explain that execution records appear after running requests
- **Mocks empty:** invite creation of a first mock rule with matcher examples
- **Scripts empty:** offer starter templates for each script type
- **Environments empty:** prompt creation of a local environment before variable substitution is used

## 12. Safety and Capability Visibility
The IA should make the T005 safety model visible without turning the product into a security dashboard.
Recommended exposure points:
- script editor side panel or info banner listing allowed capabilities for the selected script type
- execution detail warning when logs/results were redacted
- settings/help text for workspace-level runtime defaults
- clear distinction between editable secret metadata and non-readable secret values

## 13. Open Questions
1. Whether `Captures` and `History` should merge into one timeline by default in MVP is **확실하지 않음**.
2. Whether `Scripts` should be a top-level section in MVP or remain secondary to the request builder is **확실하지 않음**.
3. Whether file/asset browsing needs its own navigation entry is **확실하지 않음**.

## 14. Handoff Notes
- T006 should use this shell breakdown to decide route/state boundaries and whether a multi-pane desktop-style layout is required.
- T011 should turn the request builder section into field-level interaction and validation behavior.
- T012 should turn script-related shell placements into editor panel requirements and capability messaging.
- T014 should decide whether capture/history remain separate top-level screens or gain a unified timeline view.






## 15. Workspace UI V2 First-Wave Bounds
- Keep the explorer visually low-density and recursive instead of layering on split editors or bottom docks.
- Prefer header and tree-context creation flows over a dedicated main-surface CRUD manager.
- Treat collection and request-group run actions as first-class workspace affordances.
- Keep result and diagnostics rendering in the existing right-side panel; do not introduce a bottom-dock result shell in this wave.
- Freeze these non-goals for the first wave: multi-select, drag/drop, type-ahead, tab search, reopen-closed-tab, and inheritance-driven runtime configuration.

## 16. Post-T075 Workspace UI V2 Task Boundaries
- `T076` owns canonical documentation/tracker alignment only and does not ship runtime or UI behavior changes.
- `T077` owns recursive tree and placement contract follow-up: `parentRequestGroupId`, same-collection nesting validation, recursive DTO shape, and empty-subtree delete rules.
- `T078` owns workbench tab and quick-request follow-up: preview-slot reuse policy, pin promotion triggers, session-only quick-request save promotion, and context-seeded creation.
- `T079` owns runnable-container and batch-result follow-up: collection/request-group run orchestration, sequential batch execution DTOs, and right-panel batch result switching.
