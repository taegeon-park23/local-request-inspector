# T094 +New Import Entry Point

- **Purpose:** Expose cURL/OpenAPI/Postman entry points under +New and ship a bounded cURL-to-draft MVP while bridging OpenAPI/Postman entry actions to the existing authored-resource import pipeline.
- **Created:** 2026-03-26
- **Last Updated:** 2026-03-26
- **Related Documents:** `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`, `../tracking/progress-status.md`, `../prd/overview.md`
- **Status:** doing

## Scope
- Add a +New-triggered import entry surface with:
  - Import from cURL
  - Import from OpenAPI
  - Import from Postman
- Implement cURL MVP parsing and open a detached request draft tab seeded with:
  - method
  - url
  - headers
  - basic body mapping
- Wire OpenAPI/Postman buttons to the existing resource import preview/confirm flow.

## Assumptions
- OpenAPI/Postman parsing is not in this bounded task; the +New entries only bridge users into the existing import pipeline.
- cURL MVP focuses on common single-command HTTP patterns (`-X/--request`, `-H/--header`, `-d/--data`, URL flags and positional URL).

## Acceptance Criteria
1. +New area visibly exposes cURL/OpenAPI/Postman import entries.
2. Importing from cURL opens a request draft tab with parsed method/url and carries parsed headers/body when present.
3. OpenAPI/Postman entries trigger the same import preview pipeline already used by authored-resource import.
4. Existing request create/quick request/collection create actions remain functional.

## Verification Plan
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test:node`
- Playwright smoke in Codex:
  - open +New entry area
  - execute cURL import and confirm draft tab opens
  - trigger OpenAPI/Postman file entry actions to confirm bridge wiring
- UI full-suite verification remains user-managed (`npm.cmd run test:ui`) per AGENTS policy.
