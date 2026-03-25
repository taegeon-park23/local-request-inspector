# Request-Stage Linked Reusable-Script Reference Contract

- **Purpose:** Record the landed request-stage linked saved-script baseline and the remaining bounded follow-up rules so contributors do not reopen copy attachment, linked execution, broken-link handling, and transfer semantics as one blended scope.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-25
- **Related Documents:** `script-editor-and-automation-ux.md`, `request-builder-mvp.md`, `internal-api-contracts.md`
- **Status:** active reference
- **Update Rule:** Update when linked request-stage script bindings, broken-link behavior, or transfer/remap semantics materially change.

## 1. Landed Baseline
After `T072` and the follow-up work completed inside `T073`, the product now supports:
- attach-by-copy from saved scripts into a request stage
- explicit linked request-stage saved-script references
- read-only linked-stage chrome inside the request builder
- broken-link detection when the referenced saved script is missing or mismatched
- run blocking when a linked stage is broken
- authored-resource bundle export/import that serializes and remaps linked request-stage bindings instead of rejecting them

This note is now the canonical summary of that landed baseline and the remaining follow-up boundaries.

## 2. Binding Model
Request-stage saved-script bindings use one of exactly two modes:
- `inline`
- `linked`

Conceptual shape:

```ts
interface InlineRequestStageScriptBinding {
  mode: 'inline';
  sourceCode: string;
}

interface LinkedRequestStageScriptBinding {
  mode: 'linked';
  savedScriptId: string;
  savedScriptNameSnapshot: string;
  linkedAt: string;
}
```

The important invariant is that inline source and linked source never coexist in one hidden hybrid state.

## 3. Current Lifecycle Rules
### 3.1 Attach
- Linking happens through an explicit user action in the request-stage editor.
- Linking switches the stage into `linked` mode.
- Copy attachment keeps the stage in `inline` mode with request-owned source.

### 3.2 Edit
- Linked stages are read-only in the request-stage editor.
- Users can jump to the standalone `/scripts` library for deeper review or edits.
- The bounded request-stage escape hatch is `Detach to copy`, which converts the linked stage back to inline source using the current resolved saved-script source when available.

### 3.3 Rename and Delete
- Rename preserves the link by id.
- Request-stage chrome may show the latest saved-script name, while the snapshot name remains available as fallback context.
- Delete does not silently inline old source. Broken links remain explicit until repaired or detached.

### 3.4 Execution
- Healthy links execute the current saved-script source for that linked id.
- Broken links block `Run`; they are not silently skipped and do not fall back to a hidden inline snapshot.
- Query degradation in the saved-script library is surfaced as degraded state, not as a broken-link claim.

## 4. Result and History Boundaries
Linked reusable-script references do not change the bounded result/history model by themselves.
- execution summaries remain stage-oriented
- response, console, tests, and `EnvironmentResolutionSummary` stay unchanged
- linked-state metadata in request-stage chrome is separate from persisted execution observation payloads

## 5. Transfer Boundary
The proprietary authored-resource bundle lane now carries linked request-stage bindings.
- export serializes linked request-stage metadata
- import remaps linked saved-script ids to the newly imported authored-resource identities
- the bounded transfer lane still remains proprietary; external formats are a separate future decision

## 6. Remaining Follow-Ups
The current linked baseline still does **not** include:
- mixed `linked + local override` authoring state
- live in-place editing of the saved script from the request-stage editor
- revision-aware diff/history for linked saved scripts
- external import/export formats for linked request-stage bindings

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether detach should preserve a timestamped provenance hint after converting to `inline` mode.
- **확실하지 않음:** whether linked-stage chrome should expose saved-script updated timestamps or revision counters.
- **확실하지 않음:** whether non-proprietary transfer formats should carry linked request-stage bindings directly or flatten them during export.

## 8. Practical Rule For Future Contributors
Do not reopen linked reusable-script work from the older copy-only baseline. Start from this landed contract:
- explicit copy-or-link stage modes
- read-only linked-stage request-builder UI
- broken-link run blocking
- bundle export/import remap support

Any further slice should add one bounded follow-up on top of that baseline instead of re-deciding the core linkage model.
