# Internal API Contract Design

- **Purpose:** Define storage-agnostic internal HTTP and event contracts for workspace resources, execution flows, mock rules, and inbound capture features so implementation can proceed with stable DTO and lifecycle expectations.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `overview.md`, `shared-schema.md`, `naming-conventions.md`, `persistence-strategy.md`, `script-execution-safety-model.md`, `../tasks/task-008-internal-api-contract-design.md`
- **Status:** done
- **Update Rule:** Update when resource boundaries, transport choices, or canonical DTO semantics materially change.

## 1. Goals and Non-Goals
### Goals
- define stable resource and command endpoints for the modularized local API workbench
- define DTO families for summary, detail, mutation input, and event payloads
- define execution lifecycle payloads using T005 safety constraints
- preserve storage abstraction so JSON and SQLite details do not leak into the API surface
- keep capture and runtime streaming compatible with phased migration from the current SSE-based server

### Non-Goals
- final frontend state shape
- final persistence schema or SQL table design
- external/public API versioning policy
- full import/export payload design

## 2. Contract Design Principles
1. **Storage-agnostic contracts first.** DTOs must model product concepts rather than repository internals.
2. **Separate resource reads from execution commands.** CRUD-oriented routes and run/stop commands should not be mixed into one ambiguous shape.
3. **Use distinct summary/detail/event DTO families.** T007 explicitly requires this split.
4. **Prefer workspace-scoped resources, but allow runtime-global streams where ownership is still 확실하지 않음.**
5. **Expose redacted runtime information only.** Raw secrets, unrestricted console payloads, and unsafe error detail must not cross the contract boundary.
6. **Keep SSE as the default event transport for MVP.** WebSocket adoption remains **확실하지 않음** and can be deferred if richer bidirectional control becomes necessary.

## 3. Transport Model
### 3.1 Primary Synchronous Transport
- Use JSON over HTTP for resource queries, mutations, and execution commands.
- Resource endpoints should live under `/api`.
- All timestamps use ISO 8601 strings.
- Error payloads should use a stable envelope.

### 3.2 Primary Event Transport
- Use Server-Sent Events for MVP stream delivery.
- Recommended channels:
  - `/api/events/captured-requests`
  - `/api/events/executions`
  - `/api/events/workspaces/:workspaceId/activity`
- Event channel names and event names must remain distinct.

### 3.3 Optional Future Transport
- WebSocket support is **확실하지 않음** and should be introduced only if bidirectional live control or multiplexing becomes necessary.

## 4. Shared Envelope Conventions
### 4.1 Success Envelope
```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-03-18T00:00:00.000Z"
  }
}
```

### 4.2 Error Envelope
```json
{
  "error": {
    "code": "execution_timeout",
    "message": "Execution exceeded the configured timeout.",
    "details": {
      "executionId": "exec_123"
    },
    "retryable": false
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-03-18T00:00:00.000Z"
  }
}
```

### 4.3 Common Query Parameters
- `limit`, `cursor` for cursor-based pagination where list size can grow materially
- `q` for text search when supported
- `sortBy`, `sortOrder` for explicit sorting
- domain-specific filters should use descriptive names such as `workspaceId`, `collectionId`, `status`, `scriptType`

## 5. DTO Families
| DTO Family | Naming Rule | Purpose |
| --- | --- | --- |
| Summary | `*SummaryDto` | compact list and relationship views |
| Detail | `*DetailDto` | complete editable/readable resource shape |
| Mutation input | `Create*Input`, `Update*Input` | client-to-service create/update contracts |
| Command input | `Run*Input`, `Cancel*Input`, etc. | operation-specific non-CRUD commands |
| Event payload | `*Event` / `*EventDto` | SSE transport payloads |
| Query result | `*ListResponse` when needed | paginated list wrapper around summaries |

## 6. Resource Scope Model
### Workspace-scoped resources
- `Workspace`
- `Collection`
- `Request`
- `Environment`
- `Script`
- `ScriptTemplate`
- `MockRule`

### Runtime-oriented records
- `ExecutionHistory`
- `ExecutionResult`
- `TestResult`
- `CapturedRequest`
- `MockScenarioState`

### Scope note
`CapturedRequest` workspace ownership remains **확실하지 않음**. For MVP, support both:
- global runtime queries, and
- optional `workspaceId` filter when capture-to-workspace association exists.

## 7. Route Catalog

### 7.1 Workspaces
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| GET | `/api/workspaces` | list workspaces | `WorkspaceSummaryDto[]` |
| POST | `/api/workspaces` | create workspace | `WorkspaceDetailDto` |
| GET | `/api/workspaces/:workspaceId` | fetch workspace detail | `WorkspaceDetailDto` |
| PATCH | `/api/workspaces/:workspaceId` | update workspace metadata | `WorkspaceDetailDto` |
| DELETE | `/api/workspaces/:workspaceId` | archive/delete workspace | no body or minimal success envelope |

### 7.2 Collections and Requests
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/collections` | list collections | `CollectionSummaryDto[]` |
| POST | `/api/workspaces/:workspaceId/collections` | create collection | `CollectionDetailDto` |
| GET | `/api/collections/:collectionId` | get collection detail | `CollectionDetailDto` |
| PATCH | `/api/collections/:collectionId` | update collection metadata | `CollectionDetailDto` |
| DELETE | `/api/collections/:collectionId` | delete collection | success envelope |
| GET | `/api/workspaces/:workspaceId/requests` | list requests | `RequestSummaryDto[]` |
| POST | `/api/workspaces/:workspaceId/requests` | create saved request | `RequestDetailDto` |
| GET | `/api/requests/:requestId` | fetch request detail | `RequestDetailDto` |
| PATCH | `/api/requests/:requestId` | update request | `RequestDetailDto` |
| DELETE | `/api/requests/:requestId` | delete request | success envelope |

### 7.3 Environments and Variables
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/environments` | list environments | `EnvironmentSummaryDto[]` |
| POST | `/api/workspaces/:workspaceId/environments` | create environment | `EnvironmentDetailDto` |
| GET | `/api/environments/:environmentId` | fetch environment | `EnvironmentDetailDto` |
| PATCH | `/api/environments/:environmentId` | update environment structure or variable metadata | `EnvironmentDetailDto` |
| DELETE | `/api/environments/:environmentId` | delete environment | success envelope |

Secret values must never be returned in plain text unless an explicit future policy allows it. That policy remains **확실하지 않음**.

### 7.4 Scripts and Script Templates
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/scripts` | list saved scripts | `ScriptSummaryDto[]` |
| POST | `/api/workspaces/:workspaceId/scripts` | create saved script | `ScriptDetailDto` |
| GET | `/api/scripts/:scriptId` | fetch script detail | `ScriptDetailDto` |
| PATCH | `/api/scripts/:scriptId` | update script | `ScriptDetailDto` |
| DELETE | `/api/scripts/:scriptId` | delete script | success envelope |
| GET | `/api/script-templates` | list reusable script templates | `ScriptTemplateSummaryDto[]` |
| GET | `/api/script-templates/:templateId` | get template detail | `ScriptTemplateDetailDto` |

### 7.5 Mock Rules
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| GET | `/api/workspaces/:workspaceId/mock-rules` | list mock rules | `MockRuleSummaryDto[]` |
| POST | `/api/workspaces/:workspaceId/mock-rules` | create mock rule | `MockRuleDetailDto` |
| GET | `/api/mock-rules/:mockRuleId` | fetch rule detail | `MockRuleDetailDto` |
| PATCH | `/api/mock-rules/:mockRuleId` | update rule | `MockRuleDetailDto` |
| DELETE | `/api/mock-rules/:mockRuleId` | delete rule | success envelope |
| POST | `/api/mock-rules/:mockRuleId/enable` | enable rule | `MockRuleDetailDto` |
| POST | `/api/mock-rules/:mockRuleId/disable` | disable rule | `MockRuleDetailDto` |

### 7.6 Execution Commands and Runtime Queries
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| POST | `/api/executions/run` | execute request with resolved environment and script stages | `ExecutionAcceptedDto` |
| POST | `/api/executions/:executionId/cancel` | request cancellation | `ExecutionCancellationDto` |
| GET | `/api/execution-histories` | list execution histories | `ExecutionHistorySummaryDto[]` |
| GET | `/api/execution-histories/:executionId` | fetch execution history detail | `ExecutionHistoryDetailDto` |
| GET | `/api/execution-histories/:executionId/result` | fetch normalized execution result | `ExecutionResultDetailDto` |
| GET | `/api/execution-histories/:executionId/test-results` | fetch test assertions | `TestResultSummaryDto[]` |

### 7.7 Captured Requests
| Method | Path | Purpose | Response DTO |
| --- | --- | --- | --- |
| GET | `/api/captured-requests` | list inbound captures | `CapturedRequestSummaryDto[]` |
| GET | `/api/captured-requests/:capturedRequestId` | fetch captured request detail | `CapturedRequestDetailDto` |
| POST | `/api/captured-requests/:capturedRequestId/replay` | create replay execution from captured request | `ExecutionAcceptedDto` |

### 7.8 Assets / Local Files
The current `/__inspector/assets` capability exists in the legacy server, but direct file-system browsing as a first-class internal API remains **확실하지 않음** until T005 file capability policy and T012 UX decisions settle. Avoid baking this legacy route into the canonical contract for MVP planning.

## 8. Execution Contract Design
### 8.1 Run Input
`POST /api/executions/run` should accept `RunExecutionInput`:

```json
{
  "workspaceId": "ws_123",
  "requestId": "req_123",
  "environmentId": "env_local",
  "requestOverride": {
    "method": "POST",
    "url": "https://example.test/api"
  },
  "scriptSelection": {
    "preRequestScriptId": "scr_pre",
    "postResponseScriptId": "scr_post",
    "testScriptId": "scr_test"
  },
  "options": {
    "persistHistory": true,
    "captureConsole": true,
    "timeoutMs": 5000
  }
}
```

Notes:
- `requestId` and `requestOverride` can coexist so ad hoc execution can reuse a saved request with partial overrides.
- The accepted timeout value must be clamped to policy-defined limits.
- Capability escalation flags must not be accepted directly from clients.

### 8.2 Accepted Response
```json
{
  "data": {
    "executionId": "exec_123",
    "status": "queued",
    "acceptedAt": "2026-03-18T00:00:00.000Z"
  }
}
```

### 8.3 Execution Status Model
Recommended `ExecutionStatus` values:
- `queued`
- `running`
- `completed`
- `failed`
- `timedOut`
- `cancelled`
- `blocked`

`blocked` is useful when policy rejects a prohibited capability such as disallowed file or network access.

### 8.4 Stage Model
Each execution may include these ordered stages:
1. `requestPreparation`
2. `preRequestScript`
3. `transport`
4. `postResponseScript`
5. `testScript`
6. `resultFinalization`

Each stage record should include:
- `stage`
- `status`
- `startedAt`
- `completedAt`
- `durationMs`
- `errorCode` if failed or blocked
- `logSummary` as a redacted aggregate only

### 8.5 Result Model
`ExecutionResultDetailDto` should include:
- request summary snapshot used for execution
- response status, headers, body summary, and body preview metadata
- resolved environment reference metadata, not raw secret values
- stage results
- redacted console summary
- top-level `error` object when relevant

### 8.6 Logs and Redaction
T005 requires separation between ephemeral console detail and persisted log summary.
- Event streams may carry richer live console events subject to redaction.
- Persisted history should store summarized, redacted entries only.
- Error payloads should reference blocked/unsafe behavior with stable codes such as `capability_denied`, `execution_timeout`, `execution_cancelled`.

## 9. Event Catalog

### 9.1 Captured Request Stream
**Channel:** `/api/events/captured-requests`

Recommended events:
- `captured-request.received`
- `captured-request.updated` if enrichment occurs later

Payload sketch:
```json
{
  "eventName": "captured-request.received",
  "data": {
    "capturedRequestId": "cap_123",
    "method": "POST",
    "path": "/webhook",
    "receivedAt": "2026-03-18T00:00:00.000Z",
    "workspaceId": null
  }
}
```

### 9.2 Execution Stream
**Channel:** `/api/events/executions`

Recommended events:
- `execution.started`
- `execution.stage-updated`
- `execution.completed`
- `execution.failed`
- `execution.timed-out`
- `execution.cancelled`

### 9.3 Workspace Activity Stream
**Channel:** `/api/events/workspaces/:workspaceId/activity`

Recommended events:
- `workspace.updated`
- `request.updated`
- `environment.updated`
- `mock-rule.updated`

This stream is optional for MVP and may be added after core capture/execution streams.

## 10. Legacy-to-Target Mapping
| Legacy route / behavior | Target contract direction | Notes |
| --- | --- | --- |
| `GET /events` | `GET /api/events/captured-requests` | preserve SSE for capture feed |
| `POST /__inspector/mock` | `/api/workspaces/:workspaceId/mock-rules` family | replace global singleton mock config |
| `POST /__inspector/execute` | `POST /api/executions/run` | split request input, stage results, and safe execution semantics |
| `GET /__inspector/assets` | deferred | canonicalization blocked by file-access policy |
| wildcard capture route | `CapturedRequest` ingestion/query model | storage/query semantics move behind internal services |

## 11. Open Questions
1. Whether captured requests should always attach to a workspace or remain globally queryable by default is **확실하지 않음**.
2. Whether execution cancellation requires bidirectional transport beyond SSE is **확실하지 않음**.
3. Whether request draft autosave deserves a dedicated contract before T011 remains **확실하지 않음**.
4. Whether asset/file browsing should remain an exposed internal service is **확실하지 않음**.
5. Whether some execution log events should be queryable after completion beyond summary payloads is **확실하지 않음**.

## 12. Handoff Outputs for Downstream Tasks
### For T009 Workspace Persistence Bootstrap
- create repository interfaces that match workspace resource DTO boundaries and runtime query needs
- keep execution histories, test results, and captured requests queryable without leaking SQL details into the service layer
- support redacted log summary storage rather than raw console dumps

### For T013 Mock Engine Rules Spec
- refine `MockRuleDetailDto` into matcher, priority, delay, and scenario-state fields
- keep enable/disable and list/detail semantics aligned with workspace ownership

### For T014 History / Inspector Behavior Spec
- use `CapturedRequest` list/detail/event contracts as the baseline for search, replay, and diff behavior
- define how global-vs-workspace capture filtering should appear in the UX

### For T016 Testing and QA Strategy
- validate envelope consistency, event naming, timeout/cancellation error codes, and redaction behavior
- add contract checks covering both resource endpoints and execution lifecycle streams
