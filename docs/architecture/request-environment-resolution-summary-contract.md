# Request Environment Resolution Summary Contract

- **Purpose:** Define the bounded future contract for exposing environment resolution outcomes in post-run observation surfaces without turning the request builder into a full resolved-request inspector.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `request-builder-mvp.md`, `request-environment-selection-and-resolution.md`, `internal-api-contracts.md`, `script-execution-safety-model.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../tasks/task-034-post-t033-resolution-summary-contract.md`
- **Status:** proposed future contract
- **Update Rule:** Update when the execution/history environment summary payload changes materially or when the future implementation narrows or widens this observation slice.

## 1. Summary
`T030` implemented request-level environment selection and server-owned runtime resolution, but the active request result panel and persisted history still expose only one bounded `Environment` label. This note defines one future narrow follow-up: a shared post-run environment resolution summary for active execution observation and persisted history. The summary should describe what happened at a bounded metadata level, not expose raw resolved values, secret content, or a full resolved-request diff.

## 2. Why This Exists
- The request builder MVP already allows environment-backed execution and calls out that a resolved preview may later exist without exposing secrets.
- `T030` now resolves placeholders on the server and records only environment label metadata.
- `T033` narrowed the strongest future environment-observation lane to post-run bounded resolution summary in request-result and history surfaces.
- One explicit contract is needed before implementation so the next task does not widen into pre-run validation semantics, saved-request summary polish, or a full inspector.

## 3. Goals
- add one shared bounded summary object to execution observation and persisted history DTOs
- improve post-run clarity about how environment resolution affected execution inputs
- keep the server as the sole owner of secret-aware resolution logic
- reuse the same summary semantics in the active result panel and history detail
- avoid new route, tab, or global-state concepts

## 4. Non-Goals
- no raw resolved request snapshot
- no raw secret values or secret-derived previews
- no field-by-field diff viewer
- no dedicated resolved-preview tab
- no pre-run unresolved-feedback tiering
- no explorer or saved-request summary propagation
- no changes to request save/run semantics

## 5. Current Baseline
- Request drafts and saved requests persist `selectedEnvironmentId`.
- New drafts seed from the current default environment at creation time.
- Missing environment references already block save/run in the request surface.
- Server-owned execution resolution already:
  - substitutes placeholders in URL, params, headers, body, and auth
  - blocks transport when environment references are missing
  - blocks transport when placeholders remain unresolved
  - blocks transport when resolved JSON becomes invalid
- Active result observation and persisted history already expose:
  - `environmentId`
  - `environmentLabel`
  - stage summaries and bounded error copy

## 6. Selected Future Slice
### 6.1 Surface placement
The future implementation should extend the existing `Execution Info` presentation in:
- the active request result panel
- persisted history detail

It should **not** add:
- a new result tab
- a new top-level route
- a side-by-side authored-vs-resolved diff surface

### 6.2 Payload ownership
- The server computes the summary during execution.
- The execution observation DTO returns the summary.
- Persisted history stores the same summary object or a schema-compatible clone of it.
- The client renders the summary but does not derive it independently.

## 7. Shared DTO Shape
Add one shared object to execution/result/history DTOs:

```ts
interface EnvironmentResolutionSummary {
  status:
    | 'not-selected'
    | 'resolved'
    | 'blocked-missing-environment'
    | 'blocked-unresolved-placeholders'
    | 'blocked-invalid-resolved-json';
  summary: string;
  resolvedPlaceholderCount: number;
  unresolvedPlaceholderCount: number;
  affectedInputAreas: Array<'url' | 'params' | 'headers' | 'body' | 'auth'>;
}
```

### 7.1 Semantics
- `status` is the canonical bounded classification for what happened in environment resolution.
- `summary` is server-authored copy suitable for direct rendering in both active result and history surfaces.
- `resolvedPlaceholderCount` counts successful placeholder substitutions.
- `unresolvedPlaceholderCount` counts placeholders that remained unresolved after the server-owned resolution pass.
- `affectedInputAreas` lists only high-level authored input areas affected by substitution; it must not include raw values, exact field paths, or placeholder names.

### 7.2 Expected status usage
- `not-selected`
  - request ran without a selected environment
  - both counts are `0`
  - `affectedInputAreas` is empty
- `resolved`
  - selected environment existed and substitutions completed without unresolved placeholders
  - `resolvedPlaceholderCount` may be `0` if the selected environment contributed no substitutions
- `blocked-missing-environment`
  - selected environment reference was missing at execution time
  - both counts are `0`
- `blocked-unresolved-placeholders`
  - selected environment existed but placeholders still remained unresolved
  - `unresolvedPlaceholderCount` is greater than `0`
- `blocked-invalid-resolved-json`
  - substitution succeeded far enough to alter body content, but the resolved JSON became invalid
  - `affectedInputAreas` should include `body`

## 8. UI Contract
### 8.1 Active request result panel
Inside `Execution Info`, add one bounded subsection or meta group labeled `Environment resolution`.

Display:
- status copy from `summary`
- resolved placeholder count
- unresolved placeholder count when non-zero
- affected input areas as a compact human-readable list

Do not display:
- raw resolved URL/body/auth/header values
- placeholder names
- exact field paths

### 8.2 Persisted history detail
Mirror the same `Environment resolution` subsection inside `Execution Info`.

The history surface should:
- use the same summary object shape
- keep the same high-level labels
- remain observation-only

It should not:
- recalculate the summary on the client
- invent extra detail that the active result panel did not receive

## 9. Data and Persistence Boundaries
- The resolver helper will likely need to return both unresolved metadata and successful-resolution metadata.
- Persisted history should keep only the bounded summary object, not the full unresolved field-path list already available during server internals.
- Existing `environmentLabel` remains useful and should stay separate from `environmentResolutionSummary`.
- The summary object belongs to execution/result/history DTOs only; saved-request records do not gain this field.

## 10. Validation and Test Expectations
Future implementation should cover:
- node seam tests for resolver metadata counting and affected-area classification
- request-builder result-panel tests for successful and blocked environment resolution summaries
- history detail tests that mirror the same summary semantics
- no regression to current missing-environment and unresolved-placeholder blocking behavior

## 11. Explicit Non-Expansion Rules
- Do not widen this slice into client-side preview or local interpolation.
- Do not widen this slice into a new saved-request summary field.
- Do not widen this slice into a generic diagnostics or trace viewer.
- Do not widen this slice into pre-run validation-tier semantics.

## 12. Open Questions
1. Whether `resolvedPlaceholderCount` should count total substitutions or distinct placeholder names remains **확실하지 않음**.
2. Whether `resolved` with count `0` should render identical copy to `not-selected` or explicitly say that an environment was selected but contributed no substitutions remains **확실하지 않음**.
3. Whether blocked unresolved placeholders should reuse existing error copy exactly or keep a shorter observation-summary variant remains **확실하지 않음**.

## 13. Canonical Decision
The next narrow environment-observation contract is a shared post-run `EnvironmentResolutionSummary` object rendered in `Execution Info` for both the active request result panel and persisted history. It must stay server-authored, bounded, and metadata-only.
