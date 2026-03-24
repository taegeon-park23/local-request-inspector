# T063 - Post-T062 Request-Stage Script Linkage Lane Comparison

- **Purpose:** Narrow the remaining request-stage reusable-script follow-up space after `T061B` and `T062` so future work does not reopen copy, live reference, and library-polish scope as one blended script theme.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `task-012-script-editor-and-automation-ux-spec.md`, `task-061b-standalone-saved-scripts-authored-resource-bundle-expansion.md`, `task-064-request-stage-saved-script-attach-by-copy.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../architecture/script-editor-and-automation-ux.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
`T061B` made standalone saved scripts first-class authored-resource bundle members, but request-stage reusable-script behavior still remains deferred. `T063` narrows that remaining follow-up space into directly comparable lanes and fixes the strongest future bounded lane without promoting broad reference semantics by default.

## 2. Evaluated Lanes
### Lane A — Attach saved script by copy
- Copy one saved script into the active request stage editor.
- Keeps the request model request-bound after copy.

### Lane B — Linked reusable script reference
- Attach one saved script as a live reusable reference from the request stage.
- Reopens unresolved persistence and synchronization semantics.

### Lane C — Library-assist polish only
- Improve request-stage to library discovery and open-detail affordances.
- Does not add actual reusable attachment behavior.

## 3. Decision
The strongest future narrow lane is:
- **attach saved script by copy**

This lane is strong because it:
- uses the now-persisted and transferable saved-script library without changing request execution or history contracts
- avoids live reusable-script linkage semantics
- keeps request-stage authoring self-contained after the copy completes

`linked reusable script reference` and `library-assist polish only` remain deferred.

## 4. Future T064 Boundary
If request-stage reusable-script implementation resumes, it should promote:
- **`T064 - Request-stage saved-script attach-by-copy`**

That future implementation should stay bounded to:
- stage-filtered saved-script attach actions
- copy into the active request stage source
- stage mismatch validation or gating
- lightweight provenance hinting only

It should explicitly avoid:
- live linked reusable-script references
- new request-stage reference ids in saved request contracts
- multi-request synchronization or unlink/version flows

## 5. Explicitly Excluded From T063
- any request-builder, server, or storage code change
- linked reusable-script reference implementation
- scripts-library discoverability polish beyond what is needed to compare lanes
- environment follow-up, settings mutation, or authored-resource migration work

## 6. Validation
This was a planning/documentation task only.
- validated consistency between this task doc, `request-stage-script-linkage-lane-comparison.md`, `master-task-board.md`, and `priority-roadmap.md`
- no runtime or client/server code change is required to complete `T063`

## 7. Recommended Next Step
- Do not treat linked reusable-script references as the default next slice.
- If another bounded script-authoring follow-up is explicitly requested, promote **`T064 - Request-stage saved-script attach-by-copy`** first.
