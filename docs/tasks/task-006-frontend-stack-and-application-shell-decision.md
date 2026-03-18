# T006 - Frontend Stack and Application Shell Decision

- **Purpose:** Select a frontend stack and application shell approach that can deliver the local-first API workbench UX without overcommitting to unnecessary SSR or platform coupling.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-003-ux-information-architecture-and-workspace-flows.md`, `../architecture/frontend-stack-and-shell.md`, `../architecture/ux-information-architecture.md`, `../architecture/workspace-flows.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P0

## 1. Summary
T006 turns the UX and architecture package into a concrete frontend direction. The goal is to choose a stack that supports a desktop-like single-user workbench with complex editor panels, event-driven runtime views, and strong maintainability, while remaining compatible with future desktop wrapping if needed.

## 2. Why This Task Matters Now
- T011 needs a concrete application shell and state boundary model before detailing request-builder interactions.
- T012 needs to know how script editors, diagnostics panels, and capability messaging fit into the shell.
- T014 needs the runtime views to be placed inside a stable navigation and panel model.
- T017 needs a target stack to define tooling, test, and local developer workflow decisions.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T006 because it already provides:
- target runtime layering and module boundaries in `../architecture/overview.md`
- workspace shell and journey guidance in `../architecture/ux-information-architecture.md` and `../architecture/workspace-flows.md`
- persistence/runtime separation in `../architecture/persistence-strategy.md`
- execution/event contracts in `../architecture/internal-api-contracts.md`
- safety constraints that influence frontend capability messaging in `../architecture/script-execution-safety-model.md`
- evidence of the current frontend limitations in `../../public/index.html`

The remaining questions about future desktop packaging and exact editor capability depth are still **확실하지 않음**, but they do not block a frontend stack decision for MVP planning.

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/frontend-stack-and-shell.md` exists.
- the current `public/index.html` limitations are summarized.
- realistic frontend stack candidates are compared for a local-first desktop-like tool.
- a recommended shell architecture and state ownership model are documented.
- the recommendation explicitly addresses SSR necessity, SPA suitability, editor/panel layout, SSE handling, and future desktop-wrapper compatibility.
- follow-up inputs for T011, T012, T014, and T017 are summarized.

## 5. Outputs
- `../architecture/frontend-stack-and-shell.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required upstream architecture, schema, safety, API, and UX documents were re-read before making a stack decision.
- The current `public/index.html` and `package.json` were re-checked to confirm the project has no existing frontend framework or toolchain constraints.
- `frontend-stack-and-shell.md` now records the stack comparison, shell recommendation, and downstream handoff notes.
- T006 outputs are sufficient to hand off to T011, T012, T014, and T017 as planning inputs.

## 7. Open Questions
1. Whether the product eventually ships as browser-only or with an Electron/Tauri wrapper remains **확실하지 않음**.
2. Whether routing should stay minimal-tab-driven or grow into deeper URL-addressable workspace subroutes remains **확실하지 않음**.
3. Whether Monaco should load in the initial bundle or be code-split behind script-focused views remains **확실하지 않음**.
4. Whether the final component library should be headless-first or a full design-system package remains **확실하지 않음**.

## 8. Handoff Checklist
- [x] T006 task file exists and is linked from tracking docs
- [x] frontend stack and shell decision doc exists
- [x] current frontend limitations are documented
- [x] candidate stacks are compared with a recommendation
- [x] state ownership and shell boundary guidance are documented
- [x] T011 / T012 / T014 / T017 handoff inputs are summarized

## 9. Recommended Owner
- Primary: Architecture / Frontend Lead
- Secondary reviewer: Product / UX

## 10. Closure Decision
T006 can be closed as **done** at the planning/documentation level. Remaining questions are implementation-detail refinements for T011, T012, T014, and T017 rather than blockers to the stack or shell direction.
