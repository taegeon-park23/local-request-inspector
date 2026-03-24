# T030 - Request Environment Selection And Runtime Resolution

- **Purpose:** Implement the bounded request-level environment selector and server-owned runtime resolution contract defined by `T029`.
- **Created:** 2026-03-22
- **Last Updated:** 2026-03-23
- **Related Documents:** `task-011-request-builder-mvp-design.md`, `task-027-placeholder-route-mvp.md`, `task-029-request-environment-selection-and-resolution-plan.md`, `../architecture/request-environment-selection-and-resolution.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`
- **Status:** done
- **Priority:** P1

## 1. Summary
T030 implements request-level environment selection in the workspace request header and moves runtime placeholder resolution onto the server execution lane. Saved requests now persist `selectedEnvironmentId`, new draft requests seed from the current default environment at creation time, missing environment references block save/run, and execution/history metadata now records the resolved environment label without exposing secret raw values to the client.

## 2. Why This Task Matters Now
- `T027` made environments a real persisted workflow object.
- `T029` already fixed the intended boundary so implementation could proceed without reopening top-bar selector or environment management scope.
- Secret-backed environment rows are masked in the client read model, so request execution needed one server-owned resolution path rather than client-side interpolation.

## 3. Scope
### Included
- request draft and saved-request persistence for `selectedEnvironmentId`
- request header environment selector plus missing-reference UI
- default-environment seeding for newly created request drafts
- save/run validation for missing saved environment references
- server-owned runtime placeholder resolution during execution
- execution/history metadata persistence for environment id and label
- bounded node seam coverage for environment resolution

### Explicitly Deferred
- top-bar global environment selector
- resolved-request preview UI beyond current bounded observation summaries
- environment import/export expansion
- request-stage shared script attachment/reference semantics
- optional unresolved-placeholder warning tiers separate from blocking behavior

## 4. Definition Of Done
This task is done when all of the following are true:
- request drafts and saved requests carry `selectedEnvironmentId`
- the workspace request header exposes request-level environment selection with missing-reference feedback
- new drafts seed from the current default environment when one exists
- execution resolves placeholders on the server and blocks transport when resolution leaves required placeholders unresolved
- execution/history metadata surfaces the selected environment label without exposing secret values
- tracking and architecture docs reflect the implemented boundary and deferred follow-ups

## 5. Outputs
- request-builder draft/api/store updates for `selectedEnvironmentId`
- request header environment selector in the workspace authoring surface
- server execution-lane environment resolution helper and route integration
- execution/history metadata enrichment for environment id and label
- request-builder and workspace tests plus new node seam coverage
- tracking updates in `../tracking/`

## 6. Implementation Notes
### 6.1 Request definition lane
- Added `selectedEnvironmentId` to request draft state, draft seeds, API inputs, and persisted saved-request records.
- New request drafts now seed from the current default environment only at creation time.
- Existing saved requests and replay drafts keep their explicit environment selection or explicit `null`.

### 6.2 Authoring surface behavior
- Added a request-level `Request environment` selector to the request header strip.
- Added bounded header copy for:
  - loading environment list
  - degraded environment list
  - selected default environment
  - missing saved environment reference
  - explicit `No environment`
- Save and Run are blocked when a saved environment reference is missing or when the environment list cannot validate that selected reference.

### 6.3 Runtime resolution lane
- Added a server-side environment resolution helper for bounded `{{VARIABLE_NAME}}` substitution.
- Resolution currently runs after the Pre-request stage and before transport.
- The current implementation blocks transport when:
  - the selected environment record is missing at run time
  - environment substitution leaves placeholders unresolved in active execution inputs
  - resolved JSON body content becomes invalid after substitution
- Secret-backed environment values remain server-owned and are never echoed through client DTOs.

### 6.4 Observation and history
- Execution observations now carry `environmentId` and `environmentLabel`.
- History records now persist and expose the resolved environment metadata.
- The request result panel now shows the environment label in `Execution Info`.

### 6.5 Environment route guidance follow-up
- The `/environments` management surface now includes an operator-facing example section tied back to the `T029`/`T030` resolution contract.
- The guidance explicitly demonstrates the bounded `{{VARIABLE_NAME}}` substitution pattern across URL, header, and JSON body examples.
- The same guidance now explains the route-specific difference between plain variables, secret variables, `hasStoredValue`, and `replacementValue`.
- Script example copy currently uses `env.get('token')` because that best matches the architecture safety recommendation for a controlled environment getter API; the final runtime helper name remains **확실하지 않음** and should be updated if a stricter script contract lands later.

## 7. Validation
Validated in this sandbox on 2026-03-22:
- `npm.cmd run lint:client` -> passed
- `npm.cmd run lint:cjs` -> passed
- `npm.cmd run typecheck` -> passed
- `npm.cmd run test:node` -> passed
- `npm.cmd run check` -> passed

Direct sandbox UI rerun result:
- `npm.cmd run test:ui` -> still expected to fail before transform work with sandboxed `esbuild` worker startup (`spawn EPERM`)

Local verification handoff:
1. Run `npm.cmd run test:ui`
2. Expected result for the current repo state: exit code `0`, `Test Files  8 passed (8)`, and `Tests  49 passed (49)`

## 8. Handoff Checklist
- [x] request draft and saved-request environment persistence implemented
- [x] request header environment selector implemented
- [x] default environment seeding implemented for new drafts
- [x] server-owned environment resolution helper implemented
- [x] execution/history environment metadata surfaced
- [x] tracking and architecture docs updated

## 9. Recommended Owner
- Primary: Implementation Agent
- Secondary reviewer: QA / Verification Agent

## 10. Closure Decision
T030 is complete as the bounded implementation follow-up to `T029`. Request-level environment selection and server-owned runtime resolution are now implemented. Future environment work should build from this baseline and keep top-bar selector, richer resolution preview, and broader environment tooling as separate deferred tasks.

