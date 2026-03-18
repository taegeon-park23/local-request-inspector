# T017 - Developer Environment and Tooling Baseline

- **Purpose:** Define the MVP developer tooling, scripts, local bootstrap workflow, and test-support baseline needed before implementation begins in earnest.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-006-frontend-stack-and-application-shell-decision.md`, `task-009-workspace-persistence-bootstrap.md`, `task-016-testing-and-qa-strategy.md`, `../architecture/developer-environment-and-tooling-baseline.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T017 translates the stack, persistence, safety, and QA planning outputs into an implementation-ready tooling baseline. The result defines the recommended package manager, repository layout, TypeScript posture, lint/format/typecheck expectations, test-tooling stack, fixture and local-data rules, reset/bootstrap flows, and the minimum CI-friendly script catalog needed for the first MVP implementation PRs.

## 2. Why This Task Matters Now
- T010 needs a concrete repo/layout/script baseline so implementation slicing is grounded in realistic module and test boundaries.
- T016 explicitly deferred tool selection for contract, integration, component, and smoke coverage to T017.
- Early implementation work needs deterministic local bootstrap, reset, and seed flows so JSON resources, SQLite runtime data, replay behavior, and SSE-sensitive scenarios can be reproduced reliably.

## 3. Input Sufficiency Check
The current planning package is sufficient to complete T017 because it already defines:
- the React + Vite + TypeScript direction and `client/app`, `client/features`, `client/shared` boundary in `../architecture/frontend-stack-and-shell.md`
- shared naming, contract, and schema expectations in `../architecture/shared-schema.md`, `../architecture/naming-conventions.md`, and `../architecture/internal-api-contracts.md`
- the JSON resource lane, SQLite runtime lane, and `bootstrapPersistence()`/data-root seam in `../architecture/persistence-strategy.md` and `../architecture/persistence-bootstrap.md`
- sandbox/redaction/timeout/blocked concerns that need harness support in `../architecture/script-execution-safety-model.md`
- verification priorities for contract, integration, component, and smoke layers in `../architecture/testing-and-qa-strategy.md`

Repository re-check before starting confirmed:
- T001-T016 planning artifacts required by this task already exist
- T017-specific task and architecture documents did **not** yet exist
- tracking docs still listed T017 as the next ready task, which matched the actual artifact state
- the repo already contains a minimal `package.json`, legacy `server.js`/`public/index.html`, and T009 storage bootstrap files that must be preserved as the current baseline seam

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/developer-environment-and-tooling-baseline.md` exists
- the recommended package manager, layout, TypeScript, lint/format/typecheck, and script baselines are documented
- unit/integration/contract/component/browser-smoke tool recommendations are documented in a way that aligns with T016
- fixture, local data-root, bootstrap, reset, and seed conventions are documented
- defer items and **확실하지 않음** items are summarized
- tracking docs are updated to reflect T017 completion and the next ready planning focus

## 5. Outputs
- `../architecture/developer-environment-and-tooling-baseline.md`
- tracking updates in `../tracking/`

## 6. Current Progress
- Required PRD, architecture, persistence, shell, API, history/inspector, mock, script, and QA documents were re-read before defining the tooling baseline.
- T017 now defines a lightweight but scalable baseline centered on npm, Node 22-class runtime support, React + Vite + TypeScript implementation structure, ESLint + Prettier + `tsc`, Vitest + React Testing Library, and a limited Playwright smoke layer.
- The baseline explicitly connects T016's contract/integration/component-heavy strategy to fixture-first test data, deterministic storage reset/seed flow, loopback + simulated SSE support, and early automation for redaction, timeout, blocked, replay, and mock labeling checks.

## 7. Key Decisions
1. MVP should stay on a **single-package workspace-style repo** rather than adopt a heavy monorepo toolchain.
2. `npm` is the recommended package manager because it matches the current repo and is sufficient for the initial React + Vite + TypeScript implementation baseline.
3. Vitest should be the primary runner for unit, integration, and contract tests, with React Testing Library for component tests.
4. Playwright should be introduced only as a narrow browser-driven smoke layer, not as the main regression strategy.
5. Fixtures should be explicit file-based inputs first, with generators/helpers as secondary conveniences.
6. Local data reset/bootstrap flows must make the JSON resource lane and SQLite runtime lane separation visible and reproducible.

## 8. Open Questions
1. Whether later repo growth justifies `npm` workspaces or a different package manager remains **확실하지 않음**.
2. Whether contract fixtures should later be schema-generated or remain hand-authored remains **확실하지 않음**.
3. The exact long-term ratio of simulated SSE tests to loopback integration tests remains **확실하지 않음**.
4. The exact set of runtime env vars beyond `LRI_DATA_DIR` remains **확실하지 않음**.
5. The final Monaco lazy-load granularity and the final required CI status for browser smoke remain **확실하지 않음**.

## 9. Handoff Checklist
- [x] T017 task file exists and is linked from tracking docs
- [x] developer environment and tooling architecture doc exists
- [x] package manager, layout, TypeScript, lint/format/typecheck, and script baseline are documented
- [x] T016-aligned testing/tooling recommendations are documented
- [x] fixture, local data-root, bootstrap, reset, and seed conventions are documented
- [x] defer items and **확실하지 않음** items are summarized
- [x] T010 / implementation handoff inputs are summarized

## 10. Recommended Owner
- Primary: Frontend / Backend Lead
- Secondary reviewer: QA / Senior Engineer

## 11. Closure Decision
T017 can be closed as **done** at the planning/documentation level. The next step is to use this baseline in T010 and the first implementation PRs rather than reopen tool-selection debate without a concrete implementation need.
