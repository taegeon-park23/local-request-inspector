import { useEffect } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import type { RequestRunObservation } from '@client/features/request-builder/request-builder.api';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { isDetachedRequestTab } from '@client/features/request-builder/request-tab-state';
import {
  formatRequestPlacementPath,
  readRequestGroupName,
} from '@client/features/request-builder/request-placement';
import {
  useRequestCommandStore
} from '@client/features/request-builder/state/request-command-store';
import { useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import type { EnvironmentResolutionSummary } from '@client/shared/environment-resolution-summary';
import {
  formatEnvironmentResolutionAffectedAreas,
  formatEnvironmentResolutionStatusLabel,
} from '@client/shared/environment-resolution-summary-view';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import type { WorkspaceResultPanelTabId } from '@client/features/workspace/state/workspace-ui-store';
import type { WorkspaceBatchExecution } from '@client/features/workspace/workspace-request-tree.api';

type TranslateFn = ReturnType<typeof useI18n>['t'];
interface RequestResultPanelProps {
  activeTab: RequestTabRecord | null;
}

function getResultPanelTabs(t: TranslateFn) {
  return [
    { id: 'response' as const, label: t('workspaceRoute.resultPanel.tabs.response'), icon: 'response' as const },
    { id: 'console' as const, label: t('workspaceRoute.resultPanel.tabs.console'), icon: 'console' as const },
    { id: 'tests' as const, label: t('workspaceRoute.resultPanel.tabs.tests'), icon: 'tests' as const },
    { id: 'execution-info' as const, label: t('workspaceRoute.resultPanel.tabs.executionInfo'), icon: 'info' as const },
  ] as const;
}

function getResultPanelIcon(tabId: WorkspaceResultPanelTabId) {
  switch (tabId) {
    case 'response':
      return 'response' as const;
    case 'console':
      return 'console' as const;
    case 'tests':
      return 'tests' as const;
    case 'execution-info':
      return 'info' as const;
  }
}

function getTabSourceCopy(activeTab: RequestTabRecord, t: TranslateFn) {
  if (isDetachedRequestTab(activeTab)) {
    return t('workspaceRoute.resultPanel.source.detachedDraft');
  }

  if (activeTab.source === 'replay') {
    return activeTab.replaySource?.label ?? t('workspaceRoute.resultPanel.source.replayDraft');
  }

  const requestGroupName = readRequestGroupName(activeTab);

  if (activeTab.collectionName && requestGroupName) {
    return t('workspaceRoute.resultPanel.source.savedInCollectionRequestGroup', {
      collectionName: activeTab.collectionName,
      requestGroupName,
    });
  }

  if (activeTab.collectionName) {
    return t('workspaceRoute.resultPanel.source.savedInCollection', {
      collectionName: activeTab.collectionName,
    });
  }

  return t('workspaceRoute.resultPanel.source.savedRequest');
}

function getTransportOutcomeLabel(responseStatus: number | null) {
  if (responseStatus === null) {
    return 'No response';
  }

  return `HTTP ${responseStatus}`;
}

function formatPlacementLabel(
  collectionName: string | undefined,
  requestGroupName: string | undefined,
  t: TranslateFn,
) {
  if (!collectionName) {
    return t('workspaceRoute.resultPanel.linkage.noSavedPlacementRecorded');
  }

  return formatRequestPlacementPath(
    requestGroupName ? { collectionName, requestGroupName } : { collectionName },
  ) ?? t('workspaceRoute.resultPanel.linkage.noSavedPlacementRecorded');
}

function formatObservedLinkage(
  requestResourceId: string | null | undefined,
  sourceLabel: string | undefined,
  collectionName: string | undefined,
  requestGroupName: string | undefined,
  t: TranslateFn,
) {
  if (requestResourceId) {
    return requestResourceId;
  }

  if (collectionName) {
    const placement = formatRequestPlacementPath(
      requestGroupName ? { collectionName, requestGroupName } : { collectionName },
    ) ?? t('workspaceRoute.resultPanel.linkage.noSavedPlacementRecorded');
    return sourceLabel === 'Saved request snapshot'
      ? placement
      : t('workspaceRoute.resultPanel.linkage.draftSavePlacement', { placement });
  }

  return t('workspaceRoute.resultPanel.linkage.noLinkedSavedRequest');
}

function getStageStatus(
  executionStageSummaries: NonNullable<ReturnType<typeof useRequestCommandStore.getState>['byTabId'][string]['run']['latestExecution']>['stageSummaries'],
  stageId: 'pre-request' | 'post-response' | 'tests',
) {
  return executionStageSummaries?.find((summary) => summary.stageId === stageId)?.status ?? 'Skipped';
}

function getStageSummary(
  executionStageSummaries: NonNullable<ReturnType<typeof useRequestCommandStore.getState>['byTabId'][string]['run']['latestExecution']>['stageSummaries'],
  stageId: 'pre-request' | 'post-response' | 'tests',
  fallback: string,
) {
  return executionStageSummaries?.find((summary) => summary.stageId === stageId)?.summary ?? fallback;
}

function renderHeaderExecutionStatus(
  t: TranslateFn,
  runStatus: { status: 'idle' | 'pending' | 'success' | 'error' },
  execution: ReturnType<typeof useRequestCommandStore.getState>['byTabId'][string]['run']['latestExecution'],
) {
  if (runStatus.status === 'pending') {
    return <StatusBadge kind="neutral" value={t('workspaceRoute.resultPanel.summary.badges.running')} />;
  }

  if (execution) {
    return <StatusBadge kind="executionOutcome" value={execution.executionOutcome} />;
  }

  return <StatusBadge kind="neutral" value={t('workspaceRoute.resultPanel.summary.badges.noExecutionYet')} />;
}

function createLatestResultBadges(execution: RequestRunObservation | null, t: TranslateFn) {
  if (!execution) {
    return [];
  }

  const badges = [
    <StatusBadge key="outcome" kind="executionOutcome" value={execution.executionOutcome} />,
  ];

  if (execution.testEntries.length > 0) {
    badges.push(
      <StatusBadge
        key="tests"
        kind="testSummary"
        value={t('workspaceRoute.resultPanel.summary.badges.testsReady', { count: execution.testEntries.length })}
      />,
    );
  }

  if (execution.consoleEntries.length > 0) {
    badges.push(
      <StatusBadge
        key="console"
        kind="neutral"
        value={t('workspaceRoute.resultPanel.summary.badges.consoleReady', { count: execution.consoleEntries.length })}
      />,
    );
  }

  if (execution.responseStatus !== null) {
    badges.push(<StatusBadge key="transport" kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus)} />);
  }

  return badges;
}

function createPreviewItems(items: string[], emptyMessage: string, limit = 3) {
  return items.length > 0 ? items.slice(0, limit) : [emptyMessage];
}

function readExecutionEnvironmentResolutionSummary(execution: RequestRunObservation | null) {
  return (execution as (RequestRunObservation & {
    environmentResolutionSummary?: EnvironmentResolutionSummary;
  }) | null)?.environmentResolutionSummary;
}

function formatBatchContainerLabel(execution: WorkspaceBatchExecution) {
  return execution.containerType === 'collection' ? 'Collection batch run' : 'Request group batch run';
}

function formatBatchStepPlacement(step: WorkspaceBatchExecution['steps'][number]) {
  if (step.collectionName && step.requestGroupName) {
    return `${step.collectionName} / ${step.requestGroupName}`;
  }

  if (step.collectionName) {
    return step.collectionName;
  }

  return 'Workspace';
}

function createBatchStepSummary(step: WorkspaceBatchExecution['steps'][number]) {
  return `${step.stepIndex + 1}. ${step.requestName} - ${step.execution.executionOutcome} - ${formatBatchStepPlacement(step)}`;
}

function createBatchConsoleEntries(execution: WorkspaceBatchExecution) {
  return execution.steps.flatMap((step) => {
    if (step.execution.consoleEntries.length > 0) {
      return step.execution.consoleEntries.map((entry) => `${step.requestName}: ${entry}`);
    }

    if (step.execution.errorSummary) {
      return [`${step.requestName}: ${step.execution.errorSummary}`];
    }

    return [];
  });
}

function createBatchTestEntries(execution: WorkspaceBatchExecution) {
  return execution.steps.map((step) => `${step.requestName}: ${step.execution.testsSummary}`);
}

function createBatchLatestBadges(execution: WorkspaceBatchExecution) {
  const badges = [
    <StatusBadge key="outcome" kind="executionOutcome" value={execution.aggregateOutcome} />,
    <StatusBadge key="steps" kind="neutral" value={`Steps ${execution.totalRuns}`} />,
  ];

  if (execution.failedCount + execution.blockedCount + execution.timedOutCount > 0) {
    badges.push(
      <StatusBadge
        key="issues"
        kind="neutral"
        value={`Issues ${execution.failedCount + execution.blockedCount + execution.timedOutCount}`}
      />,
    );
  }

  if (execution.succeededCount > 0) {
    badges.push(
      <StatusBadge key="success" kind="neutral" value={`Succeeded ${execution.succeededCount}`} />,
    );
  }

  return badges;
}

function renderBatchHeaderExecutionStatus(
  batchRunState: { status: 'idle' | 'pending' | 'success' | 'error' },
  execution: WorkspaceBatchExecution | null,
) {
  if (batchRunState.status === 'pending') {
    return <StatusBadge kind="neutral" value="Running batch" />;
  }

  if (execution) {
    return <StatusBadge kind="executionOutcome" value={execution.aggregateOutcome} />;
  }

  return <StatusBadge kind="neutral" value="No batch run yet" />;
}

export function RequestResultPanel({
  activeTab,
}: RequestResultPanelProps) {
    const { t } = useI18n();
  const translateEnvironmentResolutionKey = (key: string) => t(key as Parameters<typeof t>[0]);
  const resultPanelTabs = getResultPanelTabs(t);
  const batchRunState = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => ({
    isActive: state.isActive,
    status: state.status,
    message: state.message,
    latestExecution: state.latestExecution,
    activeResultTab: state.activeResultTab,
  }));
  const commandEntry = useRequestCommandStore((state) =>
    activeTab ? state.byTabId[activeTab.id] : undefined,
  );
  const setActiveResultTab = useRequestCommandStore((state) => state.setActiveResultTab);
  const setActiveBatchResultTab = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.setActiveResultTab);
  const setActiveRoutePanel = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.setActiveRoutePanel);
  const runStatus = commandEntry?.run ?? {
    status: 'idle' as const,
    message: null,
    latestExecution: null,
    activeResultTab: 'response' as const,
  };
  const execution = runStatus.latestExecution;
  const executionStageSummaries = execution?.stageSummaries ?? [];
  const activeResultTab = runStatus.activeResultTab;
  const isDetachedDraft = isDetachedRequestTab(activeTab);
  const environmentResolutionSummary = readExecutionEnvironmentResolutionSummary(execution);
  const batchExecution = batchRunState.latestExecution;
  const batchActiveResultTab = batchRunState.activeResultTab;

  useEffect(() => {
    if (batchRunState.isActive) {
      setActiveRoutePanel('detail');
    }
  }, [batchRunState.isActive, setActiveRoutePanel]);

  useEffect(() => {
    if (runStatus.status === 'success' || runStatus.status === 'error') {
      setActiveRoutePanel('detail');
    }
  }, [runStatus.status, setActiveRoutePanel]);

  if (batchRunState.isActive) {
    const activeBatchResultTabLabel = resultPanelTabs.find((tab) => tab.id === batchActiveResultTab)?.label
      ?? t('workspaceRoute.resultPanel.tabs.response');
    const batchLatestBadges = batchExecution ? createBatchLatestBadges(batchExecution) : [];
    const batchStepPreviewItems = batchExecution
      ? createPreviewItems(
          batchExecution.steps.map((step) => createBatchStepSummary(step)),
          batchExecution.aggregateOutcome === 'Empty'
            ? 'No saved requests were found in this container.'
            : 'No batch steps were recorded.',
        )
      : [batchRunState.message ?? 'No batch execution selected.'];
    const batchConsolePreviewItems = batchExecution
      ? createPreviewItems(
          createBatchConsoleEntries(batchExecution),
          'No console output was captured for this batch run.',
        )
      : [batchRunState.message ?? 'No batch execution selected.'];
    const batchTestPreviewItems = batchExecution
      ? createPreviewItems(
          createBatchTestEntries(batchExecution),
          'No test results were captured for this batch run.',
        )
      : [batchRunState.message ?? 'No batch execution selected.'];

    return (
      <div className="workspace-detail-panel">
        <header className="workspace-detail-panel__header">
          <div className="workspace-detail-panel__header-copy">
            <p className="section-placeholder__eyebrow">Batch results</p>
            <h2>{batchExecution ? batchExecution.containerName : 'Workspace batch run'}</h2>
            <p>Collection and group runs reuse this panel to show sequential results without changing the current shell layout.</p>
            <div className="workspace-detail-panel__header-meta request-work-surface__badges">
              <span className="workspace-chip">{batchExecution ? formatBatchContainerLabel(batchExecution) : 'Batch run'}</span>
              <span className="workspace-chip workspace-chip--secondary">{activeBatchResultTabLabel}</span>
              {renderBatchHeaderExecutionStatus(batchRunState, batchExecution)}
            </div>
            {batchLatestBadges.length > 0 ? (
              <div className="workspace-detail-panel__header-meta request-work-surface__badges" aria-label="Latest batch run badges">
                {batchLatestBadges}
              </div>
            ) : null}
          </div>
        </header>

        <PanelTabs
          ariaLabel={t('workspaceRoute.resultPanel.tabs.ariaLabel')}
          tabs={resultPanelTabs}
          activeTab={batchActiveResultTab}
          onChange={(tabId) => setActiveBatchResultTab(tabId)}
        />

        <DetailViewerSection
          icon={getResultPanelIcon(batchActiveResultTab)}
          title={`Batch summary · ${activeBatchResultTabLabel}`}
          description="Batch execution summaries stay in the existing result surface."
          actions={batchExecution ? <StatusBadge kind="executionOutcome" value={batchExecution.aggregateOutcome} /> : null}
        >
          <KeyValueMetaList
            items={[
              { label: 'Scope', value: batchExecution ? formatBatchContainerLabel(batchExecution) : 'Batch run' },
              { label: 'Container', value: batchExecution?.containerName ?? 'Pending selection' },
              { label: 'Order', value: batchExecution?.executionOrder ?? 'Depth-first' },
              {
                label: 'Run lane',
                value: batchRunState.status === 'pending'
                  ? 'Batch execution in progress'
                  : batchRunState.message ?? 'No batch execution yet',
              },
              { label: 'Requests', value: batchExecution?.requestCount ?? 0 },
            ]}
          />
          <div className="workspace-detail-panel__result-stack">
            <div className="workspace-detail-panel__result-summary">
              <DetailViewerSection
                icon="tests"
                title="Step preview"
                description="Ordered request steps for this batch run."
                tone="muted"
              >
                <ul className="history-preview-list" aria-label="Batch step preview">
                  {batchStepPreviewItems.map((entry, index) => (
                    <li key={`batch-step-preview-${index}`}>{entry}</li>
                  ))}
                </ul>
              </DetailViewerSection>
            </div>
            <div className="workspace-detail-panel__result-support">
              <DetailViewerSection
                icon="console"
                title="Console preview"
                description="Console and failure highlights across the batch run."
                tone="muted"
              >
                <ul className="history-preview-list" aria-label="Batch console preview">
                  {batchConsolePreviewItems.map((entry, index) => (
                    <li key={`batch-console-preview-${index}`}>{entry}</li>
                  ))}
                </ul>
              </DetailViewerSection>
            </div>
          </div>
        </DetailViewerSection>

        {batchActiveResultTab === 'response' ? (
          <DetailViewerSection
            icon="response"
            title="Batch response summary"
            description="Aggregate outcomes and ordered request results."
            tone="muted"
          >
            {batchRunState.status === 'pending' && !batchExecution ? (
              <EmptyStateCallout
                title="Batch run in progress"
                description="Responses will appear here as each request completes."
              />
            ) : batchExecution ? (
              <div className="workspace-detail-panel__result-stack">
                <div className="workspace-detail-panel__result-summary">
                  <div className="request-run-outcome-row">
                    <StatusBadge kind="executionOutcome" value={batchExecution.aggregateOutcome} />
                    <StatusBadge kind="neutral" value={`Duration ${batchExecution.durationMs} ms`} />
                  </div>
                  <KeyValueMetaList
                    items={[
                      { label: 'Started', value: batchExecution.startedAt },
                      { label: 'Completed', value: batchExecution.completedAt },
                      { label: 'Succeeded', value: batchExecution.succeededCount },
                      { label: 'Failed', value: batchExecution.failedCount },
                      { label: 'Blocked', value: batchExecution.blockedCount },
                      { label: 'Timed out', value: batchExecution.timedOutCount },
                    ]}
                  />
                </div>
                <div className="workspace-detail-panel__result-support">
                  <ul className="history-preview-list" aria-label="Batch response steps">
                    {batchExecution.steps.map((step) => (
                      <li key={`${step.requestId}-${step.stepIndex}`}>
                        <strong>{step.requestName}</strong>: {step.execution.executionOutcome} · {getTransportOutcomeLabel(step.execution.responseStatus)} · {formatBatchStepPlacement(step)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <EmptyStateCallout
                title="No batch execution yet"
                description="Run a collection or request group to inspect aggregate results here."
              />
            )}
          </DetailViewerSection>
        ) : null}

        {batchActiveResultTab === 'console' ? (
          <DetailViewerSection
            icon="console"
            title="Batch console"
            description="Console logs and error summaries across ordered steps."
            tone="muted"
          >
            {batchExecution ? (
              <>
                <KeyValueMetaList
                  items={[
                    { label: 'Requests with logs', value: batchExecution.steps.filter((step) => step.execution.consoleEntries.length > 0).length },
                    { label: 'Total console lines', value: batchExecution.steps.reduce((total, step) => total + step.execution.consoleEntries.length, 0) },
                    { label: 'Failed or blocked', value: batchExecution.failedCount + batchExecution.blockedCount + batchExecution.timedOutCount },
                    { label: 'Continue on error', value: batchExecution.continuedAfterFailure ? 'Enabled' : 'Disabled' },
                  ]}
                />
                {createBatchConsoleEntries(batchExecution).length > 0 ? (
                  <ul className="history-preview-list">
                    {createBatchConsoleEntries(batchExecution).map((entry, index) => (
                      <li key={`${entry}-${index}`}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStateCallout
                    title="No console output"
                    description="This batch run completed without stored console entries or error summaries."
                  />
                )}
              </>
            ) : (
              <EmptyStateCallout
                title="No batch execution yet"
                description="Run a collection or request group to inspect console details here."
              />
            )}
          </DetailViewerSection>
        ) : null}

        {batchActiveResultTab === 'tests' ? (
          <DetailViewerSection
            icon="tests"
            title="Batch tests"
            description="Per-step test summaries for the current batch run."
            tone="muted"
          >
            {batchExecution ? (
              <>
                <KeyValueMetaList
                  items={[
                    { label: 'Steps', value: batchExecution.totalRuns },
                    { label: 'Succeeded', value: batchExecution.succeededCount },
                    { label: 'Failed', value: batchExecution.failedCount },
                    { label: 'Timed out', value: batchExecution.timedOutCount },
                  ]}
                />
                <ul className="history-preview-list">
                  {batchTestPreviewItems.map((entry, index) => (
                    <li key={`batch-test-${index}`}>{entry}</li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyStateCallout
                title="No batch execution yet"
                description="Run a collection or request group to inspect test summaries here."
              />
            )}
          </DetailViewerSection>
        ) : null}

        {batchActiveResultTab === 'execution-info' ? (
          <DetailViewerSection
            icon="info"
            title="Batch execution info"
            description="Container metadata and run identifiers for the latest batch execution."
            tone="muted"
          >
            {batchRunState.status === 'pending' && !batchExecution ? (
              <EmptyStateCallout
                title="Preparing batch execution"
                description="Execution metadata will appear here once the first request starts."
              />
            ) : batchExecution ? (
              <div className="workspace-detail-panel__result-stack">
                <div className="workspace-detail-panel__result-summary">
                  <div className="request-run-outcome-row">
                    <StatusBadge kind="executionOutcome" value={batchExecution.aggregateOutcome} />
                    <StatusBadge kind="neutral" value={batchExecution.batchExecutionId} />
                  </div>
                  <KeyValueMetaList
                    items={[
                      { label: 'Batch execution ID', value: batchExecution.batchExecutionId },
                      { label: 'Container type', value: batchExecution.containerType },
                      { label: 'Container ID', value: batchExecution.containerId },
                      { label: 'Started at', value: batchExecution.startedAt },
                      { label: 'Completed at', value: batchExecution.completedAt },
                      { label: 'Duration', value: `${batchExecution.durationMs} ms` },
                      { label: 'Execution order', value: batchExecution.executionOrder },
                      { label: 'Continue on error', value: batchExecution.continuedAfterFailure ? 'Enabled' : 'Disabled' },
                    ]}
                  />
                </div>
                <div className="workspace-detail-panel__result-support">
                  <ul className="history-preview-list" aria-label="Batch execution steps">
                    {batchExecution.steps.map((step) => (
                      <li key={`batch-info-${step.stepIndex}-${step.requestId}`}>
                        <strong>{step.requestName}</strong>: {step.execution.executionId} · {step.execution.executionOutcome} · {formatBatchStepPlacement(step)}
                      </li>
                    ))}
                  </ul>
                  {batchRunState.message ? <p className="shared-readiness-note">{batchRunState.message}</p> : null}
                </div>
              </div>
            ) : (
              <EmptyStateCallout
                title="No batch execution yet"
                description="Run a collection or request group to inspect execution metadata here."
              />
            )}
          </DetailViewerSection>
        ) : null}
      </div>
    );
  }

  if (!activeTab) {
    return (
      <div className="workspace-detail-panel workspace-detail-panel--empty">
        <EmptyStateCallout
          title={t('workspaceRoute.resultPanel.empty.waitingTitle')}
          description={t('workspaceRoute.resultPanel.empty.waitingDescription')}
        />
              </div>
    );
  }

  const activeResultTabLabel = resultPanelTabs.find((tab) => tab.id === activeResultTab)?.label
    ?? t('workspaceRoute.resultPanel.tabs.response');
  const latestResultBadges = createLatestResultBadges(execution, t);
  const consolePreviewItems = createPreviewItems(
    execution?.consoleEntries ?? [],
    execution?.consoleSummary ?? t('workspaceRoute.resultPanel.summary.preview.consoleEmpty'),
  );
  const testPreviewItems = createPreviewItems(
    execution?.testEntries ?? [],
    execution?.testsSummary ?? t('workspaceRoute.resultPanel.summary.preview.testsEmpty'),
  );

  return (
    <div className="workspace-detail-panel">
      <header className="workspace-detail-panel__header">
        <div className="workspace-detail-panel__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.resultPanel.header.eyebrow')}</p>
          <h2>{t('workspaceRoute.resultPanel.header.title', { title: activeTab.title })}</h2>
          <p>{t('workspaceRoute.resultPanel.header.description')}</p>
          <div className="workspace-detail-panel__header-meta request-work-surface__badges">
            <span className={activeTab.source === 'replay' ? 'workspace-chip workspace-chip--replay' : 'workspace-chip'}>
              {getTabSourceCopy(activeTab, t)}
            </span>
            <span className="workspace-chip workspace-chip--secondary">{activeResultTabLabel}</span>
            {renderHeaderExecutionStatus(t, runStatus, execution)}
          </div>
          {latestResultBadges.length > 0 ? (
            <div className="workspace-detail-panel__header-meta request-work-surface__badges" aria-label={t('workspaceRoute.resultPanel.summary.badges.latestAriaLabel')}>
              {latestResultBadges}
            </div>
          ) : null}
        </div>
      </header>

      {isDetachedDraft ? (
        <section className="workspace-detail-panel__detached-banner" role="status">
          <div>
            <h3>{t('workspaceRoute.resultPanel.detached.title')}</h3>
            <p>{t('workspaceRoute.resultPanel.detached.description')}</p>
          </div>
        </section>
      ) : null}

      <PanelTabs
        ariaLabel={t('workspaceRoute.resultPanel.tabs.ariaLabel')}
        tabs={resultPanelTabs}
        activeTab={activeResultTab}
        onChange={(tabId) => setActiveResultTab(activeTab.id, tabId)}
      />

      <DetailViewerSection
        icon={getResultPanelIcon(activeResultTab)}
        title={t('workspaceRoute.resultPanel.summary.title', { tabLabel: activeResultTabLabel })}
        description={t('workspaceRoute.resultPanel.summary.description')}
        actions={
          execution ? <StatusBadge kind="executionOutcome" value={execution.executionOutcome} /> : null
        }
      >
        <KeyValueMetaList
          items={[
            { label: t('workspaceRoute.resultPanel.summary.labels.activeRequest'), value: activeTab.title },
            { label: t('workspaceRoute.resultPanel.summary.labels.method'), value: activeTab.methodLabel },
            { label: t('workspaceRoute.resultPanel.summary.labels.tabSource'), value: getTabSourceCopy(activeTab, t) },
            { label: t('workspaceRoute.resultPanel.summary.labels.visibleSlot'), value: activeResultTabLabel },
            {
              label: t('workspaceRoute.resultPanel.summary.labels.runLane'),
              value: runStatus.status === 'pending'
                ? t('workspaceRoute.resultPanel.summary.values.executionInProgress')
                : runStatus.message ?? t('workspaceRoute.resultPanel.summary.values.noExecutionYet'),
            },
          ]}
        />
        {execution ? (
          <div className="workspace-detail-panel__result-stack">
            <div className="workspace-detail-panel__result-summary">
              <DetailViewerSection
                icon="tests"
                title={t('workspaceRoute.resultPanel.summary.preview.testsTitle')}
                description={t('workspaceRoute.resultPanel.summary.preview.testsDescription')}
                tone="muted"
              >
                <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.summary.preview.testsAriaLabel')}>
                  {testPreviewItems.map((entry, index) => (
                    <li key={`tests-preview-${index}`}>{entry}</li>
                  ))}
                </ul>
              </DetailViewerSection>
            </div>
            <div className="workspace-detail-panel__result-support">
              <DetailViewerSection
                icon="console"
                title={t('workspaceRoute.resultPanel.summary.preview.consoleTitle')}
                description={t('workspaceRoute.resultPanel.summary.preview.consoleDescription')}
                tone="muted"
              >
                <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.summary.preview.consoleAriaLabel')}>
                  {consolePreviewItems.map((entry, index) => (
                    <li key={`console-preview-${index}`}>{entry}</li>
                  ))}
                </ul>
              </DetailViewerSection>
            </div>
          </div>
        ) : null}
      </DetailViewerSection>

      {activeResultTab === 'response' ? (
        <DetailViewerSection
          icon="response"
          title={t('workspaceRoute.resultPanel.response.title')}
          description={t('workspaceRoute.resultPanel.response.description')}
          tone="muted"
        >
          {runStatus.status === 'pending' && !execution ? (
            <EmptyStateCallout
              title={t('workspaceRoute.resultPanel.response.runningTitle')}
              description={t('workspaceRoute.resultPanel.response.runningDescription')}
            />
          ) : execution ? (
            <div className="workspace-detail-panel__result-stack">
              <div className="workspace-detail-panel__result-summary">
                <div className="request-run-outcome-row">
                  <StatusBadge kind="executionOutcome" value={execution.executionOutcome} />
                  <StatusBadge kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus)} />
              </div>
                <KeyValueMetaList
                  items={[
                    { label: t('workspaceRoute.resultPanel.response.labels.httpStatus'), value: execution.responseStatusLabel },
                    { label: t('workspaceRoute.resultPanel.response.labels.duration'), value: t('workspaceRoute.resultPanel.common.durationMs', { durationMs: execution.durationMs }) },
                    { label: t('workspaceRoute.resultPanel.response.labels.previewSize'), value: execution.responsePreviewSizeLabel ?? t('workspaceRoute.resultPanel.response.values.noPreviewStored') },
                    { label: t('workspaceRoute.resultPanel.response.labels.previewPolicy'), value: execution.responsePreviewPolicy ?? t('workspaceRoute.resultPanel.response.values.previewPolicyFallback') },
                    { label: t('workspaceRoute.resultPanel.response.labels.headersSummary'), value: execution.responseHeadersSummary },
                    { label: t('workspaceRoute.resultPanel.response.labels.bodyHint'), value: execution.responseBodyHint },
                  ]}
                />
              </div>
              <div className="workspace-detail-panel__result-support">
                {execution.consoleEntries.length > 0 ? (
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.summary.preview.consoleAriaLabel')}>
                    {consolePreviewItems.map((entry, index) => (
                      <li key={`response-console-${index}`}>{entry}</li>
                    ))}
                  </ul>
                ) : null}
                {execution.testEntries.length > 0 ? (
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.summary.preview.testsAriaLabel')}>
                    {testPreviewItems.map((entry, index) => (
                      <li key={`response-tests-${index}`}>{entry}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="shared-readiness-note">{execution.responsePreviewPolicy ?? t('workspaceRoute.resultPanel.response.values.previewSupportFallback')}</p>
                <pre className="history-preview-block" data-testid="request-response-preview">{execution.responseBodyPreview || t('workspaceRoute.resultPanel.response.values.noBodyPreview')}</pre>
              </div>
            </div>
          ) : (
            <EmptyStateCallout
              title={t('workspaceRoute.resultPanel.response.empty.title')}
              description={t('workspaceRoute.resultPanel.response.empty.description')}
            />
          )}
        </DetailViewerSection>
      ) : null}

      {activeResultTab === 'console' ? (
        <DetailViewerSection
          icon="console"
          title={t('workspaceRoute.resultPanel.console.title')}
          description={t('workspaceRoute.resultPanel.console.description')}
          tone="muted"
        >
          {execution ? (
            <>
              <KeyValueMetaList
                items={[
                  { label: t('workspaceRoute.resultPanel.console.labels.logLines'), value: execution.consoleLogCount ?? execution.consoleEntries.length },
                  { label: t('workspaceRoute.resultPanel.console.labels.warnings'), value: execution.consoleWarningCount ?? 0 },
                  { label: t('workspaceRoute.resultPanel.console.labels.preRequestStage'), value: getStageStatus(executionStageSummaries, 'pre-request') },
                  { label: t('workspaceRoute.resultPanel.console.labels.postResponseStage'), value: getStageStatus(executionStageSummaries, 'post-response') },
                  { label: t('workspaceRoute.resultPanel.console.labels.summary'), value: execution.consoleSummary },
                ]}
              />
              {execution.consoleEntries.length > 0 ? (
                <ul className="history-preview-list">
                  {execution.consoleEntries.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <EmptyStateCallout
                  title={t('workspaceRoute.resultPanel.console.noEntriesTitle')}
                  description={getStageSummary(executionStageSummaries, 'post-response', execution.consoleSummary)}
                />
              )}
            </>
          ) : (
            <EmptyStateCallout
              title={t('workspaceRoute.resultPanel.console.empty.title')}
              description={t('workspaceRoute.resultPanel.console.empty.description')}
            />
          )}
        </DetailViewerSection>
      ) : null}

      {activeResultTab === 'tests' ? (
        <DetailViewerSection
          icon="tests"
          title={t('workspaceRoute.resultPanel.tests.title')}
          description={t('workspaceRoute.resultPanel.tests.description')}
          tone="muted"
        >
          {execution ? (
            <>
              <KeyValueMetaList
                items={[
                  { label: t('workspaceRoute.resultPanel.tests.labels.summary'), value: execution.testsSummary },
                  { label: t('workspaceRoute.resultPanel.tests.labels.entries'), value: execution.testEntries.length },
                  { label: t('workspaceRoute.resultPanel.tests.labels.testsStage'), value: getStageStatus(executionStageSummaries, 'tests') },
                ]}
              />
              {execution.testEntries.length > 0 ? (
                <ul className="history-preview-list">
                  {execution.testEntries.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <EmptyStateCallout
                  title={t('workspaceRoute.resultPanel.tests.noEntriesTitle')}
                  description={getStageSummary(executionStageSummaries, 'tests', execution.testsSummary)}
                />
              )}
            </>
          ) : (
            <EmptyStateCallout
              title={t('workspaceRoute.resultPanel.tests.empty.title')}
              description={t('workspaceRoute.resultPanel.tests.empty.description')}
            />
          )}
        </DetailViewerSection>
      ) : null}

      {activeResultTab === 'execution-info' ? (
        <DetailViewerSection
          icon="info"
          title={t('workspaceRoute.resultPanel.executionInfo.title')}
          description={t('workspaceRoute.resultPanel.executionInfo.description')}
          tone="muted"
        >
          {runStatus.status === 'pending' && !execution ? (
            <EmptyStateCallout
              title={t('workspaceRoute.resultPanel.executionInfo.startingTitle')}
              description={t('workspaceRoute.resultPanel.executionInfo.startingDescription')}
            />
          ) : execution ? (
            <div className="workspace-detail-panel__result-stack">
              <div className="workspace-detail-panel__result-summary">
                <div className="request-run-outcome-row">
                  <StatusBadge kind="executionOutcome" value={execution.executionOutcome} />
                  <StatusBadge kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus)} />
              </div>
                <KeyValueMetaList
                  items={[
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.executionId'), value: execution.executionId },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.startedAt'), value: execution.startedAt },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.completedAt'), value: execution.completedAt },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.outcome'), value: execution.executionOutcome },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.snapshotSource'), value: execution.requestSourceLabel ?? t('workspaceRoute.resultPanel.executionInfo.values.runtimeRequestSnapshot') },
                    {
                      label: t('workspaceRoute.resultPanel.executionInfo.labels.linkedRequest'),
                      value: formatObservedLinkage(
                        execution.requestResourceId,
                        execution.requestSourceLabel,
                        execution.requestCollectionName,
                        execution.requestGroupName,
                        t,
                      ),
                    },
                    {
                      label: t('workspaceRoute.resultPanel.executionInfo.labels.placement'),
                      value: formatPlacementLabel(
                        execution.requestCollectionName,
                        execution.requestGroupName,
                        t,
                      ),
                    },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.environment'), value: execution.environmentLabel ?? t('workspaceRoute.resultPanel.executionInfo.values.noEnvironmentSelected') },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.errorCode'), value: execution.errorCode ?? t('workspaceRoute.resultPanel.executionInfo.values.noExecutionErrorCode') },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.errorSummary'), value: execution.errorSummary ?? t('workspaceRoute.resultPanel.executionInfo.values.noExecutionErrorSummary') },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.requestInput'), value: execution.requestInputSummary ?? t('workspaceRoute.resultPanel.executionInfo.values.requestSnapshotSummaryMissing') },
                  ]}
                />
                {environmentResolutionSummary ? (
                  <DetailViewerSection
                    icon="info"
                    title={t('workspaceRoute.resultPanel.executionInfo.environmentResolution.title')}
                    description={environmentResolutionSummary.summary}
                    tone="muted"
                  >
                    <KeyValueMetaList
                      items={[
                        {
                          label: t('workspaceRoute.resultPanel.executionInfo.environmentResolution.labels.status'),
                          value: formatEnvironmentResolutionStatusLabel(
                            environmentResolutionSummary.status,
                            translateEnvironmentResolutionKey,
                            'workspaceRoute.resultPanel.executionInfo.environmentResolution',
                          ),
                        },
                        {
                          label: t('workspaceRoute.resultPanel.executionInfo.environmentResolution.labels.resolvedPlaceholders'),
                          value: environmentResolutionSummary.resolvedPlaceholderCount,
                        },
                        ...(environmentResolutionSummary.unresolvedPlaceholderCount > 0
                          ? [{
                            label: t('workspaceRoute.resultPanel.executionInfo.environmentResolution.labels.unresolvedPlaceholders'),
                            value: environmentResolutionSummary.unresolvedPlaceholderCount,
                          }]
                          : []),
                        {
                          label: t('workspaceRoute.resultPanel.executionInfo.environmentResolution.labels.affectedInputAreas'),
                          value: formatEnvironmentResolutionAffectedAreas(
                            environmentResolutionSummary.affectedInputAreas,
                            translateEnvironmentResolutionKey,
                            'workspaceRoute.resultPanel.executionInfo.environmentResolution',
                          ),
                        },
                      ]}
                    />
                  </DetailViewerSection>
                ) : null}
                              </div>
              <div className="workspace-detail-panel__result-support">
                {executionStageSummaries.length > 0 ? (
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.executionInfo.executionStageSummaryAriaLabel')}>
                    {executionStageSummaries.map((summary) => (
                      <li key={`${execution.executionId}-${summary.stageId}`}>
                        <strong>{summary.label}</strong>: {summary.status} - {summary.summary}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {execution.requestSnapshotSummary ? <p className="shared-readiness-note">{execution.requestSnapshotSummary}</p> : null}
                {runStatus.message ? <p className="shared-readiness-note">{runStatus.message}</p> : null}
              </div>
            </div>
          ) : (
            <EmptyStateCallout
              title={t('workspaceRoute.resultPanel.executionInfo.empty.title')}
              description={t('workspaceRoute.resultPanel.executionInfo.empty.description')}
            />
          )}
        </DetailViewerSection>
      ) : null}
    </div>
  );
}













