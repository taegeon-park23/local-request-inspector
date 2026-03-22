# Candidate C Gap Inventory

- **Purpose:** Provide a grounded inventory of current Candidate C packaging/startup gaps so future contributors can start from concrete missing verification seams rather than from broad packaging-polish language.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-22
- **Related Documents:** `candidate-c-promotion-readiness.md`, `post-m3-reactivation-guide.md`, `master-task-board.md`, `priority-roadmap.md`, `progress-status.md`, `../tasks/task-018-delivery-milestone-plan.md`, `../tasks/task-020-candidate-b-gap-inventory-and-lane-selection.md`, `../tasks/task-021-candidate-c-gap-inventory-and-seam-selection.md`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`
- **Status:** active reference
- **Update Rule:** Update when the shipped packaging/startup baseline changes or when a Candidate C gap is promoted, closed, or reclassified.

## 1. Current Baseline Snapshot
- The repo already ships `npm run check:app` as the main packaging/startup summary command.
- The server already exposes `/api/app-shell-status` and a built-shell-aware `/app` fallback page.
- The repo already separates `dev:app`, `dev:server`, `dev:client`, `build:client`, `serve:app`, `check:app`, `test:node`, and `test:ui`.
- `build:client` and `test:ui` already fail fast through shared S26 esbuild preflight wrappers instead of failing opaquely later.
- The current dominant packaging noise is the known environment-bound esbuild worker startup restriction.

## 2. Classification Model
- `already covered`: the current shipped packaging/startup behavior already handles the case sufficiently.
- `real but broad`: a real future need exists, but the gap is still too umbrella-shaped to justify one bounded task.
- `확실하지 않음`: current repo truth is not strong enough to classify the gap confidently or justify promotion.

## 3. Concrete Observed Gap Candidates
### Gap 1 - Built client shell missing at `/app`
- **Affected seam:** built-shell serving and fallback behavior
- **Why it might matter:** contributors need a clear signal when the built React shell is unavailable.
- **What is already shipped that overlaps:** the server returns a bounded `/app` fallback page, `/api/app-shell-status` reports built-shell availability, and `check:app` reports whether `client/dist/index.html` exists.
- **Evidence from repo/docs:** `server.js`, `scripts/check-app-shell.mjs`, `package.json`
- **Classification:** `already covered`

### Gap 2 - Build/test lane failure caused by sandboxed esbuild worker startup
- **Affected seam:** `build:client` and `test:ui` startup
- **Why it might matter:** contributors need the failure mode to be visible and bounded instead of opaque.
- **What is already shipped that overlaps:** `scripts/esbuild-sandbox-compat.mjs`, `scripts/run-vite.mjs`, `scripts/run-vitest.mjs`, and `check:app` all surface the `sandbox_esbuild_transform_blocked` / `spawn EPERM` signature clearly.
- **Evidence from repo/docs:** `scripts/esbuild-sandbox-compat.mjs`, `scripts/run-vite.mjs`, `scripts/run-vitest.mjs`, `scripts/check-app-shell.mjs`, `check-m3f3-gate.mjs`, `../tasks/task-026-m3-f3-validation-environment-blocker-triage.md`
- **Classification:** `already covered`

### Gap 3 - Storage bootstrap visibility during startup/readiness checks
- **Affected seam:** local data-root bootstrap visibility
- **Why it might matter:** contributors need to know whether persisted resource/runtime files are present before expecting stored data to appear.
- **What is already shipped that overlaps:** `check:app` reports storage bootstrap state and points to `npm run bootstrap:storage`.
- **Evidence from repo/docs:** `scripts/check-app-shell.mjs`, `package.json`
- **Classification:** `already covered`

### Gap 4 - Unified machine-readable readiness summary across CLI and server status
- **Affected seam:** packaging/startup status reporting
- **Why it might matter:** a future contributor or automation path might want one structured readiness summary instead of a text CLI report plus a narrower `/api/app-shell-status` payload.
- **What is already shipped that overlaps:** `check:app` already summarizes built-shell availability, storage bootstrap state, and esbuild preflight; `/api/app-shell-status` already exposes built-shell availability and route guidance.
- **Evidence from repo/docs:** `scripts/check-app-shell.mjs`, `server.js`
- **Classification:** `확실하지 않음`

### Gap 5 - Broad distribution or installer work
- **Affected seam:** packaging/distribution beyond local serve/startup verification
- **Why it might matter:** a future product could want broader release packaging or delivery automation.
- **What is already shipped that overlaps:** the current repo already covers local build/serve/readiness expectations and intentionally stops short of broader distribution work.
- **Evidence from repo/docs:** `candidate-c-promotion-readiness.md`, `post-m3-reactivation-guide.md`
- **Classification:** `real but broad`

## 4. Still-Too-Broad Categories
- "Improve packaging generally."
- "Fix sandbox EPERM."
- "Replace Vite or esbuild."
- "Add desktop packaging or installers."
- "Automate release readiness everywhere" without one missing verification seam.

## 5. Recommendation
- No Candidate C gap is narrow enough yet to justify a new implementation task.
- `T026` further confirms that the remaining sandbox signal occurs at bare esbuild worker startup after the repo-side wrapper/config mitigations already shipped.
- The shipped repo already covers the concrete missing-built-shell and sandbox-blocked verification seams that are visible today.
- Revisit Candidate C only when one startup or packaging status gap is demonstrably missing from the current `check:app` and `/api/app-shell-status` baseline.

## 6. Explicit Uncertainties / 확실하지 않음
- **확실하지 않음:** whether any later Candidate C gap will be product-facing or only contributor-facing.
- **확실하지 않음:** whether a future Candidate C follow-up would be a machine-readable readiness seam or a different verification improvement.
- **확실하지 않음:** whether the current environment-bound esbuild restriction will remain the dominant packaging signal long enough to block clearer narrower gaps from surfacing.
