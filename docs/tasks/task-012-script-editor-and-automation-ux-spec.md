# T012 - Script Editor and Automation UX Spec

- **Purpose:** Define the MVP script editor, stage-aware automation workflow, and diagnostic UX so implementation can add script authoring without implying unsupported capabilities.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-005-script-execution-safety-model.md`, `task-006-frontend-stack-and-application-shell-decision.md`, `task-008-internal-api-contract-design.md`, `task-009-workspace-persistence-bootstrap.md`, `task-011-request-builder-mvp-design.md`, `../architecture/script-editor-and-automation-ux.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T012 converts the safety, shell, contract, persistence, and request-builder work into a product-level UX spec for script authoring. The outcome defines where users write `Pre-request`, `Post-response`, and `Tests` scripts, how editor/runtime diagnostics are separated, what capability messaging the UI may promise, and how reusable scripts differ from request-bound editing in MVP.

## 2. Why This Task Matters Now
- T014 needs clear boundaries between request execution results and script-stage diagnostics when defining history/inspector behavior.
- Implementation needs stage-aware editor placement, lazy-loading expectations, and panel composition guidance before Monaco integration begins.
- T005/T008/T009 constraints must be translated into visible UX copy so the product does not imply legacy runtime powers that the canonical contract does not allow.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T012 because it already defines:
- allowed vs denied runtime capability direction and redaction rules in `../architecture/script-execution-safety-model.md`
- canonical execution stage names, events, and runtime payload limits in `../architecture/internal-api-contracts.md`
- lazy-loaded heavy editor expectations and shell boundaries in `../architecture/frontend-stack-and-shell.md`
- runtime persistence redaction constraints in `../architecture/persistence-bootstrap.md`
- request-builder tab structure and result-panel boundaries in `../architecture/request-builder-mvp.md`
- workspace placement and flow expectations in `../architecture/ux-information-architecture.md` and `../architecture/workspace-flows.md`

Tracking consistency required cleanup before starting: T011 outputs already existed as `done`, while `master-task-board.md`, `priority-roadmap.md`, and `progress-status.md` still reflected older earlier-phase status assumptions.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/script-editor-and-automation-ux.md` exists.
- MVP scope for stage-aware script editing is documented.
- request-bound script editing and reusable script management are clearly separated.
- capability guidance, warning/redaction messaging, and diagnostics surfaces are defined.
- validation, timeout, cancellation, and empty-state behaviors are documented.
- handoff inputs for T014 and implementation are summarized.

## 5. Outputs
- `../architecture/script-editor-and-automation-ux.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required architecture, safety, contract, persistence, shell, IA, and T011 documents were re-read before defining T012.
- Tracking documents were reconciled with the actual repository state before drafting new UX guidance.
- `script-editor-and-automation-ux.md` now defines stage-aware editor placement, capability messaging, reusable-script scope, diagnostic/result relationships, and implementation handoff notes.
- T012 outputs are sufficient to hand off to T014 and to implementation planning for Monaco integration, panel composition, and runtime state separation.

## 7. Key Decisions
1. The request builder owns the primary MVP script-authoring entry point through a `Scripts` tab family rather than a separate full-screen script IDE by default.
2. User-facing stage labels remain `Pre-request`, `Post-response`, and `Tests`, while runtime-stage names from T008 stay implementation/internal terminology only.
3. The editor may only advertise capabilities that are canonically allowed for the selected stage; legacy server abilities remain historical notes, not promised UX.
4. Reusable script management remains a secondary library/management surface, while request-bound editing is the default authoring flow in MVP.
5. Runtime outputs are split between request execution results and stage diagnostics so users can tell whether a failure came from transport, automation, or assertions.

## 8. Open Questions
1. Whether reusable scripts should support true multi-request reference semantics in MVP or begin as copy-on-attach helpers is **확실하지 않음**.
2. Whether Monaco loads at tab-entry time or first focus inside the script editor is **확실하지 않음**, though lazy loading is required.
3. Whether lightweight linting ships in MVP or remains plain syntax/error highlighting is **확실하지 않음**.
4. Whether system-provided templates expand into a richer snippet browser beyond stage starters is **확실하지 않음**.

## 9. Handoff Checklist
- [x] T012 task file exists and is linked from tracking docs
- [x] script editor / automation UX architecture doc exists
- [x] request-bound vs reusable script editing scope is documented
- [x] capability, warning, redaction, and diagnostics surfaces are documented
- [x] timeout/cancellation/error/empty states are documented
- [x] T014 / implementation handoff inputs are summarized

## 10. Recommended Owner
- Primary: Product + Frontend + Architecture
- Secondary reviewer: Runtime / Sandbox engineer

## 11. Closure Decision
T012 can be closed as **done** at the planning/documentation level. Remaining items are implementation-detail choices for Monaco loading strategy, snippet depth, saved-script persistence semantics, and history-panel integration rather than blockers to the UX spec.
