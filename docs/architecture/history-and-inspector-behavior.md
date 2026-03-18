# T014 History and Inspector Behavior Spec

- **Purpose:** Define the MVP behavior, UX, and information model for Captures, History, detail/timeline surfaces, replay, diff, and runtime diagnostics.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `overview.md`, `domain-model.md`, `shared-schema.md`, `internal-api-contracts.md`, `persistence-strategy.md`, `persistence-bootstrap.md`, `request-builder-mvp.md`, `script-editor-and-automation-ux.md`, `mock-engine-rules-spec.md`, `ux-information-architecture.md`, `workspace-flows.md`, `../tasks/task-014-history-inspector-behavior-spec.md`
- **Status:** done
- **Update Rule:** Update when observation surfaces, replay behavior, diff scope, or runtime detail redaction rules materially change.

## 1. Goal
This document defines how users should inspect runtime activity in MVP so they can:
- browse inbound captured requests and outbound execution history without confusing them
- open detail views that preserve clear boundaries between authored requests and observed runtime outcomes
- replay captured traffic into the request builder
- compare a small set of high-value artifacts through diff views
- diagnose transport, mock, script, test, timeout, cancellation, and blocked outcomes with consistent labels

## 2. MVP Scope
### 2.1 In scope
- separate top-level `Captures` and `History` sections
- list/detail patterns for captured inbound requests and execution histories
- compact timeline sections inside detail views
- replay entry from captures into the request builder
- targeted MVP diff surfaces
- redacted runtime diagnostics for transport, mock, script, and test outcomes
- shared detail primitives across result panels, history detail, and capture detail where useful

### 2.2 Out of scope / deferred
- a fully merged observability platform experience
- deep trace waterfalls for every rule/stage transition
- real-time collaborative annotations on timeline items
- arbitrary saved diff presets across many entities
- full packet-level or HAR-style inspection
- persistent unified timeline as the only primary navigation model

## 3. Observation Model
### 3.1 Core entity relationship
- `CapturedRequest` = inbound runtime observation from the local ingress server
- `ExecutionHistory` = outbound execution event record
- `ExecutionResult` = normalized result and diagnostics linked to an execution
- `TestResult` = assertion outcomes linked to an execution/test stage

### 3.2 Relationship rules
- a capture may optionally link to a matched mock outcome
- a replay action from a capture may create a new execution history entry
- an execution history record points to runtime outputs; it does not become the authored request definition itself
- request builder tabs remain the authoring surface, while Captures/History remain observation surfaces

### 3.3 Boundary rule
Observation views must never silently become editing views. Any transition into editing should be explicit through replay/open actions.

## 4. Captures vs History in MVP
### 4.1 Captures section purpose
`Captures` exists to answer:
- what inbound traffic hit the local server
- which request metadata/body arrived
- whether a mock rule matched
- what can be replayed or converted into further work

### 4.2 History section purpose
`History` exists to answer:
- what outbound executions were run
- what response, tests, logs, and execution timing resulted
- which environment/request snapshot was used
- why a run succeeded, failed, timed out, was cancelled, or was blocked

### 4.3 MVP navigation conclusion
Keep `Captures` and `History` as separate top-level sections in MVP.

Why:
- the source direction is different (inbound vs outbound)
- the primary user questions differ
- this preserves clarity while still allowing shared primitives for detail/timeline views

### 4.4 Unified timeline conclusion
A unified timeline may exist later as an auxiliary or derived view, but it should **not** replace the separate top-level sections in MVP.

## 5. Information Map
| Section | Primary list item | Primary detail object | Main user question |
| --- | --- | --- | --- |
| Captures | captured inbound request | captured request inspector | `What hit my local server?` |
| History | outbound execution entry | execution detail | `What happened when I ran this request?` |
| Request Builder result panel | latest active-tab execution | inline result surface | `What just happened in the request I am editing?` |

## 6. List Surface Design
### 6.1 Capture list
Capture list rows should show:
- method
- path/host summary
- timestamp
- content type/body presence hint
- mock outcome badge (`Mocked`, `Bypassed`, `No rule matched`, `Blocked`) if known
- workspace/global scope cue

### 6.2 History list
History list rows should show:
- request name or ad hoc label
- method + URL/host summary
- execution status
- transport status code if available
- duration/timestamp
- test summary if available
- environment and workspace cue if useful

### 6.3 Sorting defaults
- Captures default sort: newest first
- History default sort: newest first

### 6.4 Search and filter philosophy
Filtering should answer the most common narrowing questions quickly without requiring a separate advanced query builder in MVP.

## 7. Filter / Search Matrix
| Section | MVP filters | Search target | Deferred |
| --- | --- | --- | --- |
| Captures | method, path text, mock outcome, workspace scope, time range | method/path/header/body preview text if indexed cheaply | full body-structure search, saved filter sets |
| History | status, request name/url text, environment, test outcome, time range | request label/url, status metadata | deep response-body full text, complex boolean builder |

### 7.1 Capture scope explanation
Because capture ownership may still be global runtime by default, the UI should clearly expose filters like:
- `All runtime captures`
- `Current workspace only` *(when workspace association exists)*

### 7.2 History scope explanation
History is more naturally workspace-associated, but filters should still make the current workspace/environment context obvious.

## 8. Detail Panel Map
### 8.1 Capture detail panels
Capture detail should show:
- request summary header
- request metadata (method, path, host, time)
- query/headers/body
- mock outcome block
- replay actions
- compact capture timeline

### 8.2 Execution detail panels
Execution detail should show:
- execution summary header
- request snapshot summary
- response panel
- Console tab
- Tests tab
- Execution Info tab
- compact execution timeline

### 8.3 Shared detail primitives
Shared primitives can be reused for:
- raw/pretty body viewers
- key-value metadata sections
- outcome badges
- timeline rows
- diff viewer shell

## 9. Capture Detail Content
### 9.1 Core content
Capture detail must show:
- method, path, host, timestamp
- query params and headers
- raw/parsing-friendly body view if safe
- matched mock rule info if applicable
- mock outcome badge
- workspace/global scope indicator

### 9.2 Mock outcome reuse
Use T013 vocabulary directly in capture detail:
- `Mocked`
- `Bypassed`
- `No rule matched`
- `Blocked`

### 9.3 Transport separation rule
Mock outcome metadata must be shown separately from any transport/fallback response metadata so users do not read `Mocked` as an HTTP status.

## 10. Execution Detail Content
### 10.1 Core content
Execution detail must show:
- request snapshot summary
- transport response status/headers/body preview
- Console summary
- Tests summary
- Execution Info metadata
- timeout/cancellation/blocked status when relevant

### 10.2 Live result vs persisted detail
The UI must explain that persisted history detail may be less detailed than what the user saw during a live run because runtime persistence stores redacted and bounded summaries.

Suggested copy:
- `Saved history shows redacted runtime summaries.`
- `Some live execution details are not persisted in full.`

### 10.3 Request authoring boundary
Execution detail is an observation view. It may link to `Open in request builder` or `Duplicate as request`, but it is not itself the editor.

## 11. Timeline Model
### 11.1 MVP timeline approach
Use compact, human-readable summary timelines inside detail views rather than deep traces.

### 11.2 Capture timeline items
Capture detail timeline may include:
- request received
- mock evaluation outcome summary
- response/fallback summary
- replay created *(if applicable)*

### 11.3 Execution timeline items
Execution detail timeline may include:
- request prepared
- transport completed / failed
- post-response diagnostics summary
- tests completed
- result finalized

### 11.4 Summary-not-trace rule
MVP timelines should prefer final summaries and key diagnostics over full per-rule/per-stage traces.

## 12. Replay UX
### 12.1 Replay role
Replay is a bridge from runtime observation into request authoring/execution. It should help the user continue work, not replace the original detail view.

### 12.2 Replay entry points
Replay should be available from:
- capture list row secondary action *(optional)*
- capture detail primary action
- history detail secondary action for rerun/edit flows later

### 12.3 MVP default
Resolve T011's open question in favor of:
- **default action: `Open replay in request builder`**
- optional future secondary action: `Run replay now`

### 12.4 Why `edit first` wins
- preserves the authoring/observation boundary
- gives users a chance to inspect/adjust before re-execution
- is safer when environments, mock rules, or request context may have changed

### 12.5 Replay + active rule set
Replay should generally run against the **current active system state** when executed later, but the UI must warn that current mock rules, environments, or server behavior may differ from the original capture. Exact historical-preservation behavior remains **확실하지 않음**.

## 13. Diff Scope
### 13.1 MVP diff conclusion
Include only a small set of high-value comparisons in MVP.

### 13.2 Supported diff targets
1. captured request vs replay input draft
2. saved request definition vs executed request snapshot
3. execution request snapshot vs latest editor state *(optional if cheap enough)*

### 13.3 Deferred diff targets
- mocked response vs upstream transport response as a full dedicated diff workflow
- arbitrary execution-to-execution response diff browser
- generalized timeline-event diffing

### 13.4 Diff surface rule
Diff is a contextual secondary view, not a top-level navigation destination.

## 14. Timeline / Diagnostics / Labeling Vocabulary
### 14.1 Outcome families that must stay distinct
The UI should visually distinguish at least these families:
- **source type**: `Capture`, `Execution`
- **mock outcome**: `Mocked`, `Bypassed`, `No rule matched`, `Blocked`
- **transport outcome**: success/failure/status code
- **script diagnostics**: `Console`
- **test diagnostics**: `Tests`
- **execution metadata**: `Execution Info`

### 14.2 Badge strategy
Use different labels/badges/rows rather than collapsing everything into a single generic status chip.

### 14.3 Script diagnostics linkage
History detail should reuse T012 result primitives and labels for:
- `Console`
- `Tests`
- `Execution Info`

But timeline rows should summarize them, not duplicate the full panel content inline.

## 15. Validation, Error, Timeout, Cancellation, and Blocked States
### 15.1 Capture-side states
Capture detail/list should support:
- `Mocked`
- `Bypassed`
- `No rule matched`
- `Blocked`
- generic ingestion/display error notice if capture detail cannot load safely

### 15.2 History-side states
History detail/list should support:
- `Succeeded`
- `Failed`
- `Timed out`
- `Cancelled`
- `Blocked`

### 15.3 Message separation rule
- timeout/cancellation/blocked execution states belong to execution outcome handling
- mock `Blocked` belongs to mock evaluation outcome handling
- test failures belong to `Tests`, not transport failure
- script failures belong to Console/Execution Info, not to raw response status itself

## 16. Empty States and First-Use Guidance
### 16.1 Captures empty state
Show:
- what local server traffic will appear here
- the current monitored endpoint/port if known
- `Learn how capture works` or equivalent short guidance
- optional `Create mock rule` / `Go to Mocks` shortcut

### 16.2 History empty state
Show:
- that executed outbound requests will appear here
- shortcut to open the request builder
- brief explanation that save and run are different actions

### 16.3 First-use guidance
Suggested guidance:
- `Captures shows inbound traffic to your local server.`
- `History shows outbound request executions.`
- `Replay opens a request draft so you can inspect or run it again.`

## 17. Redaction and Persistence Impact
### 17.1 Persisted detail rule
Persisted runtime detail is redacted and bounded by design.

### 17.2 UX implication
Inspector/history views must not imply that persisted entries preserve every live console event, full secret-bearing payload, or unlimited body dump.

### 17.3 Comparison rule
When history detail looks thinner than a just-finished live run, the UI should frame that as an intentional persistence policy rather than a bug.

## 18. State Table
| Surface | Primary states | Notes |
| --- | --- | --- |
| Capture list/detail | Mocked, Bypassed, No rule matched, Blocked | mock outcome family |
| History list/detail | Succeeded, Failed, Timed out, Cancelled, Blocked | execution outcome family |
| Tests panel | pass/fail summary | not transport status |
| Console panel | redacted logs/warnings/errors | not raw response body |
| Execution Info panel | timing/id/environment/status metadata | supports timeout/cancellation clarity |

## 19. Defer List
- fully merged unified timeline as primary navigation
- per-rule detailed evaluation trace viewer
- per-stage detailed execution trace viewer beyond summary timeline
- broad response-to-response diff workflows
- saved multi-entity diff sessions
- advanced body search across all runtime artifacts

## 20. 확실하지 않음
1. Whether a derived unified timeline should appear in MVP as an auxiliary tab remains **확실하지 않음**.
2. Whether replay should always re-evaluate under the current active mock rule set or optionally preserve historical behavior remains **확실하지 않음**.
3. Whether execution-to-execution comparison deserves a second MVP diff target beyond the listed set remains **확실하지 않음**.
4. Whether some capture records become workspace-owned by default or remain primarily global runtime observations remains **확실하지 않음**.
5. Whether some live-only execution events need a dedicated ephemeral inspector separate from persisted history remains **확실하지 않음**.

## 21. Handoff Notes
### 21.1 For Implementation Planning
- keep `Captures` and `History` as separate routes/features while sharing detail viewer primitives
- implement explicit state models for capture outcomes, execution outcomes, script diagnostics, and test outcomes rather than one generic status field in the UI
- treat replay as a navigation bridge into request-builder draft state
- keep diff surfaces contextual and narrowly scoped
- make persistence-policy copy available wherever live detail and persisted detail may diverge

### 21.2 For UI Composition
- `features/captures/` should own capture list/detail and replay entrypoints
- `features/history/` should own history list/detail and reuse Console/Tests/Execution Info primitives
- request builder result panel and history detail should share presentation primitives but not shared state ownership

### 21.3 For Future Work
- if a unified timeline is added later, preserve strong source-type and outcome-type labeling
- if replay historical-preservation mode is added later, present it as an explicit option rather than a hidden default
- if deeper traces are added later, keep them optional drill-downs rather than replacing summary timelines
