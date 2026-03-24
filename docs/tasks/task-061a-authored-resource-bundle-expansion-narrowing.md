# T061A - Authored-Resource Bundle Expansion Narrowing

- **Purpose:** Narrow the next authored-resource bundle expansion candidate into one concrete future lane before any additional implementation work begins.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-015-import-export-strategy.md`, `task-058-workspace-navigation-only-explorer-and-main-surface-management.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/internal-api-contracts.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
The current authored-resource bundle scope already covers:
- collections
- request groups
- saved requests
- mock rules

Further bundle growth is possible, but the next expansion should not be promoted as a vague “support more resource types” theme. `T061A` narrows the decision to two realistic lanes and picks one preferred next lane.

## 2. Evaluated Lanes
### Lane A — Standalone Saved Scripts Bundle Expansion
Include standalone saved scripts in authored-resource export/import preview/confirm flows.

Why this lane is narrower:
- saved scripts are already first-class persisted resources with their own route and CRUD API
- script transfer does not immediately force request-environment semantics, default-environment handling, or secret-resolution policy into the same slice
- the imported/exported payload can stay close to the current authored-resource bundle model of persisted authored resources only

### Lane B — Environments Bundle Expansion
Include environments in authored-resource export/import preview/confirm flows.

Why this lane stays deferred:
- environment transfer touches `selectedEnvironmentId` linkage, default environment semantics, and missing-reference behavior across request authoring and execution history
- secret-backed variable behavior and resolution summaries make preview/import messaging broader than the current authored-resource bundle lane
- environment transfer would likely need a stronger decision on how imported environments interact with existing workspace defaults and redacted/runtime-owned labels

## 3. Decision
The preferred next expansion lane is:
- **standalone saved scripts bundle expansion first**

`environments bundle expansion` remains deferred until a later, narrower task explicitly owns:
- default-environment import behavior
- secret-backed variable transfer semantics
- missing-reference and history/result-label consequences

## 4. Future T061B Scope Boundary
If bundle implementation resumes, the promoted implementation task should become `T061B` and stay bounded to standalone saved scripts.

That future implementation should decide only:
- bundle payload shape for persisted saved scripts
- preview summary counts/labels for scripts
- import/export UI wording for script counts and renamed-script outcomes
- compatibility / `migration-needed` handling for script bundle members
- whether saved-script linkage to request-stage attachment stays out of scope for the first transfer slice

## 5. Explicitly Deferred From T061A
- any code or schema change to the current authored-resource bundle
- environment bundle import/export implementation
- request-stage script attachment/reference semantics
- migration-engine work beyond the current compatibility classification baseline

## 6. Validation
This was a planning/documentation task only.
- validated consistency between the new task doc, `master-task-board.md`, and `priority-roadmap.md`
- no runtime or client/server code change is required to complete `T061A`

## 7. Recommended Next Step
- Do not auto-promote bundle implementation just because `T061A` is complete.
- If another bundle follow-up is explicitly requested, promote **`T061B - standalone saved scripts bundle expansion`** rather than reopening a broad authored-resource expansion theme.


