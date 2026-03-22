# T026 - M3-F3 Validation Environment Blocker Triage

- **Purpose:** Determine whether the remaining `M3-F3` closeout blocker still hides a repo-side mitigation gap or whether it is now best treated as an environment-level validation restriction.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `task-018-delivery-milestone-plan.md`, `task-024-m3-f3-implementation-handoff.md`, `task-025-post-m3-f3-closure-priority-review.md`, `../tracking/m3-f3-implementation-handoff.md`, `../tracking/post-m3-reactivation-guide.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../tracking/candidate-c-promotion-readiness.md`, `../tracking/candidate-c-gap-inventory.md`
- **Status:** done
- **Priority:** P2

## 1. Summary
T026 investigated the remaining `M3-F3` official-closeout blocker after same-day evidence split into two lanes: a user-verified non-sandbox local `npm.cmd run test:ui` pass, and still-blocked direct sandbox reruns of `npm.cmd run check:m3f3-gate` and `npm.cmd run test:ui`. The result confirms that the current repo already applies the main bounded mitigations available at the wrapper layer. The remaining failure occurs at bare `esbuild.transform(...)` worker startup, before normal Vite/Vitest transform work can proceed, so the blocker is best treated as environment-level validation restriction rather than as an unowned repo-side packaging gap. Going forward, sandbox-blocked confirmation should be handled by giving the user exact local commands and expected results rather than by keeping `M3-F3` open in tracking.

## 2. Why This Task Matters Now
- Without this triage step, contributors can keep reopening the same question about whether another local wrapper tweak, config-loader change, or Windows-specific workaround is still missing.
- `M3-F3` closeout was already blocked at the official trio level, but the repo also needed a clearer statement about whether the current sandbox signal still justified more repo-side debugging work.
- Candidate C should not be reopened from a broad "fix sandbox EPERM" instinct if the shipped repo already surfaces and narrows the failure boundary clearly.

## 3. Inputs Reviewed
- `check-m3f3-gate.mjs`
- `scripts/esbuild-sandbox-compat.mjs`
- `scripts/run-vite.mjs`
- `scripts/run-vitest.mjs`
- `scripts/check-app-shell.mjs`
- `package.json`
- `../tracking/candidate-c-promotion-readiness.md`
- `../tracking/candidate-c-gap-inventory.md`
- `../tracking/post-m3-reactivation-guide.md`

## 4. Definition Of Done
This task is done when all of the following are true:
- the current blocker is classified explicitly as repo-side, environment-side, or still ambiguous
- current wrapper-layer mitigations are listed so contributors do not retry already-landed adjustments blindly
- tracking docs can point to one blocker-triage conclusion instead of rediscovering the same script evidence
- the next action remains clear without reopening post-M3 promotion or Candidate C prematurely

## 5. Outputs
- this task record
- tracking updates in `../tracking/`

## 6. Key Findings
1. `scripts/esbuild-sandbox-compat.mjs` reproduces the failing condition through a direct `esbuild.transform(...)` preflight using TSX input. The failure therefore happens before any app-specific module graph, route state, or feature TSX logic can matter.
2. `scripts/run-vite.mjs` and `scripts/run-vitest.mjs` already force `--configLoader runner`, so the current failure is not the older config-bundling path.
3. `patchWindowsNetUseExec()` already neutralizes the known Windows `net use` side path, so the remaining failure is not explained by that startup branch either.
4. `check-m3f3-gate.mjs` already distinguishes root-HTML success from actual transformed-module success. This means the current `env_blocked_transform` result is not a vague "dev server felt unhealthy" signal; it is tied to real transform evidence.
5. `scripts/check-app-shell.mjs` already exposes the packaging/startup status seam that current Candidate C guidance expects, including build/test sandbox compatibility messaging.

## 7. Key Decisions
1. The remaining `M3-F3` official-closeout blocker is now treated as environment-level validation restriction, not as an unidentified repo-side wrapper gap.
2. No new repo-side mitigation task is promoted from this investigation.
3. Candidate C remains parked because this triage did not reveal one new startup/packaging seam missing from the shipped `check:app`, wrapper, and `/api/app-shell-status` baseline.
4. Future sandbox-blocked verification should be resolved through local command handoff with expected results, not through repeated repo-side wrapper churn.
5. `T025` is the separate post-closeout priority review task, and sandbox-only verification churn by itself should not create any additional follow-up review task beyond that closed record.

## 8. Open Questions
1. Whether future contributors will still want to rerun the full local command set for extra assurance remains **확실하지 않음**.
2. Whether a future structured readiness artifact should unify `check:app` and `/api/app-shell-status` remains **확실하지 않음**.
3. Whether live refresh on the gated TSX files is fully healthy remains **확실하지 않음** until the official trio clears in one environment.

## 9. Handoff Checklist
- [x] current wrapper-layer mitigations reviewed
- [x] blocker classified as environment-level rather than repo-side ambiguity
- [x] no new Candidate C or post-closeout promotion created from this triage
- [x] tracking docs aligned with the conclusion

## 10. Recommended Owner
- Primary: Delivery / Tracking Agent
- Secondary reviewer: QA / Verification Agent

## 11. Closure Decision
T026 is complete as a documentation and blocker-triage task. It closes the question of whether one more repo-side wrapper/config change is still missing for `M3-F3`; the answer is no, not based on current evidence. The repo already applies the bounded mitigation work it can justify today: direct esbuild preflight classification, fail-fast Vite/Vitest wrappers, config-loader runner enforcement, Windows `net use` patching, and packaging/startup status reporting. When the same sandbox restriction appears again, the correct response is to hand off exact local commands and expected results rather than to reopen a new repo-side packaging or toolchain task.
