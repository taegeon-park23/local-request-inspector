# T095 Explorer Should + Accessibility Reinforcement

- **Purpose:** Add Explorer should-level usability and accessibility reinforcements: always reveal opened item, tree type-ahead navigation, and shortcut/command entry for major workspace actions.
- **Created:** 2026-03-26
- **Last Updated:** 2026-03-26
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../prd/overview.md`
- **Status:** doing

## Scope
- Explorer always reveals the currently opened/selected item by expanding ancestor nodes.
- Tree keyboard type-ahead moves focus to matching nodes without requiring search-box focus.
- Add major action shortcut lane and command entry access from workspace header.

## Assumptions
- This bounded task does not implement multi-select or drag/drop tree controls.
- Command entry stays lightweight (header command menu + keyboard shortcuts), not a global palette framework.

## Acceptance Criteria
1. Opening/activating a saved request tab auto-reveals its location in Explorer (ancestor collection/groups expanded).
2. With treeitem focus, typing letters performs type-ahead focus navigation to matching node labels.
3. Workspace exposes discoverable command entry and shortcuts for key actions (new request/quick/new collection/new group/run selected).
4. Existing explorer search, expand/collapse persistence, and request open/preview/pin flows continue to work.

## Verification Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test:node`
- Playwright smoke in Codex:
  - open a saved request tab and verify explorer reveal behavior
  - focus explorer tree and verify type-ahead focus jump
  - use shortcut/command entry to trigger major actions
- UI full-suite verification remains user-managed (`npm.cmd run test:ui`) per AGENTS policy.
