# T068 - Client-Owned Interface Preferences Settings Baseline

- **Purpose:** Define the first bounded implementation slice for settings mutation by adding client-owned interface preferences to `/settings` without introducing server-owned runtime defaults, storage/admin actions, or a general settings resource contract.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-027-placeholder-route-mvp.md`, `task-067-settings-mutation-lane-comparison.md`, `../tracking/settings-mutation-lane-comparison.md`, `../architecture/ux-information-architecture.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
`T068` is the first landed implementation slice that follows `T067`. The route now exposes one bounded client-owned interface preference, the default navigation-rail state, without introducing a server-backed settings resource or reopening runtime/storage administration. The preference persists locally, rehydrates on reload, and visibly affects shell presentation while keeping `/settings` scoped to diagnostics plus presentation-only controls.

## 2. Included Scope
- one small client-owned preferences section in `/settings`
- local persistence for interface preferences only
- bounded UI controls and preview copy for those preferences
- route tests covering preference persistence and visible UI changes

## 3. Candidate Preference Types
The implemented slice includes:
- default navigation-rail presentation preference
- local persistence through browser storage
- immediate shell reactivity from the settings surface

Future interface-preferences work may still consider:
- interface language alignment with the existing locale switch
- shell density / compactness preference
- route-panel default presentation preference

## 4. Explicitly Deferred
- server-owned settings resource contracts
- runtime defaults such as request timeout, capture defaults, or script policy
- storage/bootstrap/reset/backup actions
- environment/script/request execution semantics
- broad theme-system work or cross-device sync language

## 5. Definition Of Done
This task will be done when all of the following are true:
- `/settings` exposes at least one bounded client-owned preference that the user can change
- the preference persists locally and rehydrates on reload
- the changed preference visibly affects shell or route presentation
- docs/tracking reflect that settings mutation is still bounded to interface preferences rather than to runtime/storage administration

## 6. Validation
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
2. Expected result for the current repo state: exit code `0`, with the settings test proving that the navigation-rail preference updates shell state and local storage, and the router test proving that the shell rehydrates the stored navigation-rail preference on first render.

## 7. Open Questions
- **확실하지 않음:** whether the first preference slice should ship only one preference or a tiny bundle.
- **확실하지 않음:** whether shell density and route-panel defaults are narrow enough to share one task with locale alignment.
- **확실하지 않음:** whether future workspace-scoped preference persistence should ever replace the current client-owned model.
