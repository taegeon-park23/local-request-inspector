# T013 - Mock Engine Rules Spec

- **Purpose:** Define the MVP mock engine behavior, authoring UX, matcher scope, response generation rules, and diagnostics model so implementation can replace the legacy singleton mock config with predictable workspace-scoped rules.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-008-internal-api-contract-design.md`, `task-009-workspace-persistence-bootstrap.md`, `task-011-request-builder-mvp-design.md`, `task-012-script-editor-and-automation-ux-spec.md`, `../architecture/mock-engine-rules-spec.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T013 turns the architecture, API, persistence, request-builder, and script UX outputs into a product-level mock engine spec. The outcome defines how users author and manage workspace-scoped mock rules, which request attributes can be matched in MVP, how priority and rule state behave, what kinds of responses/delays are supported, and how mock hit/miss diagnostics appear without being confused with normal transport results.

## 2. Why This Task Matters Now
- T014 needs a stable mock-hit/miss vocabulary when connecting captures, replay, and timeline/history behavior.
- Implementation needs predictable matcher/priority/response rules before defining rule evaluation services, persistence schemas, and diagnostics surfaces.
- The product must move away from the current single global mock configuration toward workspace-scoped authored rules without reintroducing ambiguous runtime behavior.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T013 because it already defines:
- `MockRule` as a workspace-scoped resource plus optional scenario seam in `../architecture/domain-model.md` and `../architecture/shared-schema.md`
- mock-rule CRUD routes and capture/query/event seams in `../architecture/internal-api-contracts.md`
- resource/runtime persistence boundaries in `../architecture/persistence-strategy.md` and `../architecture/persistence-bootstrap.md`
- mock management shell placement and capture/replay relationships in `../architecture/ux-information-architecture.md` and `../architecture/workspace-flows.md`
- request/result separation and script-capability constraints that limit script-assisted mocking in `../architecture/request-builder-mvp.md`, `../architecture/script-execution-safety-model.md`, and `../architecture/script-editor-and-automation-ux.md`

Repository check before starting showed that T001-T012 artifacts already existed, T013-specific task/architecture docs were missing, and tracking documents still correctly listed T013 as the next planning task. No additional tracking cleanup was required before drafting content.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/mock-engine-rules-spec.md` exists.
- MVP matcher, priority, state, and response-generation behavior are documented.
- authoring UX and diagnostics surfaces are defined for Mocks, Captures, and related runtime views.
- deferred items and **확실하지 않음** items are clearly marked.
- handoff inputs for T014 and implementation are summarized.

## 5. Outputs
- `../architecture/mock-engine-rules-spec.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required architecture, persistence, API, IA, request-builder, and T012 documents were re-read before defining T013.
- `mock-engine-rules-spec.md` now defines MVP matcher scope, explicit priority rules, response-generation boundaries, diagnostics vocabulary, and mock/capture/replay relationships.
- T013 outputs are sufficient to hand off to T014 and to implementation planning for rule data modeling, evaluation ordering, diagnostics surfaces, and persistence seams.

## 7. Key Decisions
1. MVP moves from a legacy global singleton mock setting to workspace-scoped `MockRule` resources with explicit enable/disable state and numeric priority.
2. The canonical evaluation model is explicit priority first, then deterministic tie-breakers, rather than declaration order alone.
3. Matcher scope stays intentionally narrow in MVP: method, path/URL target, query, headers, and lightweight body matching.
4. Script-assisted matcher or response generation is deferred because it would cross unresolved T005/T012 safety and capability boundaries.
5. Mock outcomes must be labeled explicitly as `Mocked`, `Bypassed`, `No rule matched`, or `Blocked` so users do not confuse them with upstream network transport results.

## 8. Open Questions
1. Whether body matching in MVP should allow simple JSON-subset matching or only exact/raw contains matching is **확실하지 않음**.
2. Whether capture replay should default to preserving the original mocked/bypassed mode or always run against the current active rule set is **확실하지 않음**.
3. Whether scenario state deserves a minimal authored placeholder in MVP or should remain entirely deferred is **확실하지 않음**.
4. Whether mock diagnostics become part of a unified T014 timeline or stay capture-scoped first is **확실하지 않음**.

## 9. Handoff Checklist
- [x] T013 task file exists and is linked from tracking docs
- [x] mock engine spec architecture doc exists
- [x] matcher, priority, state, and response behavior are documented
- [x] diagnostics, labeling, and persistence constraints are documented
- [x] empty states, warnings, defer items, and **확실하지 않음** items are documented
- [x] T014 / implementation handoff inputs are summarized

## 10. Recommended Owner
- Primary: Product + Backend + Frontend
- Secondary reviewer: Architecture Agent

## 11. Closure Decision
T013 can be closed as **done** at the planning/documentation level. Remaining work is implementation-detail planning around body-matcher depth, replay defaults, diagnostics timelines, and future scenario-state evolution rather than blockers to the MVP mock rules spec.
