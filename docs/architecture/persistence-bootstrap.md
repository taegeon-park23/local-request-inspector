# Persistence Bootstrap

- **Purpose:** Define and initialize the first persistence scaffold that turns the T004 hybrid storage decision into concrete repository and directory boundaries.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `persistence-strategy.md`, `shared-schema.md`, `internal-api-contracts.md`, `script-execution-safety-model.md`, `../tasks/task-009-workspace-persistence-bootstrap.md`
- **Status:** done
- **Update Rule:** Update when bootstrap storage boundaries, migration/version strategy, or local data directory rules materially change.

## 1. Goal
T009 is not the final persistence implementation. It is the first concrete scaffold that makes the hybrid storage decision executable:
- JSON-backed workspace resources
- SQLite-backed runtime artifacts
- repository boundaries that do not expose transport DTOs as storage shapes
- version metadata that keeps future migrations possible
- runtime persistence aligned with T005 redaction requirements

## 2. Bootstrap Scope
### Included now
- local data-root resolution strategy
- JSON resource storage adapter scaffold
- SQLite runtime storage adapter scaffold
- bootstrap migration SQL for runtime tables
- metadata/version manifest scaffold
- repository registry boundary draft

### Deferred intentionally
- full CRUD repository implementations for every entity
- secret vault/keychain integration
- retention policies beyond schema/index placeholders
- DTO-to-storage mapping layer for all APIs
- production-ready migration runner with ordered multiple migrations

## 3. Storage Split
### 3.1 JSON resource storage
The following entities are bootstrapped as JSON resources:
- Workspace
- Collection
- Folder
- Request
- Environment
- Script
- MockRule

Reasoning:
- user-managed, low-volume, readable artifacts
- easier backup/export and manual inspection
- aligns with T004 hybrid recommendation

### 3.2 SQLite runtime storage
The following artifacts are bootstrapped in SQLite:
- CapturedRequest
- ExecutionHistory
- ExecutionResult
- TestResult

Reasoning:
- append-heavy runtime data
- better filtering and timeline queries
- easier indexing for capture/history-oriented screens

## 4. Local Data Directory Draft
Current bootstrap default:
- environment override: `LRI_DATA_DIR`
- fallback default: `<process.cwd()>/.local-request-inspector`

Proposed internal layout:
- `resources/` — JSON resource entity folders
- `runtime/runtime.sqlite` — runtime artifact database
- `metadata/storage-version.json` — storage version manifest
- `metadata/resource-manifest.json` — resource storage manifest

This keeps runtime and resource data physically separate without creating multiple unrelated roots.

## 5. Resource Storage Adapter (JSON)
Bootstrap adapter responsibilities:
- create JSON entity directories for each resource type
- expose a stable `getEntityPath(entityType, entityId)` helper
- save/read resource documents without coupling to transport DTOs
- write a resource manifest that records entity coverage and schema version

Important guardrail:
- raw secret values must not be stored as ordinary resource fields through this adapter

## 6. Runtime Storage Adapter (SQLite)
Bootstrap runtime adapter responsibilities:
- create the runtime SQLite database if missing
- apply the bootstrap migration SQL
- set runtime metadata such as schema version and redacted-only mode
- provide starter write paths for execution history records

### Runtime tables in the bootstrap migration
- `runtime_metadata`
- `captured_requests`
- `execution_histories`
- `execution_results`
- `test_results`

### Runtime persistence principles
- runtime artifacts are persisted in redacted form only
- response/request body fields are stored as previews or redacted summaries rather than canonical raw payloads
- cancellation outcome and stage status remain first-class runtime fields
- log summaries are stored structurally, not as arbitrary transport DTO copies

## 7. Repository Boundary Draft
Bootstrap boundary:
- `storage/resource/*` owns JSON file concerns
- `storage/runtime/*` owns SQLite concerns
- `storage/repositories/*` exposes higher-level repository registry seams
- `storage/index.js` exposes a single `bootstrapPersistence()` entrypoint

This keeps the bootstrap composable while avoiding early leakage of fs/sqlite details into future route handlers or domain services.

## 8. Migration and Version Metadata Strategy
Current bootstrap versioning includes:
- `storage-version.json` manifest with resource/runtime modes and schema version
- `runtime_metadata` table in SQLite for runtime schema metadata
- `001-initial-runtime.sql` as the first explicit runtime migration

Why this matters:
- future schema evolution can add ordered migrations instead of replacing an opaque database file
- resource and runtime versioning can advance independently if needed
- the bootstrap does not assume the current storage shape is permanent

## 9. Redacted-Only Runtime Persistence
T005 requires runtime persistence to avoid raw secret material.
The bootstrap reflects that by:
- naming preview fields instead of canonical raw payload fields where possible
- marking redaction flags directly in runtime tables
- storing log summaries and stage-status summaries as structured JSON text
- treating raw secret persistence as out of scope and disallowed in the bootstrap adapter

## 10. Stage Status / Log Level / Cancellation Considerations
The bootstrap schema intentionally leaves room for:
- execution `status`
- `cancellation_outcome`
- stage status summary JSON
- structured log summary JSON
- `error_code` and `error_message`

This is enough to support later T012/T014/T016 work without prematurely freezing the final execution detail model.

## 11. Storage Shape vs DTO Shape
The bootstrap does **not** treat storage rows/files as API DTOs.
Rules:
- T008 DTOs stay transport-oriented
- JSON resource documents are storage records, not API responses
- SQLite runtime rows are storage records, not event payloads
- mapping/adaptation remains a future service/repository responsibility

## 12. Defer Items
- exact retention policy for runtime artifacts is **확실하지 않음**
- exact secret backend (keychain, encrypted file, env indirection) is **확실하지 않음**
- whether `Folder` should be persisted as a separate JSON entity or nested structure in MVP code is **확실하지 않음**
- whether runtime migrations remain on `node:sqlite` or move to a dedicated package is **확실하지 않음**

## 13. Files Added in the Bootstrap
- `storage/shared/constants.js`
- `storage/shared/data-root.js`
- `storage/resource/json-resource-storage.js`
- `storage/runtime/sqlite-runtime-storage.js`
- `storage/runtime/migrations/001-initial-runtime.sql`
- `storage/repositories/repository-registry.js`
- `storage/bootstrap/bootstrap-persistence.js`
- `storage/index.js`

## 14. Follow-up Inputs
- T011 can rely on resource/runtime separation when defining request-builder save/run behavior.
- T012 can assume runtime persistence stores only redacted log/result summaries.
- T014 can refine query and retention behavior against the seeded runtime schema.
- T017 can add tooling/scripts around the `bootstrapPersistence()` entrypoint and data-root conventions.
