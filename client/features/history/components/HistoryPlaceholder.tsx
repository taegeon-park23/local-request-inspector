import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  executionHistoryDetailQueryKey,
  executionHistoryListQueryKey,
  listExecutionHistories,
  readExecutionHistory,
} from '@client/features/history/history.api';
import type { HistoryResultTabId } from '@client/features/history/history.types';
import {
  historyExecutionOutcomeOptions,
  historyMatchesExecutionOutcome,
  historyMatchesSearch,
  useHistoryStore,
} from '@client/features/history/state/history-store';
import { openHistoryReplayDraft } from '@client/features/request-builder/replay/replay-bridge';
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
  ready: 'History reads persisted execution summaries from the runtime lane. Select a row to inspect bounded result composition or open a replay draft into Workspace.',
  degraded: 'History query is degraded. Persisted execution summaries may be unavailable until the runtime lane responds again.',
} as const;

export function HistoryPlaceholder() {
  const navigate = useNavigate();
  const [activeResultTab, setActiveResultTab] = useState<HistoryResultTabId>('response');
  const selectedHistoryId = useHistoryStore((state) => state.selectedHistoryId);
  const searchText = useHistoryStore((state) => state.searchText);
  const executionOutcomeFilter = useHistoryStore((state) => state.executionOutcomeFilter);
  const selectHistory = useHistoryStore((state) => state.selectHistory);
  const setSearchText = useHistoryStore((state) => state.setSearchText);
  const setExecutionOutcomeFilter = useHistoryStore((state) => state.setExecutionOutcomeFilter);

  const historyListQuery = useQuery({
    queryKey: executionHistoryListQueryKey,
    queryFn: listExecutionHistories,
  });

  const listItems = historyListQuery.data ?? [];
  const filteredHistory = listItems.filter(
    (history) =>
      historyMatchesSearch(history, searchText) &&
      historyMatchesExecutionOutcome(history, executionOutcomeFilter),
  );
  const effectiveSelectedHistoryId = filteredHistory.some((history) => history.id === selectedHistoryId)
    ? selectedHistoryId
    : filteredHistory[0]?.id ?? null;
  const historyDetailQuery = useQuery({
    queryKey: executionHistoryDetailQueryKey(effectiveSelectedHistoryId),
    queryFn: () => readExecutionHistory(effectiveSelectedHistoryId!),
    enabled: effectiveSelectedHistoryId !== null,
  });

  const selectedHistory = historyDetailQuery.data
    ?? filteredHistory.find((history) => history.id === effectiveSelectedHistoryId)
    ?? null;
  const observationHealth = historyListQuery.isError || historyDetailQuery.isError ? 'degraded' : 'ready';
  const isListLoading = historyListQuery.isPending && !historyListQuery.data;
  const isDetailLoading = effectiveSelectedHistoryId !== null && historyDetailQuery.isPending && !historyDetailQuery.data;
  const isEmpty = !isListLoading && listItems.length === 0;
  const hasNoFilteredResults = !isListLoading && listItems.length > 0 && filteredHistory.length === 0;
  const degradedReason = historyListQuery.error instanceof Error
    ? historyListQuery.error.message
    : historyDetailQuery.error instanceof Error
      ? historyDetailQuery.error.message
      : 'Runtime execution history is temporarily unavailable.';

  const handleOpenReplayDraft = () => {
    if (!selectedHistory) {
      return;
    }

    openHistoryReplayDraft(selectedHistory);
    navigate('/workspace');
  };

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

          {isListLoading ? (
            <EmptyStateCallout
              title="Loading persisted execution history"
              description="Waiting for the runtime lane to return the latest execution summaries. Filtering stays local once the persisted list arrives."
            />
          ) : null}

          {observationHealth === 'degraded' ? (
            <EmptyStateCallout
              title="History observation is degraded"
              description={`Persisted execution summaries could not be loaded cleanly. ${degradedReason}`}
            />
          ) : null}

          {isEmpty ? (
            <EmptyStateCallout
              title="No history yet"
              description="Outbound request executions appear here after Run persists a bounded runtime summary into SQLite history storage."
              className="history-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title="No history rows match these filters"
              description="Adjust the search text or execution outcome filter to bring persisted history rows back into view."
              className="history-empty-state"
            />
          ) : null}

          {filteredHistory.length > 0 ? (
            <ul className="history-list" aria-label="History list">
              {filteredHistory.map((history) => {
                const isSelected = history.id === effectiveSelectedHistoryId;

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
            History is an observation route for persisted outbound executions. It reads redacted runtime summaries from SQLite without reusing active request-tab result state.
          </p>
        </header>

        {isListLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="Loading persisted history detail"
              description="The runtime lane is loading the latest execution list before a detail row can be selected."
            />
          </div>
        ) : !selectedHistory ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="No history selected"
              description="Pick an execution row to inspect the persisted request snapshot, bounded result composition, and compact stage summary. Replay still opens a separate authoring draft instead of mutating history detail."
            />
          </div>
        ) : isDetailLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="Loading persisted execution detail"
              description="Fetching the selected execution detail from the runtime lane. The result composition tabs stay observation-only once the row loads."
            />
          </div>
        ) : historyDetailQuery.isError ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="Execution detail is degraded"
              description={`The selected execution could not be loaded cleanly. ${degradedReason}`}
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
              description="History detail stays observation-only. Open Replay Draft creates a new editable request draft instead of turning this persisted execution record into live authoring state."
              actions={(
                <div className="request-work-surface__future-actions">
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleOpenReplayDraft}>
                    Open Replay Draft
                  </button>
                  <button type="button" className="workspace-button workspace-button--secondary" disabled>
                    Run Replay Now
                  </button>
                </div>
              )}
            >
              <p className="shared-readiness-note">
                Run Replay Now stays disabled in this slice because replay remains edit-first, and persisted history keeps only bounded redacted summaries.
              </p>
            </DetailViewerSection>

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
                description="History shows the persisted request snapshot used during execution, not the live request draft currently open in Workspace."
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
                  description="Saved history shows redacted runtime summaries. Rich JSON viewers, diff, and full raw payload inspection stay deferred for a later slice."
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
                {selectedHistory.consolePreview.length > 0 ? (
                  <ul className="history-preview-list" aria-label="Console preview">
                    {selectedHistory.consolePreview.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStateCallout
                    title="No persisted console preview"
                    description="Console stays bounded in persisted history. Live script-linked logs and richer diagnostics remain deferred."
                  />
                )}
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
                  description="History stops at bounded persisted test summaries and does not add script execution or deep diagnostics composition yet."
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
                  description="Cancellation controls, live stage streams, and diff viewers remain outside this history real-data slice."
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
              description="Execution stage summaries and deferred notes appear after a persisted history row is selected."
            />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">Observation panel</p>
                <h2>Execution stage summary</h2>
                <p>Compact persisted stage summaries only. Unified timelines, diff viewers, and deep traces remain out of scope.</p>
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
              description="Persisted history detail is intentionally bounded, and replay continues to use an explicit edit-first bridge into Workspace."
              tone="muted"
            >
              <EmptyStateCallout
                title="Replay defaults to edit-first"
                description="Open Replay Draft creates a new request-builder draft without turning history detail into editable state."
              />
            </DetailViewerSection>
          </div>
        )}
      </aside>
    </>
  );
}
