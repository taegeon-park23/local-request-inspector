# Request-Stage Script Linkage Lane Comparison

- **Purpose:** Keep the request-stage reusable-script follow-up space bounded after `T064` and `T065` so future work does not blur copy, library-assist, and linked-reference semantics into one broad script theme.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `../architecture/script-editor-and-automation-ux.md`, `../tasks/task-061b-standalone-saved-scripts-authored-resource-bundle-expansion.md`, `../tasks/task-063-post-t062-request-stage-script-linkage-lane-comparison.md`, `../tasks/task-064-request-stage-saved-script-attach-by-copy.md`, `../tasks/task-065-request-stage-saved-script-library-assist-route-bridge.md`
- **Status:** active reference
- **Update Rule:** Update when one request-stage reusable-script lane is implemented, when the saved-script baseline materially changes, or when a narrower linked-reference candidate is explicitly promoted.

## 1. Compared Lanes
### Lane 1 - Attach saved script by copy
- Focuses on copying a saved script or template into one request-stage editor.
- Keeps the canonical request model request-bound and self-contained after the copy completes.
- Landed through `T064`.

### Lane 2 - Linked reusable script reference
- Focuses on attaching a reusable saved script as a live reference from one request stage.
- Would require the request model to distinguish local script source from linked reusable source.
- Would need explicit behavior for rename, delete, collision, detachment, and stale-version cases.
- Still parked.

### Lane 3 - Library-assist polish only
- Focuses on easier navigation between request-stage editors and the top-level Scripts library without changing request-stage persistence semantics.
- Improves discovery and copy ergonomics, but does not add live reusable attachment behavior.
- Landed through `T065` as a route-aware library bridge.

## 2. Repo-Grounded Baseline
- `T012` recorded two safe UX patterns for future script reuse: attach by copy or attach a saved-script reference, while marking the final semantics as **확실하지 않음**.
- `T027` shipped standalone saved-script CRUD and template browsing in `/scripts`.
- `T061B` included standalone saved scripts in workspace authored-resource bundle export/import preview/import, making saved scripts a clearer first-class authored resource.
- `T064` landed the copy-based request-stage bridge: the Scripts tab can filter compatible saved scripts by active stage and copy one selected saved script into request-owned stage source with a lightweight provenance hint.
- `T065` landed the bounded discovery bridge: the request-stage editor can open `/scripts` with stage-aware context, `/scripts` can prefilter and preselect the requested saved script, and users can return to `/workspace` without changing persistence semantics.
- Current request drafts still persist stage-local script source only. There is no canonical request-stage field for reusable-script linkage today.
- Current execution and history surfaces already separate script-stage diagnostics from transport and environment observation, so future script reuse slices should avoid reopening those result/history contracts.

## 3. Direct Comparison
| Criteria | Lane 1 - Attach by copy | Lane 2 - Linked reusable reference | Lane 3 - Library-assist polish only |
| --- | --- | --- | --- |
| User-facing gap clarity | Strong, now landed. | Real, but broader. | Moderate, now landed as a discovery aid. |
| Overlap with shipped baseline | High after `T064`. | Lower overlap. | High after `T065`. |
| Scope narrowness | Best bounded attachment slice. | Poorer. Reopens ownership and remap policy. | Narrow and discovery-focused. |
| Risk of reopening core decisions | Low after landing. | High. | Low. |
| Validation feasibility | Strong. | Weaker. | Strong. |
| Interaction with authored-resource bundle baseline | Clean. | Broader. | Minimal. |
| Likelihood of scope creep | Controlled when copy-only. | High. | Low. |

## 4. Decision
- Lane 1, **attach saved script by copy**, is landed and now forms the bounded request-stage reusable-script baseline.
- Lane 3, **library-assist polish only**, is also landed and now provides the bounded discovery bridge between request-stage authoring and the standalone Scripts library.
- Lane 2, **linked reusable reference**, remains parked because it would reopen persistence/reference semantics that the repo still treats as unresolved.
- No new request-stage reusable-script implementation is auto-promoted after `T065`.

## 5. What Would Change This Decision Later
- Revisit Lane 2 only if the product explicitly needs live reusable-script linkage and can own rename/delete/version/remap rules in one contract.
- If future script work resumes without live linkage, it should stay additive-only and avoid changing request save contracts, bundle/reference contracts, or result/history semantics.

## 6. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether the lightweight `Copied from saved script` provenance should remain ephemeral UI state or later become persisted authoring metadata.
- **확실하지 않음:** whether a future linked-reference slice would store version pins, detached snapshots, or mutable live references.
- **확실하지 않음:** whether any future request-stage/script follow-up should touch route-local search/filter polish in `/scripts` without reopening reusable linkage semantics.
