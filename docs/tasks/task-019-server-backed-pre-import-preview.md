# T019 - Server-Backed Pre-Import Preview For Authored-Resource Bundles

- **Purpose:** Add a bounded, authoritative pre-import preview for the current saved-request/mock-rule authored-resource bundle flow so users can review import consequences before any writes occur.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-015-import-export-strategy.md`, `task-018-delivery-milestone-plan.md`, `task-010-frontend-workspace-shell-implementation-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/candidate-a-promotion-readiness.md`, `../tracking/candidate-a-gap-inventory.md`, `../tracking/candidate-a-narrow-candidate-comparison.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T019 promotes the strongest current Candidate A gap into one bounded follow-up task: a server-backed no-write preview for the existing workspace authored-resource import flow. The chosen framing is an authoritative dry-run preview plus explicit confirm step for the current saved-request/mock-rule bundle scope only. It replaces the previously ambiguous "pre-import preview" idea with one narrow direction that reuses shipped server validation and compatibility seams instead of duplicating them in the client.

## 2. Why This Task Matters Now
- The current workspace import flow starts persistence immediately after file selection, so users only see imported-name previews and reject summaries after the write path has already begun.
- Candidate A narrowing work already established that this is the strongest remaining authored-resource gap and that route-local mock import is the weaker option.
- The latest approach comparison now shows one defensible framing: server-backed dry-run preview fits current shipped seams better than client-only preview or a lightweight confirm step that lacks authoritative pre-write validation output.
- At T019 promotion time, `M3-F3` remained gated, so a non-visual, validation-friendly authored-resource task was a better implementation candidate than blocked TSX presentation work.

## 3. Input Sufficiency Check
The current planning and implementation package is sufficient to start T019 because the repo already ships:
- workspace-level authored-resource bundle import/export for saved requests and mock rules
- server-side bundle parsing, compatibility checks, resource validation, duplicate-name handling, and import summary creation
- a workspace explorer import control and post-import status surface
- low-level authored-resource bundle tests plus workspace import UI coverage

Repository re-check before promoting T019 confirmed:
- the only shipped import entrypoint is `client/features/workspace/components/WorkspaceExplorer.tsx`
- `client/features/workspace/components/WorkspacePlaceholder.tsx` reads the selected file and immediately posts bundle JSON to `/api/workspaces/:workspaceId/resource-bundle/import`
- `server.js` performs authoritative validation and import-summary generation on the server, and no preview-only or dry-run seam exists yet
- current post-import feedback already returns summary fields that can anchor a bounded preview without introducing new resource kinds or interoperability scope

## 4. Chosen Approach And Why It Won
### Chosen Approach
- **Approach B** wins: server-backed dry-run or no-write validation preview for the current workspace bundle import flow.
- The recommended framing is a dedicated preview seam for `/api/workspaces/:workspaceId/resource-bundle/import` rather than a client-only approximation.
- The preview should stay summary-level and require explicit user confirmation before the real import mutation runs.

### Why It Won
- It reuses the shipped server-side validation, compatibility, and duplicate-name logic instead of duplicating that logic in the client.
- It gives users a real pre-write answer to "what will happen if I import this bundle?" rather than only a generic confirm step.
- It fits the current request/mock authored-resource boundary cleanly and does not depend on new resource types, broader interoperability, or `M3-F3`.
- It has the cleanest validation path in the current environment: low-level Node seam tests plus workspace import UI tests.

### Why The Other Approaches Lost
- **Approach A - Client-only preview:** too likely to duplicate validation and compatibility logic already owned by the server, which risks preview drift and misleading results.
- **Approach C - Lightweight confirm step over current validation output:** too weak on its own because the current authoritative validation output only exists after the write-oriented import path begins; without a dry-run seam it becomes little more than a second click.

## 5. Scope
- Keep the task inside the existing workspace authored-resource import surface.
- Stay inside the current saved-request/mock-rule bundle format and `new_identity` policy.
- Add a no-write preview step that returns bounded import consequences before persistence.
- Show a summary-level preview only: accepted counts, rejected counts, created request count, created mock-rule count, renamed count, imported-name preview, rejected-reason summary, and duplicate-identity policy.
- Require an explicit confirm step before the actual import mutation runs.
- Preserve current post-import success and error summaries after the confirmed import completes.

## 6. Non-Goals
- No new authored-resource types such as environments or standalone scripts.
- No cURL, OpenAPI, Postman, or other external interoperability work.
- No mock-rule-local import entrypoint work.
- No per-item diff viewer, side-by-side review tool, or broad import-inspection platform.
- No write-time migration engine.
- No `M3-F3` retry, shell-scope reopening, or request-builder/result-panel TSX cleanup.

## 7. Outputs
- A bounded server-backed preview seam for workspace authored-resource import.
- A workspace import flow that separates preview from confirm-and-write.
- UI and low-level tests covering preview, confirm, cancel/back-out, and existing post-import status behavior.
- Tracking updates that keep T019 as the narrow Candidate A follow-up rather than reopening broad authored-resource tooling.

## 8. Risks
- Preview results can drift if the workspace resource lane changes between preview and confirm.
- A summary-only preview may feel limited if later users want per-item inspection.
- The task can still sprawl if it tries to solve broad import UX or interoperability at the same time.

## 9. Definition Of Done
T019 is done when all of the following are true:
- selecting an authored-resource bundle can produce a no-write preview before persistence
- the preview reuses authoritative server validation for the current request/mock bundle scope
- the UI requires explicit confirmation before the actual import write occurs
- the confirmed import still uses the existing `new_identity` policy and post-import refresh behavior
- preview output remains bounded to summary-level consequences and does not become a broad inspection platform
- tests cover the preview flow and confirmed import flow without depending on `M3-F3`

## 10. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewers: Architecture Agent and QA / Verification Agent

## 11. Explicit Defer Items / 확실하지 않음
- Dedicated preview endpoint chosen: `POST /api/workspaces/:workspaceId/resource-bundle/import-preview`
- Bounded client staging chosen: the workspace import surface retains the selected bundle text only long enough to support confirm or cancel
- **확실하지 않음:** preview remains advisory if the workspace resource lane changes between preview and confirm; the current implementation warns about that drift instead of attempting a lock or staging subsystem
- The confirm path preserves the existing non-transactional import semantics; rollback for mid-import write failure remains out of scope for T019, so failure copy must not over-promise that zero writes occurred
- Defer any per-item diffing or detailed inspection beyond the current summary vocabulary.
- Defer all broader authored-resource and interoperability expansion beyond the current saved-request/mock-rule bundle scope.

## 12. Implementation Notes
- Added a dedicated server-backed no-write preview route that reuses the same import-planning seam as the existing commit path.
- Kept preview output summary-level only: accepted counts, rejected counts, renamed count, imported-name preview, rejected-reason summary, and duplicate-identity policy.
- Updated the workspace import UI so file selection requests preview first, then offers explicit confirm and cancel actions before any write occurs.
- Preserved the existing post-confirm import semantics: current saved-request/mock-rule bundle scope, `new_identity` policy, explorer/mocks refresh behavior, and post-import status summaries.

## 13. Validation
- `npm run lint:client`
- `npm run lint:cjs`
- `npm run typecheck`
- `npm run test:node`
- `npm run test:ui -- client/features/workspace/components/WorkspacePlaceholder.test.tsx` remains blocked in this sandbox with the existing `sandbox_esbuild_transform_blocked` / `spawn EPERM` signature
