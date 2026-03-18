# T011 - Request Builder MVP Design

- **Purpose:** Define the MVP scope, interactions, validation rules, and storage/runtime boundaries for the request builder workflow.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-003-ux-information-architecture-and-workspace-flows.md`, `task-006-frontend-stack-and-application-shell-decision.md`, `task-008-internal-api-contract-design.md`, `task-009-workspace-persistence-bootstrap.md`, `../architecture/request-builder-mvp.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T011 converts the high-level shell, UX, contract, and persistence decisions into a product-level request builder design. The output clarifies what users can author in MVP, how save and run diverge into different storage lanes, which body/auth types are in scope, how validation works, and what detail belongs in the request editor versus execution results.

## 2. Why This Task Matters Now
- T012 needs the request builder's tab structure and execution/result boundaries to place script editing and diagnostics correctly.
- T014 needs a clear separation between request detail and execution result detail when connecting replay/history behavior.
- Implementation work needs a constrained MVP field matrix rather than an open-ended Postman clone scope.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T011 because it already defines:
- the persistent shell and workspace flow from T003/T006
- transport and execution commands from T008
- resource/runtime storage separation from T009
- request and related entity terminology from T007

Remaining questions like advanced auth flows, draft persistence depth, and some replay defaults are still **확실하지 않음**, but they do not block an MVP product definition.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/request-builder-mvp.md` exists.
- create/edit/duplicate/save/run/result flows are documented.
- MVP field scope for method, URL, params, headers, body, auth, and environment resolution is defined.
- request resource persistence and execution runtime persistence are clearly separated.
- validation, dirty state, error handling, and empty states are documented.
- follow-up inputs for T012, T014, and implementation work are summarized.

## 5. Outputs
- `../architecture/request-builder-mvp.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required architecture, shell, API, persistence, and UX documents were re-read before defining the request builder.
- `request-builder-mvp.md` now defines the MVP field matrix, tab model, save/run/result interactions, validation expectations, and defer list.
- T011 outputs are sufficient to hand off to T012, T014, and later implementation planning.

## 7. Open Questions
1. The exact autosave/draft persistence depth remains **확실하지 않음**.
2. The default replay behavior (`run immediately` vs `open for edit first`) remains **확실하지 않음**.
3. Full multipart file upload ergonomics in MVP remain **확실하지 않음** beyond basic key/value/file rows.
4. OAuth2 beyond simple token input remains **확실하지 않음** and is deferred.

## 8. Handoff Checklist
- [x] T011 task file exists and is linked from tracking docs
- [x] request builder MVP architecture doc exists
- [x] MVP field scope and interaction flows are documented
- [x] save/run/result storage-lane separation is documented
- [x] validation, dirty state, and empty-state expectations are documented
- [x] T012 / T014 / implementation handoff inputs are summarized

## 9. Recommended Owner
- Primary: Product + Frontend/Backend
- Secondary reviewer: Architecture Agent

## 10. Closure Decision
T011 can be closed as **done** at the planning/documentation level. Remaining items are scope refinements for T012, T014, and implementation slicing rather than blockers to the request builder MVP definition.
