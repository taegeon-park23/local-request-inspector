# T075 Secret Backend Contract And Capability Surface

- **Purpose:** Define the first secure secret provider contract behind the shipped fail-closed environment seam so later implementation can attach a real backend without reopening storage, resolution, or diagnostics policy ad hoc.
- **Created:** 2026-03-25
- **Last Updated:** 2026-03-25
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../architecture/persistence-strategy.md`, `../architecture/script-execution-safety-model.md`, `../architecture/request-environment-selection-and-resolution.md`
- **Status:** doing
- **Update Rule:** Update when scope, provider contract, migration rules, or verification plan changes.

## Scope
- Define the first secure secret provider contract for `status`, `store`, `resolve`, and `clear` operations.
- Keep raw secret material out of ordinary environment JSON, API read models, logs, and persisted runtime artifacts.
- Carry forward the shipped `secretStorage` runtime-status diagnostics seam and decide which fields remain canonical for later provider implementations.

## In Scope
- Provider-facing interface and stable error contract.
- Environment mutation behavior when the provider is present versus unavailable.
- Runtime secret-placeholder resolution contract and redaction rules.
- Migration/reporting rules for legacy secret-bearing rows already sanitized by `T074`.
- Capability/status reporting fields that Settings and environment management should rely on.

## Out Of Scope
- Implementing a real OS keychain or encrypted secret backend.
- UI redesign beyond bounded contract-alignment changes.
- Broader import/export, packaging, or script-capability work.

## Fixed Decisions
- Error-code expansion stays minimal: keep `secret_storage_unavailable` and add only `secret_provider_error` as the new generic provider-failure code.
- Provider contract is fixed as async `status/store/resolve/clear` and remains backend-agnostic.
- Secret locator is derived only from `workspaceId + environmentId + variableId` without adding new environment JSON schema fields.
- In unavailable-provider mode:
  - `store` remains fail-closed (`409 secret_storage_unavailable`).
  - `clearStoredValue` is allowed and only clears metadata (`hasStoredValue=false`) without provider calls.
- Runtime-status keeps `secretStorage` as canonical and extends only with optional provider metadata (`providerId?`, `providerVersion?`, `providerStatus?`, `capabilities?`).
- Runtime execution keeps the current transport block lane and records secret-provider failures with redaction-safe summaries only.

## Implementation Notes (Current)
- `server/secret-provider.js` now defines the unavailable adapter plus provider-status normalization.
- `server/environment-secret-policy-service.js` now owns mutation planning (`store|clear|noop`), provider call mapping, locator derivation, execution-time secret resolve hook, and runtime-status snapshot composition.
- Environment create/update routes use `applyEnvironmentSecretMutations` before persistence.
- Execution routes now call `resolveEnvironmentSecretValues` before placeholder substitution and block transport with `secret_provider_error` on provider failures.
- Placeholder resolution now accepts optional secret lookup injection without changing plain-variable default behavior.
- Settings type/fixture and runtime-status seam are backward compatible with optional provider metadata fields.

## Verification
- `npm.cmd run typecheck` passed on 2026-03-25.
- `npm.cmd run lint` passed on 2026-03-25.
- `npm.cmd run test:node` passed on 2026-03-25.
- UI full-suite policy remains unchanged: user-managed `npm.cmd run test:ui` is authoritative.

## Ready Inputs
- `T074` shipped fail-closed mutation policy, write-only environment record shape, runtime-status secret-storage diagnostics, and legacy secret-row sanitize reporting.
- The current secret-storage seam lives in `server/environment-secret-policy-service.js`, `server/environment-script-resource-service.js`, `storage/resource/environment-record.js`, and `storage/shared/runtime-status.js`.

## Open Questions
- Which provider states beyond `providerStatus` optional metadata should become hard requirements before a real backend adapter lands is **확실하지 않음**.
- Whether migration/reporting should remain read-time only or gain an explicit admin/report surface once a provider exists is **확실하지 않음**.
