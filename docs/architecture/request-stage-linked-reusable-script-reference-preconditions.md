# Request-Stage Linked Reusable-Script Reference Preconditions

- **Purpose:** Define the minimum future contract boundary for request-stage linked reusable-script references so later work does not reopen copy-based attachment, discovery polish, and live linkage semantics as one blended scope.
- **Created:** 2026-03-24
- **Last Updated:** 2026-03-24
- **Related Documents:** `script-editor-and-automation-ux.md`, `request-builder-mvp.md`, `internal-api-contracts.md`, `../tasks/task-066-request-stage-linked-reusable-script-reference-contract-narrowing.md`, `../tracking/request-stage-script-linkage-lane-comparison.md`
- **Status:** active reference
- **Update Rule:** Update when linked reusable-script references are promoted, when request-stage script binding shapes change, or when bundle/transfer behavior begins to include linked request-stage references.

## 1. Goal
After `T064` and `T065`, the product already supports:
- attach-by-copy from saved scripts into a request stage
- stage-aware navigation from the request-stage editor into `/scripts`

What remains explicitly deferred is true linked reusable-script behavior. This note defines the minimum contract boundary that must exist before such a feature is implemented.

## 2. Current Baseline
Today, request stages persist inline source only.
- request-stage scripts are request-owned after copy
- saved scripts are standalone workspace resources
- `/scripts` manages standalone saved scripts
- authored-resource bundle export/import preview/import includes standalone saved scripts but not request-stage shared-script references
- execution and history contracts already treat script-stage diagnostics as bounded runtime observation, independent of reusable linkage semantics

## 3. Future Contract Frame
If linked reusable-script references are promoted, the first implementation should start from a discriminated binding model.

### 3.1 Recommended stage binding shape
A future request stage should use one of exactly two modes:
- `inline`
- `linked`

Recommended conceptual shape:

```ts
interface InlineRequestStageScriptBinding {
  mode: 'inline';
  scriptType: 'pre-request' | 'post-response' | 'tests';
  sourceCode: string;
}

interface LinkedRequestStageScriptBinding {
  mode: 'linked';
  scriptType: 'pre-request' | 'post-response' | 'tests';
  savedScriptId: string;
  savedScriptNameSnapshot: string;
  linkedAt: string;
}
```

This note is intentionally conceptual. It does not yet promote any concrete DTO or persistence schema.

### 3.2 Why a discriminated model
- It keeps inline and linked stages mutually exclusive.
- It prevents the first linked-reference slice from silently mixing local override source with live linked source.
- It makes broken-reference and detach flows easier to reason about later.

## 4. Non-Goals For The First Linked Slice
The first linked-reference slice should **not** include:
- mixed `linked + local override` authoring state
- live in-place editing of the saved script from the request-stage editor
- automatic fallback to hidden inline snapshots after delete or import remap
- bundle/export/import behavior for linked request-stage references
- multi-request synchronization UI beyond the normal effects of linking by id

## 5. Lifecycle Rules To Freeze Before Implementation
### 5.1 Attach
- linking should happen through an explicit user action
- attaching a linked saved script should switch the stage to `linked` mode
- the request-stage editor should show clear linked-state chrome, not ordinary inline editing affordances

### 5.2 Edit
- linked source should be read-only in the request-stage editor
- the user should be able to open the standalone saved-script detail and edit there
- the only request-stage escape hatch should be an explicit future `Detach to copy` action

### 5.3 Rename
- saved-script rename should preserve the link by id
- request-stage chrome may refresh the display label from the latest saved script record
- rename should not detach or duplicate the stage binding

### 5.4 Delete
- deleting the linked saved script should not silently inline the old source
- the request stage should enter an explicit broken-reference state
- future UI can then offer bounded repair actions such as:
  - replace link
  - detach to copy if a snapshot is intentionally introduced later
  - remove linked stage binding

### 5.5 Execution
- when a link is healthy, execution should use the current saved-script source for that linked id
- execution should not use a hidden stale snapshot while claiming the stage is linked
- if the link is broken, the future product must decide whether run is blocked or whether the stage is skipped with an explicit warning; this remains **확실하지 않음**

## 6. Result / History Boundaries
Linked reusable-script references should not change the bounded result/history model by themselves.
- execution summaries remain stage-oriented
- response, console, tests, and `EnvironmentResolutionSummary` stay unchanged
- any future linked-state indicator in history or result surfaces should be additive metadata only

## 7. Bundle / Transfer Boundaries
The current authored-resource bundle intentionally excludes request-stage shared-script references.
If linked references are ever introduced later, a separate future task must decide whether bundle export/import:
- includes referenced saved scripts automatically
- rejects linked requests when referenced scripts are missing
- remaps linked ids during import

That decision is out of scope for the first linked-reference slice and should not be folded into it.

## 8. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether broken linked references should block `Run` or allow a degraded execution path.
- **확실하지 않음:** whether the first detach flow should preserve a timestamped provenance hint after converting to `inline` mode.
- **확실하지 않음:** whether linked references should expose saved-script updated timestamps or revision counters in request-stage chrome.
- **확실하지 않음:** whether import/export support for linked request stages should reuse bundle v2 or require a future bundle revision.

## 9. Practical Rule For Future Contributors
Do not start linked reusable-script implementation from the current copy-based request-stage editor. Start from this contract note first, then promote one bounded implementation task that covers only:
- discriminated stage binding shape
- linked-state read-only request-stage UI
- rename/delete broken-link rules
- a clearly bounded detach or repair seam
