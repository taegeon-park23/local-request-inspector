# T043 - Shell Density And Collapsible Navigation Refinement

- **Purpose:** Refine the compact shell so the top bar becomes a true 42px-height control strip, navigation can collapse to an icon-only rail, and header/sidebar/main separation relies on shadow-box depth instead of line separators.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-035-compact-shell-header-and-material-icon-usability-refresh.md`, `task-036-button-badge-and-radius-visual-hierarchy-refinement.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T043 landed as a bounded shell-only follow-up after T035/T036. The shell top bar now behaves like a true 42px control strip, the runtime-status wrapper no longer reads as a second passive card, navigation can collapse into an icon-only rail without losing accessible route names, and the header/sidebar/main regions now separate primarily through softer shadow-box depth instead of hard line dividers.

## 2. Planned Scope
### In Scope
- reduce the shell top bar to an actual 42px-height row
- resize brand mark, breadcrumb, runtime status copy, and badge alignment to fit that height cleanly
- remove extra border/background treatment from `shell-topbar__status`
- add a collapsible shell navigation state with a rail-toggle affordance
- keep route link accessible names stable when the navigation rail collapses to icons only
- replace top-level shell separators with shadow-box region separation across header, navigation rail, and main route surface
- add shell smoke coverage for the navigation collapse behavior

### Explicitly Out Of Scope
- backend or persistence changes
- route ownership or feature-state changes
- top-bar environment selection
- broader layout docking redesign
- full Mocks-route localization or other unrelated i18n follow-up work

## 3. Guardrails
1. The slice must remain client-only.
2. The header still only shows the brand icon, route breadcrumb, and runtime connection status.
3. Navigation collapse must not break existing link labels, route switching, or keyboard access.
4. Existing feature surfaces keep their current semantics and ownership; only shell-level density and presentation change.
5. If sandbox UI verification remains blocked, use local command handoff per `AGENTS.md` instead of leaving the task open.

## 4. Definition Of Done
This task is complete when all of the following are true:
- the top bar renders at 42px height with internal controls scaled to match
- `shell-topbar__status` no longer uses the previous chip/card background and border treatment
- the navigation rail can collapse and expand, showing icons only in the collapsed state while preserving accessible link names
- header, navigation, and main shell regions read as separate elevated surfaces through shadow-box treatment rather than line separators
- shell smoke coverage exists for the collapse toggle
- docs/tracking reflect the landed refinement and its bounded scope

## 5. Validation Results
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `git -c safe.directory=C:/dev/local-request-inspector diff --check` passed in this sandbox on 2026-03-23 after the T043 edits.
- `npm.cmd run test:ui` was not rerun in this sandbox on 2026-03-23 because this repo still hits the known `sandbox_esbuild_transform_blocked` / `spawn EPERM` failure before Vitest transform startup.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 62 tests.

## 6. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: Product / Documentation Agent
