# Workspace Flows

- **Purpose:** Document the core user journeys and flow-level state transitions for the local-first API workbench.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-25
- **Related Documents:** `ux-information-architecture.md`, `internal-api-contracts.md`, `script-execution-safety-model.md`
- **Status:** done
- **Update Rule:** Update when primary workspace journeys or runtime-view responsibilities materially change.

## 1. Flow Design Principles
- Keep high-frequency flows within one shell rather than bouncing users across unrelated screens.
- Preserve context between authoring and inspection.
- Make runtime outcomes observable without exposing unsafe/raw secret material.
- Use summary-to-detail transitions consistently across requests, captures, histories, and mock rules.

## 2. Primary Journey Map
| Journey | Entry Point | Main Outcome | Key Dependencies |
| --- | --- | --- | --- |
| Create request → save → run → inspect | Workspace | saved request and execution result | T007 schema, T008 execution API |
| Inspect captured request → detail → replay | Captures | replayed execution or saved request | T008 capture/runtime API, T014 follow-up |
| Create/update mock rule → apply → inspect match | Mocks | active rule and visible match diagnostics | T008 mock APIs, T013 follow-up |
| Write script → run → review logs/tests | Workspace or Scripts | validated script behavior and redacted outputs | T005 safety model, T012 follow-up |
| Change environment → rerun request | top bar or request header | resolved execution in selected environment | T007 environment schema, T011 follow-up |

## 3. Flow: New Request Creation to Result Inspection
### 3.1 Entry
User enters the `Workspace` section and chooses one of:
- `New Request`
- `Duplicate Existing Request`
- `Import` *(future-ready)*

### 3.2 Main Steps
1. Create an unsaved request tab, a quick request tab, or open a saved request into the preview slot.
2. Fill method and URL.
3. Add params, headers, auth, body, and optional scripts.
4. Choose environment from global or local selector.
5. Save request into a collection/request group or continue unsaved/session-only from the working tab.
6. Run request.
7. Receive execution status updates.
8. Review response, logs, and test results in result tabs.
9. Optionally refine and rerun.

### 3.3 UX Notes
- Saving should not be required before first run.
- Execution status should be visible both locally in the working tab and globally in the shell.
- After run completion, focus should move to the result panel while preserving editor context.
- Redaction warnings should appear if logs/results hide secret material.
- The workspace explorer now owns thin context actions for create, run, rename, and delete while the main work surface stays focused on authoring and inspection.
- Closing a tab is not the same action as deleting the saved request represented in the persisted tree.
- Explicit saved-request deletion should remove the tree leaf while leaving any open work as a detached draft until the user closes it.
- Collection and request-group runs should execute in deterministic depth-first order and surface aggregate results in the existing result panel without changing the shell layout.
- First-wave result presentation stays in the existing right-side panel; a bottom-dock result shell is out of scope.
- First-wave non-goals remain frozen: multi-select tree operations, drag/drop, type-ahead tree management, tab search, reopen-closed-tab, and inheritance-driven runtime configuration.

## 4. Flow: Captured Inbound Request Inspection and Replay
### 4.1 Entry
User enters `Captures` from navigation or opens a live event notification.

### 4.2 Main Steps
1. Browse capture summary list.
2. Filter by method, path, matcher, workspace, or time.
3. Open capture detail.
4. Inspect request metadata, body, and matched mock outcome.
5. Choose one of:
   - replay immediately
   - open as a new request draft
   - save as reusable request
6. Review resulting execution output in `History` or in a linked execution detail panel.

### 4.3 UX Notes
- Capture detail should preserve both raw and normalized views when safe.
- Replay should clearly communicate whether it preserves headers/body as-is or allows editing first.
- If the capture is not workspace-owned, the UI should label it as global runtime input.

## 5. Flow: Mock Rule Management and Validation
### 5.1 Entry
User enters `Mocks` or uses a `Create mock rule from capture` shortcut.

### 5.2 Main Steps
1. Open mock rule list.
2. Create or edit a rule.
3. Define matcher conditions and response behavior.
4. Enable the rule.
5. Generate or wait for inbound traffic.
6. Inspect match diagnostics and resulting response behavior.
7. Iterate on rule priority or matcher specificity.

### 5.3 UX Notes
- Rule list should display enable/disable state and last matched signal.
- Detail view should show both the authored response shape and recent match evidence.
- Scenario state visibility is required, but whether it is inline or separate is **확실하지 않음**.

## 6. Flow: Script Authoring and Test Review
### 6.1 Entry
User opens script tabs from a request editor or a saved script detail from the `Scripts` section.

### 6.2 Main Steps
1. Select script type (`pre-request`, `post-response`, or `test`).
2. Author or attach script.
3. Review capability guidance for the selected stage.
4. Run request.
5. Inspect stage-specific output:
   - pre-request modifications / errors
   - post-response logs or derived output summary
   - test pass/fail assertions
6. Iterate and rerun.

### 6.3 UX Notes
- Script editor should make the stage context obvious.
- Result displays should distinguish ephemeral live logs from persisted redacted summaries.
- Test failures should be visible both inline and in execution detail.

## 7. Flow: Environment Selection and Request Resolution
### 7.1 Entry
User changes environment from the global top bar or request header.

### 7.2 Main Steps
1. Select environment.
2. Request detail updates resolution preview.
3. Missing variables or secret-backed values show masked warnings or readiness indicators.
4. Run request with selected environment.
5. Execution detail records which environment was used.

### 7.3 UX Notes
- Environment switching should feel lightweight; users should not need to leave the request editor.
- Request detail should show enough resolution context to catch missing variables without revealing raw secrets.

## 8. Flow: History and Execution Result Exploration
### 8.1 Entry
User enters `History` from navigation, after execution completion, or via deep link.

### 8.2 Main Steps
1. Browse execution summary list.
2. Filter by request, environment, status, or time.
3. Open execution detail.
4. Inspect stage timeline, response, logs, and test results.
5. Re-run, duplicate into editor, or compare with another run.

### 8.3 UX Notes
- Execution detail should act as the canonical place for persisted result review.
- Summary list should stay compact enough for frequent scanning.
- Diff and compare affordances are valuable but exact MVP placement is **확실하지 않음**.

## 9. Cross-Cutting UX Responsibilities
### 9.1 Search
- global jump search from top bar
- section-level filter rows in list-oriented screens
- context-specific search inside large bodies/logs *(exact MVP scope 확실하지 않음)*

### 9.2 Empty States
- every major section needs a productive next step, not just a blank placeholder
- empty states should reflect scope: workspace resource creation vs runtime capture activation

### 9.3 Notifications and Status
- executions, capture connection health, and mock activation should have lightweight shell-level indicators
- severe runtime or sandbox failures should link directly to detailed diagnostics

## 10. Hand-off Inputs by Downstream Task
### T006 - Frontend Stack and Application Shell Decision
- decide whether the shell is route-driven, tab-driven, or hybrid
- decide whether the secondary sidebar and detail panel should be permanent, collapsible, or responsive
- preserve the top bar + left rail + explorer + work surface mental model

### T011 - Request Builder MVP Design
- turn the request creation flow into field-level behavior, validation rules, and save/run states
- decide exact replay behavior defaults when opening captured requests inside the builder

### T012 - Script Editor and Automation UX Spec
- design stage-aware editor affordances using the `pre-request` / `post-response` / `test` structure
- expose capability guidance, redaction messaging, and persisted-vs-ephemeral result distinctions

### T014 - History / Inspector Behavior Spec
- decide whether capture and history stay separate top-level destinations or gain a unified timeline entry point
- detail replay, compare, filter, and match-diagnostic behavior with runtime volume assumptions

## 11. Open Questions
1. Whether a unified `Activity` screen should supplement separate `Captures` and `History` sections is **확실하지 않음**.
2. Whether the `Scripts` section needs its own list/detail workspace in MVP or can remain request-context-first is **확실하지 않음**.
3. Whether mock scenario state deserves a dedicated inspector panel is **확실하지 않음**.
4. Whether first-use should auto-create default environments and starter scripts is **확실하지 않음**.

## 12. Post-T075 Workspace UI V2 Task Boundaries
- `T076` is a canon refresh slice for documentation/tracker alignment only.
- `T077` owns recursive saved-tree and placement contract follow-up (`parentRequestGroupId`, same-collection nesting guard, recursive DTO shape, empty-subtree delete rules).
- `T078` owns workbench tab and quick-request behavior follow-up (preview/pinned lifecycle, quick-request save promotion, context-seeded request creation).
- `T079` owns collection/request-group run orchestration and right-panel batch result switching.
- Implementers should keep these scopes separated so one bounded task does not absorb downstream implementation work.

