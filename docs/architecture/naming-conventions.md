# Naming Conventions

- **Purpose:** Define stable naming conventions across documentation, schemas, code, APIs, and events for the Local API Workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `shared-schema.md`, `domain-model.md`, `overview.md`
- **Status:** done
- **Update Rule:** Update when canonical terminology or naming rules materially change.

## 1. Naming Principles
- Prefer terms that reflect product concepts rather than incidental implementation details.
- Use one canonical term per concept across docs, schemas, APIs, and UI whenever possible.
- Avoid mixing “request log”, “history entry”, and “captured request” if they represent different concepts.
- Prefer explicitness over short ambiguous names.

## 2. Entity Naming Rules
- Entity names use **singular PascalCase**.
  - `Workspace`
  - `Collection`
  - `Request`
  - `CapturedRequest`
- Value object names also use singular PascalCase.
  - `RequestHeader`
  - `QueryParam`
  - `MockResponseDefinition`
- Enum names use PascalCase and end with a domain noun when needed.
  - `ExecutionStatus`
  - `ScriptType`
  - `RequestBodyType`

## 3. Field Naming Rules
- Fields use **lowerCamelCase**.
- IDs use `id` for self and `<entity>Id` for references.
- Timestamps use explicit event semantics:
  - `createdAt`
  - `updatedAt`
  - `receivedAt`
  - `startedAt`
  - `completedAt`
- Booleans should prefer `is`, `has`, or explicit adjectival forms.
  - `isEnabled`
  - `isFavorite`
  - `isDefault`

## 4. Singular / Plural Rules
- Schema type names: singular (`Request`, `ExecutionResult`)
- Collection fields: plural (`headers`, `queryParams`, `testResultIds`)
- API resource path segments: plural (`/workspaces`, `/requests`, `/mock-rules`)
- Event names: singular subject + past-tense verb or lifecycle phase (`captured-request.received`)

## 5. Domain Prefix / Suffix Rules
### Request Domain
- types: `Request`, `RequestBodyDefinition`, `RequestHeader`, `RequestSummaryDto`
- avoid ambiguous `ApiRequest` unless distinguishing from inbound framework request objects becomes necessary

### Execution Domain
- use `ExecutionHistory` for the execution record
- use `ExecutionResult` for normalized execution output
- use `TestResult` for assertion outcomes
- avoid calling `ExecutionHistory` simply `Log`

### Capture Domain
- use `CapturedRequest` for inbound observed traffic
- avoid using `RequestHistory` for captured inbound traffic
- use `CaptureStreamEvent` or specific event names for transport-level streaming types if needed

### Mock Domain
- use `MockRule`, `MockMatchCriteria`, `MockResponseDefinition`, `MockScenarioState`
- avoid vague names like `MockConfig` once the new model is adopted

### Script Domain
- use `Script` for saved code resource
- use `ScriptTemplate` for reusable starter content
- use `scriptType` values `preRequest`, `postResponse`, `test`
- avoid mixing `callback`, `runner`, and `script` for the same concept unless specifically referring to the current legacy implementation

## 6. File Naming Rules
### Documentation Files
- markdown files use kebab-case
- task files use `task-<id>-<name>.md`
- architecture docs use descriptive kebab-case names
  - `shared-schema.md`
  - `naming-conventions.md`

### Code File Guidance
- type/schema files should use kebab-case or the project’s future standard consistently; exact code-level file case is **확실하지 않음** until T006/tooling decisions land.
- whatever convention is chosen, entity/schema files should not mix multiple naming systems in the same module tree.

## 7. API Path Naming Rules
- API path segments use **kebab-case plural nouns**.
- Prefer resource-oriented paths over verb-heavy paths.

Examples:
- `/workspaces`
- `/collections`
- `/folders`
- `/requests`
- `/environments`
- `/scripts`
- `/script-templates`
- `/mock-rules`
- `/captured-requests`
- `/execution-histories`

Operation-oriented exceptions are acceptable for execution or stream semantics, for example:
- `/executions/run`
- `/events/captured-requests`

Exact route layout remains **확실하지 않음** until T008.

## 8. Event Naming Rules
- Event names use **kebab-case subject** + `.` + lifecycle/action.
- Recommended pattern:
  - `captured-request.received`
  - `execution.started`
  - `execution.completed`
  - `execution.failed`
  - `mock-rule.matched`
  - `workspace.updated`

Rules:
- event subject should be singular
- lifecycle/action should be short and past/present-phase consistent
- transport channel names and event names should not be conflated

## 9. DTO Naming Rules
- list-view payloads: `*SummaryDto`
- detail-view payloads: `*DetailDto`
- create/update commands: `Create*Input`, `Update*Input`
- stream/event payloads: `*Event` or `*EventDto`

Examples:
- `RequestSummaryDto`
- `CapturedRequestEvent`
- `CreateMockRuleInput`
- `ExecutionHistoryDetailDto`

## 10. Workspace vs Global Scope Naming Rules
- workspace-scoped resources should use `workspaceId` explicitly.
- global local runtime artifacts should only use `workspaceId` when ownership is intentionally attached.
- if a runtime artifact is imported into a workspace-managed collection later, that should be modeled as conversion/import, not as implicit scope inheritance.

## 11. Preferred Canonical Terms
Use these preferred terms consistently:
- `Workspace`
- `Request`
- `CapturedRequest`
- `ExecutionHistory`
- `ExecutionResult`
- `TestResult`
- `MockRule`
- `Script`
- `ScriptTemplate`
- `EnvironmentVariable`

## 12. Confusing / Discouraged Terms
Avoid these unless specifically describing legacy behavior:
- `MockConfig` — use `MockRule` or `MockResponseDefinition`
- `CallbackCode` as the long-term product term — use `Script` or `postResponse script`
- `History` by itself when you mean `ExecutionHistory` or `CapturedRequest`
- `RequestLog` when you mean either execution history or captured inbound request
- `Template` by itself when the distinction between request/script/mock template matters
- `RawRequest` as a canonical entity name; use `CapturedRequest` with `rawBody` / `rawHeaders`

## 13. Document / Code Vocabulary Alignment Rules
- If documentation introduces a canonical term, future code, APIs, and UI labels should prefer the same term unless there is a strong implementation-specific reason not to.
- When legacy terms appear in current code (for example `mockConfig` or callback-oriented naming), architecture docs should explicitly map them to the future canonical term.
- If a future task intentionally changes canonical vocabulary, it must update both `shared-schema.md` and this document.

## 14. Open Questions
1. Whether `ExecutionHistory` should eventually be shortened in UI copy while preserving canonical schema naming is **확실하지 않음**.
2. Whether `ExecutionRecord` is a better transport/API term than `ExecutionHistory` is **확실하지 않음**.
3. Whether system-provided templates should be named `SystemScriptTemplate` in code is **확실하지 않음**.
