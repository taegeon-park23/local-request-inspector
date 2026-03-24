# T069 - Route-Panel Default Presentation Settings Preference

- **Purpose:** Add the next bounded `/settings` mutation slice by exposing a client-owned default preference for floating route explorers without reopening runtime defaults, storage/admin actions, or a server-backed settings resource.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-067-settings-mutation-lane-comparison.md`, `task-068-client-owned-interface-preferences-settings-baseline.md`, `../tracking/settings-mutation-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/ux-information-architecture.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
`T069` extends the client-owned interface-preferences lane that started in `T068`. `/settings` now exposes a second bounded presentation preference for the default floating-explorer state used by Workspace, Captures, History, Mocks, Environments, and Scripts. The preference persists locally, rehydrates on reload, and updates the current session's route-explorer defaults without introducing a broader settings contract.

## 2. Included Scope
- one additional client-owned preference card in `/settings`
- local persistence for the default floating-explorer open/collapsed state
- first-render rehydration for focused floating-explorer routes
- immediate in-session updates to the default explorer state for supported routes
- route tests covering persistence and first-render presentation behavior

## 3. Explicitly Deferred
- per-route explorer preferences
- shell density / compactness preference
- server-owned runtime defaults
- storage/bootstrap/reset/backup actions
- workspace-scoped or synced settings persistence

## 4. Definition Of Done
This task is done when all of the following are true:
- `/settings` exposes a bounded preference for default floating-explorer presentation
- the preference persists locally and rehydrates on reload
- supported floating-explorer routes honor the stored preference on first render
- docs/tracking reflect that `/settings` still remains inside client-owned interface preferences only

## 5. Validation
- `npm.cmd run typecheck`
- `npm.cmd run lint:client`
- `npm.cmd run test:ui -- client/features/settings/components/SettingsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`

Validated in this sandbox on 2026-03-24:
- `npm.cmd run typecheck` -> passed
- `npm.cmd run lint:client` -> passed

Direct sandbox rerun result:
- `npm.cmd run test:ui -- client/features/settings/components/SettingsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx` -> blocked before Vitest transform work with `sandbox_esbuild_transform_blocked` / `spawn EPERM`

Local verification handoff:
1. Run `npm.cmd run test:ui -- client/features/settings/components/SettingsPlaceholder.test.tsx client/app/router/AppRouter.test.tsx`
2. Expected result for the current repo state: exit code `0`, with the settings test proving that the route-explorer preference persists and affects supported floating routes, and the router test proving that the stored floating-explorer default rehydrates on first render.

## 6. Open Questions
- **확실하지 않음:** whether future client-owned interface preferences should stop at shell presentation and stay out of denser per-surface layout controls.
- **확실하지 않음:** whether any future density preference should be global, route-scoped, or remain outside `/settings` entirely.
