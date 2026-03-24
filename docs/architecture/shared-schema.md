# Shared Schema

- **Purpose:** Define canonical schema concepts, resource categories, entity field drafts, and shared structural rules for the Local API Workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
- **Related Documents:** `overview.md`, `domain-model.md`, `migration-plan.md`, `naming-conventions.md`
- **Status:** done
- **Update Rule:** Update when entity shapes, relation rules, or resource-category rules materially change.

## 1. Schema Design Principles
- Shared schemas must support frontend, backend, storage, and execution/runtime collaboration.
- Shared schemas should distinguish **persisted resource**, **runtime artifact**, **value object**, and **transport DTO** concerns explicitly.
- Stable entity identifiers and timestamps are preferred over positional or implicit references.
- Use optional fields only when the lifecycle truly requires absence.
- If a model is not yet settled, mark it **확실하지 않음** rather than hiding uncertainty.

## 2. Shared Resource Categories
### 2.1 Persisted Resources
Low- or medium-volume, user-managed entities that must survive restarts.

Included by default:
- `Workspace`
- `Collection`
- `RequestGroup`
- `Request`
- `Environment`
- `EnvironmentVariable`
- `Script`
- `ScriptTemplate`
- `MockRule`
- `MockScenarioState` *(if scenario persistence is needed; exact requirement 확실하지 않음)*
- `Secret` *(if first-class secret storage is adopted; 확실하지 않음)*

### 2.2 Runtime Artifacts
Observed or generated entities that may be retained differently from user-managed resources.

Included by default:
- `CapturedRequest`
- `ExecutionHistory`
- `ExecutionResult`
- `TestResult`

### 2.3 Value Objects
Reusable embedded structures used within persisted or runtime models.

Candidate value objects:
- `RequestHeader`
- `QueryParam`
- `RequestBodyDefinition`
- `AuthConfig`
- `RequestReference`
- `MockMatchCriteria`
- `MockResponseDefinition`
- `AssertionResult`
- `ScriptReference`
- `ResourceMetadata`

### 2.4 Transport DTOs
DTOs are recommended when a transport shape differs from a persisted or runtime storage model.

Candidate DTO families:
- command DTOs for create/update actions
- summary DTOs for list views
- detail DTOs for editor/detail views
- event DTOs for capture/execution streaming

Whether DTOs are physically separate files/types from persisted models is **확실하지 않음**, but conceptual separation is recommended.

## 3. Cross-Cutting Schema Rules
### 3.1 ID Rules
- Every entity should use a stable opaque string `id`.
- Foreign-key style references should use `<entity>Id`.
- IDs should not encode ordering, user-visible names, or transport details.
- ID generation mechanism is **확실하지 않음** and should remain storage-agnostic for now.

### 3.2 Timestamp Rules
When the lifecycle supports them, entities should use:
- `createdAt`
- `updatedAt`
- `startedAt`
- `completedAt`
- `receivedAt`

Rules:
- timestamps should be stored in a consistent machine-readable format
- display-localization belongs to the UI layer
- avoid ambiguous generic names like `timestamp` unless it truly represents a generic event field

### 3.3 Metadata Rules
If an entity needs reusable metadata, prefer an embedded `metadata` or well-scoped optional fields rather than ad hoc top-level duplication.

Candidate metadata fields:
- `description`
- `tags`
- `isFavorite`
- `sortOrder`
- `source`

### 3.4 Relation Rules
- Cross-entity relations should use stable IDs, not embedded names, for canonical references.
- Snapshot-bearing runtime artifacts may embed partial copies of related entities when historical replay/debugging requires it.
- Trees should use `collectionId` plus `requestGroupId` as the canonical saved-request placement relation.
- Many-to-one relations should be explicit through owner scope fields such as `workspaceId`, `collectionId`, and `requestGroupId`.

### 3.5 Scope Rules
Each entity should declare one of these scopes:
- `workspace`
- `globalLocalRuntime`
- `derivedRuntime`

A scope should be documented even if the final persisted representation remains **확실하지 않음**.

## 4. Entity Canonical Drafts
### 4.1 Workspace
**Category:** persisted resource  
**Scope:** workspace root  
**Required fields**
- `id`
- `name`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `defaultEnvironmentId`
- `settings`

**Notes**
- `settings` structure is **확실하지 않음** and should stay loosely specified until T004/T006 clarify storage/UI needs.

### 4.2 Collection
**Category:** persisted resource  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `name`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `sortOrder`

### 4.3 RequestGroup
**Category:** persisted resource  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `collectionId`
- `name`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `sortOrder`

### 4.4 Request
**Category:** persisted resource  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `collectionId`
- `requestGroupId`
- `name`
- `method`
- `urlTemplate`
- `queryParams`
- `headers`
- `body`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `authConfig`
- `preRequestScriptId`
- `postResponseScriptId`
- `testScriptId`
- `tags`
- `isFavorite`

**Notes**
- `queryParams`, `headers`, and `body` should be typed value objects, not arbitrary string blobs.
- script links are references, but embedding strategy for snapshots during execution remains runtime-specific.

### 4.5 RequestDraft / Version
**Category:** 확실하지 않음  
**Scope:** workspace or transient client state (확실하지 않음)

**Current options**
1. `RequestDraft` is only a transient client/editor model and is not persisted independently.
2. `RequestDraft` is a persisted autosave artifact linked to a `Request`.
3. `RequestVersion` is a historical versioning concept rather than a draft concept.

**Recommendation for now**
- Do not promote `RequestDraft` to canonical persisted entity yet.
- Keep it as a design question for later if autosave/versioning becomes a concrete requirement.

### 4.6 Environment
**Category:** persisted resource  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `name`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `isDefault`

### 4.7 EnvironmentVariable
**Category:** persisted resource  
**Scope:** workspace through `Environment`  
**Required fields**
- `id`
- `environmentId`
- `key`
- `isEnabled`
- `createdAt`
- `updatedAt`

**Optional fields**
- `value`
- `valueType`
- `isSecret`
- `description`
- `secretId`

**Notes**
- if `secretId` exists, `value` should be empty or masked depending on the chosen secret strategy.
- `valueType` enum still needs finalization.

### 4.8 Secret
**Category:** persisted resource or implementation policy (**확실하지 않음**)  
**Scope:** workspace or local system integration (**확실하지 않음**)

**Option A — First-class entity**
- `id`
- `workspaceId`
- `name`
- `provider`
- `valueRef`
- `createdAt`
- `updatedAt`

**Option B — Not a shared entity**
- secrets are stored behind environment-variable policy and never modeled as independent resources

**Current recommendation**
- keep `Secret` in the shared vocabulary, but delay commitment to it as a first-class persisted entity until T004/T005 decide storage and security posture.

### 4.9 Script
**Category:** persisted resource  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `name`
- `scriptType`
- `sourceCode`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `runtimeVersion`
- `tags`

### 4.10 ScriptTemplate
**Category:** persisted resource or seed/system resource  
**Scope:** workspace or system (**확실하지 않음**)

**Required fields**
- `id`
- `name`
- `templateType`
- `sourceCode`
- `createdAt`
- `updatedAt`

**Optional fields**
- `workspaceId`
- `description`
- `tags`
- `isSystemTemplate`

### 4.11 MockRule
**Category:** persisted resource  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `name`
- `isEnabled`
- `priority`
- `matchCriteria`
- `responseDefinition`
- `createdAt`
- `updatedAt`

**Optional fields**
- `description`
- `scenarioStateId`

### 4.12 MockScenarioState
**Category:** persisted resource or derived runtime state (**확실하지 않음**)  
**Scope:** workspace or globalLocalRuntime (**확실하지 않음**)

**Candidate fields**
- `id`
- `workspaceId`
- `mockRuleId`
- `stateKey`
- `stateValue`
- `updatedAt`

**Notes**
- only promote this to a persisted resource if scenario-based mocking is explicitly in scope for near-term delivery.

### 4.13 CapturedRequest
**Category:** runtime artifact  
**Scope:** globalLocalRuntime by default; workspace scope is **확실하지 않음**

**Required fields**
- `id`
- `receivedAt`
- `method`
- `url`
- `path`
- `headers`
- `rawHeaders`

**Optional fields**
- `workspaceId`
- `query`
- `body`
- `rawBody`
- `matchedMockRuleId`
- `responseStatus`
- `responseHeaders`
- `responseBody`

**Retention notes**
- retention policy should be separate from persisted user resources
- default retention duration/limit is **확실하지 않음** and should be decided in T004/T014

### 4.14 ExecutionHistory
**Category:** runtime artifact  
**Scope:** workspace  
**Required fields**
- `id`
- `workspaceId`
- `requestSnapshot`
- `status`
- `startedAt`
- `createdAt`

**Optional fields**
- `requestId`
- `environmentId`
- `completedAt`
- `durationMs`
- `resultId`
- `testResultIds`

**Notes**
- `requestSnapshot` is required even when `requestId` exists so past executions remain reproducible.

### 4.15 ExecutionResult
**Category:** runtime artifact  
**Scope:** derivedRuntime linked to `ExecutionHistory`

**Required fields**
- `id`
- `executionHistoryId`
- `createdAt`

**Optional fields**
- `httpStatus`
- `responseHeaders`
- `responseBody`
- `responseBodyType`
- `consoleLogs`
- `errorSummary`
- `postResponseOutput`

**Separation options**
1. Always persist separately from `ExecutionHistory`.
2. Inline inside `ExecutionHistory` for simple storage engines.

**Current recommendation**
- treat `ExecutionResult` as a distinct conceptual schema even if some storage engines inline it.

### 4.16 TestResult
**Category:** runtime artifact  
**Scope:** derivedRuntime linked to `ExecutionHistory`

**Required fields**
- `id`
- `executionHistoryId`
- `status`
- `createdAt`

**Optional fields**
- `assertions`
- `summary`

**Separation options**
1. Persist separately for queryability.
2. Inline into `ExecutionResult` or `ExecutionHistory` for simpler storage.

**Current recommendation**
- keep `TestResult` as a distinct logical schema because T005/T008 benefit from a stable test-result contract.

## 5. Enum Candidates
### Request / Execution Enums
- `HttpMethod`: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- `RequestBodyType`: `json`, `text`, `formUrlEncoded`, `multipartFormData`, `binary`, `graphql`, `xml` *(final MVP subset 확실하지 않음)*
- `ExecutionStatus`: `queued`, `running`, `succeeded`, `failed`, `cancelled`
- `ScriptType`: `preRequest`, `postResponse`, `test`
- `ResultStatus`: `passed`, `failed`, `warning`, `skipped` *(usage split 확실하지 않음)*

### Environment / Secret Enums
- `VariableValueType`: `plain`, `secretRef`
- `SecretProviderType`: `localStore`, `osKeychain`, `externalProvider` *(final provider set 확실하지 않음)*

### Mock Enums
- `MockMatchOperator`: `equals`, `contains`, `regex`, `exists` *(MVP subset 확실하지 않음)*
- `MockScenarioMode`: `stateless`, `stateful` *(whether needed early is 확실하지 않음)*

## 6. Value Object Candidates
### RequestHeader
- `key` (required)
- `value` (required)
- `isEnabled` (optional, default recommended)

### QueryParam
- `key` (required)
- `value` (optional)
- `isEnabled` (optional)

### RequestBodyDefinition
- `bodyType` (required)
- `raw` (optional)
- `formFields` (optional)
- `fileRefs` (optional)

### AuthConfig
- `authType` (required)
- `token` / `username` / `password` / `apiKey` / `apiKeyLocation` (optional by auth type)
- final shape is **확실하지 않음** until T011/T008 refine auth scope

### MockMatchCriteria
- `method`
- `pathPattern`
- `queryRules`
- `headerRules`
- `bodyRules`

### MockResponseDefinition
- `statusCode`
- `headers`
- `body`
- `delayMs`

### AssertionResult
- `name`
- `status`
- `message`

### ScriptReference
- `scriptId`
- `scriptType`

## 7. Persisted Model vs Runtime Model vs DTO Guidance
### Persisted Model
Represents durable state written to local storage.
- example: `Request`, `Environment`, `MockRule`

### Runtime Model
Represents observations or generated execution state.
- example: `CapturedRequest`, `ExecutionHistory`, `ExecutionResult`, `TestResult`

### DTO
Represents transport contracts for create/update/list/detail/event flows.
- example: `RequestSummaryDto`, `CapturedRequestEvent`, `ExecutionHistoryDetailDto`

**Recommendation**
- Keep the conceptual distinction even if early implementation reuses identical field sets in some places.
- T008 should define exact DTO boundaries based on these shared model categories.

## 8. Low-Volume vs High-Volume Data Split
### Low-Volume User-Managed Data
- `Workspace`
- `Collection`
- `RequestGroup`
- `Request`
- `Environment`
- `EnvironmentVariable`
- `Script`
- `ScriptTemplate`
- `MockRule`
- `Secret` *(if first-class)*

### High-Volume Runtime Data
- `CapturedRequest`
- `ExecutionHistory`
- `ExecutionResult`
- `TestResult`
- `MockScenarioState` *(if mutation-heavy)*

**Implication for T004**
- retention, indexing, and storage strategy may differ between these categories.

## 9. Inputs for Follow-Up Tasks
### For T004 Persistence Strategy
- prioritize separate retention strategy for runtime artifacts
- decide whether `Secret` and `MockScenarioState` are first-class persisted entities
- decide whether `ExecutionResult` / `TestResult` are separate storage units or inlined

### For T005 Script Execution Safety Model
- preserve separate logical contracts for `Script`, `ExecutionResult`, and `TestResult`
- ensure secrets never leak into runtime artifacts by default
- decide allowed output structure for logs, assertions, and post-response outputs

### For T008 Internal API Contract Design
- use distinct DTO families for summary/detail/event payloads
- keep event payload names aligned with runtime artifact names
- respect workspace vs globalLocalRuntime scope when designing routes and stream channels

## 10. Open Questions
1. `Secret` as entity vs policy remains **확실하지 않음**.
2. `RequestDraft` / versioning remains **확실하지 않음**.
3. `CapturedRequest` workspace ownership remains **확실하지 않음**.
4. `MockScenarioState` persistence remains **확실하지 않음**.
5. exact DTO split from persisted models remains **확실하지 않음**.



