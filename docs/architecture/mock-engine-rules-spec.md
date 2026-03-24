# T013 Mock Engine Rules Spec

- **Purpose:** Define the MVP product, UX, and behavior rules for workspace-scoped mock rule authoring, evaluation, response generation, and diagnostics.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `overview.md`, `domain-model.md`, `shared-schema.md`, `internal-api-contracts.md`, `persistence-strategy.md`, `persistence-bootstrap.md`, `ux-information-architecture.md`, `workspace-flows.md`, `request-builder-mvp.md`, `script-editor-and-automation-ux.md`
- **Status:** done
- **Update Rule:** Update when matcher scope, rule priority semantics, diagnostics vocabulary, or response-generation boundaries materially change.

## 1. Goal
This document defines how the MVP mock engine should behave so users can:
- author predictable mock rules in a workspace-scoped `Mocks` feature
- understand which inbound requests are intercepted, bypassed, or unmatched
- inspect which rule matched and why
- avoid confusing mocked responses with normal upstream transport outcomes
- plan future evolution toward richer matching and scenario behaviors without overcommitting MVP

## 2. MVP Scope
### 2.1 In scope
- workspace-scoped mock rule CRUD and enable/disable behavior
- explicit rule priority plus deterministic tie-breakers
- request matching on method, path/URL target, query, headers, and limited body conditions
- response generation with status, headers, body, and fixed delay/latency simulation
- diagnostics for `Mocked`, `Bypassed`, `No rule matched`, and `Blocked`
- capture detail visibility for matched rule and mock outcome
- create/edit flows from the `Mocks` screen and from capture-derived shortcuts

### 2.2 Out of scope / deferred
- full WireMock-style matcher combinator depth
- script-assisted matcher logic
- script-generated dynamic mock responses
- complex scenario state machines
- one-time rule depletion / sequence chaining beyond explicit defer seams
- proxy recording modes or upstream traffic capture-to-mock auto-conversion
- advanced regex authoring UX by default

## 3. Product Principles
1. **Predictability over expressiveness.** MVP mocking should be easy to reason about before it becomes highly programmable.
2. **Workspace scope must be explicit.** Mock rules belong to the selected workspace, not to a hidden global singleton config.
3. **Diagnostics must explain outcome class.** Users must be able to tell whether a request was mocked, bypassed, unmatched, or blocked.
4. **Mock results are not transport results.** Mocked outcomes should be labeled distinctly from real network responses.
5. **Future extension seams are allowed, but not implied.** Scenario state, scripts, and richer matchers remain visible defer seams, not silent promises.

## 4. Legacy Global Mock Config → Workspace-Scoped Rules
### 4.1 Current problem
The legacy product exposes one mutable global mock setting that applies broadly. That model is hard to reason about once multiple requests, workspaces, and capture/history views exist.

### 4.2 MVP explanation rule
The new UX should explain the change in simple product terms:
- `Legacy`: one global mock response setting for all captured requests
- `MVP`: many named mock rules stored in a workspace, each with its own matcher, priority, and response definition

### 4.3 UX wording guidance
Suggested copy:
- `Mock rules belong to the current workspace.`
- `Rules are checked by priority until one matches.`
- `If no enabled rule matches, the request is bypassed or falls back to the workspace/server default behavior.`

This keeps the migration understandable without exposing internal implementation details.

## 5. Relationship to Request Execution, Captures, and Inspector
### 5.1 Inbound captured request relationship
Mock rules apply primarily to **inbound requests handled by the local ingress server**. When a capture is recorded, the detail view should show:
- whether a mock rule matched
- which rule matched
- whether the request was bypassed or unmatched
- what response class was returned

### 5.2 Request builder relationship
The outbound request builder does **not** use the mock engine to replace normal remote transport for ordinary `Run` actions. Instead:
- request builder runs remain outbound executions
- request builder may still target the local mock-enabled server as a normal HTTP destination
- any mocking that occurs there is visible as part of the server response path, not as a special request-builder-only feature

### 5.3 Capture replay relationship
Capture replay is a bridge between captured runtime data and request editing/execution. For MVP, replay should acknowledge that the current active mock rules may influence the replayed inbound/outbound path, but the exact default replay mode remains **확실하지 않음**.

### 5.4 Inspector relationship
T014 should treat mock outcome metadata as a first-class part of capture/history inspection, but not collapse it into ordinary HTTP transport semantics. Mock outcome and transport outcome may coexist in one detail view while remaining labeled separately.

## 6. Mock Rule Authoring UX
### 6.1 Primary surfaces
Users can author mock rules from:
- the top-level `Mocks` screen
- a `Create mock rule from capture` action in capture detail

### 6.2 Basic editor structure
The mock rule editor should use a structured form rather than a code-first surface. MVP sections:
- Rule metadata
- Matchers
- Response
- Delay
- Diagnostics preview / recent matches

### 6.3 Rule metadata section
Show/edit:
- name
- description
- enabled state
- priority
- workspace ownership
- last matched summary *(read-only if available)*

### 6.4 Authoring layout suggestion
| Section | Purpose | MVP inputs |
| --- | --- | --- |
| Metadata | identify and order the rule | name, description, enabled, priority |
| Matchers | define which requests qualify | method, path/URL target, query rows, header rows, body matcher |
| Response | define returned mock payload | status, headers, body mode/body content |
| Delay | simulate latency | none or fixed milliseconds |
| Diagnostics | explain evaluation and recent outcomes | matcher preview, validation, recent hit/miss note |

### 6.5 Why not a code-first authoring model?
A form-first mock editor keeps MVP consistent with the “predictable matcher” direction and avoids promising script/runtime capabilities that T005/T012 explicitly constrain.

## 7. Rule State Model
### 7.1 Canonical MVP states
Use these authored rule states:
- `Enabled`
- `Disabled`

### 7.2 Draft state conclusion
A separate persisted `Draft` state is **not required** in MVP. Unsaved form edits can exist as transient client draft state, but the persisted rule state model remains enabled/disabled only.

### 7.3 Why not persisted draft?
- avoids extra lifecycle complexity before rule evaluation basics are stable
- keeps filtering and status explanation simple
- stays aligned with T011/T012 patterns where editor dirty state does not become a persisted lifecycle state automatically

## 8. Matcher Design
### 8.1 Canonical matcher rule
A rule matches only when **all configured matcher sections** pass.

### 8.2 Method matcher
MVP includes:
- exact method match (`GET`, `POST`, etc.)
- optional `Any method` if the user leaves method unset

### 8.3 URL / path matcher
MVP should focus on path-centric matching because it is easy to explain and stable for a local ingress server.

Recommended supported path modes:
- `Exact path`
- `Path prefix`

Optional but deferred by default:
- regex/pattern mode

If absolute URL/host matching is later needed, it should extend the same matcher group rather than replace the path-first model.

### 8.4 Query matcher
Support row-based query conditions with predictable operators:
- key exists
- exact value equals
- contains *(string contains)*

Rows combine with AND.

### 8.5 Header matcher
Support row-based header conditions with predictable operators:
- key exists
- exact value equals
- contains *(string contains)*

Header-name matching should be case-insensitive in evaluation, even if displayed in user-entered casing.

### 8.6 Body matcher
MVP body matching should remain shallow and explicit. Recommended starting modes:
- `No body condition`
- `Exact text equals`
- `Contains text`
- `Exact JSON subset` is **확실하지 않음** and should only be added if implementation cost stays low

### 8.7 Advanced matcher conclusion
Script-assisted matcher logic, arbitrary code predicates, or general regex composition should be deferred. They would widen the capability surface and make mock evaluation much less predictable for MVP.

### 8.8 Matcher matrix
| Area | MVP support | Deferred / not promised |
| --- | --- | --- |
| Method | exact, any | custom method groups |
| Path | exact, prefix | regex-first authoring, full URL templating |
| Query | exists, exact equals, contains | numeric comparisons, nested object operators |
| Headers | exists, exact equals, contains | advanced normalization presets |
| Body | none, exact text, contains text | full JSONPath, XPath, code predicates |
| Script matcher | no | deferred |

## 9. Match Priority and Tie-Breakers
### 9.1 Canonical rule
Use **explicit numeric priority** as the primary ordering mechanism.

### 9.2 Why priority over declaration order?
Priority is more legible in list UIs, easier to sort/filter, and less fragile than relying on the accidental order of creation or drag position alone.

### 9.3 Recommended ordering algorithm
1. consider enabled rules only
2. sort by priority descending *(higher number wins)*
3. if tied, prefer more specific matcher count *(more configured matcher conditions wins)*
4. if still tied, prefer older stable creation order or lower sort key for deterministic results

### 9.4 UX explanation
The list UI should explain:
- `Higher priority rules are checked first.`
- `If priorities tie, the more specific rule wins.`
- `If still tied, a stable internal order resolves the match.`

### 9.5 Rule list view support
The mock list should expose:
- priority column/badge
- enabled badge
- matcher preview
- last matched time/status if available

## 10. Delay / Latency Simulation
### 10.1 MVP scope
MVP supports:
- no delay
- fixed delay in milliseconds

### 10.2 Deferred delay behavior
Do not include in MVP:
- randomized delay ranges
- percentile/variance modeling
- bandwidth throttling
- streaming/chunk pacing controls

### 10.3 UX guidance
Delay should be described as simulated server wait time for mocked responses, not network quality emulation.

## 11. Response Generation Scope
### 11.1 Supported response types
MVP supports:
- static response status
- static response headers
- static response body
- light templated response content only if it reuses already-canonical safe variable mechanisms

### 11.2 Templated response boundary
If templating is used, it should stay narrow and documentation-first:
- simple placeholder substitution from safe request metadata or workspace variables
- no arbitrary code execution
- no hidden access to unsafe runtime capabilities

### 11.3 Script-assisted response conclusion
Script-assisted response generation should be deferred in MVP. It would overlap with T005 sandbox policy and T012 capability messaging before the mock surface has a stable safety model.

### 11.4 Response body modes
Recommended MVP body modes:
- plain text
- JSON text
- empty body

Binary/file-oriented mock body workflows are deferred.

## 12. Scenario State, Sequence, and One-Time Rules
### 12.1 MVP conclusion
Scenario state is **deferred** as a functional feature, but the data model and diagnostics language should leave a seam for it.

### 12.2 Why defer?
- it adds hidden statefulness that makes rule evaluation harder to explain
- it creates persistence/runtime questions not yet resolved in T004/T009
- it increases testing complexity before simple matcher behavior is stable

### 12.3 Future seam
Leave room in the schema and editor for future additions such as:
- sequence position
- one-time exhaustion
- named scenario state transitions

But do not promise them in MVP behavior or UI copy.

## 13. Outcome Vocabulary and Labeling
### 13.1 Canonical outcome labels
Use these outcome labels consistently:
- `Mocked`
- `Bypassed`
- `No rule matched`
- `Blocked`

### 13.2 Meanings
- `Mocked` = an enabled rule matched and generated the response
- `Bypassed` = the request was allowed to continue without a mock response under the configured fallback path
- `No rule matched` = evaluation completed and nothing matched
- `Blocked` = evaluation could not complete or a response could not be produced due to unsupported/invalid state

### 13.3 Why this matters
These labels keep mock outcomes distinct from HTTP status or upstream transport success/failure.

## 14. Capture and Mock Hit Diagnostics
### 14.1 Where diagnostics appear
Mock diagnostics should appear in:
- capture summary rows *(lightweight badge only)*
- capture detail *(full match outcome + matched rule detail)*
- mock rule detail *(recent matches / last hit summary)*
- future history/timeline views via T014

### 14.2 Capture summary expectations
Each captured request row may show a small outcome badge:
- `Mocked`
- `Bypassed`
- `No rule matched`
- `Blocked`

### 14.3 Capture detail expectations
Show:
- matched rule name/id if applicable
- evaluated outcome label
- response source label (`Mock response` vs `Fallback / upstream response`)
- fixed delay applied if any
- rule priority used
- short diagnostic note if matching failed or was blocked

### 14.4 Mock rule detail expectations
Show:
- matcher preview
- response summary
- last matched timestamp
- last matched request path/method summary *(redacted as needed)*
- recent outcome snippet if available

## 15. Mock Outcome vs Real Transport UX Separation
### 15.1 Labeling rule
The UI should clearly distinguish:
- **Mock response** = generated by local mock rule engine
- **Transport response** = came from actual upstream/network transport

### 15.2 Badge examples
- `Mocked`
- `Upstream`
- `Bypassed`
- `No rule matched`

### 15.3 Detail-view copy examples
- `Returned by mock rule "Auth error stub".`
- `No mock rule matched; request followed fallback behavior.`
- `Mock evaluation was blocked before a response could be generated.`

### 15.4 Timeline distinction
If T014 introduces a unified timeline, mock events should still keep a distinct source label so they are not read as ordinary remote-response events.

## 16. Validation, Error, Blocked, and Unsupported States
### 16.1 Authoring validation
The mock editor should validate before save/enable:
- name required
- at least one meaningful matcher strongly recommended
- response status required
- duplicate/contradictory matcher rows flagged
- invalid delay value blocked

### 16.2 Unsupported state messaging
When a user attempts a deferred feature, the UI should say so directly, for example:
- `Advanced regex matching is not available in MVP.`
- `Script-based mock responses are not available in MVP.`
- `Scenario state transitions are planned later and are not enabled yet.`

### 16.3 Blocked state usage
Use `Blocked` when rule evaluation or response generation cannot proceed safely, such as:
- invalid persisted rule state
- unsupported response/body mode at runtime
- future policy denial if a deferred dynamic feature is somehow referenced

### 16.4 Error visibility
- authoring/configuration errors belong in the mock editor
- runtime mock evaluation failures belong in capture detail and diagnostics surfaces
- transport/upstream failures must not be relabeled as mock failures

## 17. Empty States and First-Use Guidance
### 17.1 Mocks empty state
When no mock rules exist, show:
- a short explanation of what mock rules do
- `Create first mock rule`
- `Create from capture`
- examples of simple path/method rules

### 17.2 First-use guidance
Suggested callout:
- `Mock rules intercept inbound requests handled by your local server.`
- `Rules are checked by priority until one matches.`
- `Start with method + path matching for the most predictable behavior.`

### 17.3 No diagnostics yet state
If a rule exists but has never matched, show:
- `No requests have matched this rule yet.`
- `Use Captures to inspect live requests and refine matchers.`

## 18. Persistence and Redaction Impact
### 18.1 Authored rules
Mock rules are user-authored resources and should follow the workspace resource persistence lane.

### 18.2 Runtime diagnostics
Mock hit/miss diagnostics are runtime observations and should follow runtime persistence rules.

### 18.3 Redaction rule
Persist diagnostics in a redacted summary form only:
- safe request metadata summary
- matched rule id/name
- outcome label
- delay applied
- bounded response preview if safe

Do not persist raw secret-bearing request bodies or unsafe full payload dumps simply to support mock debugging.

### 18.4 Why this matters
This keeps T013 aligned with T005/T009: authored resources remain durable, while runtime observations remain queryable but redacted and bounded.

## 19. State Table
| State | Meaning | Where visible |
| --- | --- | --- |
| Enabled | rule participates in evaluation | mock list, rule detail |
| Disabled | rule is persisted but skipped | mock list, rule detail |
| Mocked | matched and generated response | capture summary/detail, future history |
| Bypassed | request continued without mock response | capture summary/detail |
| No rule matched | evaluation completed with no winner | capture summary/detail |
| Blocked | evaluation/response generation could not safely complete | capture detail, diagnostics |

## 20. Defer List
- regex-first matcher builder
- script-assisted matcher logic
- script-generated mock responses
- scenario state transitions and sequence stepping
- one-time rule exhaustion semantics
- random delay ranges / bandwidth shaping
- binary/file-backed mock bodies
- proxy/record mode and automatic mock generation

## 21. 확실하지 않음
1. Whether MVP body matching includes lightweight JSON-subset semantics is **확실하지 않음**.
2. Whether capture replay should preserve historical mock mode or re-evaluate against the active current rule set is **확실하지 않음**.
3. Whether unmatched requests should always be labeled `Bypassed` or whether `No rule matched` and fallback behavior deserve two separately visible states in every surface is **확실하지 않음**.
4. Whether future timeline views should surface per-rule evaluation traces or only final outcome summaries is **확실하지 않음**.
5. Whether scenario state eventually becomes a runtime artifact, an authored resource extension, or both is **확실하지 않음**.

## 22. Handoff Notes
### 22.1 For T014 - History / Inspector Behavior Spec
- reuse the canonical mock outcome labels from this document in capture/history views
- keep mock outcome metadata visually distinct from transport success/failure metadata
- decide how unified timeline views show `Mocked`, `Bypassed`, and `No rule matched` without collapsing them into generic status chips
- clarify replay defaults when historical captures intersect with currently active rule sets

### 22.2 For Implementation Planning
- model `MockRule` as a workspace-authored resource with explicit enable flag and numeric priority
- implement deterministic evaluation order: enabled filter → priority sort → specificity tie-breaker → stable fallback order
- separate authored rule persistence from runtime diagnostics persistence
- keep diagnostics storage redacted and bounded
- reserve schema seams for future scenario state without making it MVP behavior

### 22.3 For UI Implementation
- build the rule editor as a structured form, not a script/code surface
- expose clear outcome badges in capture summaries and details
- allow creation from both the `Mocks` screen and capture-derived shortcuts
- keep unsupported advanced features visible only as deferred/help text, not interactive promises
