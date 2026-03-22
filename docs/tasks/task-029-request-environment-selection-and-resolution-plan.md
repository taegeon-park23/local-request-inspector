# T029 - Request Environment Selection And Resolution Plan

- **Purpose:** Define the bounded implementation contract for request-level environment selection and server-owned environment resolution after `T027`.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-011-request-builder-mvp-design.md`, `task-027-placeholder-route-mvp.md`, `../architecture/request-builder-mvp.md`, `../architecture/request-environment-selection-and-resolution.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T029 narrows the next request-builder follow-up after `T027`. It fixes the implementation boundary at request-level environment selection in the request header plus server-owned environment resolution at run time. It explicitly defers the top-bar selector, client-side secret resolution, full resolved-preview UI, and broader environment transfer work.

## 2. Why This Task Matters Now
- `T027` created a real persisted environment workflow surface, so the next request-builder step can now be specified concretely.
- The request-builder MVP and execution contracts already mention environment selection and resolution, but they still needed one bounded, implementation-ready interpretation.
- Without this task, contributors could easily widen the next slice into top-bar global state, client-side secret handling, or broader environment management churn.

## 3. Definition Of Done
This task is done when all of the following are true:
- the next environment-related implementation slice is bounded to request-level selection plus server-owned resolution
- save lane, run lane, and missing-reference behavior are all documented explicitly
- top-bar selector and other broader environment work remain deferred explicitly
- tracking docs point to one canonical boundary document instead of relying on scattered older notes

## 4. Outputs
- `../architecture/request-environment-selection-and-resolution.md`
- tracking updates in `../tracking/`

## 5. Key Decisions
1. The next selector is request-level, not top-bar global.
2. New request tabs seed from the current workspace default environment only at creation time.
3. Saved request definitions persist explicit `selectedEnvironmentId` rather than following default changes implicitly.
4. Run-time environment resolution is server-owned because secret-backed rows are masked in client DTOs.
5. Missing environment references block save/run until the user chooses an available environment or `No environment`.

## 6. Handoff Checklist
- [x] next-slice boundary documented
- [x] request/save/run ownership model documented
- [x] missing-reference behavior documented
- [x] deferred scope listed explicitly
- [x] board, roadmap, and progress docs updated

## 7. Recommended Owner
- Primary: Architecture + Implementation Agent
- Secondary reviewer: QA / Verification Agent

## 8. Closure Decision
T029 is complete as a planning task. The repo now has a bounded, implementation-ready environment-selection/resolution contract without prematurely widening into global selector state or broader environment tooling.
