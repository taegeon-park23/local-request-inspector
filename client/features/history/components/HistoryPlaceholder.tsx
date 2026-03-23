import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { useShellStore } from '@client/app/providers/shell-store';
import { useNavigate } from 'react-router-dom';
import {
  executionHistoryDetailQueryKey,
  executionHistoryListQueryKey,
  listExecutionHistories,
  readExecutionHistory,
} from '@client/features/history/history.api';
import type { HistoryRecord, HistoryResultTabId } from '@client/features/history/history.types';
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
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import { IconLabel } from '@client/shared/ui/IconLabel';
import { RoutePanelTabsLayout } from '@client/features/shared-section-placeholder';

type Translate = ReturnType<typeof useI18n>['t'];

function createFallbackPreviewSizeLabel(history: HistoryRecord, t: Translate) {
  if (history.bodyPreview.length === 0 || history.bodyPreview.startsWith('No persisted response body preview')) {
    return t('historyRoute.helpers.previewSizeNone');
  }

  return t('historyRoute.helpers.previewSizeBytes', {
    count: new TextEncoder().encode(history.bodyPreview).length,
  });
}

function formatObservedPlacement(collectionName: string | undefined, requestGroupName: string | undefined, t: Translate) {
  if (!collectionName) {
    return t('historyRoute.helpers.placementNone');
  }

  return requestGroupName ? `${collectionName} / ${requestGroupName}` : collectionName;
}

function createFallbackBodyModeSummary(bodyMode: HistoryRecord['requestBodyMode'], t: Translate) {
  switch (bodyMode) {
    case 'json':
      return t('historyRoute.helpers.bodyModeJson');
    case 'text':
      return t('historyRoute.helpers.bodyModeText');
    case 'form-urlencoded':
      return t('historyRoute.helpers.bodyModeForm');
    case 'multipart-form-data':
      return t('historyRoute.helpers.bodyModeMultipart');
    default:
      return t('historyRoute.helpers.bodyModeNone');
  }
}

function createFallbackAuthSummary(history: HistoryRecord, t: Translate) {
  switch (history.requestAuth.type) {
    case 'bearer':
      return t('historyRoute.helpers.authBearer');
    case 'basic':
      return t('historyRoute.helpers.authBasic');
    case 'api-key':
      return history.requestAuth.apiKeyPlacement === 'query'
        ? t('historyRoute.helpers.authApiKeyQuery')
        : t('historyRoute.helpers.authApiKeyHeader');
    default:
      return t('historyRoute.helpers.authNone');
  }
}

function createFallbackRequestInputSummary(history: HistoryRecord, t: Translate) {
  return t('historyRoute.helpers.requestInputSummary', {
    params: history.requestParams.length,
    headers: history.requestHeaders.length,
    bodyMode: createFallbackBodyModeSummary(history.requestBodyMode, t),
    auth: createFallbackAuthSummary(history, t),
  });
}

function formatHistoryRequestLinkage(history: HistoryRecord, t: Translate) {
  if (history.requestResourceId) {
    return history.requestResourceId;
  }

  if (history.requestCollectionName) {
    return history.sourceLabel === 'Saved request snapshot'
      ? formatObservedPlacement(history.requestCollectionName, history.requestGroupName, t)
      : t('historyRoute.helpers.linkedRequestDraftPlacement', {
        placement: formatObservedPlacement(history.requestCollectionName, history.requestGroupName, t),
      });
  }

  return t('historyRoute.helpers.linkedRequestNone');
}

function createFallbackResponsePreviewPolicy(history: HistoryRecord, t: Translate) {
  if (history.bodyPreview.startsWith('No persisted response body preview')) {
    return t('historyRoute.helpers.responsePreviewPolicyNone');
  }

  return t('historyRoute.helpers.responsePreviewPolicyBounded');
}

function HistoryExplorerSummaryCard({
  history,
  t,
}: {
  history: HistoryRecord;
  t: Translate;
}) {
  return (
    <DetailViewerSection
      title={t('historyRoute.sidebar.selectedSummary.title')}
      description={history.requestLabel}
      className="observation-explorer-summary observation-explorer-summary--history"
    >
      <div className="request-work-surface__badges observation-explorer-summary__badges">
        <span className="workspace-chip">{history.method}</span>
        <StatusBadge kind="executionOutcome" value={history.executionOutcome} />
        <StatusBadge kind="transportOutcome" value={history.transportOutcome} />
      </div>
      <p className="observation-explorer-summary__path">{history.hostPathHint}</p>
      <KeyValueMetaList
        items={[
          { label: t('historyRoute.summaryCards.requestSnapshot.labels.snapshotSource'), value: history.sourceLabel },
          { label: t('historyRoute.sidebar.selectedSummary.labels.transportOutcome'), value: history.transportOutcome },
          { label: t('historyRoute.sidebar.selectedSummary.labels.tests'), value: history.testSummaryLabel },
          { label: t('historyRoute.sidebar.selectedSummary.labels.duration'), value: history.durationLabel },
          { label: t('historyRoute.sidebar.selectedSummary.labels.executedAt'), value: history.executedAtLabel },
        ]}
      />
    </DetailViewerSection>
  );
}

export function HistoryPlaceholder() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);
  const historyResultTabs = [
    { id: 'response', label: t('historyRoute.resultTabs.response'), icon: 'response' },
    { id: 'console', label: t('historyRoute.resultTabs.console'), icon: 'console' },
    { id: 'tests', label: t('historyRoute.resultTabs.tests'), icon: 'tests' },
    { id: 'execution-info', label: t('historyRoute.resultTabs.executionInfo'), icon: 'info' },
  ] as const;
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
  useEffect(() => {
    if (selectedHistoryId !== effectiveSelectedHistoryId) {
      selectHistory(effectiveSelectedHistoryId);
    }
  }, [effectiveSelectedHistoryId, selectHistory, selectedHistoryId]);

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
      : t('historyRoute.empty.degraded.fallbackDescription');
  const selectedStageSummaries = selectedHistory?.stageSummaries ?? [];

  const handleOpenReplayDraft = () => {
    if (!selectedHistory) {
      return;
    }

    openHistoryReplayDraft(selectedHistory);
    navigate('/workspace');
  };

  const handleSelectHistory = (historyId: string) => {
    selectHistory(historyId);
    setFloatingExplorerOpen('history', false);
  };

  return (
    <RoutePanelTabsLayout
      layoutMode="floating-explorer"
      floatingExplorerRouteKey="history"
      floatingExplorerVariant="focused-overlay"
      defaultActiveTab="explorer"
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
        <div className="history-explorer">
          <header className="history-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('historyRoute.sidebar.eyebrow')}</p>
              <h2>{t('historyRoute.sidebar.title')}</h2>
              <p className="observation-explorer__status-line">
                {observationHealth === 'ready' ? t('historyRoute.sidebar.health.ready') : t('historyRoute.sidebar.health.degraded')}
              </p>
            </div>
          </header>

          <div className="history-filter-grid">
            <label className="request-field">
              <span>{t('historyRoute.filters.searchLabel')}</span>
              <input
                aria-label={t('historyRoute.filters.searchLabel')}
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.currentTarget.value)}
              />
            </label>
            <label className="request-field request-field--compact">
              <span>{t('historyRoute.filters.executionOutcomeFilterLabel')}</span>
              <select
                aria-label={t('historyRoute.filters.executionOutcomeFilterLabel')}
                value={executionOutcomeFilter}
                onChange={(event) => setExecutionOutcomeFilter(event.currentTarget.value as typeof executionOutcomeFilter)}
              >
                {historyExecutionOutcomeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === 'all' ? t('historyRoute.outcomeFilterOptions.all') : option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedHistory ? (
            <HistoryExplorerSummaryCard history={selectedHistory} t={t} />
          ) : null}

          {isListLoading ? (
            <EmptyStateCallout
              title={t('historyRoute.empty.loadingList.title')}
              description={t('historyRoute.empty.loadingList.description')}
            />
          ) : null}

          {observationHealth === 'degraded' ? (
            <EmptyStateCallout
              title={t('historyRoute.empty.degraded.title')}
              description={`${t('historyRoute.empty.degraded.fallbackDescription')} ${degradedReason}`}
            />
          ) : null}

          {isEmpty ? (
            <EmptyStateCallout
              title={t('historyRoute.empty.noItems.title')}
              description={t('historyRoute.empty.noItems.description')}
              className="history-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title={t('historyRoute.empty.noFilteredItems.title')}
              description={t('historyRoute.empty.noFilteredItems.description')}
              className="history-empty-state"
            />
          ) : null}

          {filteredHistory.length > 0 ? (
            <ul className="history-list" aria-label={t('historyRoute.filters.listAriaLabel')}>
              {filteredHistory.map((history) => {
                const isSelected = history.id === effectiveSelectedHistoryId;

                return (
                  <li key={history.id}>
                    <button
                      type="button"
                      className={isSelected ? 'history-row history-row--selected' : 'history-row'}
                      aria-label={t('historyRoute.helpers.openHistoryAction', { label: history.requestLabel })}
                      aria-pressed={isSelected}
                      data-source-kind={history.sourceLabel === 'Saved request snapshot' ? 'saved' : 'ad-hoc'}
                      onClick={() => handleSelectHistory(history.id)}
                    >
                      <span className="history-row__top">
                        <span className="workspace-chip">{history.method}</span>
                        <StatusBadge kind="executionOutcome" value={history.executionOutcome} />
                      </span>
                      <span className="history-row__title">{history.requestLabel}</span>
                      <span className="history-row__path">{history.hostPathHint}</span>
                      <span className="history-row__meta">
                        {history.sourceLabel} · {history.durationLabel} · {history.executedAtLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        </section>
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label={t('shell.routePanels.mainRegion')}>
        <SectionHeading
          icon="history"
          title={t('routes.history.title')}
          summary={t('routes.history.summary')}
        >
          <div className="workspace-explorer__role-strip" aria-label="History route role">
            <span className="workspace-chip">{t('roles.observation')}</span>
            <span className="workspace-chip workspace-chip--secondary">{t('routes.history.contextChip')}</span>
          </div>
        </SectionHeading>

        {isListLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('historyRoute.empty.loadingDetail.title')}
              description={t('historyRoute.empty.loadingDetail.description')}
            />
          </div>
        ) : !selectedHistory ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('historyRoute.empty.noSelection.title')}
              description={t('historyRoute.empty.noSelection.description')}
            />
          </div>
        ) : isDetailLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('historyRoute.empty.loadingPersistedDetail.title')}
              description={t('historyRoute.empty.loadingPersistedDetail.description')}
            />
          </div>
        ) : historyDetailQuery.isError ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('historyRoute.empty.detailDegraded.title')}
              description={`${t('historyRoute.empty.detailDegraded.fallbackDescription')} ${degradedReason}`}
            />
          </div>
        ) : (
          <div className="history-detail">
            <header className="history-detail__header observation-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{t('historyRoute.detail.header.eyebrow')}</p>
                <h2>{t('historyRoute.detail.header.title')}</h2>
                <p>{selectedHistory.requestSnapshotSummary}</p>
                <p className="observation-detail__header-meta">{selectedHistory.sourceLabel} · {selectedHistory.testSummaryLabel}</p>
                <div className="workspace-explorer__role-strip" aria-label="History detail role">
                  <span className="workspace-chip">{t('roles.observation')}</span>
                  <span className="workspace-chip workspace-chip--secondary">{t('historyRoute.detail.header.roleChip')}</span>
                </div>
              </div>
              <div className="request-work-surface__badges observation-detail__badge-rail">
                <span className="workspace-chip">{selectedHistory.method}</span>
                <StatusBadge kind="executionOutcome" value={selectedHistory.executionOutcome} />
                <StatusBadge kind="transportOutcome" value={selectedHistory.transportOutcome} />
              </div>
            </header>

            <DetailViewerSection
              title={t('historyRoute.detail.bridge.title')}
              description={t('historyRoute.detail.bridge.description')}
              className="history-summary-card history-summary-card--bridge"
              actions={(
                <div className="request-work-surface__future-actions">
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleOpenReplayDraft}>
                    <IconLabel icon="replay">{t('historyRoute.detail.bridge.openReplayDraft')}</IconLabel>
                  </button>
                  <button type="button" className="workspace-button workspace-button--secondary" disabled>
                    <IconLabel icon="run">{t('historyRoute.detail.bridge.runReplayNow')}</IconLabel>
                  </button>
                </div>
              )}
            >
              <p className="shared-readiness-note">
                {t('historyRoute.detail.bridge.readinessNote')}
              </p>
            </DetailViewerSection>

            <div className="history-summary-grid">
              <DetailViewerSection
                title={t('historyRoute.summaryCards.executionSummary.title')}
                description={t('historyRoute.summaryCards.executionSummary.description')}
                className="history-summary-card history-summary-card--execution"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('historyRoute.summaryCards.executionSummary.labels.executionOutcome'), value: selectedHistory.executionOutcome },
                    { label: t('historyRoute.summaryCards.executionSummary.labels.transportOutcome'), value: selectedHistory.transportOutcome },
                    { label: t('historyRoute.summaryCards.executionSummary.labels.duration'), value: selectedHistory.durationLabel },
                    { label: t('historyRoute.summaryCards.executionSummary.labels.tests'), value: selectedHistory.testSummaryLabel },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection
                title={t('historyRoute.summaryCards.requestSnapshot.title')}
                description={t('historyRoute.summaryCards.requestSnapshot.description')}
                className="history-summary-card history-summary-card--snapshot"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('historyRoute.summaryCards.requestSnapshot.labels.requestLabel'), value: selectedHistory.requestLabel },
                    { label: t('historyRoute.summaryCards.requestSnapshot.labels.snapshotSource'), value: selectedHistory.sourceLabel },
                    { label: t('historyRoute.summaryCards.requestSnapshot.labels.linkedRequest'), value: formatHistoryRequestLinkage(selectedHistory, t) },
                    { label: t('historyRoute.summaryCards.requestSnapshot.labels.placement'), value: formatObservedPlacement(selectedHistory.requestCollectionName, selectedHistory.requestGroupName, t) },
                    { label: t('historyRoute.summaryCards.requestSnapshot.labels.url'), value: selectedHistory.url },
                    { label: t('historyRoute.summaryCards.requestSnapshot.labels.requestInput'), value: selectedHistory.requestInputSummary ?? createFallbackRequestInputSummary(selectedHistory, t) },
                  ]}
                />
              </DetailViewerSection>
            </div>

            <PanelTabs
              ariaLabel={t('historyRoute.resultTabs.ariaLabel')}
              tabs={historyResultTabs}
              activeTab={activeResultTab}
              onChange={setActiveResultTab}
            />

            {activeResultTab === 'response' ? (
              <DetailViewerSection
                title={t('historyRoute.resultPanels.response.title')}
                description={selectedHistory.responseSummary}
                className="history-summary-card history-summary-card--response"
              >
                <div className="request-work-surface__badges">
                  <StatusBadge kind="transportOutcome" value={selectedHistory.transportOutcome} />
                  <StatusBadge kind="executionOutcome" value={selectedHistory.executionOutcome} />
                </div>
                <KeyValueMetaList
                  items={[
                    {
                      label: t('historyRoute.resultPanels.response.labels.statusCode'),
                      value: selectedHistory.transportStatusCode === null ? t('historyRoute.resultPanels.response.statusCodeNoPersistedCode') : selectedHistory.transportStatusCode,
                    },
                    { label: t('historyRoute.resultPanels.response.labels.duration'), value: selectedHistory.durationLabel },
                    { label: t('historyRoute.resultPanels.response.labels.previewSize'), value: selectedHistory.responsePreviewSizeLabel ?? createFallbackPreviewSizeLabel(selectedHistory, t) },
                    { label: t('historyRoute.resultPanels.response.labels.previewPolicy'), value: selectedHistory.responsePreviewPolicy ?? createFallbackResponsePreviewPolicy(selectedHistory, t) },
                    { label: t('historyRoute.resultPanels.response.labels.headersSummary'), value: selectedHistory.headersSummary },
                    { label: t('historyRoute.resultPanels.response.labels.bodyHint'), value: selectedHistory.bodyHint },
                  ]}
                />
                <p className="shared-readiness-note">{selectedHistory.responsePreviewPolicy ?? createFallbackResponsePreviewPolicy(selectedHistory, t)}</p>
                <pre className="history-preview-block">{selectedHistory.bodyPreview}</pre>
                <EmptyStateCallout
                  title={t('historyRoute.resultPanels.response.boundedDetailTitle')}
                  description={t('historyRoute.resultPanels.response.boundedDetailDescription')}
                />
              </DetailViewerSection>
            ) : null}

            {activeResultTab === 'console' ? (
              <DetailViewerSection
                title={t('historyRoute.resultPanels.console.title')}
                description={selectedHistory.consoleSummary}
                className="history-summary-card history-summary-card--console"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('historyRoute.resultPanels.console.labels.logLines'), value: selectedHistory.consoleLogCount },
                    { label: t('historyRoute.resultPanels.console.labels.warnings'), value: selectedHistory.consoleWarningCount },
                    { label: t('historyRoute.resultPanels.console.labels.postResponseStage'), value: selectedStageSummaries.find((entry) => entry.stageId === 'post-response')?.status ?? t('historyRoute.helpers.stageStatusSkipped') },
                    { label: t('historyRoute.resultPanels.console.labels.storedSummary'), value: t('historyRoute.resultPanels.console.labels.storedSummaryValue') },
                  ]}
                />
                {selectedHistory.consolePreview.length > 0 ? (
                  <ul className="history-preview-list" aria-label={t('historyRoute.resultPanels.console.consolePreviewAriaLabel')}>
                    {selectedHistory.consolePreview.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStateCallout
                    title={t('historyRoute.resultPanels.console.noPersistedSummaryTitle')}
                    description={selectedStageSummaries.find((entry) => entry.stageId === 'post-response')?.summary ?? selectedHistory.consoleSummary}
                  />
                )}
              </DetailViewerSection>
            ) : null}

            {activeResultTab === 'tests' ? (
              <DetailViewerSection
                title={t('historyRoute.resultPanels.tests.title')}
                description={selectedHistory.testsSummary}
                className="history-summary-card history-summary-card--tests"
              >
                <div className="request-work-surface__badges">
                  <StatusBadge kind="testSummary" value={selectedHistory.testOutcome} />
                </div>
                <KeyValueMetaList
                  items={[
                    { label: t('historyRoute.resultPanels.tests.labels.assertions'), value: selectedHistory.assertionCount },
                    { label: t('historyRoute.resultPanels.tests.labels.passed'), value: selectedHistory.passedAssertions },
                    { label: t('historyRoute.resultPanels.tests.labels.failed'), value: selectedHistory.failedAssertions },
                    { label: t('historyRoute.resultPanels.tests.labels.testsStage'), value: selectedStageSummaries.find((entry) => entry.stageId === 'tests')?.status ?? t('historyRoute.helpers.stageStatusSkipped') },
                  ]}
                />
                {selectedHistory.testsPreview.length > 0 ? (
                  <ul className="history-preview-list" aria-label={t('historyRoute.resultPanels.tests.testsPreviewAriaLabel')}>
                    {selectedHistory.testsPreview.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStateCallout
                    title={t('historyRoute.resultPanels.tests.noPersistedSummaryTitle')}
                    description={selectedHistory.testsSummary}
                  />
                )}
                <EmptyStateCallout
                  title={t('historyRoute.resultPanels.tests.deferredDetailTitle')}
                  description={t('historyRoute.resultPanels.tests.deferredDetailDescription')}
                />
              </DetailViewerSection>
            ) : null}

            {activeResultTab === 'execution-info' ? (
              <DetailViewerSection
                title={t('historyRoute.resultPanels.executionInfo.title')}
                description={t('historyRoute.resultPanels.executionInfo.description')}
                className="history-summary-card history-summary-card--execution-info"
              >
                <div className="request-work-surface__badges">
                  <StatusBadge kind="executionOutcome" value={selectedHistory.executionOutcome} />
                </div>
                <KeyValueMetaList
                  items={[
                    { label: t('historyRoute.resultPanels.executionInfo.labels.executionId'), value: selectedHistory.executionId },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.started'), value: selectedHistory.startedAtLabel },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.completed'), value: selectedHistory.completedAtLabel },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.environment'), value: selectedHistory.environmentLabel },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.source'), value: selectedHistory.sourceLabel },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.errorCode'), value: selectedHistory.errorCode ?? t('historyRoute.resultPanels.executionInfo.noExecutionErrorCode') },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.errorSummary'), value: selectedHistory.errorSummary ?? t('historyRoute.resultPanels.executionInfo.noExecutionErrorSummary') },
                    { label: t('historyRoute.resultPanels.executionInfo.labels.requestInput'), value: selectedHistory.requestInputSummary ?? createFallbackRequestInputSummary(selectedHistory, t) },
                  ]}
                />
                {selectedStageSummaries.length > 0 ? (
                  <ul className="history-preview-list" aria-label={t('historyRoute.resultPanels.executionInfo.stageSummaryAriaLabel')}>
                    {selectedStageSummaries.map((summary) => (
                      <li key={`${selectedHistory.executionId}-${summary.stageId}`}>
                        <strong>{summary.label}</strong>: {summary.status} - {summary.summary}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <EmptyStateCallout
                  title={t('historyRoute.resultPanels.executionInfo.deferredDetailTitle')}
                  description={t('historyRoute.resultPanels.executionInfo.deferredDetailDescription')}
                />
              </DetailViewerSection>
            ) : null}
          </div>
        )}
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
        {!selectedHistory ? (
          <div className="workspace-detail-panel workspace-detail-panel--empty">
            <EmptyStateCallout
              title={t('historyRoute.empty.timelinePlaceholder.title')}
              description={t('historyRoute.empty.timelinePlaceholder.description')}
            />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">{t('historyRoute.timelinePanel.header.eyebrow')}</p>
                <h2>{t('historyRoute.timelinePanel.header.title')}</h2>
                <p>{t('historyRoute.timelinePanel.header.description')}</p>
                <div className="workspace-explorer__role-strip" aria-label="History timeline role">
                  <span className="workspace-chip">{t('roles.observation')}</span>
                  <span className="workspace-chip workspace-chip--secondary">{t('historyRoute.timelinePanel.header.roleChip')}</span>
                </div>
              </div>
            </header>

            <DetailViewerSection
              title={t('historyRoute.timelinePanel.timelineSummary.title')}
              description={t('historyRoute.timelinePanel.timelineSummary.description')}
              className="history-summary-card history-summary-card--timeline"
            >
              <ol className="history-timeline" aria-label={t('historyRoute.timelinePanel.timelineSummary.ariaLabel')}>
                {selectedHistory.timelineEntries.map((entry) => (
                  <li key={entry.id} className="history-timeline__item">
                    <DetailViewerSection title={entry.title} description={entry.summary} tone="muted" className="history-timeline__entry" />
                  </li>
                ))}
              </ol>
            </DetailViewerSection>

            <DetailViewerSection
              title={t('historyRoute.timelinePanel.deferred.title')}
              description={t('historyRoute.timelinePanel.deferred.description')}
              className="history-summary-card history-summary-card--deferred"
              tone="muted"
            >
              <EmptyStateCallout
                title={t('historyRoute.timelinePanel.deferred.emptyTitle')}
                description={t('historyRoute.timelinePanel.deferred.emptyDescription')}
              />
            </DetailViewerSection>
          </div>
        )}
        </aside>
      )}
    />
  );
}



