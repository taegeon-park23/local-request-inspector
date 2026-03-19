import { useState } from 'react';
import type { MockRuleDetailTabId, MockRuleStateFilter } from '@client/features/mocks/mock-rule.types';
import {
  mockRuleMatchesSearch,
  mockRuleMatchesStateFilter,
  mockRuleStateFilterOptions,
  useMocksStore,
} from '@client/features/mocks/state/mocks-store';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { StatusBadge } from '@client/shared/ui/StatusBadge';

const mockDetailTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'matchers', label: 'Matchers' },
  { id: 'response', label: 'Response' },
  { id: 'diagnostics', label: 'Diagnostics' },
] as const;

export function MocksPlaceholder() {
  const [activeDetailTab, setActiveDetailTab] = useState<MockRuleDetailTabId>('overview');
  const listItems = useMocksStore((state) => state.listItems);
  const selectedRuleId = useMocksStore((state) => state.selectedRuleId);
  const searchText = useMocksStore((state) => state.searchText);
  const stateFilter = useMocksStore((state) => state.stateFilter);
  const selectRule = useMocksStore((state) => state.selectRule);
  const setSearchText = useMocksStore((state) => state.setSearchText);
  const setStateFilter = useMocksStore((state) => state.setStateFilter);
  const openNewRuleDraft = useMocksStore((state) => state.openNewRuleDraft);

  const filteredRules = listItems.filter(
    (rule) => mockRuleMatchesSearch(rule, searchText) && mockRuleMatchesStateFilter(rule, stateFilter),
  );
  const selectedRule = filteredRules.find((rule) => rule.id === selectedRuleId) ?? filteredRules[0] ?? null;
  const isEmpty = listItems.length === 0;
  const hasNoFilteredResults = listItems.length > 0 && filteredRules.length === 0;

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="mocks-explorer">
          <header className="mocks-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">Rule management</p>
              <h2>Mock rules</h2>
              <p>
                Synthetic rule fixtures back this management shell. New Rule opens a local-only draft while CRUD, persistence, and runtime evaluation stay explicitly deferred.
              </p>
            </div>
            <button type="button" className="workspace-button" onClick={openNewRuleDraft}>
              New Rule
            </button>
          </header>

          <div className="mocks-filter-grid">
            <label className="request-field">
              <span>Search rules</span>
              <input
                aria-label="Search rules"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.currentTarget.value)}
              />
            </label>
            <label className="request-field request-field--compact">
              <span>Rule state filter</span>
              <select
                aria-label="Rule state filter"
                value={stateFilter}
                onChange={(event) => setStateFilter(event.currentTarget.value as MockRuleStateFilter)}
              >
                {mockRuleStateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <EmptyStateCallout
            title="Persistence is deferred"
            description="This route establishes a mock rule management shell only. Actual create/edit persistence and runtime evaluation stay outside this readiness pass."
          />

          {isEmpty ? (
            <EmptyStateCallout
              title="No mock rules yet"
              description="Rules will appear here once persisted rule querying lands. Until then, the list stays fixture-backed."
              className="mocks-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title="No rules match these filters"
              description="Adjust the search text or rule-state filter to bring authored rules back into view."
              className="mocks-empty-state"
            />
          ) : null}

          {filteredRules.length > 0 ? (
            <ul className="mocks-list" aria-label="Mock rules list">
              {filteredRules.map((rule) => {
                const isSelected = rule.id === selectedRule?.id;

                return (
                  <li key={rule.id}>
                    <button
                      type="button"
                      className={isSelected ? 'mocks-row mocks-row--selected' : 'mocks-row'}
                      aria-label={`Open mock rule ${rule.name}`}
                      aria-pressed={isSelected}
                      onClick={() => selectRule(rule.id)}
                    >
                      <span className="mocks-row__top">
                        <StatusBadge kind="neutral" value={rule.ruleState} />
                        <span className="workspace-chip">Priority {rule.priority}</span>
                      </span>
                      <span className="mocks-row__title">{rule.name}</span>
                      <span className="mocks-row__summary">{rule.matcherSummary}</span>
                      <span className="mocks-row__meta">{rule.responseSummary}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>Mocks</h1>
          <p>
            Mocks is an authored rule management surface. It stays separate from capture outcomes, history, and request drafts, and it does not pretend to execute rules yet.
          </p>
        </header>

        {!selectedRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="No mock rule selected"
              description="Pick a rule row or start a local-only draft shell to inspect matcher summaries, response scaffolding, and deferred management notes."
            />
          </div>
        ) : (
          <div className="mocks-detail">
            <header className="mocks-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">Rule detail</p>
                <h2>Mock rule detail</h2>
                <p>{selectedRule.matcherSummary}</p>
              </div>
              <div className="request-work-surface__badges">
                <StatusBadge kind="neutral" value={selectedRule.ruleState} />
                <span className="workspace-chip">Priority {selectedRule.priority}</span>
                <span className="workspace-chip">{selectedRule.fixedDelayLabel}</span>
              </div>
            </header>

            <DetailViewerSection
              title="Management boundary"
              description="This slice stops at authored rule summaries and a local draft shell. Save/Create stays disabled because persistence, evaluation traces, and script-assisted matcher/response logic land later."
              actions={(
                <button type="button" className="workspace-button workspace-button--secondary" disabled>
                  {selectedRule.isDraftShell ? 'Create rule' : 'Save rule'}
                </button>
              )}
            >
              <p className="shared-readiness-note">
                Disabled actions here are readiness cues, not broken buttons. CRUD and runtime evaluation wiring remain intentionally out of scope for this slice.
              </p>
            </DetailViewerSection>

            <div className="mocks-summary-grid">
              <DetailViewerSection
                title="Rule summary"
                description="Enabled/Disabled here describes authored rule state, not runtime mock outcome."
                className="mocks-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Rule name', value: selectedRule.name },
                    { label: 'Rule state', value: selectedRule.ruleState },
                    { label: 'Priority', value: selectedRule.priority },
                    { label: 'Source', value: selectedRule.sourceLabel },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection
                title="Skeleton coverage"
                description="Structured matcher and response vocabulary is visible, but the actual editor remains intentionally shallow in this shell."
                className="mocks-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Matcher summary', value: selectedRule.matcherSummary },
                    { label: 'Response summary', value: selectedRule.responseSummary },
                    { label: 'Delay hint', value: selectedRule.fixedDelayLabel },
                  ]}
                />
              </DetailViewerSection>
            </div>

            <PanelTabs
              ariaLabel="Mock rule detail tabs"
              tabs={mockDetailTabs}
              activeTab={activeDetailTab}
              onChange={setActiveDetailTab}
            />

            {activeDetailTab === 'overview' ? (
              <DetailViewerSection
                title="Overview"
                description="Mocks stay in a structured rule-management shell rather than expanding into a full free-form editor in this slice."
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Rule state', value: selectedRule.ruleState },
                    { label: 'Priority', value: selectedRule.priority },
                    { label: 'Matcher summary', value: selectedRule.matcherSummary },
                    { label: 'Response summary', value: selectedRule.responseSummary },
                  ]}
                />
                <EmptyStateCallout
                  title="Editing remains deferred"
                  description="This management surface is visible without adding persistence, validation-heavy editing, or runtime evaluation. The goal is readability, not a complete editor."
                />
              </DetailViewerSection>
            ) : null}

            {activeDetailTab === 'matchers' ? (
              <DetailViewerSection
                title="Matchers"
                description="Structured matcher vocabulary is visible here, but deep builder logic and scripts remain deferred."
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Method', value: selectedRule.methodSummary },
                    { label: 'Path', value: selectedRule.pathSummary },
                    { label: 'Query', value: selectedRule.querySummary },
                    { label: 'Headers', value: selectedRule.headerSummary },
                    { label: 'Body', value: selectedRule.bodySummary },
                  ]}
                />
                <EmptyStateCallout
                  title="Script-assisted matchers are deferred"
                  description="This shell stops at summaries for exact/any, exact/prefix, and lightweight matcher hints. Script evaluation stays out of scope."
                />
              </DetailViewerSection>
            ) : null}

            {activeDetailTab === 'response' ? (
              <DetailViewerSection
                title="Response"
                description="Static response scaffolding is shown as authored summary data only."
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Response summary', value: selectedRule.responseSummary },
                    { label: 'Status', value: selectedRule.responseStatusSummary },
                    { label: 'Headers', value: selectedRule.responseHeadersSummary },
                    { label: 'Delay', value: selectedRule.fixedDelayLabel },
                  ]}
                />
                <pre className="mocks-preview-block">{selectedRule.responseBodyPreview}</pre>
                <EmptyStateCallout
                  title="Response generation remains deferred"
                  description="Templating helpers, scripts, and runtime generation logic are not part of this skeleton."
                />
              </DetailViewerSection>
            ) : null}

            {activeDetailTab === 'diagnostics' ? (
              <DetailViewerSection
                title="Diagnostics and deferred work"
                description={selectedRule.diagnosticsSummary}
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Deferred note', value: selectedRule.deferredSummary },
                    { label: 'Source', value: selectedRule.sourceLabel },
                  ]}
                />
                <EmptyStateCallout
                  title="Runtime evaluation trace is deferred"
                  description="Captures/history composition, replay, diff, and live rule-evaluation diagnostics remain later-slice work."
                />
              </DetailViewerSection>
            ) : null}
          </div>
        )}
      </section>

      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        {!selectedRule ? (
          <div className="workspace-detail-panel workspace-detail-panel--empty">
            <EmptyStateCallout
              title="Management notes placeholder"
              description="Deferred editing notes, local draft guidance, and matcher/response reminders appear after a rule is selected."
            />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">Contextual panel</p>
                <h2>Management notes</h2>
                <p>Mock outcomes live in captures. This panel stays focused on authored rule skeleton notes and deferred management affordances.</p>
              </div>
            </header>

            <DetailViewerSection
              title="Deferred capabilities"
              description="Persistence, runtime evaluation, and script-assisted matcher/response work remain explicitly out of scope in this shell."
            >
              <KeyValueMetaList
                items={[
                  { label: 'Draft shell', value: selectedRule.isDraftShell ? 'Local-only open' : 'Not opened from New Rule' },
                  { label: 'Persistence', value: 'Deferred' },
                  { label: 'Runtime evaluation', value: 'Deferred' },
                ]}
              />
            </DetailViewerSection>

            <DetailViewerSection
              title="Rule-management guardrails"
              description="This shell is intentionally incomplete. It should not look like a complete editor or execution console."
              tone="muted"
            >
              <EmptyStateCallout
                title="Replay, diff, and capture/history links remain deferred"
                description="This route describes authored rules only. Runtime outcomes, traces, and bridges stay in their own features."
              />
            </DetailViewerSection>
          </div>
        )}
      </aside>
    </>
  );
}



