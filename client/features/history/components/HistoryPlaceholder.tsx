import { useState } from 'react';
import type { HistoryResultTabId } from '@client/features/history/history.types';
import {
  historyExecutionOutcomeOptions,
  historyMatchesExecutionOutcome,
  historyMatchesSearch,
  useHistoryStore,
} from '@client/features/history/state/history-store';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { StatusBadge } from '@client/shared/ui/StatusBadge';

const historyResultTabs = [
  { id: 'response', label: 'Response' },
  { id: 'console', label: 'Console' },
  { id: 'tests', label: 'Tests' },
  { id: 'execution-info', label: 'Execution Info' },
] as const;

const observationHealthCopy = {
  ready: 'Synthetic execution history fixtures back this slice while persistence/query wiring stays deferred.',
  degraded: 'History observation is degraded. Showing only the last bounded summaries that are still available.',
} as const;

export function HistoryPlaceholder() {
  const [activeResultTab, setActiveResultTab] = useState<HistoryResultTabId>('response');
  const observationHealth = useHistoryStore((state) => state.observationHealth);
  const listItems = useHistoryStore((state) => state.listItems);
  const selectedHistoryId = useHistoryStore((state) => state.selectedHistoryId);
  const searchText = useHistoryStore((state) => state.searchText);
  const executionOutcomeFilter = useHistoryStore((state) => state.executionOutcomeFilter);
  const selectHistory = useHistoryStore((state) => state.selectHistory);
  const setSearchText = useHistoryStore((state) => state.setSearchText);
  const setExecutionOutcomeFilter = useHistoryStore((state) => state.setExecutionOutcomeFilter);

  const filteredHistory = listItems.filter(
    (history) =>
      historyMatchesSearch(history, searchText) &&
      historyMatchesExecutionOutcome(history, executionOutcomeFilter),
  );
  const selectedHistory = filteredHistory.find((history) => history.id === selectedHistoryId)
    ?? filteredHistory[0]
    ?? null;
  const isEmpty = listItems.length === 0;
  const hasNoFilteredResults = listItems.length > 0 && filteredHistory.length === 0;

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="history-explorer">
          <header className="history-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">Execution observations</p>
              <h2>History list</h2>
              <p>{observationHealthCopy[observationHealth]}</p>
            </div>
          </header>

          <div className="history-filter-grid">
            <label className="request-field">
              <span>Search history</span>
              <input
                aria-label="Search history"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.currentTarget.value)}
              />
            </label>
            <label className="request-field request-field--compact">
              <span>Execution outcome filter</span>
              <select
                aria-label="Execution outcome filter"
                value={executionOutcomeFilter}
                onChange={(event) => setExecutionOutcomeFilter(event.currentTarget.value as typeof executionOutcomeFilter)}
              >
                {historyExecutionOutcomeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {observationHealth === 'degraded' ? (
            <EmptyStateCallout
              title="History observation is degraded"
              description="Persisted execution summaries remain visible, but richer history loading and replay composition stay deferred from S6."
            />
          ) : null}

          {isEmpty ? (
            <EmptyStateCallout
              title="No history yet"
              description="Executed outbound requests will appear here once the history observation seam receives normalized entries."
              className="history-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title="No history rows match these filters"
              description="Adjust the search text or execution outcome filter to bring history rows back into view."
              className="history-empty-state"
            />
          ) : null}

          {filteredHistory.length > 0 ? (
            <ul className="history-list" aria-label="History list">
              {filteredHistory.map((history) => {
                const isSelected = history.id === selectedHistory?.id;

                return (
                  <li key={history.id}>
                    <button
                      type="button"
                      className={isSelected ? 'history-row history-row--selected' : 'history-row'}
                      aria-label={`Open history ${history.requestLabel}`}
                      aria-pressed={isSelected}
                      onClick={() => selectHistory(history.id)}
                    >
                      <span className="history-row__top">
                        <span className="workspace-chip">{history.method}</span>
                        <StatusBadge kind="executionOutcome" value={history.executionOutcome} />
                        <StatusBadge kind="transportOutcome" value={history.transportOutcome} />
                      </span>
                      <span className="history-row__title">{history.requestLabel}</span>
                      <span className="history-row__path">{history.hostPathHint}</span>
                      <span className="history-row__summary">{history.testSummaryLabel}</span>
                      <span className="history-row__meta">
                        {history.durationLabel} · {history.executedAtLabel}
                      </span>
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
          <h1>History</h1>
          <p>
            History keeps outbound execution observation state separate from request drafts and inbound captures while reusing the shared result/detail primitives from S5.
          </p>
        </header>

        {!selectedHistory ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="No history selected"
              description="Pick an execution row to inspect the request snapshot, result composition, and compact stage summary."
            />
          </div>
        ) : (
          <div className="history-detail">
            <header className="history-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">Observation detail</p>
                <h2>History detail</h2>
                <p>{selectedHistory.requestSnapshotSummary}</p>
              </div>
              <div className="request-work-surface__badges">
                <span className="workspace-chip">{selectedHistory.method}</span>
                <StatusBadge kind="executionOutcome" value={selectedHistory.executionOutcome} />
                <StatusBadge kind="transportOutcome" value={selectedHistory.transportOutcome} />
                <StatusBadge kind="testSummary" value={selectedHistory.testOutcome} />
              </div>
            </header>

            <DetailViewerSection
              title="Observation boundary"
              description="History stays observation-only in S6. Replay and request-builder bridge actions remain explicit later slices."
              actions={(
                <button type="button" className="workspace-button workspace-button--secondary" disabled>
                  Open request snapshot in builder
                </button>
              )}
            />

            <div className="history-summary-grid">
              <DetailViewerSection
                title="Execution summary"
                description="Execution outcome, transport outcome, and test summary remain separate vocabulary families."
                className="history-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Execution outcome', value: selectedHistory.executionOutcome },
                    { label: 'Transport outcome', value: selectedHistory.transportOutcome },
                    { label: 'Duration', value: selectedHistory.durationLabel },
                    { label: 'Tests', value: selectedHistory.testSummaryLabel },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection
                title="Request snapshot"
                description="History detail shows the executed request snapshot, not the live request draft state."
                className="history-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Request label', value: selectedHistory.requestLabel },
                    { label: 'URL', value: selectedHistory.url },
                    { label: 'Environment', value: selectedHistory.environmentLabel },
                    { label: 'Source', value: selectedHistory.sourceLabel },
                  ]}
                />
              </DetailViewerSection>
            </div>

            <PanelTabs
              ariaLabel="History result tabs"
              tabs={historyResultTabs}
              activeTab={activeResultTab}
              onChange={setActiveResultTab}
            />

            {activeResultTab === 'response' ? (
              <DetailViewerSection
                title="Response summary"
                description={selectedHistory.responseSummary}
              >
                <div className="request-work-surface__badges">
                  <StatusBadge kind="transportOutcome" value={selectedHistory.transportOutcome} />
                  <StatusBadge kind="executionOutcome" value={selectedHistory.executionOutcome} />
                </div>
                <KeyValueMetaList
                  items={[
                    {
                      label: 'Status code',
                      value: selectedHistory.transportStatusCode === null ? 'No persisted code' : selectedHistory.transportStatusCode,
                    },
                    { label: 'Duration', value: selectedHistory.durationLabel },
                    { label: 'Headers summary', value: selectedHistory.headersSummary },
                    { label: 'Body hint', value: selectedHistory.bodyHint },
                  ]}
                />
                <pre className="history-preview-block">{selectedHistory.bodyPreview}</pre>
                <EmptyStateCallout
                  title="Persisted response detail is bounded"
                  description="Rich JSON viewers, diff, and full raw payload inspection stay deferred from S6."
                />
              </DetailViewerSection>
            ) : null}

            {activeResultTab === 'console' ? (
              <DetailViewerSection
                title="Console summary"
                description={selectedHistory.consoleSummary}
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Log lines', value: selectedHistory.consoleLogCount },
                    { label: 'Warnings', value: selectedHistory.consoleWarningCount },
                    { label: 'Persistence policy', value: 'Redacted summary only' },
                  ]}
                />
                <ul className="history-preview-list" aria-label="Console preview">
                  {selectedHistory.consolePreview.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
                <EmptyStateCallout
                  title="Live console streaming is deferred"
                  description="History stores compact redacted console summaries rather than the full live execution stream."
                />
              </DetailViewerSection>
            ) : null}

            {activeResultTab === 'tests' ? (
              <DetailViewerSection
                title="Tests summary"
                description={selectedHistory.testsSummary}
              >
                <div className="request-work-surface__badges">
                  <StatusBadge kind="testSummary" value={selectedHistory.testOutcome} />
                </div>
                <KeyValueMetaList
                  items={[
                    { label: 'Assertions', value: selectedHistory.assertionCount },
                    { label: 'Passed', value: selectedHistory.passedAssertions },
                    { label: 'Failed', value: selectedHistory.failedAssertions },
                  ]}
                />
                <ul className="history-preview-list" aria-label="Tests preview">
                  {selectedHistory.testsPreview.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
                <EmptyStateCallout
                  title="Per-assertion drilldown is deferred"
                  description="S6 stops at bounded test summaries and does not add script-editor or deep diagnostics composition."
                />
              </DetailViewerSection>
            ) : null}

            {activeResultTab === 'execution-info' ? (
              <DetailViewerSection
                title="Execution info"
                description="Execution metadata remains separate from request authoring and inbound capture observation state."
              >
                <div className="request-work-surface__badges">
                  <StatusBadge kind="executionOutcome" value={selectedHistory.executionOutcome} />
                </div>
                <KeyValueMetaList
                  items={[
                    { label: 'Execution id', value: selectedHistory.executionId },
                    { label: 'Started', value: selectedHistory.startedAtLabel },
                    { label: 'Completed', value: selectedHistory.completedAtLabel },
                    { label: 'Environment', value: selectedHistory.environmentLabel },
                    { label: 'Source', value: selectedHistory.sourceLabel },
                  ]}
                />
                <EmptyStateCallout
                  title="Advanced execution diagnostics are deferred"
                  description="Cancellation controls, live stage streams, and diff viewers remain outside the S6 slice."
                />
              </DetailViewerSection>
            ) : null}
          </div>
        )}
      </section>

      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        {!selectedHistory ? (
          <div className="workspace-detail-panel workspace-detail-panel--empty">
            <EmptyStateCallout
              title="Compact timeline placeholder"
              description="Execution stage summaries and deferred notes appear after a history row is selected."
            />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">Observation panel</p>
                <h2>Execution stage summary</h2>
                <p>Compact stage summaries only. Unified timelines, diff viewers, and deep traces remain out of scope.</p>
              </div>
            </header>

            <DetailViewerSection
              title="Compact timeline"
              description="History keeps stage summaries compact and human-readable rather than turning into a deep trace viewer."
            >
              <ol className="history-timeline" aria-label="History timeline">
                {selectedHistory.timelineEntries.map((entry) => (
                  <li key={entry.id} className="history-timeline__item">
                    <DetailViewerSection title={entry.title} description={entry.summary} tone="muted" />
                  </li>
                ))}
              </ol>
            </DetailViewerSection>

            <DetailViewerSection
              title="Deferred runtime detail"
              description="Persisted history detail is intentionally bounded and replay composition remains a later bridge."
              tone="muted"
            >
              <EmptyStateCallout
                title="Replay, diff, and deep traces remain deferred"
                description="S6 stops at history skeleton and result composition. Observation-to-authoring bridge work lands in a later slice."
              />
            </DetailViewerSection>
          </div>
        )}
      </aside>
    </>
  );
}
