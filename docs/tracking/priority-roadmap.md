# Priority Roadmap

- **Purpose:** Show the live delivery sequence after completed work has been archived out of the default read path.
- **Created:** 2026-03-18
- **Last Updated:** 2026-03-30
- **Related Documents:** `master-task-board.md`, `progress-status.md`, `completed-work-summary.md`, `../prd/overview.md`
- **Update Rule:** Update when a new bounded task is promoted or when the live verification baseline changes.

## Roadmap Snapshot
1. Foundation, architecture, UX, QA, tooling, and shipped implementation history are archived in `completed-work-summary.md`.
2. `T073` is archived into `completed-work-summary.md`.
3. `T074` is archived into `completed-work-summary.md`.
4. `T075` is archived into `completed-work-summary.md`.
5. `T076` is archived into `completed-work-summary.md`.
6. `T077` is archived into `completed-work-summary.md`.
7. `T078` is archived into `completed-work-summary.md`.
8. `T079` is archived into `completed-work-summary.md`.
9. `T080` is archived into `completed-work-summary.md`.
10. `T081` Explorer Interaction And Accessibility Completion is archived.
11. `T082` Creation Flow Hybrid Completion is archived.
12. `T083` Workbench Tab Conflict And Status Hardening is archived.
13. `T084` Inheritance Config Model V1 is archived.
14. `T085` Result Contract Precision is archived.
15. `T086` Workbench Duplicate Draft Flow is archived.
16. `T087` Workbench Tab Search And Reopen Flow is archived.
17. `T088` Request Tree Contract Alignment is archived.
18. `T089` New Request Save Placement Mismatch Fix is archived.
19. `T091` Collection/Request-Group Batch Run Timeout Hardening is archived.
20. `T092` Request Create Sheet Unification is archived.
21. `T093` Workbench Tab Capability Reinforcement is archived.
22. `T094` +New Import Entry Point is archived.
23. `T095` Explorer Should + Accessibility Reinforcement is archived.
24. `T096` Context Panel V2 + Inheritance Visualization is archived.
25. `T097` Runner Capability Advancement is archived.
26. `T098` API Transport Error Normalization is archived.
27. `T099` Backend-Unavailable UI Message Normalization is archived.
28. `T100` Workspace Degraded Detail Deduplication is archived.
29. `T101` Explorer Selected-Summary Card Removal is archived.
30. `T102` Browser-Style One-Line Tab Rail + Horizontal Scroll Conversion is archived.
31. `T103` Script Editor Modernization (Monaco + Stage Intellisense) is archived.
32. `T104` was dropped by explicit user reprioritization on 2026-03-29 and is not a live blocker.
33. `T105` Workspace Core Layout Primitives Cleanup is archived.
34. `T106` Workspace Pane Responsive Cleanup is archived.
35. `T107` Explorer Row Action Safety Cleanup is archived.
36. `T108` Runner And Resource-Manager Surface Tier Cleanup is archived.
37. `T109` Scroll Owner And Overflow Normalization is archived.
38. `T110` Detail And Context Density Follow-Up is archived.
39. `T111` Script Surface Focus And Badge Containment is archived.
40. `T112` Script Editor Focus Retention Debug is archived.
41. `T113` Cross-Route Detail Surface Consistency Cleanup is archived.

## Current Sequencing Rules
- Do not reopen archived completed task docs.
- Define and execute one bounded task at a time.
- Keep Codex-side UI reruns closed; use Playwright smoke in Codex and reserve `npm.cmd run test:ui` for user-managed local verification.
- `T104` is dropped; do not treat missing UI capture evidence as a prerequisite for future bounded tasks.

## Immediate Next Step
- Run user-managed local `npm.cmd run test:ui` if broader UI verification is needed, or promote exactly one new bounded follow-up slice before more implementation work starts.
