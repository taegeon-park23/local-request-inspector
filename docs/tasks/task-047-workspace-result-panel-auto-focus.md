# T047 - Workspace Result Panel Auto Focus And Immediate Feedback

- **Purpose:** Refine the workspace result panel so runs automatically surface the most relevant result tab, keep the detail panel visible in the single-panel layout, and expose immediate console/test feedback without extra tab switching.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-044-single-panel-route-tabs-layout.md`, `task-040-workspace-result-panel-localization-pass.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T047 is a bounded workspace follow-up to `T044` and the request-result UX lane. It promotes the active result tab from component-local state into shared per-request command state, applies auto-focus rules after each run, and ensures the route-local detail panel becomes visible again when fresh execution output lands.

## 2. Planned Scope
### In Scope
- promote workspace result-tab selection into shared per-tab command state
- auto-select `tests` or `console` after run completion based on the latest execution payload
- force the workspace route-panel layout back to the detail panel when new run output settles
- add immediate-feedback badges and preview snippets for console/tests in the result-panel summary area
- add focused regression coverage for result-tab auto focus behavior

### Explicitly Out Of Scope
- backend execution payload contract changes
- persisted history/captures observation redesign
- broader docking, split-resize, or multi-panel persistence work
- runtime-token translation or unrelated request-builder ARIA follow-up work

## 3. Guardrails
1. Result focus must stay per request tab instead of becoming one shared global tab state.
2. Auto-focus rules must not override a request tab forever; users can still manually change tabs after the run settles.
3. If an execution has no console/test output, the panel should keep a non-diagnostic tab rather than forcing an empty diagnostic view.
4. The single-panel route layout from `T044` must stay mounted and state-preserving while the detail panel is re-selected.

## 4. Definition Of Done
This task is complete when:
- workspace result-tab state is shared per active request tab instead of being component-local
- run completion selects `tests` first, then `console`, then keeps a non-diagnostic tab when no diagnostic output exists
- workspace detail panel visibility is restored automatically after a run completes
- the result-panel header/summary exposes immediate execution badges plus bounded console/test previews
- regression coverage confirms the auto-focus rule at the store/UI seam
- tracking docs link the change back to `T044`

## 5. Validation Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `npm.cmd run test:ui -- request-command-store.test.ts`

## 6. Implementation Notes
- Added per-tab `activeResultTab` state plus auto-focus helpers to `request-command-store` so runs can promote `tests` or `console` without relying on component-local React state.
- Wired the workspace single-panel layout to shared route-panel selection so run completion can move the route back to the detail panel after `T044`.
- Updated the workspace result panel to show immediate outcome badges and bounded preview lists for console/tests in the summary and response surfaces.
- Added focused store-level regression coverage for the new auto-focus rules.

## 7. Validation Results
- `npm.cmd run typecheck` — passed in sandbox on 2026-03-23
- `npm.cmd run lint:client` — passed in sandbox on 2026-03-23
- `npm.cmd run test:ui -- request-command-store.test.ts` — passed in sandbox on 2026-03-23
