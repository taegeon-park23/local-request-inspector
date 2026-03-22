# Material 3 Adoption Plan

- **Purpose:** Define the safe, incremental adoption path for Material 3 foundations in the current shell-first React workbench without changing feature semantics or state ownership.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-23
- **Related Documents:** `overview.md`, `frontend-stack-and-shell.md`, `request-builder-mvp.md`, `script-editor-and-automation-ux.md`, `mock-engine-rules-spec.md`, `history-and-inspector-behavior.md`, `frontend-workspace-shell-implementation-plan.md`, `../tasks/task-010-frontend-workspace-shell-implementation-plan.md`, `../tracking/post-m3-reactivation-guide.md`
- **Status:** done
- **Update Rule:** Update when the Material 3 foundation strategy, token model, component mapping, or rollout slices materially change.

## 1. Goal
Apply Material 3 foundations to the current workspace shell in a way that:
- preserves shell-first composition
- preserves authoring vs observation separation
- preserves family-aware status separation
- avoids a big-bang visual rewrite
- supports incremental code review through small slices

This document is not a component-library migration proposal. It is a token-first visual-system plan for the existing custom shell.

## 2. Current UI Diagnosis
### Good boundaries worth preserving
- `client/app`, `client/features/*`, and `client/shared/*` are already separated cleanly.
- `Workspace` and `request-builder` remain authoring surfaces.
- `Captures` and `History` remain observation surfaces.
- `Mocks` remains authored rule management rather than runtime observation.
- `StatusBadge` already preserves distinct status families for connection, mock outcome, execution outcome, transport outcome, and test summary.
- `PanelTabs`, `DetailViewerSection`, `KeyValueMetaList`, and `EmptyStateCallout` are reusable seams that can be reskinned without changing feature ownership.

### Current design-system reality
- The visual system is effectively ad hoc and centralized in `client/app/shell/shell.css`.
- Color, spacing, radius, and typography values are repeated directly rather than expressed through design tokens.
- The shell is dark-first, but there is no light-ready token layer or theme structure.
- Many controls are visually similar while serving different roles, which weakens hierarchy between authoring, observation, and management surfaces.

## 3. Material 3 Adoption Principles
### Foundation rules
- Use Material 3 color roles and surface tiers as the baseline.
- Use a compact subset of the Material 3 typography scale suited to a dense desktop workbench.
- Use shape, elevation, and state-layer tokens rather than one-off per-feature values.
- Keep explicit focus visibility, keyboard support, and readable contrast above decorative polish.

### Product-specific guardrails
- Do not collapse authoring and observation into one visual model.
- Do not collapse status families into one generic badge system.
- Do not mix semantics work with visual-system work in the same slice.
- Do not assume a full Material component library is required.

## 4. Recommended Strategy
### Recommendation
Use a **token-first custom implementation**:
- CSS variables as the runtime source of truth
- thin shared-primitives reskinning
- feature-local composition kept intact
- no MUI or other full component-library adoption in the first phase

### Why this fits the repo
- The repo already uses a custom React shell and custom shared primitives.
- Existing feature boundaries map well to Material 3 surface roles without changing state ownership.
- A library-first rewrite would force DOM, class, and interaction changes that are out of scope for a safe visual refresh.

## 5. Token / Theme Architecture
### Foundation token groups
- Color roles: primary, secondary, tertiary, error, surface, surface-container tiers, outline, scrim
- Typography: headline-small, title-large, title-medium, body-large, body-medium, label-large, label-medium, label-small
- Shape: xs, s, m, l, xl, full
- Elevation: 0 through 3
- State: hover, pressed, selected, focus ring
- Spacing and density: 4dp-aligned compact desktop rhythm
- Motion: short and medium transitions only

### Theme structure
- Dark remains the default active theme.
- Light tokens exist from the start so the system is light-ready.
- Theme Builder output is a reference/generation artifact, not the runtime source of truth.
- Repo-maintained CSS variables remain canonical.

## 6. Surface Mapping
### Shell chrome
- Top app bar maps to a small top bar with distinct surface treatment and status slot.
- Navigation becomes a Material-style rail treatment while keeping route-backed section ownership.
- Explorer, main surface, and detail panel keep the existing three-panel structure but receive clearer surface hierarchy.

### Shared primitives
- `PanelTabs` maps to a Material-style secondary tab or segmented treatment depending on context.
- `DetailViewerSection` maps to a card/section container with stronger surface, border, and type hierarchy.
- `KeyValueMetaList` keeps `dl` semantics and gains label/value rhythm consistent with Material 3.
- `EmptyStateCallout` becomes a supporting card rather than a dashed placeholder box.
- `StatusBadge` keeps family-aware semantics and only changes visual tone and state tokens.

### Feature surfaces
- Request builder keeps stronger authoring emphasis through clearer field affordances and control hierarchy.
- Captures and History keep observation emphasis through clearer summary cards, result tabs, and list-row hierarchy.
- Mocks keeps authored management emphasis with neutral rule-state treatment and no collapse into capture-side outcome vocabulary.

## 7. Incremental Rollout
### M3-1 Foundation
- Add token/theme layer
- Dark default plus light-ready tokens
- Global focus, shape, spacing, and elevation baselines

### M3-2 Shell and shared primitives
- Top bar, navigation rail, panel surfaces
- `PanelTabs`, `DetailViewerSection`, `EmptyStateCallout`, `StatusBadge`

### M3-3 Authoring controls
- Request tabs
- request-builder inputs, field groups, buttons, scripts authoring shell

### M3-4 Observation surfaces
- Request result panel
- Captures
- History

### M3-5 Management and secondary surfaces
- Mocks
- Workspace explorer
- placeholder sections and remaining shell affordances

### M3-6 Accessibility and polish
- contrast tuning
- keyboard/focus verification
- density tuning
- light theme activation and restrained motion refinement

## 8. Figma and Workflow
- Use Material 3 Design Kit as a component anatomy and spacing reference.
- Use Material Theme Builder to generate initial role sets from the chosen seed color.
- Keep code tokens as the canonical source of truth.
- Keep Figma lightweight: foundations, shell mapping, primitives, and three representative feature surfaces only.

## 9. Accessibility and Quality Baseline
- Contrast: 4.5:1 for body text on primary surfaces
- Explicit focus ring on interactive controls
- Keyboard-reachable nav rail, tabs, rows, and action buttons
- Minimum practical touch targets for buttons and row actions
- Status badges remain distinguishable by label, border, placement, and color
- Empty, deferred, and disabled messaging must stay explicit and not appear broken

## 10. Open Questions / 확실하지 않음
### Ready to lock now
- Token-first custom implementation is the preferred path.
- Dark default with light-ready tokens is appropriate.
- Theme Builder is a reference tool, not runtime state.

### Still requires implementation judgment
- Final seed color can stay close to the current cyan continuity or be neutralized later.
- Typography can move to Roboto/Roboto Flex later if local availability and rendering quality justify it.
- Navigation rail iconography can stay lightweight in the first implementation phase and be refined later.

### Explicitly deferred
- Dynamic/system color
- Material Expressive motion
- full component-library migration
- layout/docking redesign
- command palette redesign tied to visual-system work

## 11. Implementation Notes
- Keep all changes visual-system-scoped.
- Do not change save/run/history/captures/mocks/scripts/replay semantics.
- Do not move canonical ownership of any feature state.
- Prefer CSS-token and shared-primitives work before deeper per-feature markup changes.
- **Implementation follow-up (2026-03-22):** the initial rollout now includes a Material 3 token layer, dark-default light-ready theme attributes, shell chrome materialization, a top-bar role legend, route-role cues in the navigation rail, and a first-pass reskin across shared primitives, request-builder controls, and observation/management cards without changing feature semantics.
- **Implementation follow-up (2026-03-22):** a later visual-only pass extends role cues from shell chrome into feature-level list, detail, and contextual-panel headers for Workspace, Captures, History, and Mocks, reinforcing authoring vs observation vs management boundaries without touching state ownership.
- **Implementation follow-up (2026-03-22):** `M3-F2` is now landed as a CSS-first accessibility/density polish pass that strengthens focus-visible clarity, interaction-state contrast, supporting-container separation, and dense metadata/readiness/list scanability across shared tabs, action/filter groups, detail/meta primitives, and list-row surfaces without changing behavior or ownership.
- **Implementation follow-up (2026-03-23):** `T035` is now landed as the current visual plus light-UX continuation slice. It compacts the shell header, moves the shell breadcrumb to a route-only `Workbench / section` model, introduces a local curated SVG icon primitive inspired by Material Symbols Rounded, and limits icon adoption to navigation, top-level section headers, shared tabs, empty/detail callouts, and icon-plus-label primary actions.
- **Guardrail refresh (2026-03-23):** `T035` remains client-only. It does not change backend APIs, persisted state ownership, request/capture/history/mock semantics, or the server-owned environment-resolution contract.
- **Implementation follow-up (2026-03-23):** `T036` is now landed as the next visual correction slice after `T035`. It tightens shape usage, reduces over-rounded grouped surfaces, caps button corners near 12px, and increases the visual separation between actionable buttons and passive badges/tabs without changing semantics or contracts.

## 12. Post-S26 Follow-Up Slices
### M3-F1 — Secondary surfaces and remaining shell affordances
- Scope: placeholder/secondary routes and remaining shell affordances only.
- Guardrails: keep the slice visual-only, prefer CSS-first changes, and do not change feature ownership or behavior.

### M3-F2 — Accessibility, contrast, and density polish
- Scope: focus-visible treatment, supporting-container rhythm, spacing/density, and empty/deferred/disabled readability across shared primitives and list/detail/filter surfaces.
- Guardrails: use the existing smoke/readiness flows as regression checks and keep all save/run/history/captures/mocks/scripts/replay semantics stable.
- Status: done on 2026-03-22 as a bounded CSS-only refinement pass; no TSX restructuring was included.

### M3-F3 — TSX presentation refinement
- Scope: request-builder and active request observation wrapper hierarchy only.
- Gate: the slice is already applied in code; use local verification handoff when sandboxed confirmation cannot run.
- Fallback: if sandboxed verification is blocked, request exact local commands and compare against expected results instead of reopening the slice as blocked/deferred.
- Official gate procedure: run `npm run check:m3f3-gate`. The check requires `typecheck`, a real dev-transform probe against `/`, `/app/bootstrap/main.tsx`, `RequestWorkSurfacePlaceholder.tsx`, and `RequestResultPanelPlaceholder.tsx`, plus bounded build/test preflight reporting. Dev-server startup or root HTML alone never clears the gate.
- Hold-state reference: use `../tracking/post-m3-reactivation-guide.md` before requesting extra local confirmation of `M3-F3` or promoting any optional post-M3 backlog item.
- Re-check note (2026-03-22): the gated TSX surfaces remain `client/features/request-builder/components/RequestWorkSurfacePlaceholder.tsx` and `client/features/request-builder/components/RequestResultPanelPlaceholder.tsx`.
- Validation note (2026-03-22): `npm.cmd run typecheck` passes after the wrapper/CSS patch, a user-verified non-sandbox local `npm.cmd run test:ui` passed the then-current full UI suite, and sandbox-only reruns of the gate remain environment-blocked because Vite/esbuild worker startup hits `spawn EPERM` on `/app/bootstrap/main.tsx`, `RequestWorkSurfacePlaceholder.tsx`, and `RequestResultPanelPlaceholder.tsx`.
- Status: done in tracking on 2026-03-22. `M3-F3` has the intended request-builder/result-panel wrapper cleanup in code, and future sandbox-blocked confirmation should be handled through local command handoff rather than as an active milestone blocker.

### T035 — Compact shell header and icon-supported usability refresh
- Scope: shell header compaction, route-only breadcrumb, navigation/icon refresh, shared-primitives icon support, and icon-plus-label primary-action polish only.
- Guardrails: keep the slice visual plus light UX only, keep text labels canonical for accessibility and tests, and do not change backend or state ownership.
- Status: done on 2026-03-23 as a client-only continuation of the current Material 3 baseline.

### T036 — Button, badge, and radius visual hierarchy refinement
- Scope: reduce excessive radius intensity across dense controls and grouped surfaces, make buttons more obviously actionable than chips/status badges, and tighten shared tab geometry.
- Guardrails: keep the slice client-only, preserve accessible names and control roles, and prefer CSS/token refinement over broad TSX churn.
- Status: done on 2026-03-23 as a bounded Material 3 control-hierarchy refinement pass.

### Explicitly Deferred Beyond This Sequence
- light theme activation
- restrained motion refinement
