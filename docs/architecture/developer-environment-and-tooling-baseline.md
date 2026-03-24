# T017 Developer Environment and Tooling Baseline

- **Purpose:** Define the minimum viable but scalable local development environment, repository layout, scripts, and tooling conventions needed to begin MVP implementation with consistent quality and reproducible workflows.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `frontend-stack-and-shell.md`, `internal-api-contracts.md`, `persistence-bootstrap.md`, `script-execution-safety-model.md`, `testing-and-qa-strategy.md`
- **Status:** done
- **Update Rule:** Update when the baseline stack, script catalog, fixture strategy, or local bootstrap workflow materially changes.

## 1. Goal
T017 turns the existing architecture and QA guidance into an implementation-ready developer baseline. The goal is not to lock the team into a heavy monorepo or enterprise platform, but to make the first implementation PRs predictable.

This baseline must support:
- the React + Vite + TypeScript direction from T006
- the JSON resource lane + SQLite runtime lane split from T004/T009
- the contract / integration / component-heavy QA strategy from T016
- local-first development with reproducible reset/bootstrap flows
- early automation for redaction, timeout, blocked, replay, and SSE-sensitive behavior

Any detail that is not yet fully settled is marked **확실하지 않음**.

## 2. Current Repository Reality Check
Current repository state, as re-verified before drafting this document:
- the runtime is still a small Node/Express prototype with `server.js`
- the frontend is still `public/index.html`
- `package.json` exists with a minimal script set and no TypeScript, lint, formatting, or test toolchain yet
- the storage bootstrap scaffold from T009 exists under `storage/` and already establishes:
  - `bootstrapPersistence()` as the storage bootstrap entrypoint
  - JSON resource directories under a workspace data root
  - SQLite runtime storage under the same data root
  - `LRI_DATA_DIR` override support via `storage/shared/data-root.js`

This means T017 should define the baseline for the **next repo shape**, while staying compatible with the current prototype and existing storage bootstrap seam.

## 3. Baseline Principles
1. **Prefer one JavaScript/TypeScript toolchain.** Use Node-based tools end to end to avoid multi-runtime setup overhead.
2. **Favor workspace structure over true monorepo complexity.** Keep one package and one lockfile in MVP unless implementation pressure proves otherwise.
3. **Optimize for contract/integration/component tests first.** Do not build an E2E-heavy pyramid before feature boundaries exist.
4. **Keep local reset/bootstrap explicit.** Developers must be able to recreate JSON resources, SQLite runtime state, and fixtures without hidden machine state.
5. **Separate authored data from observed data.** Tooling, scripts, fixtures, and reset flows must reinforce the JSON-resource vs SQLite-runtime split.
6. **Bias toward deterministic file-backed fixtures.** Dynamic generators are useful helpers, not the canonical source of truth for MVP regression inputs.
7. **Keep Monaco/editor-heavy tooling optional at startup.** Developer commands should not require heavy browser/editor surfaces unless the task truly needs them.

## 4. Package Manager Recommendation
### 4.1 Selection criteria
The package manager should:
- work well in a Node + Vite + TypeScript stack
- keep installs fast and lockfile behavior deterministic
- support simple script orchestration without additional task-runner layers
- avoid introducing monorepo-specific mental overhead too early
- be common enough that contributors can onboard quickly

### 4.2 Recommended baseline
**Recommended:** `npm`

Why `npm` is the baseline for MVP:
- it matches the repository's current `package.json` state
- it avoids churn from introducing a second tool decision before implementation starts
- it is sufficient for a single-package React + Vite + TypeScript workspace
- it keeps CI and contributor setup simple for early implementation PRs

### 4.3 When to revisit
Revisit package-manager choice only if one of these becomes true:
- the repository is intentionally split into multiple independently-versioned packages
- install performance becomes a meaningful daily bottleneck
- workspace linking needs become complex enough that `npm` workspaces materially hurt clarity

**확실하지 않음:** whether a later shift to `pnpm` would be worthwhile if the repo grows into multiple first-class packages. That is not required for MVP start.

## 5. Runtime and Version Baseline
### 5.1 Node baseline
**Recommended baseline:** Node.js 22 LTS-compatible runtime.

Reasoning:
- current storage bootstrap uses `node:sqlite`, which requires a modern Node runtime
- existing server code already expects built-in `fetch`
- using one modern Node target reduces polyfill/tooling complexity

### 5.2 Version pinning
Repository baseline should add, when implementation begins:
- `.nvmrc` or `.node-version` with the chosen Node major version
- `engines.node` in `package.json`
- a short setup note in the main README once implementation starts

## 6. Repository and Workspace Layout Baseline
## 6.1 Guiding rule
Use a **single-package workspace-style repo**, not a multi-package monorepo. The directory structure should create clear boundaries without requiring package-per-folder overhead.

## 6.2 Recommended layout
```text
client/
  app/
  features/
  shared/
  test/
server/
  app/
  routes/
  services/
  runtime/
  test/
storage/
  bootstrap/
  resource/
  runtime/
  shared/
shared/
  contracts/
  schemas/
  utils/
fixtures/
  contracts/
  integration/
  component/
  smoke/
  workspaces/
  runtime/
scripts/
  dev/
  test/
  bootstrap/
public/
  legacy/                # temporary during migration only
```

## 6.3 Boundary notes
- `client/` follows the T006 shell boundary of `app`, `features`, and `shared`.
- `server/` owns HTTP routes, SSE endpoints, execution orchestration, and server-side integration harnesses.
- `storage/` remains the home of persistence bootstrap and storage adapters already introduced in T009.
- `shared/` holds code-lifted contracts and schema helpers derived from T007/T008.
- `fixtures/` is top-level so both browser-facing and server-facing tests can consume the same canonical seed data.

## 6.4 Migration note
The current `server.js` and `public/index.html` can remain temporarily during migration, but the implementation baseline should avoid adding new MVP features directly into those files once the new structure starts.

## 7. TypeScript Baseline
### 7.1 Scope
Use TypeScript for new implementation work across:
- client application code
- shared contracts/schema helpers
- new server modules introduced during refactor

Legacy prototype files may remain JavaScript temporarily while migration is in progress.

### 7.2 Compiler posture
Recommended TypeScript posture:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `useUnknownInCatchVariables: true`
- `noEmit: true` for typecheck-only app validation in the default config

### 7.3 Path alias posture
Use a small alias set only:
- `@client/*`
- `@server/*`
- `@shared/*`
- `@fixtures/*` *(tests/tooling only if needed)*

Avoid deep or numerous aliases that hide ownership.

### 7.4 Schema/type relationship
TypeScript types should be derived from or aligned with shared contract/schema definitions, but storage records must not be treated as API DTOs. This preserves the T008/T009 separation between transport contracts and persistence shapes.

## 8. Lint / Format / Import / Typecheck Baseline
### 8.1 Recommended tool set
- **ESLint** for code-quality and boundary rules
- **Prettier** for formatting
- **TypeScript (`tsc`)** for typecheck

### 8.2 ESLint baseline rules
The MVP lint config should cover:
- unused imports/variables
- accidental `any` creep where easy to prevent
- consistent type-only imports where supported
- import ordering/grouping
- React hooks rules in client code
- basic Node/server safety rules for new server modules

### 8.3 Formatting posture
Prettier should be the source of truth for formatting. Avoid custom stylistic ESLint rule churn.

### 8.4 Import ordering
Use one explicit import-ordering rule set, with groups roughly:
1. Node built-ins
2. third-party packages
3. internal aliases
4. relative imports

Keep ordering automated where possible rather than review-enforced.

### 8.5 Minimum CI-friendly checks
The minimum required code-quality commands for implementation PRs should be:
- `lint`
- `format:check`
- `typecheck`
- `test`

## 9. Test Tooling Baseline
## 9.1 Goal
The chosen tools must naturally support T016's contract / integration / component-heavy strategy without forcing an E2E-first workflow.

## 9.2 Recommended stack
### Unit + integration + contract
- **Vitest** as the default test runner
- Node environment for server/domain/storage tests
- jsdom environment only where client/component tests require it

Why:
- aligns well with Vite/React/TypeScript
- supports fast local iteration and low-config setup
- can cover unit, integration, and many contract tests in one runner
- keeps the baseline small for a single-package repo

### Component/UI
- **React Testing Library** on top of Vitest

Why:
- good fit for T016's emphasis on labels, panels, entrypoints, and behavior-level UI assertions
- avoids overcommitting to full browser automation for every surface

### Browser-driven smoke
- **Playwright** for a very small smoke layer only

Why:
- suitable for validating a handful of end-to-end MVP flows
- strong for SSE-connected, request-builder, and replay smoke scenarios
- should remain intentionally narrow to avoid making smoke the primary correctness mechanism

### Contract validation helpers
- contract assertions should live in test helpers under `shared/` or `server/test/` and use explicit response/event fixtures
- schema-backed helper validation may be added, but generated-contract machinery is not required for MVP baseline

## 9.3 What not to add yet
Do **not** add all of the following during MVP baseline unless implementation proves a clear need:
- Cypress plus Playwright together
- Storybook-first test infrastructure
- heavy multi-project orchestration tools such as Nx/Turborepo
- separate unit-test runners for server and client
- snapshot-heavy approval systems as the default regression mechanism

## 10. Coverage Model Mapped to T016
| Verification layer | Recommended tool baseline | MVP usage |
| --- | --- | --- |
| Unit | Vitest | pure helpers, mapper functions, matcher logic, redaction utilities |
| Integration | Vitest + Node test harnesses | route/service/storage/SSE/loopback behavior |
| Contract | Vitest + explicit fixtures/assertion helpers | DTO/event envelopes, status enums, error codes, redaction expectations |
| Component | Vitest + React Testing Library + jsdom | shell composition, tabs, labels, entrypoints, replay wording, panel visibility |
| Browser smoke | Playwright | tiny release-readiness layer for core flows only |

## 11. Fixture / Test Data / Mock Data Baseline
## 11.1 Canonical strategy
**Recommendation:** explicit file-based fixtures are the source of truth, with optional helper generators layered on top.

Why:
- aligns with a documentation-heavy repo where reviewability matters
- keeps contract and regression inputs visible in diffs
- supports T016's vocabulary-sensitive checks for `blocked`, `Mocked`, `Bypassed`, replay warnings, and redaction outcomes
- improves reproducibility for local-first smoke and bootstrap runs

## 11.2 Directory proposal
```text
fixtures/
  contracts/
    api/
    events/
  integration/
    execution/
    mocks/
    captures/
    persistence/
  component/
    workspaces/
    requests/
    histories/
  smoke/
    baseline-workspace/
  workspaces/
    minimal/
    script-heavy/
    mock-heavy/
  runtime/
    sqlite-seeds/
```

## 11.3 Fixture rules
- Prefer JSON fixtures for DTOs, resources, and event payloads.
- Prefer small `.ts` helper builders only when timestamps/IDs/random values must vary.
- Avoid fixtures that encode undocumented behavior.
- Keep redacted vs non-redacted expectations explicit in fixture file names or metadata.
- Keep one minimal baseline workspace fixture that is safe for smoke/bootstrap use.

## 11.4 Generator posture
Generators are allowed for:
- unique IDs
- timestamp normalization
- repetitive contract variants
- derived runtime rows for integration setup

But generators should produce data from named canonical fixture inputs, not replace them entirely.

**확실하지 않음:** whether schema-derived fixture generation will be worth adding after shared runtime contracts are implemented in code.

## 12. Local Data Directory Rules
### 12.1 Canonical data root
Use the T009 data-root convention as the baseline:
- default root: `./.local-request-inspector/`
- override: `LRI_DATA_DIR`

### 12.2 Expected layout
```text
.local-request-inspector/
  metadata/
  resources/
  runtime/
```

### 12.3 Repo hygiene rules
- `.local-request-inspector/` should remain gitignored
- smoke fixtures or golden data should live under `fixtures/`, not under the live data root
- reset scripts must recreate the live data root from fixtures/bootstrap rather than relying on committed runtime data

## 13. Environment Variable and Secret Handling Rules
### 13.1 Development rules
Environment handling in local development should distinguish three categories:
1. **tool/runtime config** — process environment for the app itself
2. **workspace variables** — user-managed variables persisted through the product model
3. **secrets** — values that must not appear in logs, test snapshots, or committed fixtures

### 13.2 Baseline rules
- Use `.env.example` for documented non-secret config keys once implementation starts.
- Do not commit real secret values in fixtures, smoke seeds, screenshots, or local runtime data.
- Tests must use synthetic secret placeholders and explicit redaction expectations.
- Any script that prints environment or runtime state must avoid dumping raw secret-bearing values.
- Workspace variables used for smoke runs should come from dedicated fixture environments, not a contributor's shell history.

### 13.3 Candidate MVP config keys
Potential development config keys include:
- `PORT`
- `LRI_DATA_DIR`
- `LRI_LOG_LEVEL`
- `LRI_EXECUTION_TIMEOUT_MS`
- `LRI_SMOKE_WORKSPACE`

Exact final env-var names beyond `LRI_DATA_DIR` are **확실하지 않음** until implementation codifies them.

## 14. Dev Scripts Baseline
## 14.1 Required script catalog
The repo should converge on a small, explicit script set:

| Script | Purpose | Notes |
| --- | --- | --- |
| `dev` | run the active local app in development mode | may orchestrate server + client once split exists |
| `build` | produce production-ready client/server outputs | can remain no-op for legacy prototype until build exists |
| `lint` | run ESLint across implementation code and selected scripts | CI baseline |
| `format` | apply Prettier writes | local cleanup |
| `format:check` | verify formatting without changes | CI baseline |
| `typecheck` | run TypeScript validation | CI baseline |
| `test` | run fast unit/integration/contract/component suite | default verification entry |
| `test:unit` | optional narrower loop for pure logic | useful but not required day one |
| `test:integration` | optional focused server/storage/SSE lane | useful for high-risk seams |
| `test:component` | optional focused UI lane | useful after shell exists |
| `smoke` | run the minimal browser-driven smoke suite | release-readiness / pre-merge for risky UI work |
| `bootstrap:storage` | initialize local resource/runtime storage | already present in primitive form |
| `reset:data` | destroy and recreate local data root from bootstrap + seed fixtures | must be deterministic |
| `seed:fixtures` | load a baseline workspace/runtime seed into the local data root | pairs with smoke and manual QA |

## 14.2 Script posture
- `test` should exclude slow browser smoke by default.
- `smoke` should assume a deterministic seed/reset flow.
- `dev` should not implicitly destroy local data.
- `reset:data` should be explicit and safe, because local-first tools may contain useful local state.

## 15. Local Bootstrap and Reset Flow
### 15.1 Required developer flow
The minimum local initialization sequence should be:
1. install dependencies
2. run `bootstrap:storage`
3. run `reset:data` when a clean state is needed
4. run `seed:fixtures` for a known baseline workspace
5. run `dev`
6. run `test` and `smoke` as needed

### 15.2 Bootstrap responsibilities
`bootstrap:storage` should:
- call the existing `bootstrapPersistence()` entrypoint
- ensure the data root exists
- ensure JSON resource directories exist
- ensure the SQLite runtime DB and bootstrap migration exist
- avoid inserting opinionated sample user data by default

### 15.3 Reset responsibilities
`reset:data` should:
- remove the live data root directory
- re-run `bootstrap:storage`
- optionally leave the repo in an empty-but-valid state

### 15.4 Seed responsibilities
`seed:fixtures` should:
- copy or transform fixture-backed workspace resources into the JSON resource lane
- seed any runtime rows needed for smoke/manual verification only when explicitly requested
- make seeded labels obvious so contributors do not confuse sample observations with their own history

## 16. JSON Resource Lane and SQLite Runtime Lane Support
### 16.1 Local initialization direction
The local toolchain should make lane separation visible:
- JSON resource lane reset/seed should be file-driven
- SQLite runtime lane reset should recreate the DB from bootstrap migrations
- tests should be able to reset one lane without necessarily mutating the other when useful

### 16.2 Developer commands needed early
The first implementation wave should support these practical commands/harnesses:
- initialize an empty data root
- load a minimal saved workspace fixture
- clear runtime history/captures without rewriting saved resources
- recreate runtime DB when schema or fixtures change

### 16.3 Why this matters
This directly supports T016's need to verify:
- save vs run lane separation
- replay without source mutation
- redacted runtime persistence
- stable seeded conditions for smoke/manual QA

## 17. SSE / Loopback / Sandbox Test Support Direction
### 17.1 SSE recommendation
Use **both** of the following, but not at equal weight:
- **simulated stream tests by default** for fast, deterministic event-shape/component behavior
- **loopback integration tests selectively** for real route + runtime + persistence wiring confidence

### 17.2 Why not only one approach
- simulated streams are cheaper and better for component and contract assertions
- loopback-only tests are slower and make edge-state setup harder
- simulated-only tests are insufficient for verifying route wiring, connection lifecycle, and event/persistence handoff

### 17.3 MVP recommendation
Default to:
- component tests fed by synthetic SSE payload fixtures
- integration tests using local loopback servers for a small set of critical flows

### 17.4 Sandbox-related support
Add targeted harness utilities for:
- forcing timeout paths
- simulating capability denial / `blocked`
- collecting redacted console/log outputs
- asserting that persisted runtime artifacts remain bounded and redacted

These harnesses matter earlier than broad browser automation because T005/T016 classify them as high-risk policy behavior.

## 18. Early Automation Targets
The earliest purpose-built harnesses/scripts should cover:
1. **redaction checks** — fixture + assertion helpers proving secret-bearing values are transformed before persistence/transport
2. **timeout checks** — forced long-running pre/post/test stage scenarios with stable timeout outcomes
3. **blocked checks** — capability-denied cases mapped to documented status/error vocabulary
4. **replay checks** — replay opens authoring flow and preserves source observations
5. **mock outcome labeling checks** — `Mocked`, `Bypassed`, `No rule matched`, `Blocked` vocabulary stays stable
6. **SSE consistency checks** — event payload and persisted summaries stay semantically aligned

These should mostly live in contract/integration/component suites, not only smoke.

## 19. Browser Automation Scope for MVP
### 19.1 Recommended boundary
MVP should adopt **limited browser-driven smoke coverage**, not a broad E2E suite.

### 19.2 Include in MVP smoke
A very small browser harness should verify flows such as:
- app boots with seeded workspace
- request builder opens and a basic request run completes
- history entry appears and detail shows response/log/test summaries
- capture arrives over SSE and replay opens request builder
- mocked capture shows the correct outcome labeling

### 19.3 Defer from MVP baseline
Defer broad browser automation for:
- large cross-browser matrices
- exhaustive editor keystroke behavior
- every error/edge case already better covered by integration/component tests

This keeps the stack aligned with T016 rather than drifting into an E2E-heavy strategy.

## 20. Editor-Heavy Surface Development Guidance
### 20.1 Monaco posture
Monaco or similarly heavy editors should be lazy-loaded at the panel/feature boundary, not bundled into every startup path.

### 20.2 Developer guidance
- keep script editors and JSON-heavy editors behind explicit lazy imports
- provide lightweight fallback rendering for tests that do not need full Monaco behavior
- avoid making unit/component tests depend on Monaco internals unless testing editor integration itself
- use test doubles/adapters around editor wrappers so most UI tests can focus on behavior and state, not editor implementation detail

### 20.3 Why this matters
This protects:
- startup performance in local development
- test reliability in jsdom/component environments
- future flexibility if the exact editor loading granularity changes

**확실하지 않음:** whether Monaco should be loaded per route, panel, or editor instance in final implementation.

## 21. CI-Friendly Minimum Baseline
Before broad implementation begins, the minimum CI-friendly command set should be:
- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm run test`

`npm run smoke` should be available but may begin as an opt-in or a narrower required check for shell/integration PRs until runtime becomes more stable.

## 22. Tooling Matrix
| Area | Baseline | Why now | Deferred alternatives |
| --- | --- | --- | --- |
| Package manager | npm | already present, simplest path | pnpm if repo/package count grows |
| Client build/dev | Vite | aligns with T006 | heavier frameworks |
| UI framework | React | already chosen in T006 direction | none for MVP |
| Language | TypeScript for new modules | shared contracts + refactor safety | JS-only continuation |
| Lint | ESLint | catches drift early | custom heavy rule packs |
| Format | Prettier | avoids style debate | none |
| Test runner | Vitest | unified fast runner | separate Jest/Mocha split |
| Component testing | React Testing Library | behavior-focused UI checks | Storybook-first testing |
| Smoke | Playwright | small real-browser confidence layer | Cypress / larger E2E harness |
| Persistence bootstrap | existing `bootstrapPersistence()` | already available from T009 | custom ad hoc setup |

## 23. Defer Items
The following are intentionally deferred beyond the MVP baseline unless implementation proves a clear need:
- true multi-package monorepo tooling
- code generation-heavy contract pipelines
- Storybook as a required foundation
- browser-matrix E2E infrastructure
- performance/load test harnesses beyond lightweight smoke
- desktop packaging tooling baked into the day-one local developer workflow

## 24. Open Questions / 확실하지 않음
1. Whether later repo growth justifies moving from a single-package layout to `npm` workspaces is **확실하지 않음**.
2. Whether contract fixtures should eventually be generated from code schemas or remain hand-authored is **확실하지 않음**.
3. The exact balance of simulated SSE tests vs loopback integration tests may shift once implementation reveals the real complexity of event orchestration; the long-term split is **확실하지 않음**.
4. The exact set of application env vars beyond `LRI_DATA_DIR` is **확실하지 않음**.
5. Whether the MVP smoke harness should run on every PR or only on selected UI/runtime-impacting changes is **확실하지 않음**.
6. The final Monaco lazy-load granularity is **확실하지 않음**.

## 25. Handoff to T010 and Implementation
### 25.1 T010 input
T010 should assume:
- a `client/app`, `client/features`, `client/shared` implementation structure
- lazy feature boundaries that map cleanly to component/integration test ownership
- a minimal script catalog that supports shell work without hiding data-root/bootstrap behavior

### 25.2 First implementation PR expectations
The first implementation PR should, at minimum:
- establish Node/version metadata
- introduce TypeScript baseline config
- introduce `lint`, `format`, `typecheck`, and `test` commands
- preserve the existing storage bootstrap seam
- add deterministic local data reset/seed commands
- keep browser smoke narrow and optional until a basic shell exists

### 25.3 Delivery posture
The implementation team should treat this baseline as a **minimum coherent starting point**, not as permission to add a wide tool platform before feature code exists.
