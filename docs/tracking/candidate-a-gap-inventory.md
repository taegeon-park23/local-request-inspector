# Candidate A Gap Inventory

- **Purpose:** Provide a grounded inventory of current Candidate A gap candidates so future contributors can start from actual authored-resource seams in the shipped repo instead of broad "resource tooling" ideas.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-a-promotion-readiness.md`, `candidate-a-narrow-candidate-comparison.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-019-server-backed-pre-import-preview.md`
- **Status:** active reference
- **Update Rule:** Update when the shipped authored-resource workflow changes or when a currently inventoried gap is promoted, closed, or reclassified.

## 1. Current Baseline Snapshot
- The shipped authored-resource workflow already supports workspace-level authored-resource bundle export/import for saved requests and mock rules.
- The shipped UI also supports single-resource export for one persisted saved request and one persisted mock rule.
- Import already performs bundle validation, resource-kind/schema validation, compatibility classification, and create-new-identity import naming.
- Current import feedback already includes accepted and rejected counts, imported-name previews, rejected-reason summaries, and immediate refresh of workspace explorer and mocks data.
- Runtime history, captures, execution results, and runtime mock outcomes remain intentionally outside authored-resource transfer scope.
- Environments and route-level Scripts remain placeholder surfaces, not first-class authored-resource transfer lanes.

## 2. Classification Model
- `already covered`: the current shipped workflow already addresses the need closely enough that it should not drive Candidate A promotion now.
- `real but broad`: a real future need exists, but the gap is still too umbrella-shaped to become one bounded task.
- `real but blocked by missing first-class resource type`: the gap depends on a resource kind that is not yet a real workflow object.
- `plausible narrow future promotion candidate`: the gap appears real, bounded, user-facing, and distinct enough that it could justify one later task if priorities shift.
- `landed follow-up`: the gap was narrow enough to become one explicit task and is now implemented.
- `확실하지 않음`: current repo truth is not strong enough to classify it confidently.

## 3. Concrete Observed Gap Candidates
### Gap 1 - Transfer scope clarity for request/mock bundles
- **Affected surface / resource kind:** Workspace explorer transfer controls for saved requests and mock rules.
- **Why it might matter:** users need to understand what export/import includes and what it intentionally excludes.
- **What is already shipped that overlaps:** the explorer header already says transfer stays limited to authored request definitions and mock rules, export success messaging calls out counts and runtime exclusions, and import messaging explains new-identity behavior.
- **Evidence from repo/docs:** `client/features/workspace/components/WorkspaceExplorer.tsx`, `client/features/workspace/components/WorkspacePlaceholder.tsx`, `docs/tasks/task-015-import-export-strategy.md`
- **Classification:** `already covered`

### Gap 2 - Request-bound script and request-organization loss during transfer
- **Affected surface / resource kind:** Saved request definition transfer.
- **Why it might matter:** users could worry that request-bound scripts, collection names, or folder names are not preserved when a request is exported or imported.
- **What is already shipped that overlaps:** saved request records already carry `scripts`, `collectionName`, and optional `folderName`; those fields move through request export/import as part of the request resource record.
- **Evidence from repo/docs:** `client/features/request-builder/request-builder.api.ts`, `client/features/workspace/resource-bundle.api.ts`, `storage/resource/authored-resource-bundle.js`
- **Classification:** `already covered`

### Gap 3 - Pre-import validation preview before writes occur
- **Affected surface / resource kind:** Workspace-level authored-resource import for saved requests and mock rules.
- **Why it might matter:** the current flow starts import immediately after file selection, so users only see imported-name previews and reject summaries after the write attempt begins.
- **What is already shipped that overlaps:** post-import status already shows accepted and rejected counts, imported-name previews, and reject summaries; bundle validation already happens on the server.
- **Evidence from repo/docs:** `client/features/workspace/components/WorkspaceExplorer.tsx` file input immediately calls `onImportResources`; `client/features/workspace/components/WorkspacePlaceholder.tsx` reads the file and immediately mutates `importWorkspaceResources`; `client/features/workspace/components/WorkspacePlaceholder.test.tsx` covers post-import preview and reject-summary behavior.
- **Classification:** `landed follow-up`

### Gap 4 - Mock-rule-local import entrypoint for current bundle scope
- **Affected surface / resource kind:** `/mocks` management flow for mock-rule resources.
- **Why it might matter:** mock rules already support local export inside the mocks detail surface, but import still lives only in the workspace explorer, which makes rule-focused transfer asymmetrical.
- **What is already shipped that overlaps:** workspace-level import already accepts bundles containing mock rules and refreshes the mocks list after import.
- **Evidence from repo/docs:** `client/features/mocks/components/MocksPlaceholder.tsx` exposes `Export rule` but no import action; `client/features/workspace/components/WorkspaceExplorer.tsx` contains the only import control; `client/features/workspace/components/WorkspacePlaceholder.test.tsx` shows imported mock rules appearing in `/mocks` after workspace import.
- **Classification:** `plausible narrow future promotion candidate`

### Gap 5 - Richer post-import inspection beyond summary lines
- **Affected surface / resource kind:** Workspace import feedback for saved requests and mock rules.
- **Why it might matter:** users may eventually want more structured inspection of per-item accept/reject outcomes than the current status message plus preview list.
- **What is already shipped that overlaps:** the current import status already reports created counts, rename counts, reject counts, imported-name previews, and grouped reject reasons; imported records also appear in refreshed explorer and mocks lists.
- **Evidence from repo/docs:** `client/features/workspace/components/WorkspacePlaceholder.tsx` `createImportStatusMessage`, `client/features/workspace/components/WorkspacePlaceholder.test.tsx`
- **Classification:** `real but broad`

### Gap 6 - Environments as transferable authored resources
- **Affected surface / resource kind:** Environment resources.
- **Why it might matter:** environments are a natural authored-resource concept for a local API workbench, but they are not currently part of the shipped transfer lane.
- **What is already shipped that overlaps:** nothing first-class beyond the broader resource vocabulary in shared constants and planning docs.
- **Evidence from repo/docs:** `client/features/environments/components/EnvironmentsPlaceholder.tsx`, `storage/shared/constants.js`, `docs/tracking/candidate-a-promotion-readiness.md`
- **Classification:** `real but blocked by missing first-class resource type`

### Gap 7 - Standalone reusable script resources
- **Affected surface / resource kind:** Route-level Scripts and reusable authored scripts.
- **Why it might matter:** reusable script resources could become a future authored-resource type distinct from request-bound scripts.
- **What is already shipped that overlaps:** request-bound scripts are already stored inside saved request definitions, but route-level Scripts remains a placeholder and there is no standalone reusable script resource.
- **Evidence from repo/docs:** `client/features/scripts/components/ScriptsPlaceholder.tsx`, `client/features/request-builder/request-builder.api.ts`, `docs/tracking/candidate-a-promotion-readiness.md`
- **Classification:** `real but blocked by missing first-class resource type`

### Gap 8 - Broader external interoperability
- **Affected surface / resource kind:** cURL, OpenAPI, Postman, or other non-native interchange flows.
- **Why it might matter:** users may eventually want to bring external definitions into the app without first converting them to app-native bundles.
- **What is already shipped that overlaps:** app-native bundle import/export for saved requests and mock rules only.
- **Evidence from repo/docs:** `docs/tasks/task-015-import-export-strategy.md`, `docs/tracking/candidate-a-promotion-readiness.md`
- **Classification:** `real but broad`

## 4. Promotion-Ready Characteristics For Plausible Narrow Candidates
### Pre-import validation preview before writes occur
- This is narrow because it stays inside the existing workspace import surface and the current saved-request/mock-rule bundle format.
- It is meaningfully different from "improve import/export generally" because it focuses on one missing step: previewing validation/import consequences before commit.
- A likely validation path would use the existing workspace import UI seam plus bundle-validation/server behavior, rather than requiring new resource types or `M3-F3`.
- It does not depend on reopening `M3-F3` because it is authored-resource workflow work, not gated request-builder/result-panel TSX presentation cleanup.

### Mock-rule-local import entrypoint for current bundle scope
- This is narrow because it stays inside the already shipped mock-rule transfer lane and does not change bundle format or resource ownership.
- It is meaningfully different from a broad resource-tooling initiative because it targets one missing affordance: importing current mock-rule bundles from the route where mock rules are managed.
- A likely validation path would reuse the existing bundle import API, mocks query refresh behavior, and mocks/workspace component test seams, rather than depending on `M3-F3`.
- It does not require a new first-class resource type or broader interoperability work.

## 5. Still-Too-Broad Categories
- Broad interoperability such as cURL, OpenAPI, or Postman import.
- "Improve import/export generally" without one missing step or affected resource kind.
- Expanding transfer to all authored-resource types at once.
- Environments or standalone scripts before those resource kinds become first-class workflow objects.
- Umbrella resource-management initiatives that combine transfer, browsing, organization, and interoperability into one promotion request.

## 6. Recommendation
One Candidate A gap is now promoted, and one remains parked.

- Gap 3, pre-import validation preview before writes occur, is now landed as `../tasks/task-019-server-backed-pre-import-preview.md`.
- Gap 4, mock-rule-local import entrypoint for the existing bundle scope, remains parked because the underlying import capability already exists in the workspace flow and the route-local ownership seam is still too ambiguous.

Everything else in the current inventory is either already covered, blocked by a missing first-class resource type, or still too broad.

## 7. Explicit Uncertainties / 확실하지 않음
- Dedicated preview endpoint chosen for `T019`; broader authored-resource preview/staging work remains out of scope.
- **확실하지 않음:** whether environments or standalone scripts will become first-class authored-resource types soon enough to affect the next Candidate A decision.
- **확실하지 않음:** whether any future authored-resource management/discovery gap can be kept narrow enough to avoid collapsing into a broad resource-tooling initiative.
