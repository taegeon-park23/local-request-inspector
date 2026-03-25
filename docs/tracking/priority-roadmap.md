# Priority Roadmap

- **Purpose:** Show the live delivery sequence after completed work has been archived out of the default read path.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `master-task-board.md`, `progress-status.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update when a new bounded task is promoted or when the live verification baseline changes.

## Roadmap Snapshot
1. Foundation, architecture, UX, QA, tooling, and shipped implementation history are archived in `completed-work-summary.md`.
2. `T073` is archived into `completed-work-summary.md`.
3. `T074` is archived into `completed-work-summary.md`.
4. `T075` is archived into `completed-work-summary.md`.
5. Next promotion candidate is `T076`, followed by `T077 -> T078 -> T079`.

## Current Sequencing Rules
- Do not reopen archived completed task docs.
- Define and execute one bounded task at a time.
- Keep Codex-side UI reruns closed; use Playwright smoke in Codex and reserve `npm.cmd run test:ui` for user-managed local verification.

## Next Queue
- `T076` Workspace UI V2 Canon Refresh
- `T077` Recursive Tree And Placement Contract
- `T078` Workbench Tabs And Quick Request
- `T079` Runnable Containers And Batch Results

## Immediate Next Step
- Promote `T076` as the next active bounded task before further implementation.
