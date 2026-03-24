# Environment Follow-Up Lane Comparison

- **Purpose:** Compare the currently deferred environment-related follow-up lanes directly so future contributors can narrow the next environment task without reopening broad global-state or transfer scope by default.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `resolved-preview-sub-lane-comparison.md`, `../architecture/request-environment-selection-and-resolution.md`, `../tasks/task-029-request-environment-selection-and-resolution-plan.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`
- **Status:** active reference
- **Update Rule:** Update when one deferred environment lane is promoted, when the implemented baseline materially changes, or when a new narrower environment follow-up candidate replaces one of the current lanes.

## 1. Compared Lanes
### Lane 1 - Richer resolved-preview UX
- Focuses on the request authoring/result experience after `T030`.
- Keeps request-level environment selection as the ownership model.
- Would add bounded visibility into how environment resolution affects active execution inputs without exposing secret raw values.

### Lane 2 - Top-bar global environment selector
- Focuses on shell-level environment state instead of request-level explicit selection.
- Would add cross-tab/global environment behavior above the current request header selector.
- Would need to explain how global state interacts with persisted `selectedEnvironmentId`.

### Lane 3 - Environment transfer as an authored-resource type
- Focuses on import/export behavior for environments.
- Would add environments to some future authored-resource transfer contract beyond the current request/mock bundle scope.
- Would need to define behavior for secret/default semantics and imported request references.

## 2. Repo-Grounded Baseline
- `T027` already shipped persisted environment CRUD, default-environment enforcement, and masked secret handling in `/environments`.
- `T029` explicitly narrowed the implemented baseline to request-level selector plus server-owned run-time resolution, not top-bar global state.
- `T030` already shipped `selectedEnvironmentId` persistence, default seeding for new drafts, missing-reference blocking, server-owned placeholder resolution, and execution/history environment labels.
- The request result panel already shows one bounded execution-time environment label in `Execution Info`.
- Current save/run validation already blocks missing environment references and unresolved required placeholders.
- Current authored-resource transfer still covers saved requests and mock rules only; environments are not in bundle membership today.

## 3. Direct Comparison
| Criteria | Lane 1 - Richer resolved-preview UX | Lane 2 - Top-bar global selector | Lane 3 - Environment transfer |
| --- | --- | --- | --- |
| User-facing gap clarity | Stronger. `T030` resolves on the server and shows only bounded result metadata, so users may later want slightly better pre-run or post-run visibility into what changed without altering ownership. | Weaker. The request-level selector already solves the main environment-selection workflow, so the remaining gap is convenience/global-state symmetry rather than missing core capability. | Real but less immediate. Environment management exists, but transfer semantics are still absent and under-specified. |
| Overlap with shipped baseline | Moderate overlap. The current result panel already shows environment label and blocking feedback, but not richer resolution-oriented feedback. | High overlap. Users can already select environments per request, save them, and run with them. | Lower overlap. No transfer contract exists today, but the missing contract is large. |
| Scope narrowness | Best of the three. Can stay inside request/result/history presentation and validation language if tightly bounded. | Poorer. It reopens shell-wide state ownership, tab interaction, and default-versus-explicit selection rules. | Poorer. It reopens authored-resource boundaries, secret/default handling, request references, and import/export semantics together. |
| Risk of reopening core decisions | Lower if bounded to visibility and not semantics. | High. Could undermine the request-level explicit-selection rule chosen in `T029`/`T030`. | High. Could reopen Candidate A transfer debates plus request/runtime coupling. |
| Validation feasibility | Credible. Can rely on request-builder/result/history UI tests and current run-lane behavior. | Credible only with broader cross-tab UI behavior and extra state rules. | Credible eventually, but would need transfer API, persistence, and mixed-resource validation changes. |
| Likelihood of scope creep | Moderate. Preview can expand into full diff/inspect tooling if not bounded. | High. Global selector convenience can quickly turn into override precedence and synchronization redesign. | High. Transfer can quickly turn into bundle membership, import remapping, and secret policy churn. |
| Fit with current no-promotion state | Best fit for a future narrow lane if priorities change. | Not a good fit today. | Not a good fit today. |

## 4. Lane-Specific Notes
### Lane 1 - Richer resolved-preview UX
- This is the strongest future environment lane because it builds directly on `T030` without changing the current request-level ownership model.
- `T033` later narrows the strongest future sub-lane inside this bucket to post-run bounded resolution summary in request-result and history observation surfaces.
- A narrow version would likely stay inside one bounded question such as:
  - clearer unresolved-placeholder feedback tiers, or
  - bounded resolved-summary copy in request/result/history surfaces
- A promotable version must still avoid:
  - exposing raw secret values
  - adding a full resolved-request inspector
  - changing save/run semantics

### Lane 2 - Top-bar global environment selector
- This is weaker because the request header selector already covers the core workflow and persists explicit request intent.
- A top-bar selector would need explicit rules for:
  - whether it seeds only new requests or also overrides open tabs
  - whether saved requests with explicit `selectedEnvironmentId` ignore it
  - how replay drafts and history-linked requests behave
- That makes it too likely to reopen decisions already settled by `T029` and implemented by `T030`.

### Lane 3 - Environment transfer as an authored-resource type
- This is real but broad because `T030` added new coupling rather than narrowing it.
- Any future transfer contract would now need to explain:
  - secret replacement and masking behavior
  - default-environment behavior after import
  - imported request `selectedEnvironmentId` remapping or missing-reference outcomes
  - whether run/history environment labels remain purely observational
- That keeps this lane parked behind a much narrower contract-definition step.

## 5. Decision
- Lane 1, richer resolved-preview UX, is the strongest future environment follow-up lane if a later request needs one more environment-related task.
- Lane 2, top-bar global environment selector, remains parked because it would reopen shell-level state ownership that `T029` and `T030` intentionally avoided.
- Lane 3, environment transfer, remains parked because it is still broad and now carries more request/runtime coupling than it did before `T030`.
- This comparison does **not** promote a new implementation task by itself.

## 6. What Would Change This Decision Later
- Promote Lane 1 only if one concrete bounded visibility gap is documented, not “better environment UX” generally.
- Revisit Lane 2 only if the product explicitly needs shell-level environment state and can defend new precedence rules over the current request-level model.
- Revisit Lane 3 only if authored-resource strategy work defines one narrow environment transfer contract before any implementation task is written.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether the strongest future resolved-preview lane is pre-run feedback, post-run summary refinement, or history/result consistency work.
- **확실하지 않음:** whether any later global selector need would remain convenience-only or would reopen request override semantics immediately.
- **확실하지 않음:** whether environment transfer can ever become narrow enough without a prior import-remapping contract for request references.

