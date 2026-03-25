# T075 Secret Backend Contract And Capability Surface

- **Purpose:** Define the first secure secret provider contract behind the shipped fail-closed environment seam so later implementation can attach a real backend without reopening storage, resolution, or diagnostics policy ad hoc.
- **Created:** 2026-03-25
- **Last Updated:** 2026-03-25
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../architecture/persistence-strategy.md`, `../architecture/script-execution-safety-model.md`, `../architecture/request-environment-selection-and-resolution.md`
- **Status:** todo
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

## Verification Plan
- Keep live tracker docs, task doc, and related architecture references aligned.
- If code seams change during this task, keep `npm.cmd run check` green.
- Any UI verification beyond Codex smoke remains user-managed via `npm.cmd run test:ui`.

## Ready Inputs
- `T074` shipped fail-closed mutation policy, write-only environment record shape, runtime-status secret-storage diagnostics, and legacy secret-row sanitize reporting.
- The current secret-storage seam lives in `server/environment-secret-policy-service.js`, `server/environment-script-resource-service.js`, `storage/resource/environment-record.js`, and `storage/shared/runtime-status.js`.

## Open Questions
- Which provider states need first-class API codes beyond `secret_storage_unavailable`.
- Whether migration/reporting should remain read-time only or gain an explicit admin/report surface once a provider exists.
- Whether one provider contract is enough for MVP or whether provider type/version should be explicit from day one.
