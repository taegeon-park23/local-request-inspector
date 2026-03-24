# T070 - Shell Density Settings Preference

- **Purpose:** Add the next bounded `/settings` mutation slice by exposing a client-owned shell-density preference that only affects shell chrome spacing and does not reopen runtime defaults, storage/admin actions, or route-level density systems.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-067-settings-mutation-lane-comparison.md`, `task-068-client-owned-interface-preferences-settings-baseline.md`, `task-069-route-panel-default-presentation-settings-preference.md`, `../tracking/settings-mutation-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/ux-information-architecture.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
`T070` extends the client-owned interface-preferences lane that now includes `T068` and `T069`. `/settings` now exposes a bounded shell-density preference with `compact` and `comfortable` modes. The preference persists locally, rehydrates on reload, and adjusts only shell chrome spacing such as the top bar, navigation rail, and outer shell framing.

## 2. Included Scope
- one additional client-owned preference card in `/settings`
- local persistence for shell density mode
- first-render rehydration for shell chrome density
- shell-only density overrides for top bar, navigation rail, and outer shell spacing
- route tests covering persistence and first-render presentation behavior

## 3. Explicitly Deferred
- route-level card density controls
- per-route density overrides
- server-owned runtime defaults
- storage/bootstrap/reset/backup actions
- broad theme-system or typography preference work

## 4. Definition Of Done
This task is done when all of the following are true:
- `/settings` exposes a bounded shell-density preference
- the preference persists locally and rehydrates on reload
- changing the preference visibly affects shell chrome only
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
2. Expected result for the current repo state: exit code `0`, with the settings test proving that the shell-density preference persists and updates shell presentation, and the router test proving that the stored shell-density preference rehydrates on first render.

## 6. Open Questions
- **확실하지 않음:** whether any future route-level density control should stay outside `/settings` and remain feature-owned instead.
- **확실하지 않음:** whether later client-owned interface preferences should keep using one card per preference or introduce a grouped presentation section.
