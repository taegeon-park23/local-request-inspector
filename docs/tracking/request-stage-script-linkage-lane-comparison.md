# Request-Stage Script Linkage Lane Comparison

- **Purpose:** Compare the deferred request-stage reusable-script linkage lanes after `T061B` and `T062` so future script follow-up work does not reopen copy, live reference, and library-polish scope as one blended theme.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `../architecture/script-editor-and-automation-ux.md`, `../tasks/task-061b-standalone-saved-scripts-authored-resource-bundle-expansion.md`, `../tasks/task-063-post-t062-request-stage-script-linkage-lane-comparison.md`, `../tasks/task-064-request-stage-saved-script-attach-by-copy.md`
- **Status:** active reference
- **Update Rule:** Update when one request-stage reusable-script linkage lane is promoted, when the saved-script baseline materially changes, or when a narrower linkage candidate replaces one of the current lanes.

## 1. Compared Lanes
### Lane 1 - Attach saved script by copy
- Focuses on copying a saved script or template into one request stage editor.
- Keeps the canonical request model request-bound and self-contained after the copy completes.
- Would add one bounded library-to-stage reuse flow without introducing shared-live linkage semantics.

### Lane 2 - Linked reusable script reference
- Focuses on attaching a reusable saved script as a live reference from one request stage.
- Would require the request model to distinguish local script source from linked reusable source.
- Would need explicit behavior for rename, delete, collision, detachment, and stale-version cases.

### Lane 3 - Library-assist polish only
- Focuses on easier navigation between request-stage editors and the top-level Scripts library without changing request-stage persistence semantics.
- Would improve discovery and copy ergonomics, but it would not actually add reusable-script attachment behavior.

## 2. Repo-Grounded Baseline
- `T012` already records two safe UX patterns for future script reuse: attach by copy or attach a saved-script reference, while marking the final semantics as **확실하지 않음**.
- `T027` shipped standalone saved-script CRUD and template browsing in `/scripts`.
- `T039` localized the request-bound script authoring surface and the Scripts library surface, but it did not connect reusable saved scripts to request-stage persistence.
- `T061B` now includes standalone saved scripts in workspace authored-resource bundle export/import preview/import, which makes saved scripts a clearer first-class authored resource than before.
- Current request drafts persist stage-local script source only. There is no canonical request-stage field for reusable-script linkage today.
- Current execution and history surfaces already separate script-stage diagnostics from transport and environment observation, so a future script reuse slice should avoid reopening those result/history contracts.

## 3. Direct Comparison
| Criteria | Lane 1 - Attach by copy | Lane 2 - Linked reusable reference | Lane 3 - Library-assist polish only |
| --- | --- | --- | --- |
| User-facing gap clarity | Strong. Users already have saved scripts and request-stage editors, but there is no direct reuse path between them. | Real, but broader. It promises stronger reuse than the repo currently models. | Weaker. It helps navigation but not the actual reusable-script gap. |
| Overlap with shipped baseline | Moderate. The library and request stages already exist; only the copy bridge is missing. | Lower overlap. The repo has no request-stage linkage contract today. | High overlap. Open-detail and manual copy already exist as adjacent workflows. |
| Scope narrowness | Best of the three. It can stay inside request-stage authoring and one explicit import/copy action. | Poorer. It reopens reference ownership, stale-link semantics, and version drift policy. | Narrow, but low leverage. |
| Risk of reopening core decisions | Lower. The copied script becomes ordinary request-bound source after insertion. | High. It reopens whether requests store live references, detached snapshots, or hybrid linkage metadata. | Low, but it does not solve the stronger product gap. |
| Validation feasibility | Strong. It can rely on request-builder authoring tests plus saved-script picker/copy assertions. | Weaker. It would need new persistence, save/run, delete, and rename behavior tests. | Strong, but payoff is smaller. |
| Interaction with authored-resource bundle baseline | Clean. Saved scripts stay bundle resources, while copied request-stage source remains request-owned. | Broader. It would couple bundle/import behavior to request-stage reference remapping and missing-link handling. | Minimal. |
| Likelihood of scope creep | Moderate. It can still drift into stage mismatch or template/link variants if not bounded. | High. Live reference semantics invite multi-request synchronization and mutation policy churn. | Low. |

## 4. Lane Notes
### Lane 1 - Attach saved script by copy
- This is the strongest future lane because it turns the now-persisted and transferable saved-script library into a bounded authoring aid without reopening shared-live-edit semantics.
- A clean implementation can stay bounded to:
  - stage-filtered saved-script picker or attach action
  - copy into the active stage editor
  - stage mismatch validation or disabled choices
  - lightweight provenance hint such as `Copied from saved script`
- A promotable implementation must still avoid:
  - live synchronization between reusable scripts and request stages
  - new request-stage reference ids
  - cross-request mutation propagation

### Lane 2 - Linked reusable script reference
- This remains parked because it would need explicit answers for:
  - what the request stores when a saved script is linked
  - how request execution behaves after the saved script is renamed or deleted
  - whether edits in the request stage mutate the saved script, create a detached copy, or require an explicit unlink flow
  - how imported/exported requests behave when script references are missing
- That is a much broader contract than the current request-bound script baseline.

### Lane 3 - Library-assist polish only
- This remains parked because it is a weaker improvement than actual attach behavior.
- It may still matter later for discoverability, especially around:
  - open-library-detail from a request stage
  - search/filter polish in `/scripts`
  - provenance callouts after copy
- It should not outrank the missing reusable attachment path itself.

## 5. Decision
- Lane 1, **attach saved script by copy**, is the strongest future narrow lane for request-stage reusable-script work.
- Lane 2, linked reusable reference, remains parked because it would reopen persistence/reference semantics that the repo still treats as unresolved.
- Lane 3, library-assist polish only, remains parked because it is useful but lower leverage than adding a bounded copy-based attachment flow.
- This comparison does **not** auto-promote implementation by itself, but it does make one future bounded follow-up implementation-ready.

## 6. What Would Change This Decision Later
- Promote Lane 1 if another request-builder/script follow-up is explicitly requested and the implementation can stay copy-only.
- Revisit Lane 2 only if the product explicitly needs live reusable-script linkage and can own rename/delete/version/remap rules in one contract.
- Revisit Lane 3 only if the reusable copy flow is already implemented and discoverability becomes the concrete remaining gap.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether the first copy-based slice should add a dedicated picker modal, an inline saved-script dropdown, or a route-bridge action from `/scripts`.
- **확실하지 않음:** whether stage mismatch should block attachment entirely or offer a copy-with-stage-change action.
- **확실하지 않음:** whether provenance should remain a one-time `Copied from...` hint or become persisted authoring metadata later.
