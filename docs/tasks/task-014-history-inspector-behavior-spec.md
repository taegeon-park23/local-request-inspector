# T014 - History / Inspector Behavior Spec

- **Purpose:** Define the MVP product, UX, and behavior model for Captures, History, detail/timeline surfaces, replay flows, diff surfaces, and diagnostics so execution observation remains clear and separate from request authoring.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-011-request-builder-mvp-design.md`, `task-012-script-editor-and-automation-ux-spec.md`, `task-013-mock-engine-rules-spec.md`, `../architecture/history-and-inspector-behavior.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T014 converts the architecture, persistence, request-builder, script UX, and mock engine outputs into a product-level history/inspector spec. The outcome defines how users browse captured inbound requests versus outbound execution history, how lists/details/timelines/replay/diff relate, how mock/script/test outcomes stay visually distinct, and how persisted redacted summaries differ from richer live execution detail.

## 2. Why This Task Matters Now
- Implementation needs stable list/detail/timeline/replay/diff boundaries before building capture/history modules and shared detail primitives.
- T016 needs a clearer observation-state model to define regression and QA coverage for captures, replay, mock outcomes, script diagnostics, and timeout/cancellation states.
- T010 can use this document to plan screen composition, shared panels, and state boundaries across `Captures`, `History`, and request-builder result primitives.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T014 because it already defines:
- runtime entities and scope questions for `CapturedRequest`, `ExecutionHistory`, `ExecutionResult`, and `TestResult` in `../architecture/domain-model.md` and `../architecture/shared-schema.md`
- query/event contracts for captured requests, execution histories, replay, and runtime streams in `../architecture/internal-api-contracts.md`
- workspace/capture/history shell placement and flow expectations in `../architecture/ux-information-architecture.md` and `../architecture/workspace-flows.md`
- save/run/result separation and replay bridge constraints in `../architecture/request-builder-mvp.md`
- script-stage diagnostics surfaces in `../architecture/script-editor-and-automation-ux.md`
- mock outcome vocabulary and capture/mock diagnostics in `../architecture/mock-engine-rules-spec.md`
- persistence and redacted-runtime rules in `../architecture/persistence-strategy.md`, `../architecture/persistence-bootstrap.md`, and `../architecture/script-execution-safety-model.md`

Repository check before starting showed that T001-T013 artifacts already existed, T014-specific task/architecture docs were missing, and tracking documents correctly listed T014 as the next planning task. No corrective tracking update was needed before writing the new spec.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/history-and-inspector-behavior.md` exists.
- Captures and History MVP roles, list/detail structures, timeline expectations, replay behavior, and diff scope are documented.
- mock outcomes, transport outcomes, script/test diagnostics, and persistence redaction rules are connected into one observation model.
- empty states, error states, and **확실하지 않음** items are documented.
- follow-up inputs for implementation are summarized.

## 5. Outputs
- `../architecture/history-and-inspector-behavior.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required architecture, persistence, UX, request-builder, script UX, and mock engine documents were re-read before defining T014.
- `history-and-inspector-behavior.md` now defines the MVP split between Captures and History, shared detail/timeline primitives, replay and diff boundaries, outcome labeling, and redacted persistence expectations.
- T014 outputs are sufficient to hand off to implementation planning for list/detail/timeline composition, replay state, diff targets, and diagnostics rendering.

## 7. Key Decisions
1. MVP keeps `Captures` and `History` as separate top-level sections, while allowing shared detail/timeline primitives under the hood.
2. Replay remains a bridge into the request builder, not a replacement for execution detail or capture detail itself.
3. T011's replay default is resolved toward **edit first** in MVP, with `run immediately` allowed only as a secondary action later.
4. T013 mock outcome vocabulary (`Mocked`, `Bypassed`, `No rule matched`, `Blocked`) is reused in capture/history/timeline surfaces, but remains visually separate from transport status and test/script outcomes.
5. MVP timelines show final summaries and key diagnostics, not full per-rule or per-stage traces.

## 8. Open Questions
1. Whether captures should eventually gain a derived unified timeline tab inside the `History` area remains **확실하지 않음**.
2. Whether replay should always re-evaluate against the current active mock rule set or optionally preserve historical behavior remains **확실하지 않음**.
3. Whether diff should expand beyond the documented MVP targets into response-to-response comparisons remains **확실하지 않음**.
4. Whether some live-only execution events deserve a dedicated ephemeral inspector view beyond persisted detail remains **확실하지 않음**.

## 9. Handoff Checklist
- [x] T014 task file exists and is linked from tracking docs
- [x] history / inspector architecture doc exists
- [x] captures/history split and list/detail/timeline model are documented
- [x] replay, diff, diagnostics, labeling, and redaction rules are documented
- [x] empty/error/defer/**확실하지 않음** items are documented
- [x] implementation handoff inputs are summarized

## 10. Recommended Owner
- Primary: Product + Frontend + Backend
- Secondary reviewer: Architecture Agent

## 11. Closure Decision
T014 can be closed as **done** at the planning/documentation level. Remaining work is implementation-detail planning around unified timeline scope, replay re-evaluation defaults, diff expansion, and live-vs-persisted observation detail rather than blockers to the MVP history/inspector behavior spec.
