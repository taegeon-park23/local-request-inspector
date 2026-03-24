# T016 Testing and QA Strategy

- **Purpose:** Define a realistic MVP testing strategy, QA ownership model, and regression guard set for the Local API Workbench implementation.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `overview.md`, `script-execution-safety-model.md`, `internal-api-contracts.md`, `persistence-bootstrap.md`, `request-builder-mvp.md`, `script-editor-and-automation-ux.md`, `mock-engine-rules-spec.md`, `history-and-inspector-behavior.md`, `frontend-stack-and-shell.md`
- **Status:** done
- **Update Rule:** Update when verification scope, risk priorities, or accepted MVP regression guards materially change.

## 1. Goal
This document defines how the MVP should be verified so the team can:
- choose the smallest useful automated test set for high-risk behavior
- preserve traceability between planning decisions and verification obligations
- keep request authoring, runtime observation, mock behavior, and script execution policies from regressing silently
- balance automated coverage with targeted manual QA in a practical local-first workflow

## 2. Strategy Principles
1. **Prefer layered verification over E2E-only coverage.** Most MVP confidence should come from contract, integration, and component tests.
2. **Test policy boundaries explicitly.** Redaction, capability denial, timeout, cancellation, and blocked states need direct verification.
3. **Protect vocabulary and state separation.** UI labels and state ownership must reflect the product terms already defined in T011-T014.
4. **Treat persistence policy as behavior.** Differences between live runtime detail and persisted history detail are valid only when they match documented policy.
5. **Keep smoke coverage small but meaningful.** A few end-to-end-style flows should prove the app hangs together without becoming the primary safety net.

## 3. MVP Test Layers
### 3.1 Unit tests
Use for:
- pure validation logic
- matcher evaluation helpers
- priority ordering helpers
- redaction/normalization helpers
- DTO/state mapping utilities

### 3.2 Integration tests
Use for:
- API/controller-to-service-to-storage flows
- sandbox runner policy behavior
- persistence lane separation
- replay command creation
- SSE/event-to-persistence consistency checks

### 3.3 Contract tests
Use for:
- request/response envelope shapes against T008
- execution status/event vocabulary
- redacted field expectations
- mock outcome vocabulary and DTO consistency

### 3.4 Component/UI tests
Use for:
- request builder tab/result behavior
- script editor diagnostics presentation
- mock rule editor validation and labeling
- captures/history list-detail composition
- replay/diff entrypoint visibility and wording

### 3.5 Smoke / scenario tests
Use for a very small set of end-to-end-style workflows that prove:
- the app boots
- request authoring can run
- capture/mock/history paths connect
- critical outcomes appear with correct labels

## 4. Coverage Map by Feature Family
| Feature family | Primary layers | Why |
| --- | --- | --- |
| Request builder | component, integration, smoke | mixed UI state + execution handoff |
| Script execution safety | unit, integration, contract | policy-heavy, redaction-heavy |
| Mock engine | unit, integration, component | deterministic matcher/order + visible diagnostics |
| History / inspector | component, integration, smoke | list/detail/timeline/replay composition |
| Persistence lanes | integration, contract | storage split and redacted summaries |
| SSE/runtime events | integration, contract | drift risk between live and persisted views |

## 5. Traceability Map from Prior Tasks
| Upstream task/doc | Verification obligation |
| --- | --- |
| T005 safety model | capability denial, timeout, cancellation, redaction, bounded persistence |
| T008 internal contracts | DTO/event/status drift checks |
| T011 request builder | authoring-vs-result separation, validation, save/run lane behavior |
| T012 script UX | stage labels, Console/Tests/Execution Info linkage, warning wording |
| T013 mock engine | matcher semantics, priority, mock outcome badges, diagnostics wording |
| T014 history/inspector | captures/history split, replay bridge, diff limits, timeline summaries |

## 6. Request Builder Verification Scope
### 6.1 Unit / logic focus
- pre-save and pre-run validation rules
- body/auth compatibility rules
- unresolved variable detection
- dirty-state helpers if extracted

### 6.2 Component focus
- tab switching does not lose authored state unexpectedly
- result panel remains distinct from authored request fields
- validation errors anchor to the right tab/field
- run does not silently clear dirty state

### 6.3 Integration focus
- save writes to resource lane, run writes to runtime lane
- execution request snapshot differs from saved resource when unsaved edits exist
- replay opens the request builder without mutating original history/capture records

## 7. Script Execution Safety / Capability / Redaction Verification Scope
### 7.1 Unit focus
- capability allow/deny tables
- redaction transforms for logs/results/errors
- timeout/cancellation status mapping

### 7.2 Integration focus
- denied capability becomes `blocked`/stable error code, not raw crash
- timeout produces correct stage/execution outcome and bounded diagnostics
- cancelled execution produces explicit cancellation outcome
- persisted runtime artifacts contain redacted summaries only

### 7.3 Contract focus
- T008 stage names and execution status vocabulary stay stable
- response/event payloads do not leak raw secrets
- persisted detail may be thinner than live detail, but required summary fields remain present

### 7.4 Component/UI focus
- user-facing labels remain `Pre-request`, `Post-response`, `Tests`, `Console`, `Execution Info`
- blocked/timeout/cancellation warnings use distinct wording
- UI copy explains redacted persistence rather than implying missing data is a failure

## 8. Mock Engine Verification Scope
### 8.1 Unit focus
- matcher semantics for method/path/query/header/body
- priority sort and tie-breaker rules
- enable/disable filtering
- outcome classification helpers (`Mocked`, `Bypassed`, `No rule matched`, `Blocked`)

### 8.2 Integration focus
- inbound request evaluation returns the expected rule/outcome
- fixed delay is applied when configured
- unsupported/deferred features fail predictably without hidden runtime behavior
- capture diagnostics and rule last-match summaries remain consistent enough for MVP expectations

### 8.3 Component/UI focus
- rule editor validation
- outcome badges appear with the correct vocabulary
- mock outcome family is not collapsed into generic transport status
- `Create from capture` entry point preserves expected initial matcher data

## 9. History / Inspector / Replay / Diff Verification Scope
### 9.1 Component focus
- `Captures` and `History` remain separate top-level sections
- detail views show the correct panel composition
- replay opens authoring flow, not a mutated detail screen
- diff entrypoints are limited to the documented MVP targets

### 9.2 Integration focus
- replay from capture creates an execution command/input without mutating the original capture
- history detail queries compose `ExecutionHistory` + `ExecutionResult` + `TestResult` correctly
- capture detail shows mock outcome metadata separately from transport metadata

### 9.3 Smoke focus
- capture arrives, detail opens, replay opens request builder
- request runs, history entry appears, detail shows response + diagnostics + tests summary
- mocked capture and regular execution remain visually distinct

## 10. Persistence Lane Separation Verification Scope
### 10.1 What to verify
- saved resources are written to the JSON resource lane
- runtime artifacts are written to SQLite runtime storage
- redacted-only runtime persistence rules are enforced
- history/capture detail queries do not require raw secret-bearing payload storage

### 10.2 Regression guard
A missing raw detail in persisted history is **not** automatically a bug if the documented redacted summary remains available.

## 11. SSE / Runtime Event / Persisted History Consistency Scope
### 11.1 Core principle
Live runtime streams may contain richer transient detail than persisted history. QA must verify consistency of meaning, not byte-for-byte equality.

### 11.2 What should stay consistent
- execution identity / capture identity linkage
- stable status vocabulary
- required summary timestamps and outcome classes
- redaction policy guarantees

### 11.3 What may legitimately differ
- verbosity of console output
- intermediate progress events
- oversized/raw payload detail
- some stage/rule trace detail if it is intentionally live-only

## 12. Validation / Timeout / Cancellation / Blocked State Strategy
### 12.1 Validation
Use unit + component tests for field-level validation and integration tests for server-side acceptance/rejection behavior.

### 12.2 Timeout
Use integration tests to force timeout paths and confirm:
- stable status/error codes
- correct UI-facing wording inputs
- persisted summaries remain bounded

### 12.3 Cancellation
Use integration tests for cancellation command handling and component tests for distinct cancellation rendering.

### 12.4 Blocked
Use policy-driven integration tests plus component/UI checks to ensure blocked states are not rendered as generic failure or success.

## 13. Contract Drift Prevention
### 13.1 Goal
T008 contracts must not silently drift away from implementation.

### 13.2 Verification approach
Use contract checks that validate:
- route envelopes
- DTO required fields
- event names
- status enums
- stable error codes
- redacted field expectations

### 13.3 Regression trigger examples
- `blocked` removed or renamed
- `Mocked`/`Bypassed` labels replaced with generic status strings in contract payloads
- history detail starts returning raw secret-bearing fields

## 14. UI Vocabulary and Label Verification
### 14.1 Why it matters
T011-T014 defined explicit user-facing vocabulary. QA should treat label drift as a real product regression, not as cosmetic churn.

### 14.2 Must-match vocabulary families
- request builder: `Response`, `Console`, `Tests`, `Execution Info`
- script stages: `Pre-request`, `Post-response`, `Tests`
- mock outcomes: `Mocked`, `Bypassed`, `No rule matched`, `Blocked`
- history/capture source labels: `Capture`, `History`, `Mock response`, `Transport response`

### 14.3 Verification method
Use component snapshot/assertion tests for stable labels plus manual QA review for high-importance copy in empty/error/degraded states.

## 15. Request Authoring vs Execution Observation Separation
### 15.1 Regression risk
The product will regress if request editing state and runtime result state become coupled or overwrite each other.

### 15.2 Required tests
- running a dirty request does not clear authoring state unexpectedly
- history detail does not mutate the current request editor implicitly
- replay opens an explicit authoring draft instead of converting detail view into edit mode
- request builder result panel and history detail can share presentation primitives without sharing state ownership

## 16. Mock Outcome Family vs Transport Outcome Family
### 16.1 Regression risk
A generic status chip could collapse mock and transport meanings into ambiguous UI.

### 16.2 QA rule
Tests and review checklists must confirm that:
- mock outcomes keep mock vocabulary
- transport outcomes keep execution/HTTP vocabulary
- test failures do not replace transport status
- blocked mock evaluation and blocked execution are not mislabeled as the same thing without context

## 17. Replay Verification Strategy
### 17.1 Principle under test
Replay is an **observation → authoring** bridge.

### 17.2 Required checks
- replay default opens request builder draft first
- replay preserves enough context to be useful without mutating source records
- replay warning/copy explains that current active rules/environment may differ from the original observation
- history/capture detail remains inspectable after replay is triggered

## 18. Diff Regression Guard
### 18.1 Principle under test
Diff must stay inside the MVP-approved target set.

### 18.2 Guard approach
- component/integration tests verify only the approved entrypoints exist
- QA checklist confirms no extra ad hoc response-diff surface quietly ships without spec updates
- future diff expansion should require explicit doc update plus new acceptance cases

## 19. Manual QA vs Automated QA Split
### 19.1 Automate first
Automate:
- deterministic logic
- contracts/status vocabularies
- redaction rules
- matcher/priority behavior
- list/detail panel state composition
- core smoke flows

### 19.2 Keep manual in MVP
Manual QA remains important for:
- empty-state clarity
- degraded-state messaging
- label/copy review
- live-vs-persisted detail interpretation
- visual distinction between outcome families

## 20. Empty / Error / Degraded State Checklist
### 20.1 Empty states
Verify that empty `Captures`, `History`, `Mocks`, and request builder result surfaces teach the next useful action.

### 20.2 Error states
Verify that:
- validation errors point to authored inputs
- runtime errors appear in observation/result surfaces
- raw sensitive detail is not dumped in errors

### 20.3 Degraded states
Verify behavior when:
- SSE is disconnected or delayed
- persisted history is present but live stream is absent
- some details are intentionally truncated/redacted
- optional diagnostics are unavailable but core summaries still render

## 21. Smoke Scenario Set
### 21.1 Smoke scenario A — Request run lifecycle
1. Open request builder.
2. Author a minimal request.
3. Run it.
4. Verify result panel shows response + Execution Info.
5. Verify history entry appears.

### 21.2 Smoke scenario B — Script diagnostic lifecycle
1. Add a simple test or log-producing script.
2. Run request.
3. Verify Console/Tests surfaces update.
4. Verify persisted history shows bounded/redacted summaries, not unlimited raw detail.

### 21.3 Smoke scenario C — Mock capture lifecycle
1. Enable a simple mock rule.
2. Send inbound request to local server.
3. Verify capture row appears with mock outcome badge.
4. Open capture detail and verify matched mock info.

### 21.4 Smoke scenario D — Replay bridge lifecycle
1. Open capture detail.
2. Trigger replay.
3. Verify request builder opens draft first.
4. Re-run from the builder and verify new history entry appears.

## 22. Risk Map
| Risk | Why high risk | Minimum guard |
| --- | --- | --- |
| Redaction leaks | security/privacy impact | unit + integration + manual review |
| Contract drift | UI/backend mismatch risk | contract tests |
| Timeout/cancellation mislabeling | confusing runtime behavior | integration + component |
| Mock/transport status collapse | misleading diagnostics | component + manual QA |
| Replay mutates observation | authoring/observation boundary break | integration + component |
| Persistence lane mixing | architecture violation | integration |
| Live vs persisted detail confusion | false bug reports / UX inconsistency | component + manual QA |

## 23. Defer List
- exhaustive browser E2E suite as the main safety net
- broad screenshot/golden coverage for every screen state
- property-based fuzzing for every matcher/parser from day one
- large matrix of OS/package-environment permutations before MVP shell stabilizes
- performance/load testing beyond lightweight smoke confidence

## 24. 확실하지 않음
1. Exact test runner and browser-automation stack choices remain **확실하지 않음** until T017 finalizes tooling.
2. Whether SSE verification should rely primarily on simulated streams, loopback servers, or both remains **확실하지 않음**.
3. Whether contract fixtures are generated from schemas or maintained manually remains **확실하지 않음**.
4. Whether limited browser-driven smoke coverage is sufficient or a second higher-fidelity harness is needed remains **확실하지 않음**.

## 25. Handoff Notes
### 25.1 For T017 - Developer Environment and Tooling Baseline
- choose tooling that supports contract/integration/component-heavy coverage without assuming a giant E2E pyramid
- provide scripts/fixtures for redaction, timeout, blocked, replay, and SSE checks early
- make it easy to run smoke scenarios locally with deterministic seed data

### 25.2 For T010 - Frontend Workspace Shell Implementation Plan
- preserve feature boundaries that map cleanly to component and integration test ownership
- plan shared primitives for result/detail/timeline surfaces without collapsing state ownership
- keep route/feature seams visible so Captures, History, Workspace, and Mocks can be tested independently

### 25.3 For Implementation Work
- start automation with contract + integration + component tests around the highest-risk policy and vocabulary boundaries
- treat smoke scenarios as release-readiness checks, not as the only correctness mechanism
- require spec updates before broadening replay/diff/trace behavior beyond the documented MVP scope
