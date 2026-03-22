# T034 - Post-T033 Resolution Summary Contract

- **Purpose:** Define the exact bounded contract for the post-run environment resolution summary selected by `T033` so a future implementation task can stay inside one request-result/history observation slice.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-030-request-environment-selection-and-runtime-resolution.md`, `task-033-post-t032-resolved-preview-sub-lane-comparison.md`, `../architecture/request-environment-selection-and-resolution.md`, `../architecture/request-environment-resolution-summary-contract.md`, `../tracking/resolved-preview-sub-lane-comparison.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../tracking/post-m3-reactivation-guide.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T034 turns the `T033` narrowing decision into one concrete future contract. The chosen future slice is a post-run bounded resolution summary that appears consistently in the active request result panel and persisted history. The contract adds one shared summary object to execution/history DTOs, keeps resolution ownership on the server, and avoids raw resolved maps, secret exposure, pre-run validation-tier work, or explorer-summary copy changes.

## 2. Why This Task Matters Now
- `T033` already picked the strongest future sub-lane, but it still left the exact payload and UI boundary underdefined.
- Without one contract note, a future implementation could still drift into a full resolved-request inspector or into pre-run validation semantics.
- A contract-definition step is lower risk than jumping directly from comparison language into implementation.

## 3. Definition Of Done
This task is done when all of the following are true:
- one bounded DTO contract exists for environment resolution summary in execution/result/history flows
- request-result and history UI scope is fixed clearly enough for one future implementation task
- non-goals explicitly exclude raw resolved values, pre-run warning tiers, and explorer-summary propagation
- board, roadmap, progress, and reactivation docs all point to the same contract note

## 4. Outputs
- this task record
- `../architecture/request-environment-resolution-summary-contract.md`
- tracking alignment in `../tracking/`

## 5. Key Decisions
1. T034 is a planning/architecture task, not an implementation task.
2. The future summary object should be shared between active request execution observation and persisted history rather than split into two unrelated shapes.
3. The bounded summary should report status, counts, and affected areas, not raw resolved values or full field-level diffs.
4. The future UI should extend `Execution Info` in the active result panel and history detail rather than adding a new result tab.
5. Pre-run unresolved-feedback tiering, explorer/readability copy, and any full resolved-request inspector remain explicitly out of scope.

## 6. Handoff Checklist
- [x] bounded execution/history summary contract defined
- [x] active-result and history UI scope defined
- [x] non-goals fixed clearly
- [x] tracking docs aligned

## 7. Recommended Owner
- Primary: Architecture Agent
- Secondary reviewer: Delivery / Tracking Agent

## 8. Closure Decision
T034 is complete as the contract-definition pass after `T033`. If a future environment-observation implementation is requested, it should start from the shared post-run resolution summary contract defined here rather than from broad “better resolved preview” language.
