# Request Environment Selection And Resolution

- **Purpose:** Define the bounded next-step design for request-level environment selection and server-owned environment resolution after `T027` made environments a real persisted workflow surface.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-25
- **Related Documents:** `request-builder-mvp.md`, `internal-api-contracts.md`, `script-execution-safety-model.md`, `workspace-flows.md`
- **Status:** implemented baseline
- **Update Rule:** Update when request-level environment selection, environment resolution ownership, or runtime secret-handling boundaries materially change.

## 1. Summary
This document originally narrowed the next environment-related implementation step after `T027`, and now also records the implemented baseline from `T030`. The current baseline is request-level environment selection inside the `Workspace` request header plus server-owned environment resolution during request execution. The implemented slice still does **not** include a top-bar global environment selector, full resolved-preview UI, or environment import/export expansion.

## 2. Why This Exists Now
- `T027` made `/environments` a real persisted management surface, so the repo now has an actual environment workflow object rather than just planning language.
- The request builder already assumes environment selection and environment resolution conceptually, but the current code and docs still need one bounded design before implementation resumes.
- Secret rows are now write-only in the environment route, which means client-side resolution would be the wrong ownership model for the next step.

## 3. Goals
- add one request-level environment selector to the request header strip
- make save/run behavior deterministic for selected environments
- keep secret resolution server-owned
- preserve the request-definition lane versus execution-history lane split
- define missing-reference behavior before implementation starts

## 4. Non-Goals
- no top-bar or cross-tab global environment selector
- no environment management changes inside `/environments`
- no full resolved-request preview panel
- no environment import/export support
- no settings mutation or preferences
- no request-stage standalone script attachment/reference work

## 5. Selected Product Decisions
### 5.1 Selector placement
- The selector lives in the request header strip inside the active request work surface.
- It is request-specific, not global to the shell.
- Top-bar environment selection stays deferred.

### 5.2 Initial selection behavior
- A newly created request tab initializes to the current workspace default environment if one exists.
- Users can explicitly change the selection to another environment or to `No environment`.
- The workspace default is therefore a creation-time seed, not a runtime fallback.

### 5.3 Persistence rule
- The request definition persists one field: `selectedEnvironmentId: string | null`.
- Saving a request stores the currently selected environment id or `null` for explicit no-environment behavior.
- Saved requests do not silently track later default-environment changes.

### 5.4 Runtime rule
- Run requests send `selectedEnvironmentId` as execution input.
- The server resolves variables against the persisted environment record.
- The client never resolves secret-backed values locally because the read model intentionally masks them.

### 5.5 Missing-reference rule
- If a saved request points at an environment id that no longer exists, the request builder surfaces a `Missing environment` state in the selector.
- Save and run are blocked until the user chooses an available environment or `No environment`.
- The system must not silently rewrite the missing selection during load.

### 5.6 Default-environment change rule
- Changing the workspace default environment affects only future new-request initialization.
- Existing request drafts and saved requests keep their explicit selected environment unless the user changes them.

## 6. Resolution Ownership
### 6.1 Client responsibilities
- show current selected environment label/state
- persist `selectedEnvironmentId` in request definitions
- send authored request input plus `selectedEnvironmentId` to the run endpoint
- render unresolved-variable and missing-environment validation feedback returned from the server

### 6.2 Server responsibilities
- load the persisted environment record for `selectedEnvironmentId`
- resolve variables into URL, params, headers, body, and auth inputs
- keep secret raw values off the client DTO surface
- produce bounded validation diagnostics and runtime history metadata

### 6.3 Why server-owned resolution wins
- `/environments` intentionally returns masked secret rows
- runtime history already persists only bounded labels and summaries
- script execution safety guidance already expects controlled environment access rather than a raw secret catalog

## 7. Data Contract Adjustments
### 7.1 Request definition lane
Add to saved request definition and draft state:
- `selectedEnvironmentId: string | null`

### 7.2 Execution command lane
Use:
- `environmentId: string | null`

### 7.3 Runtime artifact lane
Persist:
- `environmentId`
- environment label used at execution time

Do not persist:
- raw resolved environment variable maps
- raw secret values

## 8. Validation Model
### 8.1 Blocking run conditions
- selected environment reference is missing
- selected environment exists but placeholder substitution still leaves unresolved placeholders in active execution inputs
- malformed JSON/body/auth validation already fails independently

### 8.2 Non-blocking warnings
- unresolved placeholders warning tiers beyond the current blocking model remain deferred
- environment selected but currently contributes no variables

### 8.3 Save behavior
- Save is allowed with `No environment`
- Save is not allowed while the request still references a deleted/missing environment id

## 9. UI Scope For The Next Implementation Slice
- request header selector with current environment chip/label
- `No environment` option
- visible default badge or summary for the currently selected default-seeded environment
- inline warning for missing environment reference
- no dedicated resolved-preview inspector yet

## 10. Authoring Guidance Alignment
### 10.1 Placeholder syntax used in runtime resolution
- The implemented runtime resolution baseline uses bounded `{{VARIABLE_NAME}}` placeholder substitution.
- Current request-resolution docs explicitly call out substitution in URL, params, headers, body, and auth inputs.
- Management-surface guidance in `/environments` should therefore demonstrate examples such as:
  - URL: `https://api.example.com/{{baseUrl}}/users`
  - Header: `Authorization: Bearer {{token}}`
  - JSON body: `{ "workspaceId": "{{workspaceId}}" }`

### 10.2 Secret versus plain rows in route guidance
- Plain rows may continue showing their authored value in the environment-management route.
- Secret rows remain write-only in the route read model.
- `hasStoredValue` indicates only whether a secret-backed value is already stored.
- `replacementValue` is the write-only replacement payload used during save; it is not a readable echo of the stored secret.

### 10.3 Script access wording
- The architecture safety guidance recommends a controlled `env` object or getter API for script access.
- Example guidance may therefore use `env.get('token')` as the current best-aligned script example.
- The exact final runtime helper surface is still **확실하지 않음** because the current docs describe the capability shape but do not yet freeze a concrete script API contract in code-facing detail.

## 11. Open Questions
1. Whether the request header should also show a compact "default-seeded" hint for newly created requests remains **확실하지 않음**.
2. Whether unresolved placeholders should later split into blocking vs warning-only tiers remains **확실하지 않음**.
3. Whether environment labels should be copied into saved-request summaries for explorer readability remains **확실하지 않음**.
4. Whether the future script runtime should keep `env.get(...)` exactly or expose a closely related helper name remains **확실하지 않음**.

## 12. Canonical Decision
The implemented environment baseline is request-level selector plus server-owned run-time resolution, not a top-bar global selector. The request definition persists explicit `selectedEnvironmentId`, new requests seed from the current workspace default only at creation time, and deleted environment references surface as a blocking missing-reference state instead of being silently cleared.
## 13. T075 Secret Provider Contract Alignment
- Runtime environment resolution now has an explicit provider seam before placeholder substitution.
- The provider contract is fixed as async `status/store/resolve/clear`; the default runtime adapter remains `unavailable` until a real secure backend is attached.
- Execution-time flow:
  - read selected environment reference
  - resolve secret-backed values through provider when available
  - merge resolved secret lookup with plain variable lookup
  - run placeholder substitution through the existing unresolved-placeholder validator
- Failure behavior remains deterministic:
  - provider unavailable: secret placeholders remain unresolved and execution is blocked by the existing unresolved-placeholder rule
  - provider internal failure: execution is blocked with `secret_provider_error` and a redaction-safe summary
- Persisted runtime artifacts still store only bounded summaries and status metadata; raw secret values do not cross this boundary.
