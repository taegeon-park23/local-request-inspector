# T005 - Script Execution Safety Model

- **Purpose:** Define a realistic, local-first script execution safety model that protects secrets, preserves usability, and gives T008/T009/T012 stable execution contracts.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-18
- **Related Documents:** `task-004-persistence-strategy-decision.md`, `../architecture/script-execution-safety-model.md`, `../architecture/persistence-strategy.md`, `../tracking/master-task-board.md`
- **Status:** done
- **Priority:** P0

## 1. Summary
T005 converts the architecture and persistence work into an execution-safety model for user-authored scripts. The goal is not perfect isolation, but a local-tool-appropriate model that limits avoidable harm, protects secrets, constrains runtime behavior, and supports later implementation work.

## 2. Why This Task Matters Now
- T008 needs stable execution lifecycle, payload, and event semantics.
- T009 needs repository boundaries for script output, logs, and redacted runtime artifacts.
- T012 needs a clear capability model to decide what the editor can promise and autocomplete.

## 3. T004 Input Validation
T004 is considered sufficient input for T005 because it provides:
- a storage split between user-managed resources and runtime artifacts
- a secret-storage direction that avoids treating raw secrets as ordinary JSON fields
- a runtime-artifact persistence model that requires redaction rules before implementation
- explicit unresolved items that belong to T005, especially secret handling and runtime artifact content boundaries

## 4. Definition of Done
This task is done when all of the following are true:
- `docs/architecture/script-execution-safety-model.md` exists.
- current `vm.runInContext()` risks are documented.
- trust boundaries, allowed/denied capabilities, and redaction rules are defined.
- pre-request / post-response / test execution stages are described.
- realistic MVP execution isolation guidance is stated.
- T008, T009, and T012 follow-up inputs are summarized.

## 5. Outputs
- `../architecture/script-execution-safety-model.md`

## 6. Current Progress
- T004 outputs were reviewed and judged sufficient to start T005.
- Current server-side `vm.runInContext()` usage was re-inspected for threat and capability analysis.
- T008 execution, result, and event contracts were reviewed and found sufficient to close T005 at the planning level.
- `script-execution-safety-model.md` now aligns stage boundaries, persisted-vs-ephemeral artifact rules, cancellation/timeout semantics, and redaction expectations with T008.

## 7. DoD Closure Review
| DoD Item | Status | Notes |
| --- | --- | --- |
| `docs/architecture/script-execution-safety-model.md` exists | done | Safety model document exists and is updated with T008 alignment. |
| `vm.runInContext()` risks are documented | done | Current broad capability exposure and in-process execution risks are described. |
| trust boundaries, allowed/denied capabilities, and redaction rules are defined | done | Capability matrix, trust boundaries, and secret redaction rules are documented. |
| pre-request / post-response / test execution stages are described | done | Stage goals plus T008-aligned contract boundaries are now documented. |
| realistic MVP execution isolation guidance is stated | done | Child-process runner remains the recommended MVP direction with defer boundaries noted. |
| T008, T009, and T012 follow-up inputs are summarized | done | Handoff inputs now also cover T013, T014, and T016 through T008 contract alignment. |

## 8. Open Questions
The following items remain intentionally unresolved, but they no longer block closing T005 because they are implementation-default choices rather than missing safety-model structure:
1. Whether file access should be disabled by default or opt-in per workspace is **확실하지 않음**.
2. Whether outbound network access should be fully open in MVP or restricted to request-derived hosts is **확실하지 않음**.
3. Exact timeout default values are **확실하지 않음**.
4. The exact secret-classification/redaction detection mechanism is **확실하지 않음**.

## 9. Handoff Checklist
- [x] T005 task file exists and is linked from tracking docs
- [x] script execution safety model draft exists
- [x] T004 sufficiency is explicitly recorded
- [x] T008 sufficiency for T005 closure is explicitly recorded
- [x] follow-up inputs for T008, T009, and T012 are summarized
- [x] unresolved safety decisions remain visible

## 10. Closure Decision
T005 can be closed as **done** at the documentation/planning level. Remaining items are default-policy and implementation-detail follow-ups for T009, T012, T013, T014, and T016 rather than blockers to the safety model itself.

## 11. Recommended Owner
- Primary: Architecture / Security-minded Engineer
- Secondary reviewer: Backend / Runtime Engineer
