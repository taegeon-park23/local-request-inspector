# T008 - Internal API Contract Design

- **Purpose:** Specify storage-agnostic internal API routes, DTO families, and event contracts for workspace resources, execution, mock rules, and captured requests.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-005-script-execution-safety-model.md`, `task-007-shared-domain-schema-and-naming-conventions.md`, `../architecture/internal-api-contracts.md`, `../architecture/persistence-strategy.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T008 translates the architecture, schema, persistence, and execution-safety outputs into an implementable internal contract layer. The result is a route catalog and event model that downstream implementation can use without hard-coding storage or leaking unsafe runtime detail.

## 2. Why This Task Matters Now
- T009 needs service and repository boundaries that already reflect resource vs runtime APIs.
- T013 and T014 need stable mock and captured-request endpoints before behavior specs go deeper.
- T016 needs stable contracts and event names for future validation planning.

## 3. Inputs Used
- T001 architecture overview and migration plan
- T004 persistence strategy decision
- T005 script execution safety model
- T007 shared schema and naming conventions
- current legacy Express routes in `../../server.js`

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/internal-api-contracts.md` exists.
- a route catalog covers workspace resources, execution, mock rules, and captured requests.
- DTO family guidance distinguishes summary, detail, mutation, and event payloads.
- execution lifecycle statuses and stage payload expectations are defined from T005 safety guidance.
- unresolved transport/scope questions remain explicitly marked **확실하지 않음**.

## 5. Outputs
- `../architecture/internal-api-contracts.md`
- this task handoff summary

## 6. Current Progress
- route catalog completed for workspace resources, runtime queries, execution commands, and SSE streams
- legacy-to-target mapping captured for `/events`, `/__inspector/mock`, and `/__inspector/execute`
- redaction-aware execution status and stage payload guidance documented for T009/T016 follow-up

## 7. Open Questions
1. Whether `CapturedRequest` should default to global scope or always attach to a workspace is **확실하지 않음**.
2. Whether execution cancellation eventually requires WebSocket transport is **확실하지 않음**.
3. Whether file/asset browsing remains part of the canonical API surface is **확실하지 않음**.
4. Whether request draft autosave needs a dedicated endpoint family before T011 is **확실하지 않음**.

## 8. Handoff Checklist
- [x] T008 task file exists and is linked from tracking docs
- [x] internal API contract doc exists
- [x] route catalog covers resources, commands, and event streams
- [x] execution payload and status guidance reflects T005 safety model
- [x] unresolved scope/transport decisions remain visible

## 9. Recommended Owner
- Primary: Backend / Architecture
- Secondary reviewer: Frontend integration lead
