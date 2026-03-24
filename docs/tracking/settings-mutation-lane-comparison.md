# Settings Mutation Lane Comparison

- **Purpose:** Compare the remaining settings-mutation follow-up lanes directly so future contributors can narrow one safe next settings task without reopening runtime defaults, storage administration, and broader preferences as one blended scope.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `../architecture/ux-information-architecture.md`, `../tasks/task-027-placeholder-route-mvp.md`, `../tasks/task-067-settings-mutation-lane-comparison.md`, `../tasks/task-068-client-owned-interface-preferences-settings-baseline.md`, `../tasks/task-069-route-panel-default-presentation-settings-preference.md`, `../tasks/task-070-shell-density-settings-preference.md`
- **Status:** active reference
- **Update Rule:** Update when one deferred settings lane is promoted, when the `/settings` baseline materially changes, or when a narrower settings-mutation candidate replaces one of the current lanes.

## 1. Compared Lanes
### Lane 1 - Client-owned interface preferences
- Focuses on low-risk preferences that affect shell and management presentation only.
- Stays inside client-owned state and local persistence rather than reopening server-owned runtime or storage policy.
- Landed through `T068`, `T069`, and `T070` with a default navigation-rail preference, a default floating route-explorer presentation preference, and a shell-density preference.
- Future additive concerns could still include later alignment polish around existing locale/presentation controls.

### Lane 2 - Runtime defaults and execution preferences
- Focuses on mutable defaults that affect request execution or runtime behavior.
- Example future concerns: default timeout, capture/logging defaults, future request-run defaults, or policy-adjacent script/runtime settings.

### Lane 3 - Storage and maintenance actions
- Focuses on settings-driven maintenance actions and persistence administration.
- Example future concerns: bootstrap helpers, reset/cleanup actions, backup/export helpers, and workspace-level maintenance commands.

## 2. Repo-Grounded Baseline
- `T027` intentionally shipped `/settings` as a diagnostics-first read-only surface backed by `GET /api/settings/runtime-status`.
- `T037` already added one bounded client-owned preference flow, locale persistence, without turning `/settings` into a broader mutation surface or introducing a settings resource contract.
- `T068` now adds one bounded client-owned interface preference for the default navigation-rail state, persisted locally and reflected immediately in shell presentation.
- `T069` now adds one bounded client-owned interface preference for the default floating-explorer state used by supported route explorers, persisted locally and reflected on first render plus in-session preference updates.
- `T070` now adds one bounded client-owned interface preference for shell-density mode, persisted locally and reflected through shell-only spacing changes without altering route-level content density.
- Runtime behavior, request execution defaults, environment resolution, and storage bootstrap already have bounded ownership elsewhere in the repo; `/settings` does not currently own those contracts.
- Current docs still mention broader future settings ideas such as runtime defaults and preferences, but the only landed mutation baseline remains client-owned presentation state.

## 3. Direct Comparison
| Criteria | Lane 1 - Client-owned interface preferences | Lane 2 - Runtime defaults and execution preferences | Lane 3 - Storage and maintenance actions |
| --- | --- | --- | --- |
| User-facing gap clarity | Stronger. The route already contains client-facing diagnostics and a locale switch, so a small presentation-preferences lane is easy to explain. | Real but broader. These defaults touch request execution, environment handling, or safety vocabulary outside current settings ownership. | Real but broader. Maintenance actions are meaningful, but they reopen destructive flows and confirmation semantics quickly. |
| Overlap with shipped baseline | Moderate. Locale persistence already proves one low-risk settings-like mutation path exists on the client side. | Lower overlap. No current settings contract owns execution-default mutation. | Lower overlap. Current route is read-only and does not own maintenance actions. |
| Scope narrowness | Best. Can stay client-only and presentation-only. | Poorer. Reopens server-owned behavior and policy boundaries. | Poorer. Reopens irreversible actions, backup semantics, and operator safety rules. |
| Risk of reopening core decisions | Low if bounded to shell/interface preferences only. | High. Could blur settings with request execution, environment semantics, or safety policy. | High. Could blur settings with tooling, migration, or admin workflows. |
| Validation feasibility | Strong. Can rely on client route tests and local persistence checks. | Weaker. Would need new API/state rules and broader execution regressions. | Weaker. Would need new confirmation, error, and possibly file-system or storage mutation tests. |
| Likelihood of scope creep | Moderate but controllable. | High. | High. |

## 4. Lane-Specific Notes
### Lane 1 - Client-owned interface preferences
- This is the strongest future settings lane because it extends an already-shipped settings-adjacent mutation pattern without changing request/run/storage contracts.
- A promotable first slice should stay bounded to presentation and local persistence only.
- The first slice should avoid broad theme systems or cross-device sync language.

### Lane 2 - Runtime defaults and execution preferences
- This remains parked because it would need explicit ownership rules for how settings interact with request tabs, saved requests, environment selection, and execution history.
- It also risks reopening script safety and runtime policy boundaries that are intentionally documented elsewhere.

### Lane 3 - Storage and maintenance actions
- This remains parked because it would need destructive-action rules, backup/recovery language, and stronger operator guardrails than the current settings route owns.
- The current command catalog and path hints already cover bounded diagnostics needs without UI-side mutation.

## 5. Decision
- Lane 1, `client-owned interface preferences`, is now the landed settings-mutation baseline through `T068`, `T069`, and `T070`.
- Lane 2, `runtime defaults and execution preferences`, remains parked because it would reopen request execution and policy ownership.
- Lane 3, `storage and maintenance actions`, remains parked because it would reopen destructive maintenance semantics and backup/recovery flows.
- No new settings implementation is auto-promoted beyond the landed client-preferences baseline.

## 6. What Would Change This Decision Later
- Promote Lane 1 only if the first slice stays client-owned, presentation-only, and explicitly avoids new server settings contracts.
- Revisit Lane 2 only if the product explicitly wants runtime defaults in Settings and can defend new precedence rules against request-level ownership.
- Revisit Lane 3 only if the repo identifies one concrete maintenance gap that is not already covered by diagnostics, command hints, or CLI workflows.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether the first interface-preferences slice should persist only per device or later evolve into workspace-scoped preferences.
- **확실하지 않음:** whether density, route-panel defaults, and locale should live in one bounded task or be split further.
- **확실하지 않음:** whether future maintenance actions should ever live inside `/settings` instead of staying CLI-first with diagnostics guidance.
