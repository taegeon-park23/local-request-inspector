# T071 - Post-T070 Priority Review And Linked-Script Promotion

- **Purpose:** Re-evaluate the next implementation candidate after the bounded `/settings` preference baseline now spans `T068`-`T070`, and decide whether another settings slice or a different already-narrowed lane should be promoted next.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, `task-067-settings-mutation-lane-comparison.md`, `task-068-client-owned-interface-preferences-settings-baseline.md`, `task-069-route-panel-default-presentation-settings-preference.md`, `task-070-shell-density-settings-preference.md`, `task-072-request-stage-linked-reusable-script-reference-baseline.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/settings-mutation-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/request-stage-linked-reusable-script-reference-preconditions.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
After `T068`, `T069`, and `T070`, `/settings` now has three bounded client-owned interface preferences:
- locale persistence baseline from `T037`
- navigation-rail default state from `T068`
- route-explorer default presentation from `T069`
- shell-density mode from `T070`

That is enough to make the settings lane honest without continuing to spend the next promotion on more shell presentation. The stronger remaining candidate is request-stage linked reusable-script references, but only if the first implementation slice stays narrow and explicitly avoids authored-resource bundle expansion.

## 2. Compared Next-Step Options
### Option 1 - Keep extending `/settings`
- Still technically possible through more client-owned presentation preferences.
- Weaker now because the route already has multiple bounded preference controls and no newly documented shell gap forces another immediate slice.

### Option 2 - Promote linked reusable-script references
- Stronger now because:
  - `T061B` made saved scripts a first-class authored resource
  - `T064` landed attach-by-copy
  - `T065` landed the route bridge into `/scripts`
  - `T066` froze the minimum contract frame for linked references
- Still risky unless the first slice explicitly avoids reopening bundle semantics.

### Option 3 - Reopen broader parked work
- Candidate B/C, runtime-default settings, storage/admin settings, and broader environment transfer all remain broader and less ready than the linked-script lane.

## 3. Decision
- Do **not** auto-promote another `/settings` implementation slice after `T070`.
- Promote the linked reusable-script lane as the next strongest implementation candidate.
- The promoted implementation should start from one additional narrowing choice:
  - linked request-stage bindings may be saved and reloaded as part of request definitions
  - request export and workspace authored-resource bundle export should be **blocked** when linked request-stage bindings are present
  - broader linked-request bundle/import semantics remain a later dedicated task

This makes the first linked-reference slice meaningfully useful without forcing bundle transfer changes into the same implementation.

## 4. Why This Decision Is Narrow Enough
- It reuses the contract frame already frozen in `T066`.
- It avoids broadening `/settings` beyond the already-landed client-preferences baseline.
- It avoids reopening authored-resource bundle schema/version work in the same slice.
- It gives the next implementation a clear stop line: request-stage linkage, save/load, run-time usage, rename/delete/broken-link behavior, and export blocking only.

## 5. Outputs
- `task-072-request-stage-linked-reusable-script-reference-baseline.md`
- tracking updates in `../tracking/`
- linked-script reference note refresh in `../architecture/`

## 6. Validation
This was a planning/documentation task only.
- validated consistency between this task doc, `task-072-request-stage-linked-reusable-script-reference-baseline.md`, `request-stage-script-linkage-lane-comparison.md`, `request-stage-linked-reusable-script-reference-preconditions.md`, `master-task-board.md`, and `priority-roadmap.md`
- no runtime or client/server code change is required to complete `T071`

## 7. Recommended Next Step
- Start `T072` as the next bounded implementation task.
- Keep its stop line at:
  - discriminated request-stage linked bindings
  - linked-state read-only request-stage UI
  - rename/delete broken-link behavior
  - detach-to-copy escape hatch
  - request save/load support
  - export blocking for linked requests
