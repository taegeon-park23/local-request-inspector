# Candidate A Promotion Readiness

- **Purpose:** Provide the canonical readiness note for Candidate A so future contributors can distinguish the authored-resource functionality that is already shipped from the narrower authored-resource gaps that could justify a future promotion.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-23
- **Related Documents:** `candidate-a-gap-inventory.md`, `candidate-a-narrow-candidate-comparison.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-019-server-backed-pre-import-preview.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-028-post-t027-candidate-a-readiness-refresh.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md`
- **Status:** active reference
- **Update Rule:** Update when the shipped authored-resource baseline changes, when a new authored-resource type becomes first-class, or when Candidate A promotion criteria materially change.

## 1. Current Shipped Authored-Resource Baseline
- Saved request definitions are first-class persisted authored resources. The workspace route can export a whole authored-resource bundle or export one persisted saved request as a bundle with a single request record.
- Mock rules are first-class persisted authored resources. The mocks route can export one persisted rule as a bundle with a single mock-rule record, and workspace-level bundle export also includes mock rules.
- Workspace-level import already exists for authored-resource bundles. Import returns accepted requests, accepted mock rules, reject summaries, imported-name previews, and the explicit `new_identity` duplicate policy.
- Current bundle transfer intentionally excludes runtime history, captures, execution results, and runtime mock outcomes.
- Compatibility handling is already shipped for bundle kind/schema validation, per-resource kind/schema validation, migration-needed versus unsupported-version classification, and read-compatible legacy bundle/resource paths.
- The current baseline does not require a write-time migration engine. Read-compatible and migration-needed classification are the active compatibility seams today.

## 2. Current Authored-Resource Boundaries
- First-class authored-resource transfer today is limited to saved requests and mock rules.
- Environments are now first-class persisted workflow objects in the shipped shell, and `T030` also makes them request-linked execution inputs through `selectedEnvironmentId`, server-owned placeholder resolution, and execution/history environment metadata. They are still not authored-resource transfer types.
- Route-level Scripts is also now a first-class persisted workflow surface with standalone saved scripts plus read-only templates, but it is not yet part of the authored-resource transfer lane.
- Collection and folder labels exist as organization metadata on saved requests, but collections and folders are not currently standalone authored-resource transfer objects.
- Broader interoperability such as cURL, OpenAPI, and Postman import remains deferred and should not be treated as implied Candidate A scope.
- `T027` changed the workflow-object prerequisite for environments and standalone scripts, but it did not define bundle membership, secret/template policy, or import/export boundaries for those resource kinds.
- **확실하지 않음:** whether future authored-resource bundles should add environments, standalone saved scripts, or other resource kinds beyond saved requests and mock rules.

## 3. Gap Categories
### Ergonomics Improvements
- Narrow improvements to the already shipped request/mock transfer flows.
- Examples: clearer bundle naming, more bounded import summaries, or more legible transfer status around the existing saved-request/mock-rule scope.

### Transfer and Import/Export UX Improvements
- Improvements that stay inside the current request/mock authored-resource boundary.
- Examples: tighter previews, more explicit validation feedback, or bounded request-versus-rule transfer affordances that do not add new resource kinds.

### Additional Authored-Resource Transfer Types
- Resource kinds that are now real workflow objects but still lack a narrow authored-resource transfer contract.
- Examples: environments with secret/default semantics plus request-reference/runtime-label coupling, or standalone saved scripts with template and request-bound-script boundaries.

### Management and Discovery Improvements
- Better authored-resource browsing or management around the current persisted resource lane.
- Examples: bounded saved-request or mock-rule discovery improvements that remain separate from runtime observations.

### Interoperability-Oriented Tooling
- Import or translation work that moves beyond app-native bundles.
- Examples: cURL, OpenAPI, or Postman-related tooling.
- This category is the broadest and highest-risk Candidate A bucket and should stay parked unless split into a much narrower proposal.

## 4. Promotion Criteria
- A future Candidate A proposal must name one concrete user-facing gap, not a general authored-resource ambition.
- The proposal must state which resource kind is affected and why the current request/mock bundle baseline does not already solve it.
- The scope must be small enough for one reviewable task with explicit non-goals.
- The validation path must be credible in the current environment and must not depend on reopening `M3-F3`.
- The proposal must avoid broad schema churn, platform churn, or umbrella “resource tooling” language.
- If a new resource type is involved, the proposal must show both that the resource type is already a real workflow object and that one narrow transfer contract can be defined without reopening broader workflow semantics.
- Environment-transfer proposals must now also explain how imported request `selectedEnvironmentId` references, missing environment references after import, and run/history environment-label expectations are supposed to behave.
- Board, roadmap, and progress updates must be cleanly expressible as one narrow task rather than a multi-track initiative.

## 5. Non-Promotion Examples
- “Improve import/export generally.”
- “Add better resource tooling.”
- “Support all authored-resource types.”
- “Do OpenAPI/Postman/cURL interoperability.”
- “Add environments and scripts to bundles” without first narrowing secret/default/template boundaries, request-reference behavior, and the exact transfer contract.
- “Unify all authored-resource management” without one clearly named user-facing gap and validation path.

## 6. Re-Entry Checklist
1. Is the proposed gap real, user-facing, and specific?
2. Is the gap already partially solved by current workspace bundle export/import or single-resource export?
3. Does the proposal stay inside saved-request/mock-rule scope, or does it explicitly justify a new first-class resource kind?
4. Is the scope small enough to avoid broad schema, platform, or interoperability churn?
5. Does the validation path work without depending on `M3-F3` clearing?
6. Can the task be described with clear outputs, non-goals, and one recommended owner?
7. Can `master-task-board.md`, `priority-roadmap.md`, and `progress-status.md` be updated around one narrow task instead of a vague future-work bucket?

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether environments should become a first-class authored-resource transfer type now that they are also request-linked execution inputs rather than only standalone route objects.
- **확실하지 않음:** whether standalone saved scripts should become a transfer type, or whether script authoring should remain split between request-bound scripts and standalone management for longer.
- **확실하지 않음:** whether collections or folders should ever become standalone authored-resource transfer objects instead of remaining request metadata.
- **확실하지 않음:** when broader interoperability should graduate from deferred strategy to a narrow promotable task.

## 8. Canonical Candidate A Decision
- Candidate A is no longer fully parked.
- `../tasks/task-019-server-backed-pre-import-preview.md` is landed as the first narrow Candidate A delivery because a server-backed no-write preview was the cleanest fit for the shipped workspace import seams.
- `../tasks/task-028-post-t027-candidate-a-readiness-refresh.md` is landed as the latest planning refresh after `T027`; it confirms that environments and standalone saved scripts are now real workflow objects but still does not promote transfer implementation for either resource kind.
- `../tasks/task-031-post-t030-priority-and-candidate-a-refresh.md` is landed as the latest planning refresh after `T030`; it confirms that request/runtime environment coupling makes environment transfer more concrete but still not narrowly promotable.
- This document still exists to keep any further Candidate A proposals narrow rather than letting authored-resource work reopen as a broad umbrella.
- Use `candidate-a-gap-inventory.md` as the current evidence list before deciding whether a proposed Candidate A gap is already covered, still broad, blocked by a missing first-class resource type, or worth promoting after `T019`.
- Use `candidate-a-narrow-candidate-comparison.md` to understand why Candidate 2 stayed parked and why Candidate 1 won before `T019` was created.
