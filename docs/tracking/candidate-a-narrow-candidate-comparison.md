# Candidate A Narrow Candidate Comparison

- **Purpose:** Compare the two currently plausible narrow Candidate A gaps directly so future contributors can decide whether one is ready to become `T019` without re-running the same authored-resource discovery work.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-a-gap-inventory.md`, `candidate-a-promotion-readiness.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-015-import-export-strategy.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-019-server-backed-pre-import-preview.md`
- **Status:** active reference
- **Update Rule:** Update when either candidate's shipped overlap changes, when Candidate A is promoted, or when a third narrow Candidate A candidate replaces this comparison.

## 1. Compared Candidates
### Candidate 1 - Pre-import validation preview before writes occur
- Focuses on the existing workspace import surface.
- Targets the current saved-request/mock-rule authored-resource bundle only.
- Would add a step that previews validation or import consequences before persistence begins.

### Candidate 2 - Mock-rule-local import entrypoint for the current bundle scope
- Focuses on the `/mocks` route.
- Targets the current mock-rule transfer lane without changing bundle format.
- Would add a route-local import affordance near the already shipped `Export rule` flow.

## 2. Repo-Grounded Baseline
- The only shipped import control lives in `client/features/workspace/components/WorkspaceExplorer.tsx` as `Import authored resources`.
- That control immediately calls `onImportResources(file)` on file selection, and `client/features/workspace/components/WorkspacePlaceholder.tsx` immediately reads the file and posts the full bundle text to `/api/workspaces/:workspaceId/resource-bundle/import`.
- The current import endpoint in `server.js` writes accepted request and mock-rule records directly after validation and returns a post-write summary. There is no preview-only or dry-run mode today.
- The current import result already reports accepted counts, rejected counts, imported-name preview, rejected-reason summary, and `new_identity` behavior.
- The `/mocks` route already supports single-rule export in `client/features/mocks/components/MocksPlaceholder.tsx`, but it has no local import affordance.
- Workspace import already refreshes the mocks list after import, so mock-rule import capability exists today even though its entrypoint is workspace-scoped.

## 3. Direct Comparison
| Criteria | Candidate 1 - Pre-import validation preview | Candidate 2 - Mock-rule-local import entrypoint |
| --- | --- | --- |
| User-facing pain / clarity of need | Stronger. Current import starts writing immediately after file selection, so users cannot inspect consequences before commit. | Weaker. Mock-rule import already works via the workspace explorer; the missing piece is route-local symmetry, not missing capability. |
| Narrowness of scope | Medium. The affected resource boundary is still narrow, but a true pre-write preview likely needs an extra confirmation step and a preview-only server or client validation seam. | Medium on first look, but less clean in practice because the current import format can include both requests and mock rules, not just rules. |
| Overlap with shipped baseline | Moderate overlap. Current post-import summaries already exist, but they happen after write attempts begin. | Higher overlap. The route already has export, and mock-rule import already succeeds through the workspace entrypoint and refreshes `/mocks` afterward. |
| Risk of scope creep | Moderate. Preview work can expand into diff views or per-item inspection if not tightly bounded. | Moderate to high. A local mocks import button can quickly raise questions about mock-only filtering, mixed bundles, or whether `/mocks` should own only rule imports. |
| Dependency on missing first-class resource types | None. Stays inside current request/mock bundle scope. | None. Stays inside current request/mock bundle scope. |
| Validation feasibility | Credible. Can rely on server bundle-validation seams plus workspace import tests, without touching `M3-F3`. | Credible, but less isolated. UI tests can cover a new `/mocks` affordance, yet mixed-bundle behavior would need broader cross-route expectations. |
| Likely implementation surface area | Moderate. Workspace import UI plus preview/confirm seam plus corresponding server or client validation logic. | Moderate. `/mocks` UI plus import handoff, but the ownership semantics of mixed bundles would need an explicit rule. |
| Likelihood of ballooning into broad Candidate A work | Lower than Candidate 2 if explicitly bounded to "preview before write for current bundle scope only." | Higher than Candidate 1 because route-local symmetry can turn into broader resource-management or resource-filtering discussion. |

## 4. Candidate-Specific Notes
### Candidate 1 - Pre-import validation preview before writes occur
- This is the stronger future Candidate A direction because it addresses a real missing step in the current flow rather than a missing shortcut to an already working capability.
- This comparison by itself was not enough to choose an exact framing, so Candidate 1 moved to a deeper approach decision instead of being implemented directly from this note.
- That later approach decision chose a server-backed no-write preview, and `../tasks/task-019-server-backed-pre-import-preview.md` is now landed.

### Candidate 2 - Mock-rule-local import entrypoint for the current bundle scope
- This is less compelling as the next task because the main user-facing capability already exists through the workspace import control.
- The remaining gap is affordance symmetry, but the shipped import contract is still workspace-wide and bundle-wide.
- That means a `/mocks` import entrypoint would need one of two uncomfortable behaviors:
  - accept that a mocks-route import may also create saved requests from the same bundle, or
  - introduce a new mock-only filtering/ownership rule that goes beyond simple route-local affordance polish.
- That ambiguity makes Candidate 2 more likely to grow into broader resource-tooling churn than its button-sized surface suggests.

## 5. Decision
- Candidate 1 won the narrow-candidate comparison and has since landed through `../tasks/task-019-server-backed-pre-import-preview.md`.
- Candidate 2 stays parked unless future repo changes make mock-rule import ownership clearly local to `/mocks` without changing current bundle semantics.
- This comparison remains the canonical record of why route-local mock import lost before the repo narrowed Candidate 1 further.

## 6. What Would Change This Decision Later
- `T019` now carries the chosen Candidate 1 direction, so later changes should focus on whether that task stays bounded during implementation.
- Revisit Candidate 2 later only if the repo gains a clearly local mock-rule import ownership model that does not silently expand into mixed-bundle or mock-only-filtering redesign.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether mock-rule-local import symmetry would matter enough to users once the workspace import route is already documented and working.
- **확실하지 않음:** whether later authored-resource work will surface a third narrow candidate that is clearly better than both current options.
