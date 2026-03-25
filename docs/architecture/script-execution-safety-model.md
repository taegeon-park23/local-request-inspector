# Script Execution Safety Model Draft

- **Purpose:** Define the script execution safety model for the Local API Workbench, balancing local usability with realistic security and containment expectations.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `overview.md`, `shared-schema.md`, `persistence-strategy.md`, `internal-api-contracts.md`
- **Status:** done
- **Update Rule:** Update when execution capabilities, isolation mechanisms, or artifact redaction rules change.

## 1. Current Execution Model and Its Problems
### 1.1 Current Behavior
Today the server executes user-provided code directly inside the main Node.js process via `vm.runInContext()`, injecting:
- `fetch`
- `URLSearchParams`
- `FormData`
- `Blob`
- `fs.promises`
- `path`
- `__dirname`
- `response`
- a custom `console` wrapper

### 1.2 Main Problems
- execution happens in the same server process that handles API requests
- `fs.promises` and `path` give broad file access with no explicit policy layer
- `fetch` is fully open and unconstrained
- there is no explicit timeout, cancellation token, CPU budget, or memory budget
- logs and return values are accepted without structured redaction policy
- secrets could be accidentally surfaced through script inputs, logs, outputs, or persisted runtime artifacts

## 2. Threat Model
### 2.1 Threat Assumption
This is a **local developer tool**, not a hostile multi-tenant cloud service. That means the safety model should focus on:
- preventing accidental self-harm
- reducing secret leakage
- containing runaway or overly powerful scripts
- making script behavior predictable and debuggable

It does **not** assume the local user is an adversary against themselves in the same way as an internet-exposed sandbox.

### 2.2 Protected Assets
- raw secrets and resolved secret values
- workspace resource integrity
- runtime artifact integrity
- local machine stability (avoid runaway loops / unbounded resource usage)
- user trust in what scripts can and cannot do

### 2.3 Trust Boundaries
1. **UI to application API**
   - user code and execution settings enter the system here
2. **Application API to script runner**
   - capability policy and execution limits must be enforced here
3. **Script runner to persistence layer**
   - only redacted, structured outputs should cross this boundary
4. **Script runner to local machine/network**
   - file and network access must be policy-governed, not implied

## 3. Safety Principles
- default to the **minimum practical capability set** for MVP
- protect secrets more aggressively than ordinary request/response data
- allow strong debugging visibility without persisting sensitive material by default
- prefer deterministic structured outputs over arbitrary ambient process access
- isolate enough for local safety without overcommitting to unrealistic perfect sandbox claims

## 4. Script Types and Execution Stages
### 4.1 Pre-request Script
Purpose:
- derive headers/body/query values
- compute request-specific variables
- prepare artifacts before sending the outbound request

Allowed focus:
- mutate request draft / resolved request
- read environment variables through redacted/resolved access APIs
- emit logs and warnings

### 4.2 Post-response Script
Purpose:
- inspect the network response
- compute follow-up values
- derive structured output for the UI or later chained operations

Allowed focus:
- read request + response context
- emit logs
- produce structured post-response output

### 4.3 Test Script
Purpose:
- produce assertion outcomes
- mark pass/fail/warning states

Allowed focus:
- read request + response + resolved environment context
- emit structured assertion results
- avoid unrestricted side effects where possible

## 4.4 Stage Input and Output Boundaries
The safety model now treats each stage boundary as a contract boundary, aligned with T008 `RunExecutionInput`, stage records, and execution event payloads.

| Stage | Input Boundary | Allowed Output | Must Not Cross Boundary |
| --- | --- | --- | --- |
| `requestPreparation` | saved/ad hoc request definition, environment selection, request override, policy defaults | resolved request snapshot metadata, validation diagnostics | raw secret catalog, ambient process state, storage-engine details |
| `preRequestScript` | mutable request draft, controlled `env`, redaction-aware `console`, controlled `fetch` if policy allows | request mutations, structured warnings, redacted logs, structured blocked/error status | unrestricted filesystem/module/process access, raw secret echo into persisted artifacts |
| `transport` | finalized request snapshot, timeout/cancellation policy | normalized response snapshot, transport timing, structured transport error | direct persistence of raw response body when policy requires truncation/redaction |
| `postResponseScript` | normalized request + response context, controlled `env`, redaction-aware `console` | structured derived output, redacted logs, structured blocked/error status | arbitrary host access, unbounded binary/blob output, raw secret reflection |
| `testScript` | normalized request + response context, assertion helpers, controlled `env` | `TestResult` records, redacted assertion messages, warnings | side-effect-heavy host operations, raw secret disclosure in assertion detail |
| `resultFinalization` | stage outputs, redaction policy, persistence policy | persisted `ExecutionHistory`/`ExecutionResult` payloads, event-safe summaries | unredacted logs/results, storage-specific leakage into API DTOs |

The `preRequest`, `postResponse`, and `test` stage names in product UX can remain user-facing labels, while runtime contracts may still include the broader `requestPreparation`, `transport`, and `resultFinalization` stages from T008.

## 5. Capability Model
### 5.1 Allowed Capability Candidates for MVP
| Capability | MVP recommendation | Reasoning |
| --- | --- | --- |
| `fetch` | Allow, but policy-governed | Core workflow value depends on follow-up HTTP calls |
| request/response context | Allow | Fundamental to script usefulness |
| structured env access | Allow with secret redaction policy | Needed for automation |
| `console` logging | Allow with persistence redaction | Essential for debugging |
| timers / sleep-like control | 제한적으로 허용 or defer | Useful, but can create runaway behavior |
| file read access | Restricted / opt-in | Valuable for assets flows, but sensitive |
| file write/delete access | Deny in MVP | High-risk, low necessity |
| unrestricted process/env access | Deny | Exposes too much host state |
| arbitrary module import / require | Deny in MVP | Breaks containment model |

### 5.2 Explicitly Denied Capabilities for MVP
- raw `process` access
- unrestricted `require` / module loading
- child process spawn from user scripts
- arbitrary file write / rename / delete
- direct DB access
- host environment variable enumeration
- unrestricted OS command execution

## 6. File System, Path, Env, and Network Policy
### 6.1 File System Access
Current code exposes `fs.promises` directly, which is too broad for the target product.

**MVP recommendation**
- do not expose raw `fs.promises`
- instead expose a narrow file service only if file workflows are enabled
- initial allowed scope should be limited to designated workspace asset directories
- default mode should be **read-only**
- write/delete operations should be denied in MVP

**Status**
- whether read-only asset access is enabled by default or opt-in is **확실하지 않음**

### 6.2 Path Access
**MVP recommendation**
- do not expose raw host `path` as an unrestricted filesystem navigation tool
- if needed, expose safe helper functions for asset-relative path resolution
- avoid exposing `__dirname` directly to user scripts long-term

### 6.3 Environment Access
**MVP recommendation**
- scripts should access environment variables through a controlled `env` object or getter API
- secret-backed values should be resolved only when policy allows
- bulk dump of all raw secrets should be disallowed

### 6.4 Network Access
**MVP recommendation**
- allow `fetch` because follow-up HTTP automation is a core use case
- but route it through a policy layer that can:
  - log destination metadata
  - enforce timeout/cancellation
  - later support allowlist/restriction modes

**Open question**
- whether MVP should allow open network access or only request-related/follow-up targets is **확실하지 않음**

## 7. Secret Handling and Exposure Policy
### 7.1 Secret Input Policy
- secret-backed values may be available to scripts only as resolved values needed for execution
- scripts should not receive a raw secrets catalog dump
- secret access should be auditable at the execution metadata level where practical

### 7.2 Secret Output Policy
Secrets must not appear in persisted runtime artifacts by default.
That includes:
- `consoleLogs`
- `postResponseOutput`
- `ExecutionResult.responseBody` if it is merely echoing resolved secrets from script-side state
- `TestResult.summary` or assertion messages

### 7.3 Redaction Principles
When secret-like values appear in logs or outputs:
- redact before persistence
- prefer masking tokens such as `[REDACTED]`
- retain enough context for debugging without exposing value content

### 7.4 Persistence Rule
- raw secret values should never be stored in `ExecutionResult` or `TestResult`
- if a script returns an object containing known secret-backed fields, those fields must be redacted before persistence
- secret-bearing fields returned through HTTP APIs should use the same redaction semantics as runtime persistence: safe metadata may be exposed, raw values may not
- exact field/classification detection remains **확실하지 않음** and needs implementation support in T009

## 8. Logging, Output, and Assertion Handling
### 8.1 Console Logs
- keep structured log entries with level + message payload
- persist logs only after redaction
- UI may show richer ephemeral detail than what is durably stored

### 8.2 Post-response Output
- allow structured JSON-like return output
- persist only if it passes size and redaction rules
- large opaque blobs should be truncated or stored as summarized metadata in MVP

### 8.3 Test Results
- persist assertion name, status, and safe message
- avoid storing arbitrary giant objects as test artifacts
- keep `TestResult` logically separate from network response payloads

### 8.4 Persisted Result vs Ephemeral Event Boundary
T008 clarified that execution telemetry has two consumers with different safety needs:
- **ephemeral execution events** for live UI progress
- **persisted runtime artifacts** for history, inspection, and later queries

Recommended rule set:
- ephemeral SSE events may include richer stage-progress context, but still must pass redaction before transport
- persisted `ExecutionHistory`, `ExecutionResult`, and `TestResult` must store only redacted, size-bounded summaries
- a field that is safe to display live is not automatically safe to store durably
- event payloads should emphasize current status and lightweight previews, while detail endpoints return curated persisted records

This separation keeps the API contract storage-agnostic while preventing the runtime store from becoming a dump of raw script output.

### 8.5 ExecutionResult Storage Boundary
Recommended persisted contents:
- HTTP status / selected response metadata
- redacted console logs
- safe post-response output summary
- structured execution error summary

Not recommended by default:
- raw secret values
- unrestricted filesystem path disclosures
- unrestricted full stack dumps if they leak host details

## 9. Timeout, Cancellation, and Resource Limits
### 9.1 Timeout
Each script stage should have an explicit timeout.

**MVP recommendation**
- independent timeout per stage (`preRequest`, `postResponse`, `test`)
- timeout values configurable at application level; exact defaults are **확실하지 않음**

### 9.2 Cancellation
- user-triggered cancellation should stop further execution stages
- outbound `fetch` calls should use abort/cancellation hooks when possible
- cancellation should produce structured status, not a generic crash
- cancellation outcomes should align with the T008 contract by surfacing `cancelled` execution status, stage-level `cancelled` or `completed` state as appropriate, and stable error codes such as `execution_cancelled`

### 9.2.1 Timeout / Cancellation / Structured Error Alignment
To stay consistent with `internal-api-contracts.md`, the safety model assumes:
- top-level execution status may be `queued`, `running`, `completed`, `failed`, `timedOut`, `cancelled`, or `blocked`
- stage records carry redacted `errorCode`, timing metadata, and log summary only
- `blocked` should represent policy denial such as prohibited file or network capability use
- `timedOut` should represent an enforced stage or execution deadline rather than an ambiguous generic failure
- structured errors returned to API clients or persisted in runtime artifacts must prefer stable codes over raw stack dumps

### 9.3 Resource Limits
**Desired limits**
- CPU/time budget
- memory ceiling
- log volume cap
- output payload size cap

**MVP reality**
- true hard isolation of CPU/memory is easier with child-process isolation than with plain `vm`
- some limits may initially be soft or best-effort if a lighter-weight runtime is chosen

## 10. Sandbox Isolation Options
### 10.1 Comparison Table
| Option | Strengths | Weaknesses | MVP fit | Recommendation |
| --- | --- | --- | --- | --- |
| Current in-process `vm.runInContext()` | easiest to keep, low implementation change | weak containment, broad host coupling, hard resource enforcement | Poor long-term fit | Do not keep as-is |
| Worker thread | better separation than direct in-process callbacks, lighter than child process | still same OS process family, file/network restrictions still policy-driven | Possible transitional option | Viable but second choice |
| Child process runner | strongest practical isolation for MVP, clearer kill/time/memory boundaries | more IPC complexity, more runner orchestration | Strong fit for local tool safety | Recommended MVP direction |
| Third-party hardened sandbox runtime | may improve ergonomics | dependency and trust complexity, version risk | 확실하지 않음 | Defer unless justified |

### 10.2 Recommended MVP Isolation Direction
Use a **dedicated child-process script runner** for MVP, with:
- explicit input payload
- limited capability injection
- timeout and cancellation support
- structured IPC output
- no raw `require`, `process`, or unrestricted filesystem exposure
- policy-owned redaction before results cross back into API or persistence layers

Recommended MVP runner scope:
- one execution job per spawned runner process or equivalent bounded unit
- stage orchestration owned by the application/runtime layer, not by arbitrary script chaining
- controlled helpers for `fetch`, `env`, assertion APIs, and optional asset reads
- hard stop/kill behavior when timeout or cancellation policy requires termination

### 10.3 Transitional Note
If implementation cost forces an interim step, a worker-based runner may be acceptable temporarily, but the product should not present it as strong isolation.

### 10.4 Defer Boundary
The following remain intentionally deferred beyond this task's closure:
- advanced per-workspace capability grants and approvals
- fine-grained per-host outbound network policies
- richer file-asset browsing/write APIs
- alternative hardened sandbox engines
- perfect deterministic CPU/memory isolation guarantees beyond what a child-process runner can realistically provide

## 11. Usability vs Safety Trade-off
### 11.1 Why Not Lock Everything Down?
This tool is meant to help developers automate local API workflows. If `fetch` and selected file reads are removed entirely, the product loses too much of its value.

### 11.2 Why Not Allow Everything?
The current model is convenient but too implicit. It blurs trust boundaries, makes secret leakage easy, and couples debugging features with unsafe persistence behavior.

### 11.3 Practical Balance for MVP
- allow HTTP follow-up requests
- allow controlled environment access
- consider limited asset-directory read access
- deny unrestricted OS/process/module access
- isolate execution in a separate runner process
- redact persisted outputs aggressively

## 12. Recommended MVP Safety Model
### 12.1 Summary
- child-process runner
- staged execution model (`preRequest`, `postResponse`, `test`)
- explicit capability injection instead of ambient globals
- controlled `fetch`
- controlled `env`
- optional read-only asset access
- no raw host process/module access
- redacted persisted logs/results

### 12.2 Defer Items
- advanced per-host network allowlists
- rich capability grants per workspace/request
- full secret provider integration details
- hardened third-party sandbox engine adoption
- perfect memory isolation guarantees beyond what the chosen runner can realistically provide

## 13. Inputs for Follow-Up Tasks
### For T008 Internal API Contract Design
- define stage-oriented execution payloads and results
- include structured statuses for timeout, cancellation, and redaction-aware errors
- separate ephemeral console detail from persisted log summary when useful

### For T009 Workspace Persistence Bootstrap
- store only redacted runtime artifacts
- create schema support for execution stage status, log level, and cancellation outcomes
- avoid persistence models that require raw secret material in runtime tables

### For T012 Script Editor and Automation UX Spec
- surface allowed capability list clearly in the editor UX
- align autocomplete and runtime docs with the actual injected APIs only
- distinguish script types and their available context objects in the editor help model

## 14. Remaining Uncertainties
1. default network policy breadth remains **확실하지 않음**.
2. default file-read enablement remains **확실하지 않음**.
3. exact timeout defaults remain **확실하지 않음**.
4. Child-process isolation is now the primary runner baseline; the remaining question is how long the worker-thread fallback should stay available for spawn-restricted sandbox environments.
## 15. T075 Runtime Boundary Update
- Secret resolution now executes through a provider seam (`status/store/resolve/clear`) before transport starts.
- The runtime keeps a fail-closed posture:
  - unavailable provider does not expose secret values and unresolved placeholders remain blocking
  - provider internal failures are surfaced as `secret_provider_error`
- `secret_provider_error` summaries must remain redaction-safe and must not include raw provider payloads or secret values.
- Persisted execution history/results continue to store bounded error code/summary metadata only.
