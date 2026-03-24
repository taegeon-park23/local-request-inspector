# T067 - Settings Mutation Lane Comparison

- **Purpose:** Narrow the remaining settings-mutation follow-up space after the diagnostics-first `/settings` MVP so future contributors do not reopen presentation preferences, runtime defaults, and storage/admin actions as one blended settings theme.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-027-placeholder-route-mvp.md`, `../architecture/ux-information-architecture.md`, `../tracking/settings-mutation-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `task-068-client-owned-interface-preferences-settings-baseline.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
`T027` intentionally left `/settings` as a diagnostics-first read-only surface. That kept placeholder-route replacement bounded, but it also left a broad future question behind: what kind of mutation, if any, should Settings own first? `T067` narrows that question into directly comparable lanes and fixes one clear future-first lane. The result is that client-owned interface preferences are the strongest future settings slice, while runtime defaults and storage/admin actions remain parked because they reopen much broader ownership and safety questions.

## 2. Why This Task Matters Now
- `/settings` is no longer a placeholder, so the remaining follow-up space is not “finish Settings” generically.
- Current docs still mention workspace preferences, runtime defaults, and future persistence/security settings at a broad level.
- Without a direct lane comparison, future settings work could easily widen into execution policy, maintenance operations, or backup/reset UX without a bounded contract.

## 3. Inputs Reviewed
- `task-027-placeholder-route-mvp.md`
- `../architecture/ux-information-architecture.md`
- current `/settings` client route and runtime-status baseline
- current tracking notes for deferred environment, script, and authored-resource lanes

## 4. Decision
`T067` fixes the future settings-mutation priority order to this shape:
1. **Client-owned interface preferences** is the strongest future settings lane.
2. **Runtime defaults and execution preferences** remain parked.
3. **Storage and maintenance actions** remain parked.

The comparison is recorded in `../tracking/settings-mutation-lane-comparison.md`.

## 5. Outputs
- `../tracking/settings-mutation-lane-comparison.md`
- tracking updates in `../tracking/`
- a bounded future task stub in `task-068-client-owned-interface-preferences-settings-baseline.md`

## 6. Validation
This was a planning/documentation task only.
- validated consistency between this task doc, `settings-mutation-lane-comparison.md`, `master-task-board.md`, `priority-roadmap.md`, and the updated IA wording
- no runtime or client/server code change is required to complete `T067`

## 7. Recommended Next Step
- Do not auto-promote broad settings mutation just because `T067` exists.
- If settings mutation is explicitly requested later, start from `task-068-client-owned-interface-preferences-settings-baseline.md` and keep the first slice client-owned, presentation-only, and free of new runtime/storage mutation contracts.
