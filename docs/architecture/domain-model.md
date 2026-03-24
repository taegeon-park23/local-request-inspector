# T001 Domain Model

- **Purpose:** Define the initial domain vocabulary, entity responsibilities, relationships, and field drafts for the Local API Workbench architecture.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-23
- **Related Documents:** `overview.md`, `migration-plan.md`, `../prd/overview.md`
- **Status:** done
- **Update Rule:** Update when entity definitions, naming rules, or certainty levels change.

## 1. Modeling Principles
- Separate **user-authored resources** from **runtime observations**.
- Prefer explicit entities over hidden JSON blobs when the concept is important to search, history, or reuse.
- Keep IDs stable and opaque.
- Keep field naming transport-friendly and cross-language friendly.
- Mark uncertain fields or relationships as **확실하지 않음** instead of assuming a final model.

## 2. Naming Rules
- Entity names use singular PascalCase in documentation.
- Field names use lowerCamelCase.
- Timestamp fields should prefer explicit names such as `createdAt`, `updatedAt`, `startedAt`, `completedAt`.
- Foreign keys should use `<entity>NameId` pattern only when the referenced entity type is ambiguous; otherwise `<entity>Id` is preferred.
- Secret-bearing fields should not store raw values in logs or derived result records.

## 3. Entity Map Overview
### User-Authored Resources
- Workspace
- Collection
- RequestGroup
- Request
- Environment
- EnvironmentVariable
- Secret
- MockRule
- Script
- ScriptTemplate

### Runtime / Observed Resources
- ExecutionHistory
- ExecutionResult
- TestResult
- CapturedRequest

### Supporting Value Objects
- RequestHeader
- QueryParam
- RequestBodyDefinition
- AuthConfig
- MockResponseDefinition
- ScriptBindingContext

## 4. Entity Drafts
### 4.1 Workspace
**Role:** Top-level container for all saved resources and local settings.

**Core responsibilities**
- scope ownership of collections, environments, mock rules, templates, and history preferences
- define the active local project boundary

**Draft fields**
- `id`
- `name`
- `description`
- `defaultEnvironmentId` *(optional)*
- `settings` *(object; exact structure 확실하지 않음)*
- `createdAt`
- `updatedAt`

**Status:** confirmed as required by PRD direction.

### 4.2 Collection
**Role:** Named top-level group of related request groups within a workspace.

**Draft fields**
- `id`
- `workspaceId`
- `name`
- `description`
- `sortOrder`
- `createdAt`
- `updatedAt`

**Relationships**
- belongs to one `Workspace`
- contains many `RequestGroup`
- does not contain root-level `Request` records directly in the canonical model

### 4.3 RequestGroup
**Role:** Single-level grouping unit inside a collection. Every saved request belongs to exactly one request group.

**Draft fields**
- `id`
- `workspaceId`
- `collectionId`
- `name`
- `description`
- `sortOrder`
- `createdAt`
- `updatedAt`

**Status:** hierarchy depth is fixed to one level in the canonical model; nested groups are out of scope.

### 4.4 Request
**Role:** Canonical saved outbound request definition used by the workspace.

**Core responsibilities**
- store executable request configuration
- reference scripts, auth, environments, and metadata
- serve as the source artifact for execution and duplication

**Draft fields**
- `id`
- `workspaceId`
- `collectionId`
- `requestGroupId`
- `name`
- `description`
- `method`
- `urlTemplate`
- `queryParams` *(array of value objects)*
- `headers` *(array of value objects)*
- `body` *(RequestBodyDefinition)*
- `authConfig` *(AuthConfig; optional)*
- `preRequestScriptId` *(optional)*
- `postResponseScriptId` *(optional)*
- `testScriptId` *(optional)*
- `tags` *(array; optional)*
- `isFavorite`
- `createdAt`
- `updatedAt`

**Confirmed vs uncertain**
- Confirmed: request must store URL, headers, body, and method.
- **확실하지 않음:** whether scripts are embedded snapshots, references, or both.

### 4.5 Environment
**Role:** Named set of runtime variables bound to a workspace and optionally used as the active execution context.

**Draft fields**
- `id`
- `workspaceId`
- `name`
- `description`
- `isDefault`
- `createdAt`
- `updatedAt`

### 4.6 EnvironmentVariable
**Role:** Non-secret or secret-backed variable entry in an environment.

**Draft fields**
- `id`
- `environmentId`
- `key`
- `valueType` *(e.g. `plain`, `secretRef`; exact enum 확실하지 않음)*
- `value` *(masked or inline depending on policy)*
- `isSecret`
- `isEnabled`
- `description`
- `createdAt`
- `updatedAt`

### 4.7 Secret
**Role:** Separately managed sensitive value referenced by environment variables or auth configurations.

**Draft fields**
- `id`
- `workspaceId`
- `name`
- `provider` *(local, OS keychain, other; 확실하지 않음)*
- `valueRef` *(implementation-specific; raw storage approach 확실하지 않음)*
- `createdAt`
- `updatedAt`

**Status:** conceptually useful, but exact persistence/security model is **확실하지 않음**.

### 4.8 MockRule
**Role:** Declarative rule describing how an inbound request should be matched and responded to.

**Draft fields**
- `id`
- `workspaceId`
- `name`
- `description`
- `isEnabled`
- `priority`
- `matchCriteria` *(object containing method/path/query/header/body matchers)*
- `responseDefinition` *(MockResponseDefinition)*
- `scenarioState` *(optional; exact shape 확실하지 않음)*
- `createdAt`
- `updatedAt`

**Confirmed vs uncertain**
- Confirmed: method/path-based mock behavior is required.
- **확실하지 않음:** depth of body matching and scenario state in MVP.

### 4.9 Script
**Role:** Executable user-authored JavaScript resource.

**Draft fields**
- `id`
- `workspaceId`
- `name`
- `description`
- `scriptType` *(preRequest, postResponse, test)*
- `sourceCode`
- `runtimeVersion` *(optional; exact semantics 확실하지 않음)*
- `createdAt`
- `updatedAt`

**Status:** confirmed as a first-class concept.

### 4.10 ScriptTemplate
**Role:** Reusable starter or snippet for generating scripts.

**Draft fields**
- `id`
- `workspaceId` *(optional if system-provided templates are supported)*
- `name`
- `description`
- `templateType`
- `sourceCode`
- `tags`
- `createdAt`
- `updatedAt`

**Status:** system templates vs user templates coexistence is **확실하지 않음**.

### 4.11 ExecutionHistory
**Role:** Durable record of one request execution event.

**Core responsibilities**
- track input snapshot, timing, links to results, and user-visible execution status
- power history, replay, and debugging views

**Draft fields**
- `id`
- `workspaceId`
- `requestId` *(optional because ad hoc unsaved requests may be executed)*
- `requestSnapshot` *(required; exact schema to be aligned with T007)*
- `environmentId` *(optional)*
- `status` *(queued, running, succeeded, failed, cancelled; tentative)*
- `startedAt`
- `completedAt` *(optional)*
- `durationMs` *(optional)*
- `resultId` *(optional)*
- `createdAt`

### 4.12 ExecutionResult
**Role:** Normalized output of an execution pipeline, including network response and script logs.

**Draft fields**
- `id`
- `executionHistoryId`
- `httpStatus` *(optional if request never reached network)*
- `responseHeaders`
- `responseBody`
- `responseBodyType` *(optional)*
- `consoleLogs` *(array)*
- `errorSummary` *(optional)*
- `postResponseOutput` *(optional)*
- `createdAt`

**Status:** confirmed as needed, final split between history/result can change.

### 4.13 TestResult
**Role:** Structured outcome of assertions executed during the test phase.

**Draft fields**
- `id`
- `executionHistoryId`
- `status`
- `assertions` *(array with name, outcome, message)*
- `summary`
- `createdAt`

**Status:** exact relationship to `ExecutionResult` is **확실하지 않음**.

### 4.14 CapturedRequest
**Role:** Runtime record of an inbound request observed by the local server.

**Core responsibilities**
- preserve normalized inbound metadata for inspection, replay, or later conversion into mock/templates
- remain distinct from saved outbound `Request`

**Draft fields**
- `id`
- `workspaceId` *(optional if capture is globally scoped; 확실하지 않음)*
- `receivedAt`
- `method`
- `url`
- `path`
- `query`
- `headers`
- `rawHeaders`
- `body`
- `rawBody`
- `matchedMockRuleId` *(optional)*
- `responseStatus` *(optional)*
- `responseHeaders` *(optional)*
- `responseBody` *(optional)*

## 5. Relationship Summary
- `Workspace` 1—N `Collection`
- `Workspace` 1—N `Environment`
- `Workspace` 1—N `MockRule`
- `Workspace` 1—N `Script`
- `Workspace` 1—N `ScriptTemplate`
- `Workspace` 1—N `ExecutionHistory`
- `Workspace` 1—N `CapturedRequest` *(tentative)*
- `Collection` 1—N `RequestGroup`
- `RequestGroup` 1—N `Request`
- `Environment` 1—N `EnvironmentVariable`
- `ExecutionHistory` 1—1 `ExecutionResult` *(tentative)*
- `ExecutionHistory` 1—N `TestResult` *(tentative)*

## 6. Modeling Notes for Follow-Up Tasks
### For T004 Persistence Strategy
- Entities split naturally into low-change resources vs high-volume runtime records.
- `CapturedRequest` and `ExecutionHistory` may need different retention policies from `Workspace` resources.

### For T005 Script Execution Safety Model
- `Script`, `ExecutionResult`, and `TestResult` need clear contracts for log/error/output capture.
- Secret handling must avoid leaking into history/result storage.

### For T007 Shared Domain Schema
- Value objects and enum lists need to be formalized.
- Snapshot schemas (`requestSnapshot`, response bodies, matcher objects) still need canonical definitions.

## 7. Open Questions
1. Whether `Secret` should be a standalone entity or a storage policy behind `EnvironmentVariable` is **확실하지 않음**.
2. Whether `ExecutionResult` and `TestResult` remain separate persisted entities is **확실하지 않음**.
3. Whether `CapturedRequest` belongs to a workspace or to a global local runtime scope is **확실하지 않음**.
4. Whether scripts are referenceable shared resources, embedded request fields, or both is **확실하지 않음**.









