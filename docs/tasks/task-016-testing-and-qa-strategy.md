# T016 - Testing and QA Strategy

- **Purpose:** Define a realistic MVP testing and QA strategy that links architecture and UX decisions to specific verification layers, regression guards, and manual-vs-automated responsibilities.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-005-script-execution-safety-model.md`, `task-008-internal-api-contract-design.md`, `task-011-request-builder-mvp-design.md`, `task-012-script-editor-and-automation-ux-spec.md`, `task-013-mock-engine-rules-spec.md`, `task-014-history-inspector-behavior-spec.md`, `../architecture/testing-and-qa-strategy.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T016 converts the architecture, contract, persistence, request-builder, script UX, mock engine, and history/inspector outputs into an MVP QA strategy. The outcome defines which risks belong to unit, integration, contract, component/UI, and smoke testing layers; how manual QA complements automation; and which acceptance criteria should protect the highest-value user flows without overbuilding enterprise test infrastructure.

## 2. Why This Task Matters Now
- T017 needs concrete guidance on test runners, scripts, fixture shape, and local workflow expectations.
- T010 needs a testability-oriented feature breakdown so shell and feature modules do not bake in hard-to-verify coupling.
- Implementation needs explicit regression guards for redaction, timeout/cancellation, replay boundaries, mock outcome labeling, and request authoring vs execution observation separation.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T016 because it already defines:
- execution safety, timeout, capability denial, and redaction policies in `../architecture/script-execution-safety-model.md`
- canonical runtime/resource contracts and event vocabulary in `../architecture/internal-api-contracts.md`
- persistence-lane boundaries and redacted runtime storage direction in `../architecture/persistence-strategy.md` and `../architecture/persistence-bootstrap.md`
- user-facing behavior and vocabulary for request builder, script UX, mock engine, and history/inspector flows in `../architecture/request-builder-mvp.md`, `../architecture/script-editor-and-automation-ux.md`, `../architecture/mock-engine-rules-spec.md`, and `../architecture/history-and-inspector-behavior.md`
- shell/feature decomposition direction in `../architecture/frontend-stack-and-shell.md`

Repository check before starting showed that T001-T014 artifacts already existed, T016-specific task/architecture docs were missing, and tracking documents correctly listed T016 as a next ready planning task. No corrective tracking cleanup was required before drafting the strategy.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/testing-and-qa-strategy.md` exists.
- test layers and their ownership/risk focus are documented.
- request builder, script safety, mock engine, history/inspector, persistence, and SSE/runtime consistency verification expectations are defined.
- manual QA and automated QA boundaries are documented.
- smoke scenarios, defer items, and **확실하지 않음** items are summarized.

## 5. Outputs
- `../architecture/testing-and-qa-strategy.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required architecture, persistence, safety, contract, UX, mock, and history/inspector documents were re-read before defining T016.
- `testing-and-qa-strategy.md` now defines the MVP test-layer model, risk map, coverage matrix, smoke flows, and regression guards for redaction, replay, mock labeling, timeout/cancellation, and state separation.
- T016 outputs are sufficient to hand off to T017, T010, and implementation planning for tooling selection, shell composition, and early automation priorities.

## 7. Key Decisions
1. MVP verification should be contract/integration/component heavy rather than E2E-first.
2. Redaction, timeout, cancellation, blocked states, replay boundaries, and mock outcome labeling are top-tier regression risks and require explicit regression guards.
3. Request authoring state and execution observation state must be tested as separate state domains.
4. Live runtime event detail and persisted history detail are allowed to differ, but QA must verify that the difference matches policy and copy rather than treating all divergence as failure.
5. Manual QA remains necessary for first-use, degraded-state, and UX labeling review even when automated coverage exists.

## 8. Open Questions
1. The exact automation stack choices for UI/component/E2E tooling remain **확실하지 않음** and belong partly to T017.
2. The long-term balance between browser-driven smoke tests and lower-level integration harnesses remains **확실하지 않음**.
3. Whether contract checks are generated from schemas or maintained as explicit fixtures remains **확실하지 않음**.
4. Whether SSE test harnesses should use simulated streams, loopback servers, or both by default remains **확실하지 않음**.

## 9. Handoff Checklist
- [x] T016 task file exists and is linked from tracking docs
- [x] testing / QA architecture doc exists
- [x] test layers, risk map, and coverage expectations are documented
- [x] smoke scenarios and regression guards are documented
- [x] manual-vs-automated QA boundaries are documented
- [x] T017 / T010 / implementation handoff inputs are summarized

## 10. Recommended Owner
- Primary: QA / Senior Engineer
- Secondary reviewer: Frontend + Backend leads

## 11. Closure Decision
T016 can be closed as **done** at the planning/documentation level. Remaining work is tooling selection, fixture implementation, and automation slicing rather than blockers to the MVP QA strategy itself.
