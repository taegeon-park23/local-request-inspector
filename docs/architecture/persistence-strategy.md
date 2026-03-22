# Persistence Strategy Decision

- **Purpose:** Compare local persistence options and recommend a storage direction for workspace resources and runtime artifacts in the Local API Workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-22
- **Related Documents:** `shared-schema.md`, `overview.md`, `migration-plan.md`, `../tasks/task-004-persistence-strategy-decision.md`
- **Status:** done
- **Update Rule:** Update when storage decisions, entity placement, or retention policy assumptions change.

## 1. Decision Context
The product is a **local-first developer tool** with two broad data classes:
- **low-volume user-managed resources** such as workspaces, requests, environments, scripts, and mock rules
- **high-volume runtime artifacts** such as captured inbound requests, execution history, execution results, and test results

This mix means the persistence strategy must serve both:
- human-editable, backup-friendly resource data
- append-heavy, query-heavy runtime data with retention concerns

## 2. Comparison Criteria
The options are compared using these criteria:
1. local-first ergonomics
2. fit for low-volume user-managed resources
3. fit for high-volume runtime artifacts
4. filtering / indexing / query capability
5. backup / export friendliness
6. migration and schema evolution cost
7. operational simplicity for a local tool
8. future support for T005, T008, and T009

## 3. Option Comparison
### 3.1 Summary Table
| Option | Strengths | Weaknesses | Best Fit | Recommendation |
| --- | --- | --- | --- | --- |
| JSON files only | Very transparent, easy manual backup/export, simple diffability | Weak querying, indexing, retention, and append-heavy runtime handling | Small user-managed resource sets | Not recommended as the only store |
| SQLite only | Strong local query/index support, single-file backup, handles mixed workloads | Less human-readable, some export ergonomics need tooling, secret handling still needs policy | Unified local store for resources + runtime data | Viable, but not ideal for all concerns |
| Hybrid (JSON + SQLite) | Best match to data shape split; readable config-like resources + efficient runtime querying | More moving parts, migration boundaries need discipline | Local-first tool with mixed low/high-volume storage needs | Recommended MVP direction |

### 3.2 JSON Files Only
**Pros**
- easy to inspect and edit manually
- easy to export/import or sync as files
- friendly for low-volume structured configuration data
- low implementation complexity for basic resource CRUD

**Cons**
- poor fit for high-volume append/query patterns
- filtering captured requests or execution histories becomes expensive or ad hoc
- concurrency and atomic update patterns become more error-prone as the tool grows
- indexing, retention cleanup, and reporting are awkward

**Local-tool assessment**
JSON files are attractive for user-authored resources because users often value portability and easy backup. However, for a Postman-like local workbench that can accumulate many captures and execution runs, JSON-only creates avoidable friction.

### 3.3 SQLite Only
**Pros**
- excellent local query, filter, sort, and retention capabilities
- single-file backup story is still good
- natural fit for runtime artifacts and indexed history
- supports joins or equivalent relations between request, environment, and execution records

**Cons**
- less human-readable than JSON resources
- import/export of user-authored resources may need an explicit export layer
- if secrets are stored at all, encryption/key management remains separate from “database choice”
- initial schema migration discipline becomes more important

**Local-tool assessment**
SQLite is a strong default for local tools because it combines “runs locally, no server dependency” with mature query behavior. If the product prioritized simplicity of one storage engine over all else, SQLite-only would be the strongest single-store option.

### 3.4 Hybrid (JSON + SQLite)
**Shape**
- JSON files for low-volume user-managed resources
- SQLite for high-volume runtime artifacts and indices
- secret storage handled by separate policy, not assumed to be plain JSON or plain SQLite by default

**Pros**
- keeps user-authored resources readable and export-friendly
- gives runtime artifacts a queryable/indexable local store
- aligns well with the domain split already established in T007
- reduces pressure to force one storage model onto fundamentally different data patterns

**Cons**
- requires explicit repository boundaries and sync rules
- backups must account for two stores instead of one
- migrations must cover both file schemas and database schemas
- cross-store references must remain simple and disciplined

**Local-tool assessment**
For a local API workbench, hybrid is the most proportionate answer because it respects the difference between “things the user curates” and “things the app generates continuously.” It also preserves a good local backup story without sacrificing runtime querying.

## 4. Why Separate Low-Volume and High-Volume Data
### 4.1 Low-Volume User-Managed Data
These objects change intentionally and are often edited, copied, exported, or reviewed by users:
- `Workspace`
- `Collection`
- `Folder`
- `Request`
- `Environment`
- `EnvironmentVariable`
- `Script`
- `ScriptTemplate`
- `MockRule`
- `MockScenarioState` *(if persisted)*

Desired qualities:
- human-oriented backup/export
- clear versionability
- stable schemas
- infrequent writes

### 4.2 High-Volume Runtime Data
These objects grow through usage and require filtering, retention, and timeline queries:
- `CapturedRequest`
- `ExecutionHistory`
- `ExecutionResult`
- `TestResult`

Desired qualities:
- append efficiency
- indexed filtering and search
- retention cleanup support
- efficient timeline and detail queries

### 4.3 Conclusion
A single store can support both classes, but a hybrid approach fits their operational profiles more naturally.

## 5. Entity-by-Entity Storage Recommendation
### 5.1 Recommended MVP Placement
| Entity | Category | Recommended store | Reasoning |
| --- | --- | --- | --- |
| Workspace | persisted resource | JSON | low volume, user-managed, good portability |
| Collection | persisted resource | JSON | hierarchical workspace content, easy export |
| Folder | persisted resource | JSON | tree data with user-centric editing |
| Request | persisted resource | JSON | core user-authored definition |
| Environment | persisted resource | JSON | user-managed config set |
| EnvironmentVariable | persisted resource | JSON with secret-reference policy | config-like, low volume |
| Script | persisted resource | JSON | user-authored code asset |
| ScriptTemplate | persisted resource / system seed | JSON | seed/export-friendly |
| MockRule | persisted resource | JSON | declarative resource, low write volume |
| MockScenarioState | 확실하지 않음 | SQLite if runtime-heavy; JSON if persisted configuration-like | depends on whether it behaves like mutable runtime state |
| CapturedRequest | runtime artifact | SQLite | append-heavy with filter/retention needs |
| ExecutionHistory | runtime artifact | SQLite | indexed timelines and replay support |
| ExecutionResult | runtime artifact | SQLite | detail storage and result querying |
| TestResult | runtime artifact | SQLite | structured assertion outcomes, queryable by status |
| Secret | 확실하지 않음 | separate secret policy | should not be decided purely by JSON vs SQLite |

### 5.2 Secret Storage Policy
`Secret` should not be treated as “just another JSON field” by default.

Options:
1. store encrypted values in the same persistence layer as workspace resources
2. store only secret references in app-managed storage and keep raw values in OS keychain / secure store
3. keep secret support minimal in MVP and avoid strong commitment until T005 clarifies security posture

**Recommended MVP direction**
- keep `EnvironmentVariable` as the shared schema entry point
- prefer storing **references or masked placeholders** in JSON resources
- raw secret storage policy remains **확실하지 않음**, but should be separated from ordinary resource persistence and finalized with T005

### 5.3 MockScenarioState Treatment
`MockScenarioState` depends on feature shape:
- if scenarios are ephemeral runtime progression state, SQLite is a better fit
- if scenarios are static authored mock configurations, JSON may be enough

**Recommendation**
- do not commit to `MockScenarioState` as a persisted JSON resource in MVP
- treat it as **확실하지 않음** until scenario-based mocking is firmly in scope

## 6. Runtime Artifact Separation Strategy
### 6.1 Same Physical Store vs Separate Store
**Option A — Same physical SQLite database for all runtime artifacts**
- simpler query joins across `CapturedRequest`, `ExecutionHistory`, `ExecutionResult`, `TestResult`
- easier unified retention and indexing

**Option B — Separate runtime stores by artifact type**
- could isolate growth and retention policies
- but adds operational complexity early

**Recommendation**
- use one runtime artifact store for MVP, preferably SQLite
- separate by tables/collections inside the store, not by multiple databases at the start

### 6.2 Same Store as Persisted Resources?
**Not recommended for MVP hybrid approach.**
Keeping user-managed resources and runtime artifacts in one SQLite database is viable, but the hybrid split is easier to reason about for exportability and retention.

## 7. Indexing, Query, and Retention Considerations
### 7.1 Query Patterns to Support
Runtime artifacts likely need:
- filter by method / path / status / time range
- find executions by requestId or workspaceId
- search recent captures
- sort by startedAt / receivedAt / durationMs
- load detail payloads on demand

These patterns strongly favor SQLite over flat JSON files for runtime data.

### 7.2 Retention Strategy
MVP should plan for bounded retention at least conceptually.

Candidate retention rules:
- keep last N captured requests per workspace or globally
- keep last N execution histories per workspace
- optionally age out large response bodies before metadata

Exact defaults are **확실하지 않음**, but the store must make retention cleanup cheap enough to add later.

## 8. Backup / Export / Migration View
### 8.1 Backup
- JSON resource files are easy to back up individually or by workspace folder
- SQLite runtime store is easy to back up as a single file
- hybrid means backup should package both resource files and runtime DB, optionally with secrets excluded or referenced only

### 8.2 Export
- export/import for user-authored resources should prefer JSON-based bundles
- runtime artifacts do not need the same export priority in MVP
- a future export command can include or omit runtime history separately

### 8.3 Migration
Hybrid introduces two migration surfaces:
- JSON schema evolution for resource files
- DB schema migration for runtime artifacts

This is acceptable if repository boundaries are explicit and model-to-storage adapters are well-defined.

## 9. DTO / Persisted Model / Runtime Model Separation and Storage Impact
The conceptual split established in T007 affects storage in a good way:
- persisted models can stay close to user-authored JSON representation
- runtime models can optimize for indexed queryability
- DTOs can evolve independently without forcing storage schema churn for every API change

**Recommendation**
- do not tie transport DTO shapes directly to storage shapes
- define repository-level models explicitly for resource persistence and runtime persistence
- let T008 derive API contracts from schemas, not from storage internals

## 10. Recommended MVP Direction
### 10.1 Recommendation
Adopt a **hybrid persistence strategy** for MVP:
- **JSON files** for low-volume user-managed resources
- **SQLite** for high-volume runtime artifacts
- **separate secret policy** for raw secret values

### 10.2 Why This Is Appropriate
This direction is appropriate because the product is a local developer tool, not a server platform. Users benefit from:
- readable/exportable resource definitions
- strong runtime history and capture querying
- local backups that remain understandable and manageable
- lower pressure to over-engineer persistence too early

### 10.3 What to Defer
- final raw secret storage mechanism
- whether `MockScenarioState` is persisted in MVP
- exact retention defaults
- whether runtime artifacts need a unified timeline projection table/view

## 11. Option Summary for Future Revisit
If future complexity grows, the product may still migrate to:
- SQLite-only for simpler operational packaging
- a more advanced local DB strategy if search/history volume grows substantially

That possibility should not block the hybrid MVP decision now.

## 12. Inputs for Follow-Up Tasks
### For T005 Script Execution Safety Model
- design secret handling assuming raw secret values are not ordinary JSON resource fields
- ensure execution logs/results do not persist sensitive resolved secret values by default
- define which script outputs are persisted into runtime SQLite tables

### For T008 Internal API Contract Design
- keep API contracts storage-agnostic
- design resource APIs around JSON-managed workspace resources
- design history/capture APIs around queryable runtime records
- plan DTOs that can aggregate across stores without exposing store internals

### For T009 Workspace Persistence Bootstrap
- create separate repository adapters for resource storage and runtime storage
- start with JSON resource repositories and one SQLite runtime database
- keep migration/version metadata explicit from the first implementation pass

## 13. Remaining Uncertainties
1. raw secret value handling remains **확실하지 않음**.
2. `MockScenarioState` persistence remains **확실하지 않음**.
3. exact retention defaults remain **확실하지 않음**.
4. whether some small runtime artifacts should be inlined into history rows remains **확실하지 않음**.
