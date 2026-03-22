# Resolved-Preview Sub-Lane Comparison

- **Purpose:** Compare the narrower follow-up candidates inside the richer resolved-preview UX lane so future contributors can choose one bounded environment-observation task without reopening broad validation or summary-polish scope.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `environment-follow-up-lane-comparison.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../architecture/request-builder-mvp.md`, `../architecture/request-environment-selection-and-resolution.md`, `../architecture/request-environment-resolution-summary-contract.md`, `../tasks/task-030-request-environment-selection-and-runtime-resolution.md`, `../tasks/task-032-post-t030-environment-follow-up-lane-comparison.md`, `../tasks/task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../tasks/task-034-post-t033-resolution-summary-contract.md`
- **Status:** active reference
- **Update Rule:** Update when one narrower resolved-preview sub-lane is promoted, when the implemented environment baseline materially changes, or when a new narrower observation candidate replaces one of the current sub-lanes.

## 1. Compared Sub-Lanes
### Sub-Lane 1 - Pre-run unresolved-feedback tiering
- Focuses on the active request authoring surface before transport starts.
- Would split environment-resolution problems into clearer blocking versus warning-only feedback instead of relying mainly on run-time failure summaries.
- Would likely add request-surface messaging beyond the current selected-environment support copy.

### Sub-Lane 2 - Post-run bounded resolution summary
- Focuses on the observation surfaces after execution settles.
- Would add bounded metadata about environment resolution impact to the active request result panel and persisted history.
- Would stay observation-first and would not expose raw resolved values or secret content.

### Sub-Lane 3 - Explorer and readability copy propagation
- Focuses on compact authored-summary copy rather than execution-time diagnostics.
- Would consider things like default-seeded hints or environment labels in request summaries and explorer-facing copy.
- Would improve readability but would not materially deepen runtime observation.

## 2. Repo-Grounded Baseline
- `T030` already ships request-level environment selection, default-environment seeding for new drafts, missing-reference blocking, and server-owned placeholder resolution.
- The request header already shows selected-environment support copy, default badges, and missing-reference status.
- `useRequestBuilderCommands` blocks save/run for missing environment references and malformed JSON, but unresolved placeholders are not precomputed there today.
- `environment-resolution.js` already records unresolved placeholders with field paths during server-owned resolution and summarizes them when transport is blocked.
- The active request result panel and persisted history already show one bounded `Environment` label in `Execution Info`, but they do not yet show richer resolution-oriented summaries.
- Saved-request explorer summaries do not currently include environment labels or default-seeded hints.

## 3. Direct Comparison
| Criteria | Sub-Lane 1 - Pre-run unresolved-feedback tiering | Sub-Lane 2 - Post-run bounded resolution summary | Sub-Lane 3 - Explorer and readability copy propagation |
| --- | --- | --- | --- |
| User-facing gap clarity | Real. Users only see missing-environment blocking before run and unresolved-placeholder specifics mainly after server-owned execution begins. | Stronger. The repo already executes server-owned resolution but only returns minimal environment label metadata to the observation surfaces. | Weaker. Better copy would help, but it does not answer the stronger “what changed at run time?” question. |
| Overlap with shipped baseline | Lower overlap. The current request surface does not yet calculate unresolved placeholder tiers pre-run. | Moderate overlap. The result/history surfaces already carry execution metadata and environment labels. | Higher overlap. The current request surface already has selected-environment support copy and default badges. |
| Scope narrowness | Moderate at best. It quickly pulls in validation-tier semantics, preview timing, and possibly a new preview/validation seam. | Best of the three. It can stay inside result/history observation metadata if kept strictly bounded. | Narrow but weaker. It risks becoming a copy-polish pass rather than the strongest environment follow-up. |
| Dependency pressure | Higher. Credible implementation likely needs new pre-run validation ownership beyond the current run-only resolution path. | Lower. It can build on the existing run-time resolution and history/result DTO path. | Lower. Mostly presentation and summary language, but that also limits leverage. |
| Risk of reopening core decisions | Higher. It can reopen the deferred blocking-versus-warning placeholder semantics from the architecture note. | Lower if bounded to metadata and observation copy only. | Moderate. It can blur authored-request summaries with runtime-observation vocabulary. |
| Validation feasibility | Weaker. It likely needs new authoring-surface behavior and more validation semantics. | Stronger. It can rely on existing request-builder and history execution tests plus DTO assertions. | Credible but low-leverage. UI tests would be straightforward, but the product payoff is smaller. |
| Fit with current no-promotion state | Not yet. It still needs another contract-definition step before implementation would be clean. | Best fit. It is the clearest narrow future lane if another environment task is later requested. | Not the best fit. It is plausible later polish but not the strongest future lane. |

## 4. Sub-Lane Notes
### Sub-Lane 1 - Pre-run unresolved-feedback tiering
- This is real because the current request surface does not classify unresolved placeholders until the server-owned execution path runs.
- It remains parked because a clean version would need to answer:
  - whether warnings versus blockers are computed before run or only mirrored from a preview endpoint
  - whether the client is allowed to approximate placeholder checks without secret visibility
  - whether default-seeded hints and unresolved tiers belong to the same task
- That makes it too likely to reopen semantics before one bounded validation contract exists.

### Sub-Lane 2 - Post-run bounded resolution summary
- This is the strongest future narrow lane because the server already owns environment resolution and the observation surfaces already carry execution metadata.
- `T034` later narrows this sub-lane into one shared execution/history contract centered on a bounded `EnvironmentResolutionSummary` object in `Execution Info`.
- A bounded version could add items such as:
  - how many placeholders were resolved
  - which authored input areas were affected (URL, headers, body, auth, params)
  - whether the run used environment-backed values without exposing raw values
- A promotable version must still avoid:
  - raw resolved maps
  - a full resolved-request inspector
  - previewing secret values
  - changing save/run semantics

### Sub-Lane 3 - Explorer and readability copy propagation
- This stays parked because it is more copy polish than environment-observation clarification.
- It may still matter later for authored-request readability, especially around:
  - default-seeded hints
  - saved-request environment labels
  - compact summary language in explorer rows
- But it is not the strongest next lane while the result/history observation gap is still larger.

## 5. Decision
- Sub-Lane 2, post-run bounded resolution summary, is the strongest future narrow lane inside the richer resolved-preview UX area.
- Sub-Lane 1, pre-run unresolved-feedback tiering, remains parked because it would reopen broader validation-tier and preview-ownership questions too quickly.
- Sub-Lane 3, explorer and readability copy propagation, remains parked because it is plausible polish but not the strongest environment-observation gap.
- This comparison does **not** promote a new implementation task by itself.

## 6. What Would Change This Decision Later
- Promote Sub-Lane 2 only if one bounded observation contract is written first, not “show more environment detail” generally.
- Revisit Sub-Lane 1 only if the product explicitly needs pre-run unresolved-feedback semantics and can defend one preview/validation ownership model.
- Revisit Sub-Lane 3 only if authored-request readability becomes the concrete problem rather than run/history observation clarity.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** which exact bounded summary fields would deliver the best value first inside Sub-Lane 2.
- **확실하지 않음:** whether any future Sub-Lane 2 implementation should persist the same bounded summary in both active result state and history or compute one surface-specific variant.
- **확실하지 않음:** whether default-seeded hinting should stay parked as authored-summary polish or eventually rejoin a future pre-run feedback lane.
