# T012 Script Editor and Automation UX Spec

- **Purpose:** Define the MVP script editor surfaces, stage-aware automation workflow, and diagnostic/result UX for request-bound and reusable script authoring.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `request-builder-mvp.md`, `script-execution-safety-model.md`, `internal-api-contracts.md`, `ux-information-architecture.md`, `workspace-flows.md`, `frontend-stack-and-shell.md`, `persistence-bootstrap.md`
- **Status:** done
- **Update Rule:** Update when script stages, capability policy, editor loading strategy, or diagnostic panel composition materially changes.

## 1. Goal
This document specifies how script authoring should work in the MVP request builder so users can:
- write `Pre-request`, `Post-response`, and `Tests` scripts in the same request workspace
- understand which context objects and capabilities exist for each stage
- review logs, assertions, warnings, and execution metadata without confusing script outcomes with transport outcomes
- discover reusable scripts/templates without turning MVP into a full IDE product

The document stays product/UX focused. It intentionally does not lock implementation details beyond what T014 and implementation planning need to begin.

## 2. MVP Scope
### 2.1 In scope
- request-bound script authoring inside the request builder
- three script stages: `Pre-request`, `Post-response`, `Tests`
- lazy-loaded code editor surface appropriate for JavaScript authoring
- stage-specific capability/help panel driven by the canonical allowed contract only
- stage-aware result/diagnostic presentation connected to request execution
- starter templates/snippets for each stage as first-use aids
- redaction/warning/cancellation/timeout/error messaging
- lightweight reusable-script management guidance and boundaries

### 2.2 Out of scope / deferred
- full VS Code parity
- arbitrary file browsing or local asset APIs from script UX
- marketplace/plugin-style snippet systems
- advanced refactor tooling or symbol navigation across scripts
- multi-file scripts or module imports
- guaranteed persistent live collaboration across request tabs and reusable scripts
- execution visualizer deeper than stage status + summaries

## 3. UX Principles
1. **Stage awareness beats generic code editing.** The editor must always make it obvious whether the user is editing `Pre-request`, `Post-response`, or `Tests`.
2. **Only promise what is actually allowed.** The editor, autocomplete/help copy, and examples may only reference canonically allowed capabilities from T005/T008.
3. **Execution and authoring are different surfaces.** Script source editing belongs to the request definition surface; logs/assertions/results belong to the execution result surface.
4. **Diagnostics must explain scope.** Users should be able to tell whether an issue is validation, capability denial, script runtime failure, transport failure, timeout, cancellation, or assertion failure.
5. **Redaction must be visible, not silent.** If output is masked, truncated, or omitted due to policy, the UI should say so.
6. **MVP favors clarity over IDE breadth.** Starter guidance, snippets, and stage docs are in; deep IDE features are deferred.

## 4. Script Surface Placement in the Request Builder
### 4.1 Request builder tab placement
Following T011, the request builder keeps request editing and runtime results separated.

**Authoring tab row** inside the request builder detail view:
- Params
- Headers
- Body
- Auth
- **Scripts**
- Tests *(label reserved for assertion-stage visibility inside Scripts and results; see below)*
- Metadata / Description *(optional placement from T011)*

### 4.2 Scripts tab composition
The `Scripts` tab is the entry surface for all three script stages. Inside that tab, a secondary stage switcher controls which script is active:
- `Pre-request`
- `Post-response`
- `Tests`

This avoids crowding the primary tab bar with three separate code-editor tabs while still preserving stage awareness.

### 4.3 Why not put scripts in the result panel?
Scripts are authored intent, so they belong with request definition editing. The result panel is reserved for runtime observation:
- Response
- Console
- Tests
- Execution Info

This preserves the T011 rule that request definition and runtime artifact views must stay distinct.

## 5. Panel Map
| Surface | Purpose | MVP contents | Notes |
| --- | --- | --- | --- |
| Request header | run/save/context actions | request name, environment selector, Save, Run | unchanged from T011 |
| Request tab row | request-definition editing | Params, Headers, Body, Auth, Scripts | `Scripts` is authoring entry point |
| Script stage switcher | choose stage | `Pre-request`, `Post-response`, `Tests` | always visible inside Scripts tab |
| Editor column | author source | code editor, dirty state, template/snippet action | stage-bound source only |
| Info/diagnostic side panel | explain capabilities and validation | stage summary, allowed context objects, warnings, redaction notes | driven by canonical contract |
| Result panel | execution observation | Response, Console, Tests, Execution Info | shared with non-script execution UX |
| Scripts library view | reusable asset management | saved scripts, saved templates, usage links | secondary feature, not default MVP entry |

## 6. Stage Model and User-Facing Labels
### 6.1 User-facing labels
Use these product labels in UI:
- `Pre-request`
- `Post-response`
- `Tests`

### 6.2 Runtime-stage names
T008 contract and runtime internals still use broader pipeline stage names:
- `requestPreparation`
- `preRequestScript`
- `transport`
- `postResponseScript`
- `testScript`
- `resultFinalization`

### 6.3 UX wording rule
The UI should not expose raw runtime identifiers as primary labels. Instead:
- use `Pre-request`, `Post-response`, and `Tests` for editor chrome and user help
- use internal stage names only in implementation, telemetry, or advanced diagnostic metadata where needed
- when showing execution details, map runtime stages to friendly labels, e.g. `Pre-request script failed` rather than `preRequestScript failed`

This keeps product language understandable without hiding the richer internal lifecycle needed by T008.

## 7. Stage-by-Stage UX Differences
| Stage | User goal | Primary context shown in UX | Mutability expectation | Result emphasis |
| --- | --- | --- | --- | --- |
| Pre-request | prepare or adjust outbound request before send | request draft, environment access, allowed helpers, request mutation notes | can affect request draft before transport | request-change warnings, blocked capability notice, prep logs |
| Post-response | inspect/derive from response after transport | request + response context, read-focused examples, summary/output notes | should not change already-sent transport result | derived-output/log summary, runtime failure notice |
| Tests | assert expected response conditions | assertion helpers, request + response context, pass/fail examples | no request mutation value promised in UX | pass/fail summary, assertion failures, log summary |

### 7.1 Pre-request UX
The `Pre-request` stage should emphasize:
- that it runs before the HTTP request is sent
- that it may adjust the request draft within allowed contract limits
- that blocked capabilities stop before transport if policy is violated
- that failures here can prevent transport entirely

Suggested UX cues:
- stage badge: `Runs before send`
- helper note: `Use this stage to compute headers, params, or auth inputs.`
- warning copy when relevant: `If this script fails or times out, the request is not sent.`

### 7.2 Post-response UX
The `Post-response` stage should emphasize:
- that transport has already completed
- that it can inspect response data and produce derived logs/summary output
- that it should not be confused with the raw response viewer

Suggested UX cues:
- stage badge: `Runs after response`
- helper note: `Use this stage to inspect response data or emit follow-up diagnostics.`
- separation note near results: `Response data comes from transport; script output appears in Console.`

### 7.3 Tests UX
The `Tests` stage should emphasize:
- named assertions and pass/fail outcomes
- that test failures are different from transport failures
- that tests appear both in authoring guidance and in the result panel summary

Suggested UX cues:
- stage badge: `Runs after response`
- helper note: `Use this stage for assertions and pass/fail reporting.`
- result copy: `Tests can fail even when the request succeeds.`

## 8. Request-Bound Editing vs Reusable Script Management
### 8.1 MVP conclusion
MVP should support **both** request-bound editing and reusable script management, but not as equal-weight authoring modes.

### 8.2 Primary authoring path: request-bound editing
The default path should be inside the request builder because:
- most users reason about scripts in the context of one request/run
- stage context is clearest when URL, body, auth, environment, and latest results are visible nearby
- it minimizes up-front library management friction

### 8.3 Secondary management path: reusable script view
A separate `Scripts` navigation view is still useful in MVP, but as a management/library surface for:
- reviewing saved reusable scripts
- browsing system-provided templates
- viewing script type, last updated time, and usage references
- opening a script into an editor detail page or attaching/copying it into a request

### 8.4 Separation rule
To avoid confusion:
- **request-bound editor** = edits the script attached to the current request draft
- **scripts library view** = manages saved script assets/templates independent of a single request run

### 8.5 Attachment semantics
The current MVP baseline now supports two explicit request-stage attachment paths:
1. **Attach by copy** from the template/library into the request-stage editor, or
2. **Attach saved-script reference** with explicit linked-state chrome, a read-only stage surface, and an `Open Scripts library` action

The shipped model is intentionally explicit rather than transparent shared live editing:
- inline stages remain request-owned source
- linked stages resolve the current saved-script source by id at run time
- broken links stay broken until the user repairs or detaches them
- request-stage editing never silently mixes live linked source with local overrides

After `T061B`, `T063`, `T064`, and `T065`, `T072` landed linked reusable references as a bounded request-stage capability, and `T073` then completed transfer/remap handling plus degraded-state cleanup around linked saved-script queries. Request-stage scripts can now either copy compatible saved scripts into request-owned source or keep an explicit linked reference without implying transparent multi-request live-edit semantics.

## 9. Stage Context and Capability Messaging
### 9.1 Principle
The editor must show only the context objects and helpers that are actually allowed for the selected stage.

### 9.2 Canonical capability presentation
Use a compact side panel or inline info block with these sections:
- `Available in this stage`
- `Not available in this stage`
- `Persistence / redaction note`
- `Examples`

### 9.3 Capability matrix for UX
| Stage | Show in “Available” | Show in “Not available / not promised” | UX notes |
| --- | --- | --- | --- |
| Pre-request | request draft access, resolved env access, console, allowed helper APIs, possible controlled fetch only if policy/contract confirms it | raw secrets catalog, unrestricted filesystem, arbitrary modules, ambient process APIs | mention that transport has not started yet |
| Post-response | request context, response context, env access, console | request resend control, unrestricted filesystem, arbitrary modules, ambient process APIs | mention response already exists |
| Tests | request context, response context, assertion helpers, env access, console | mutation-heavy transport control, unrestricted filesystem, arbitrary modules, ambient process APIs | emphasize pass/fail output |

### 9.4 Legacy behavior vs canonical contract
The legacy server exposed broader behavior through VM execution, including file-system-oriented capabilities. MVP UX must treat that as **historical implementation detail only**:
- do **not** autocomplete or advertise `fs`, `path`, or asset browsing unless they become canonically allowed later
- do **not** use legacy route presence as justification for UX affordances
- if migration/help text references the old behavior, label it clearly as `Legacy behavior, not guaranteed in MVP`

### 9.5 Capability badge examples
- `Allowed here: request, env, console`
- `Allowed here: request, response, env, console`
- `Blocked by policy: filesystem, arbitrary modules, raw secret access`

## 10. Editor Surface
### 10.1 Editor choice and loading
A Monaco-class editor is acceptable, but it should be **lazy-loaded** because it is a heavy dependency and not every request-editing session needs scripts immediately.

### 10.2 Lazy-load requirement
Recommended MVP behavior:
1. load the main request builder without Monaco
2. when the user opens the `Scripts` tab for the first time, render a lightweight loading shell/skeleton
3. load the heavy editor bundle asynchronously
4. reuse the loaded editor for later script tabs/library views during the session

### 10.3 UX requirements for lazy loading
- show a deterministic loading placeholder: `Loading script editor…`
- preserve stage selection while the editor loads
- allow read-only helper/capability content to render before the heavy editor arrives
- do not block the entire request builder just to initialize the editor

### 10.4 확실하지 않음
Whether the final load boundary is route-level, panel-level, or first-focus-level is **확실하지 않음**. The UX contract only requires that users do not pay the Monaco cost before they ask for script editing.

## 11. Templates and Snippets
### 11.1 MVP requirement
MVP should include **stage-specific starter templates** and a very small snippet set.

### 11.2 Why templates are needed
- first-use automation is otherwise intimidating
- each stage has different intent and available context
- templates reduce the risk that users infer unsupported APIs from generic examples

### 11.3 MVP template strategy
Provide:
- one starter template for `Pre-request`
- one starter template for `Post-response`
- one starter template for `Tests`
- optional 2–4 tiny snippets such as `Read env`, `Log summary`, `Basic assertion`

### 11.4 UX rules
- templates/snippets must be filtered by stage
- snippet names must describe intent, not internal runtime naming
- inserting a template should replace only if the editor is empty or user confirms replacement

### 11.5 Deferred scope
Large snippet catalogs, community templates, and organization-wide libraries are deferred.

## 12. Editor and Result Panel Relationship
### 12.1 Separation rule
The editor is for **authored source**. The result panel is for **execution observation**.

### 12.2 Shared cross-links
The two surfaces should still connect via lightweight linking:
- from script editor to latest stage result summary: `View latest Console` / `View latest Tests`
- from Console/Tests result panel back to authoring stage: `Open Post-response script` / `Open Tests script`

### 12.3 Confusion-prevention copy
The UI should distinguish:
- `Response` = network transport result
- `Console` = redacted script/runtime logs
- `Tests` = assertion outcomes from test stage
- `Execution Info` = stage timing, identifiers, cancellation/timeout metadata

This helps prevent users from reading script logs as if they were raw response data.

## 13. Console / Tests / Execution Info Integration
### 13.1 Console tab
Console should aggregate redacted logs and runtime warnings from all relevant stages, grouped by friendly stage labels.

Show:
- stage chips such as `Pre-request`, `Post-response`, `Tests`
- log severity if known
- short blocked/timeout/cancelled notices
- note when entries are summarized/redacted for persistence

### 13.2 Tests tab
Tests should prioritize scanability:
- total passed / failed counts
- per-test row with name and failure message
- expandable detail for assertion message summary if available
- stage context label only when helpful (`From Tests script`)

### 13.3 Execution Info tab
Execution Info should clarify pipeline state without duplicating full logs:
- execution id
- environment used
- per-stage status summary
- timestamps/duration
- timeout/cancellation status
- redaction note if persisted details are truncated or masked

### 13.4 Relationship to editor UX
From the Scripts tab, the user should understand:
- where logs will appear (`Console`)
- where assertions will appear (`Tests`)
- where status/timing/cancellation will appear (`Execution Info`)

## 14. Validation, Error, Timeout, and Cancellation States
### 14.1 Validation before run
Before execution, the Scripts tab should surface lightweight script validation states such as:
- empty script (neutral, not error)
- syntax issue
- too-large content warning if limits exist
- stage mismatch if an invalid saved-script type is attached

### 14.2 Runtime error categories
| Type | Where shown | UX expectation |
| --- | --- | --- |
| Syntax/parse error | in editor + run feedback | anchor to script stage and line if available |
| Capability denied | editor warning area + Console + Execution Info | explain that the action is not allowed by current policy |
| Stage runtime exception | Console + stage banner | stage-specific failure message |
| Timeout | stage banner + Execution Info | say whether transport ran or was skipped |
| Cancellation | Execution Info + relevant stage/result banner | distinguish user cancellation from timeout |
| Assertion failure | Tests tab | not the same as transport failure |

### 14.3 Pre-request-specific wording
If `Pre-request` fails, the user should see wording such as:
- `Pre-request script stopped execution before the request was sent.`

### 14.4 Post-response-specific wording
If `Post-response` fails after a 200 response, the user should see wording such as:
- `The request succeeded, but the Post-response script failed.`

### 14.5 Tests wording
If tests fail after a successful response, the user should see wording such as:
- `The request completed, but 2 tests failed.`

## 15. Warning, Capability, and Redaction UX
### 15.1 Capability messaging
The UI should proactively explain capabilities instead of only failing at runtime.

Recommended surfaces:
- stage info panel inside the Scripts tab
- small warning banner for blocked/disallowed features
- template/snippet content that uses only supported APIs

### 15.2 Redaction messaging
Because T005/T009 require redacted-only runtime persistence, the UI must explain that:
- logs and summaries may be masked or truncated
- secrets are not persisted in raw form
- a live run may reveal less persisted detail in history later than what was visible during the current session

Suggested copy:
- `Stored runtime details are redacted for safety.`
- `Sensitive values are masked in logs and saved results.`

### 15.3 Warning hierarchy
1. **Capability warning** — informs before action
2. **Runtime blocked warning** — informs at failure time
3. **Redaction notice** — informs about result visibility/storage limits
4. **Legacy note** — only where migration help is needed, clearly marked as non-canonical

## 16. Empty States and First-Use Guidance
### 16.1 Empty script stage
When a stage has no script yet, show:
- a one-sentence stage purpose
- `Start with template` action
- `Write from scratch` action
- compact list of allowed objects/helpers

### 16.2 First-use guidance
On the first visit to the Scripts tab in a workspace/session, optionally show a dismissible callout:
- `Scripts run in controlled stages with limited capabilities.`
- `Choose a stage to see what context is available.`

### 16.3 Empty reusable library
If no saved reusable scripts exist, show:
- stage-filtered starter templates
- explanation that request-bound scripts can be authored without creating a reusable library asset first

## 17. State Table
| State | Editor surface | Result surface | Notes |
| --- | --- | --- | --- |
| No script yet | empty-state guidance + template CTA | no script-specific result | neutral state |
| Editing dirty script | dirty badge + unsaved hint | previous run results remain visible until rerun | keep save/run separate |
| Ready to run | stage help visible | latest run summary if any | normal state |
| Running | editor stays visible, optionally read-only if needed | stage-progress/loading indication in result panel | exact locking behavior 확실하지 않음 |
| Blocked by validation | inline error in Scripts tab | no new stage result | pre-run validation |
| Capability denied | warning banner + diagnostics | Console + Execution Info note | transport may or may not have run |
| Timed out | timeout banner | Console/Execution Info status | copy depends on stage |
| Cancelled | cancellation notice | Execution Info + any partial logs | distinguish from timeout |
| Assertion failures | Tests stage remains editable | Tests tab shows pass/fail list | transport may still be successful |

## 18. Defer List
- breakpoint-style debugging
- advanced IntelliSense beyond stage-aware hints/help
- multi-tab compare/diff for script revisions
- user-defined global snippet packs
- inline history playback inside the script editor
- file-picker UX for script runtime assets
- editable stage pipeline composition beyond the fixed three product stages

## 19. 확실하지 않음
1. Whether request-stage scripts eventually need a third mixed mode beyond the current explicit copy-or-link model is **확실하지 않음**.
2. Whether editor lint diagnostics come from Monaco only, a dedicated JS worker, or server validation is **확실하지 않음**.
3. Whether running a request should temporarily lock the active script editor is **확실하지 않음**.
4. Whether history detail later shows more granular live-console events than persisted summaries is **확실하지 않음**.
5. Whether the `Scripts` top-level library remains visible in MVP navigation or is demoted if scope tightens is **확실하지 않음**.

## 20. Handoff Notes
### 20.1 For T014 - History / Inspector Behavior Spec
- keep script-stage diagnostics distinct from raw response/history transport detail
- history detail should reuse the same friendly stage labels used here, not raw runtime identifiers, unless explicitly in advanced metadata
- history persistence and display must respect the redacted-only runtime rule from T005/T009
- if live execution streams show richer console detail than persisted history, the UX must explain the difference clearly

### 20.2 For Implementation Planning
- separate authoring state from execution result state in client architecture
- implement a lazy-loaded heavy editor path for Scripts surfaces
- create stage metadata/config objects so tabs, templates, labels, and capability panels stay synchronized
- reuse result primitives across request execution and future history detail views
- keep capability/help content sourced from canonical runtime contract, not legacy server globals
- maintain explicit mapping between internal runtime stages and user-facing script labels

### 20.3 For Monaco Integration Work
- scope Monaco to script editing, not every request field
- load editor code only after script intent is clear
- ensure templates/snippets and diagnostics are stage-filtered
- avoid IntelliSense claims that exceed injected runtime capabilities





