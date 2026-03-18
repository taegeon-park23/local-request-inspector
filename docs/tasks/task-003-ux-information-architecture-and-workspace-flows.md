# T003 - UX Information Architecture and Workspace Flows

- **Purpose:** Define the workspace shell, top-level navigation, core screen responsibilities, and high-value user journeys for the local-first API workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-005-script-execution-safety-model.md`, `task-008-internal-api-contract-design.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P0

## 1. Summary
T003 turns the architecture, schema, persistence, and internal API decisions into a user-facing information architecture. The output should clarify how workspace-scoped resources and runtime-scoped observations appear in the product, how users move between request authoring and operational inspection, and which flows must be treated as MVP-critical.

## 2. Why This Task Matters Now
- T006 needs a clear workspace shell and panel responsibility map before selecting the frontend shell and routing strategy.
- T011 needs the request builder flow and summary/detail split to define the central request authoring experience.
- T012 needs stage-aware script authoring and result review flows that already reflect T005 and T008 constraints.
- T014 needs capture/history/replay visibility rules that align with runtime scope and event-stream contracts.

## 3. Input Sufficiency Check
The current planning package is sufficient to start T003 because it already defines:
- target runtime layers and module boundaries in `../architecture/overview.md`
- canonical entities and scope distinctions in `../architecture/domain-model.md` and `../architecture/shared-schema.md`
- storage separation between persisted resources and runtime artifacts in `../architecture/persistence-strategy.md`
- execution safety boundaries in `../architecture/script-execution-safety-model.md`
- resource/runtime/event APIs in `../architecture/internal-api-contracts.md`

Remaining unknowns such as desktop packaging and exact editor capability defaults are still **확실하지 않음**, but they do not block IA-level planning.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/ux-information-architecture.md` exists.
- `docs/architecture/workspace-flows.md` exists.
- top-level navigation and workspace shell regions are defined.
- summary/detail expectations are documented for requests, captures, mock rules, and execution history.
- key user journeys cover request authoring, capture inspection, mock management, script usage, and environment switching.
- T006, T011, T012, and T014 handoff inputs are explicitly summarized.

## 5. Outputs
- `../architecture/ux-information-architecture.md`
- `../architecture/workspace-flows.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Upstream architecture, schema, persistence, safety, and API contract documents were re-read for IA alignment.
- `ux-information-architecture.md` now defines top-level navigation, shell regions, scope separation, summary/detail rules, empty states, and handoff notes.
- `workspace-flows.md` now documents the primary journeys for request authoring, capture replay, mock management, script usage, environment switching, and history exploration.
- T003 outputs are sufficient to hand off to T006, T011, T012, and T014 as planning inputs.

## 7. Open Questions
1. Whether the long-term shell includes a desktop wrapper or remains browser-only is **확실하지 않음**.
2. Whether captured-request views should default to a unified timeline with execution history in MVP is **확실하지 않음**.
3. Whether request draft autosave requires a dedicated visible draft concept in the shell is **확실하지 않음**.
4. Whether asset/file browsing deserves a first-class navigation surface in MVP is **확실하지 않음**.

## 8. Handoff Checklist
- [x] T003 task file exists and is linked from tracking docs
- [x] UX / IA document exists
- [x] workspace flows document exists
- [x] top-level shell and panel responsibilities are documented
- [x] core user journeys are documented
- [x] T006 / T011 / T012 / T014 handoff inputs are summarized

## 9. Recommended Owner
- Primary: Product + UX / Architecture
- Secondary reviewer: Frontend lead

## 10. Closure Decision
T003 can be closed as **done** at the planning/documentation level. Remaining questions are UX refinement decisions for T006, T011, T012, and T014 rather than blockers to the information architecture itself.
