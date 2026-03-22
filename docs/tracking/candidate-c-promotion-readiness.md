# Candidate C Promotion Readiness

- **Purpose:** Capture the current shipped packaging/startup verification baseline and define when Candidate C becomes narrow enough to promote, so packaging work does not reopen from environment noise or broad distribution ideas.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-c-gap-inventory.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-017-developer-environment-and-tooling-baseline.md`, `../tasks/task-016-testing-and-qa-strategy.md`, `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`
- **Status:** active reference
- **Update Rule:** Update when packaging/startup verification seams, release-readiness criteria, or Candidate C promotion criteria materially change.

## 1. Current Shipped Baseline
- The repo already ships bounded packaging/startup verification through `npm run check:app`.
- The repo already exposes `/api/app-shell-status` and a built-shell-aware `/app` fallback path.
- Build and UI-test lanes already fail fast through the S26 esbuild sandbox-compatibility wrappers rather than failing opaquely later.
- Script taxonomy already distinguishes `dev:app`, `dev:server`, `dev:client`, `build:client`, `serve:app`, `check:app`, `test:node`, and `test:ui`.
- The current known limitation is environment-bound esbuild worker startup failure, not an undocumented packaging seam.
- `T026` now confirms that the remaining failure occurs after the current repo-side wrapper/config mitigations already shipped.

## 2. Current Boundaries
- Candidate C is not a toolchain-migration bucket.
- Candidate C is not a desktop-wrapper or installer initiative.
- Candidate C is not "fix sandbox EPERM generally" by itself.
- Candidate C should stay focused on concrete release-readiness, startup-verification, or packaging-surface gaps that the current scripts and status seams do not already cover.

## 3. Gap Categories
### Verification seam gap
- A future gap could appear if a real startup or packaging state is missing from `check:app` and `/api/app-shell-status`.
- This is the cleanest future Candidate C direction if it appears later.

### Built-shell distribution clarity gap
- A future gap could appear if contributors or users need clearer built-shell or serve-path verification than the current `/app` fallback plus status reporting provides.
- This is not active today because the repo already documents and reports the relevant built-shell state.

### Environment-bound transform failure
- The current esbuild `spawn EPERM` signature is real, but by itself it is not a scoped Candidate C task because it is environment-bound and already surfaced explicitly by current checks.
- This should stay parked unless a narrower packaging seam emerges around it.

### Broad packaging/distribution initiative
- This includes umbrella ideas like desktop packaging, installers, or broad release automation.
- This remains too broad for the current repo state.

## 4. Promotion Criteria
A future Candidate C promotion should generally require all of the following:
1. One clearly named startup, packaging, or release-readiness gap that current shipped checks do not already cover.
2. A validation path that is mostly script-level or Node-level and does not depend on `M3-F3`.
3. Narrow scope that avoids Vite/Vitest/esbuild replacement or desktop-wrapper work.
4. Clear user/operator value beyond "something around packaging feels unfinished."

## 5. Non-Promotion Examples
- "Fix the sandbox."
- "Improve packaging generally."
- "Replace esbuild/Vite."
- "Add desktop packaging."
- "Make builds work everywhere" without one concrete repo seam that is currently missing.

## 6. Re-Entry Checklist
Before proposing Candidate C:
1. Confirm the gap is not already reported by `check:app`, the build/test wrappers, or `/api/app-shell-status`.
2. Confirm the issue is not just the already documented environment-bound esbuild restriction.
3. Confirm the scope stays inside one startup/packaging verification seam.
4. Confirm script-level or Node-level validation is enough to prove the fix.
5. Update `master-task-board.md`, `priority-roadmap.md`, and `progress-status.md` together if Candidate C is ever promoted.

## 7. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether a future Candidate C gap will be product-facing or only environment-facing.
- **확실하지 않음:** whether any later packaging follow-up will remain script-level or eventually involve broader distribution concerns.
- **확실하지 않음:** when the current esbuild restriction will stop being the dominant source of packaging noise.

## 8. Recommendation
- Candidate C should remain parked after this readiness pass.
- The current repo already has the main bounded packaging/startup verification seams it needs.
- Revisit Candidate C only when one concrete startup or release-readiness gap appears that current checks do not already cover.
- Use `candidate-c-gap-inventory.md` before any future Candidate C promotion decision so packaging work starts from concrete shipped gaps instead of from broad readiness language.
