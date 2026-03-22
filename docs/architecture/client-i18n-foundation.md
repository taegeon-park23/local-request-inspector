# Client I18n Foundation

- **Purpose:** Define the bounded client-side internationalization model for English and Korean so later localization work can expand surface-by-surface without re-choosing provider, storage, or key conventions.
- **Created:** 2026-03-23
- **Last Updated:** 2026-03-23
- **Related Documents:** `../tasks/task-037-client-i18n-foundation-and-korean-locale-bootstrap.md`, `../tasks/task-038-environments-and-scripts-route-localization-pass.md`, `../tasks/task-039-workspace-authoring-localization-pass.md`, `../tasks/task-040-workspace-result-panel-localization-pass.md`, `material-3-adoption-plan.md`, `../tracking/master-task-board.md`, `../tracking/priority-roadmap.md`
- **Update Rule:** Update when locale ownership, message-key shape, supported locales, or first-slice coverage rules change.

## 1. Scope
This document defines the first i18n baseline for the React client. It does not describe a full translation rollout for every route. Instead, it fixes the shared rules that later localization tasks should inherit.

## 2. Supported Locales
- `en`: fallback and existing baseline locale
- `ko`: first additional locale

## 3. Ownership Model
- Locale state is client-owned.
- Locale persistence is client-owned and stored in browser storage.
- Server routes remain locale-agnostic in this slice.
- Runtime DTOs, storage records, and API responses remain unchanged.

## 4. Provider Model
The app uses one top-level i18n provider that supplies:
- current locale
- locale setter
- message translation helper `t(key, values?)`
- formatting helpers for numbers, date-times, and lists

The provider also synchronizes the active locale to `document.documentElement.lang` and stores the selected locale for the next session.

## 5. Message Catalog Rules
1. English remains the canonical message shape.
2. Korean must satisfy the same key shape as English.
3. Translation keys should be stable and semantic, not derived from visible English sentences.
4. Later translation work should extend the catalog rather than embedding new literals directly into components.
5. Interpolation should use named tokens such as `{count}` and `{label}`.

## 6. First-Slice Proof Of Use
The first proof-of-use surface is intentionally bounded to:
- shell breadcrumb and runtime-connection label
- navigation section labels, summaries, and role labels
- top-level section headers
- settings diagnostics route and locale switch surface

This first slice is enough to validate provider wiring, locale persistence, catalog shape, and UI switching without forcing full-route localization across every feature surface immediately.

## 7. Landed Follow-Up Slices
After the foundation slice, the following bounded localization passes are now landed:
- `T038`: Environments and Scripts route internals now translate client-owned management copy, empty states, validation text, and action labels.
- `T039`: Workspace explorer chrome, request tab shell, request-builder authoring copy, request-bound scripts authoring surface, and explorer-owned authored-resource transfer messaging now translate through the shared i18n layer.
- `T040`: Workspace result panel tabs, observation header copy, response/console/tests/execution-info section copy, and client-owned fallback text now translate through the shared i18n layer without changing runtime DTO ownership.

## 8. Deferred Follow-Up Boundaries
The following are explicitly deferred beyond the currently landed slices:
- full translation of captures, history, and mocks observation-route internals
- broad ARIA-label localization across the whole app in one pass
- backend-driven locale negotiation
- translation import/export tooling
- runtime enum/status token localization where CSS or test contracts still depend on English values

## 9. Future Task Guidance
When later localization tasks begin:
1. add new keys to the shared catalogs first
2. prefer converting one coherent surface at a time
3. keep English fallback intact
4. avoid mixing localized and hard-coded literals inside the same component area when a bounded conversion is practical
5. update tests to pin either explicit English fallback behavior or explicit Korean rendering for the translated surface
6. treat Environments/Scripts, Workspace authoring, and Workspace result-panel copy as the current bounded reference patterns before starting broader observation-route translation work
