# T036 - Button, Badge, and Radius Visual Hierarchy Refinement

- **Purpose:** Reduce excessive border-radius usage and clarify the visual distinction between buttons, badges, and tabs so controls read by role instead of looking like one repeated pill pattern.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-035-compact-shell-header-and-material-icon-usability-refresh.md`, `../architecture/material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T036 delivered a bounded visual-system correction after `T035`. The shell now keeps the compact header and icon refresh from the previous slice, but dense controls no longer rely on the same repeated pill geometry. Buttons now use tighter corners and stronger filled affordance, passive badges and status chips are flatter and lighter, and shared tab groups use tighter segmented geometry that avoids the previous overlapping rounded-surface look.

## 2. Why This Task Mattered
- Buttons, badges, and tabs were sharing too much of the same shape language, which weakened scanability and click-confidence.
- Large radii across tabs, chips, cards, and grouped surfaces created overlap and unclear edge ownership in dense layouts.
- The fix stayed inside a client-only visual-system refinement and improved usability without changing feature semantics.

## 3. Delivered Scope
### Completed
- reduced overall shape intensity for dense controls and grouped surfaces
- capped button corner radius around 12px through the shared shape scale and button-specific styling
- made buttons read as actionable while keeping badges and chips visually lighter and passive
- tightened shared tab geometry and grouped tab-container rhythm
- neutralized nested button-label styling that had been making some button interiors look like badges

### Explicitly Still Deferred
- backend or storage API changes
- feature-flow or state-ownership changes
- new component-library adoption
- icon-only control redesign
- route or information architecture changes

## 4. Definition Of Done
This task is complete because all of the following are now true:
- primary, secondary, and ghost buttons no longer look like badges or chips
- shared badges and chips remain visually lighter and more informational than buttons
- shared tabs and request subtabs no longer rely on oversized pill geometry and no longer create overlapping rounded-surface ambiguity
- the general radius language is tighter and more consistent across compact controls and grouped surfaces
- tracking/docs reflect the refinement and validation status

## 5. Guardrails
1. Keep this task client-only.
2. Do not change accessible names, control roles, or feature semantics.
3. Preserve the current Material 3 token-first approach rather than introducing a new library.
4. Prefer token/CSS refinement over broad TSX churn.
5. Keep badges passive-looking and buttons obviously actionable.

## 6. Validation Results
- `npm.cmd run lint:client` passed in this sandbox on 2026-03-23.
- `npm.cmd run typecheck` passed in this sandbox on 2026-03-23.
- `npm.cmd run test:ui` could not complete in this sandbox on 2026-03-23 because the repo's esbuild/Vitest transform preflight failed before test execution with `sandbox_esbuild_transform_blocked` / `spawn EPERM`.
- Local verification handoff per `AGENTS.md`:
  - Run `npm.cmd run test:ui`
  - Expected result: all tests pass; current suite inventory is 11 test files / 54 tests.

## 7. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: QA / Verification Agent
