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
    if (activeTab.replaySource?.kind === 'capture') {
      return t('workspaceRoute.resultPanel.source.captureReplay');
    }

    if (activeTab.replaySource?.kind === 'history') {
      return t('workspaceRoute.resultPanel.source.historyReplay');
    }

    return t('workspaceRoute.resultPanel.source.replayDraft');
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

function getTransportOutcomeLabel(responseStatus: number | null, t: TranslateFn) {
  if (responseStatus === null) {
    return t('workspaceRoute.resultPanel.common.transportNoResponse');
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

function getLocalizedExecutionSourceLabel(sourceLabel: string | undefined, t: TranslateFn) {
  switch (sourceLabel) {
    case 'Saved request snapshot':
      return t('workspaceRoute.resultPanel.executionInfo.values.savedRequestSnapshot');
    case 'Ad hoc request snapshot':
      return t('workspaceRoute.resultPanel.executionInfo.values.adHocRequestSnapshot');
    case 'Runtime request snapshot':
      return t('workspaceRoute.resultPanel.executionInfo.values.runtimeRequestSnapshot');
    default:
      return sourceLabel ?? t('workspaceRoute.resultPanel.executionInfo.values.runtimeRequestSnapshot');
  }
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

function readAssertionSummary(execution: RequestRunObservation | null) {
  if (!execution?.assertionSummary) {
    return null;
  }

  return execution.assertionSummary;
}

function readAssertionEntries(execution: RequestRunObservation | null) {
  if (!execution) {
    return [];
  }

  if (Array.isArray(execution.assertionResults) && execution.assertionResults.length > 0) {
    return execution.assertionResults.map((entry) => {
      const normalizedName = typeof entry.name === 'string' && entry.name.trim().length > 0
        ? entry.name.trim()
        : entry.id;
      const statusLabel = entry.status === 'failed' ? 'FAIL' : 'PASS';
      const message = typeof entry.message === 'string' && entry.message.trim().length > 0
        ? entry.message
        : normalizedName;
      return `${statusLabel} ${normalizedName}: ${message}`;
    });
  }

  return execution.testEntries ?? [];
}

function readAssertionCount(execution: RequestRunObservation | null) {
  const summary = readAssertionSummary(execution);

  if (summary) {
    return summary.total;
  }

  if (Array.isArray(execution?.assertionResults)) {
    return execution.assertionResults.length;
  }

  return execution?.testEntries?.length ?? 0;
}

function createLatestResultBadges(execution: RequestRunObservation | null, t: TranslateFn) {
  if (!execution) {
    return [];
  }

  const badges = [
    <StatusBadge key="outcome" kind="executionOutcome" value={execution.executionOutcome} />,
  ];
  const assertionCount = readAssertionCount(execution);

  if (assertionCount > 0) {
    badges.push(
      <StatusBadge
        key="tests"
        kind="testSummary"
        value={t('workspaceRoute.resultPanel.summary.badges.testsReady', { count: assertionCount })}
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
    badges.push(<StatusBadge key="transport" kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus, t)} />);
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

function formatBatchContainerLabel(execution: WorkspaceBatchExecution, t: TranslateFn) {
  return execution.containerType === 'collection'
    ? t('workspaceRoute.resultPanel.batch.containerLabels.collection')
    : t('workspaceRoute.resultPanel.batch.containerLabels.requestGroup');
}

function formatBatchStepPlacement(step: WorkspaceBatchExecution['steps'][number], t: TranslateFn) {
  if (step.collectionName && step.requestGroupName) {
    return `${step.collectionName} / ${step.requestGroupName}`;
  }

  if (step.collectionName) {
    return step.collectionName;
  }

  return t('workspaceRoute.resultPanel.common.workspaceRoot');
}

function createBatchStepSummary(step: WorkspaceBatchExecution['steps'][number], t: TranslateFn) {
  return `${step.stepIndex + 1}. ${step.requestName} - ${step.execution.executionOutcome} - ${formatBatchStepPlacement(step, t)}`;
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
  return execution.steps.map((step) => {
    const assertionCount = readAssertionCount(step.execution);
    const summary = assertionCount > 0
      ? `${assertionCount} assertion(s)`
      : step.execution.testsSummary;
    return `${step.requestName}: ${summary}`;
  });
}

function createBatchLatestBadges(execution: WorkspaceBatchExecution, t: TranslateFn) {
  const badges = [
    <StatusBadge key="outcome" kind="executionOutcome" value={execution.aggregateOutcome} />,
    <StatusBadge key="steps" kind="neutral" value={t('workspaceRoute.resultPanel.batch.badges.steps', { count: execution.totalRuns })} />,
  ];

  if (execution.failedCount + execution.blockedCount + execution.timedOutCount > 0) {
    badges.push(
      <StatusBadge
        key="issues"
        kind="neutral"
        value={t('workspaceRoute.resultPanel.batch.badges.issues', {
          count: execution.failedCount + execution.blockedCount + execution.timedOutCount,
        })}
      />,
    );
  }

  if (execution.succeededCount > 0) {
    badges.push(
      <StatusBadge key="success" kind="neutral" value={t('workspaceRoute.resultPanel.batch.badges.succeeded', { count: execution.succeededCount })} />,
    );
  }

  return badges;
}

function renderBatchHeaderExecutionStatus(
  t: TranslateFn,
  batchRunState: { status: 'idle' | 'pending' | 'success' | 'error' },
  execution: WorkspaceBatchExecution | null,
) {
  if (batchRunState.status === 'pending') {
    return <StatusBadge kind="neutral" value={t('workspaceRoute.resultPanel.batch.status.running')} />;
  }

  if (execution) {
    return <StatusBadge kind="executionOutcome" value={execution.aggregateOutcome} />;
  }

  return <StatusBadge kind="neutral" value={t('workspaceRoute.resultPanel.batch.status.noRunYet')} />;
}

export function RequestResultPanel({
  activeTab,
}: RequestResultPanelProps) {
    const { t } = useI18n();
  const translateEnvironmentResolutionKey = (key: string) => t(key as Parameters<typeof t>[0]);
  const resultPanelTabs = getResultPanelTabs(t);
  const batchRunIsActive = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.isActive);
  const batchRunStatus = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.status);
  const batchRunMessage = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.message);
  const batchExecution = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.latestExecution);
  const batchActiveResultTab = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.activeResultTab);
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

  useEffect(() => {
    if (batchRunIsActive) {
      setActiveRoutePanel('detail');
    }
  }, [batchRunIsActive, setActiveRoutePanel]);

  useEffect(() => {
    if (runStatus.status === 'success' || runStatus.status === 'error') {
      setActiveRoutePanel('detail');
    }
  }, [runStatus.status, setActiveRoutePanel]);

  if (batchRunIsActive) {
    const activeBatchResultTabLabel = resultPanelTabs.find((tab) => tab.id === batchActiveResultTab)?.label
      ?? t('workspaceRoute.resultPanel.tabs.response');
    const batchLatestBadges = batchExecution ? createBatchLatestBadges(batchExecution, t) : [];
    const batchStepPreviewItems = batchExecution
      ? createPreviewItems(
          batchExecution.steps.map((step) => createBatchStepSummary(step, t)),
          batchExecution.aggregateOutcome === 'Empty'
            ? t('workspaceRoute.resultPanel.batch.status.noRequestsFound')
            : t('workspaceRoute.resultPanel.batch.status.noStepsRecorded'),
        )
      : [batchRunMessage ?? t('workspaceRoute.resultPanel.batch.status.noExecutionSelected')];
    const batchConsolePreviewItems = batchExecution
      ? createPreviewItems(
          createBatchConsoleEntries(batchExecution),
          t('workspaceRoute.resultPanel.batch.status.noConsoleCaptured'),
        )
      : [batchRunMessage ?? t('workspaceRoute.resultPanel.batch.status.noExecutionSelected')];
    const batchTestPreviewItems = batchExecution
      ? createPreviewItems(
          createBatchTestEntries(batchExecution),
          t('workspaceRoute.resultPanel.batch.status.noTestsCaptured'),
        )
      : [batchRunMessage ?? t('workspaceRoute.resultPanel.batch.status.noExecutionSelected')];

    return (
      <div className="workspace-detail-panel">
        <header className="workspace-detail-panel__header">
          <div className="workspace-detail-panel__header-copy">
            <p className="section-placeholder__eyebrow">{t('workspaceRoute.resultPanel.batch.header.eyebrow')}</p>
            <h2>{batchExecution ? batchExecution.containerName : t('workspaceRoute.resultPanel.batch.header.titleFallback')}</h2>
            <p>{t('workspaceRoute.resultPanel.batch.header.description')}</p>
            <div className="workspace-detail-panel__header-meta request-work-surface__badges">
              <span className="workspace-chip">{batchExecution ? formatBatchContainerLabel(batchExecution, t) : t('workspaceRoute.resultPanel.batch.badges.batchRun')}</span>
              <span className="workspace-chip workspace-chip--secondary">{activeBatchResultTabLabel}</span>
              {renderBatchHeaderExecutionStatus(t, { status: batchRunStatus }, batchExecution)}
            </div>
            {batchLatestBadges.length > 0 ? (
              <div className="workspace-detail-panel__header-meta request-work-surface__badges" aria-label={t('workspaceRoute.resultPanel.batch.badges.latestAriaLabel')}>
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
          title={t('workspaceRoute.resultPanel.batch.summary.title', { tabLabel: activeBatchResultTabLabel })}
          description={t('workspaceRoute.resultPanel.batch.summary.description')}
          actions={batchExecution ? <StatusBadge kind="executionOutcome" value={batchExecution.aggregateOutcome} /> : null}
        >
          <KeyValueMetaList
            items={[
              {
                label: t('workspaceRoute.resultPanel.batch.summary.labels.scope'),
                value: batchExecution ? formatBatchContainerLabel(batchExecution, t) : t('workspaceRoute.resultPanel.batch.badges.batchRun'),
              },
              {
                label: t('workspaceRoute.resultPanel.batch.summary.labels.container'),
                value: batchExecution?.containerName ?? t('workspaceRoute.resultPanel.batch.summary.values.pendingSelection'),
              },
              {
                label: t('workspaceRoute.resultPanel.batch.summary.labels.order'),
                value: batchExecution?.executionOrder ?? t('workspaceRoute.resultPanel.batch.summary.values.depthFirst'),
              },
              {
                label: t('workspaceRoute.resultPanel.batch.summary.labels.runLane'),
                value: batchRunStatus === 'pending'
                  ? t('workspaceRoute.resultPanel.batch.summary.values.executionInProgress')
                  : batchRunMessage ?? t('workspaceRoute.resultPanel.batch.summary.values.noExecutionYet'),
              },
              { label: t('workspaceRoute.resultPanel.batch.summary.labels.requests'), value: batchExecution?.requestCount ?? 0 },
            ]}
          />
          <div className="workspace-detail-panel__result-stack">
            <div className="workspace-detail-panel__result-summary">
              <DetailViewerSection
                icon="tests"
                title={t('workspaceRoute.resultPanel.batch.summary.preview.stepTitle')}
                description={t('workspaceRoute.resultPanel.batch.summary.preview.stepDescription')}
                tone="muted"
              >
                <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.batch.summary.preview.stepAriaLabel')}>
                  {batchStepPreviewItems.map((entry, index) => (
                    <li key={`batch-step-preview-${index}`}>{entry}</li>
                  ))}
                </ul>
              </DetailViewerSection>
            </div>
            <div className="workspace-detail-panel__result-support">
              <DetailViewerSection
                icon="console"
                title={t('workspaceRoute.resultPanel.batch.summary.preview.consoleTitle')}
                description={t('workspaceRoute.resultPanel.batch.summary.preview.consoleDescription')}
                tone="muted"
              >
                <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.batch.summary.preview.consoleAriaLabel')}>
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
            title={t('workspaceRoute.resultPanel.batch.response.title')}
            description={t('workspaceRoute.resultPanel.batch.response.description')}
            tone="muted"
          >
            {batchRunStatus === 'pending' && !batchExecution ? (
              <EmptyStateCallout
                title={t('workspaceRoute.resultPanel.batch.response.runningTitle')}
                description={t('workspaceRoute.resultPanel.batch.response.runningDescription')}
              />
            ) : batchExecution ? (
              <div className="workspace-detail-panel__result-stack">
                <div className="workspace-detail-panel__result-summary">
                  <div className="request-run-outcome-row">
                    <StatusBadge kind="executionOutcome" value={batchExecution.aggregateOutcome} />
                    <StatusBadge kind="neutral" value={t('workspaceRoute.resultPanel.common.durationMs', { durationMs: batchExecution.durationMs })} />
                  </div>
                  <KeyValueMetaList
                    items={[
                      { label: t('workspaceRoute.resultPanel.batch.response.labels.started'), value: batchExecution.startedAt },
                      { label: t('workspaceRoute.resultPanel.batch.response.labels.completed'), value: batchExecution.completedAt },
                      { label: t('workspaceRoute.resultPanel.batch.response.labels.succeeded'), value: batchExecution.succeededCount },
                      { label: t('workspaceRoute.resultPanel.batch.response.labels.failed'), value: batchExecution.failedCount },
                      { label: t('workspaceRoute.resultPanel.batch.response.labels.blocked'), value: batchExecution.blockedCount },
                      { label: t('workspaceRoute.resultPanel.batch.response.labels.timedOut'), value: batchExecution.timedOutCount },
                    ]}
                  />
                </div>
                <div className="workspace-detail-panel__result-support">
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.batch.response.stepsAriaLabel')}>
                    {batchExecution.steps.map((step) => (
                      <li key={`${step.requestId}-${step.stepIndex}`}>
                        <strong>{step.requestName}</strong>: {step.execution.executionOutcome} · {getTransportOutcomeLabel(step.execution.responseStatus, t)} · {formatBatchStepPlacement(step, t)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <EmptyStateCallout
                title={t('workspaceRoute.resultPanel.batch.response.emptyTitle')}
                description={t('workspaceRoute.resultPanel.batch.response.emptyDescription')}
              />
            )}
          </DetailViewerSection>
        ) : null}

        {batchActiveResultTab === 'console' ? (
          <DetailViewerSection
            icon="console"
            title={t('workspaceRoute.resultPanel.batch.console.title')}
            description={t('workspaceRoute.resultPanel.batch.console.description')}
            tone="muted"
          >
            {batchExecution ? (
              <>
                <KeyValueMetaList
                  items={[
                    { label: t('workspaceRoute.resultPanel.batch.console.labels.requestsWithLogs'), value: batchExecution.steps.filter((step) => step.execution.consoleEntries.length > 0).length },
                    { label: t('workspaceRoute.resultPanel.batch.console.labels.totalConsoleLines'), value: batchExecution.steps.reduce((total, step) => total + step.execution.consoleEntries.length, 0) },
                    { label: t('workspaceRoute.resultPanel.batch.console.labels.failedOrBlocked'), value: batchExecution.failedCount + batchExecution.blockedCount + batchExecution.timedOutCount },
                    { label: t('workspaceRoute.resultPanel.batch.console.labels.continueOnError'), value: batchExecution.continuedAfterFailure ? t('workspaceRoute.resultPanel.batch.console.values.enabled') : t('workspaceRoute.resultPanel.batch.console.values.disabled') },
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
                    title={t('workspaceRoute.resultPanel.batch.status.noOutputTitle')}
                    description={t('workspaceRoute.resultPanel.batch.status.noOutputDescription')}
                  />
                )}
              </>
            ) : (
              <EmptyStateCallout
                title={t('workspaceRoute.resultPanel.batch.console.emptyTitle')}
                description={t('workspaceRoute.resultPanel.batch.console.emptyDescription')}
              />
            )}
          </DetailViewerSection>
        ) : null}

        {batchActiveResultTab === 'tests' ? (
          <DetailViewerSection
            icon="tests"
            title={t('workspaceRoute.resultPanel.batch.tests.title')}
            description={t('workspaceRoute.resultPanel.batch.tests.description')}
            tone="muted"
          >
            {batchExecution ? (
              <>
                <KeyValueMetaList
                  items={[
                    { label: t('workspaceRoute.resultPanel.batch.tests.labels.steps'), value: batchExecution.totalRuns },
                    { label: t('workspaceRoute.resultPanel.batch.tests.labels.succeeded'), value: batchExecution.succeededCount },
                    { label: t('workspaceRoute.resultPanel.batch.tests.labels.failed'), value: batchExecution.failedCount },
                    { label: t('workspaceRoute.resultPanel.batch.tests.labels.timedOut'), value: batchExecution.timedOutCount },
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
                title={t('workspaceRoute.resultPanel.batch.tests.emptyTitle')}
                description={t('workspaceRoute.resultPanel.batch.tests.emptyDescription')}
              />
            )}
          </DetailViewerSection>
        ) : null}

        {batchActiveResultTab === 'execution-info' ? (
          <DetailViewerSection
            icon="info"
            title={t('workspaceRoute.resultPanel.batch.executionInfo.title')}
            description={t('workspaceRoute.resultPanel.batch.executionInfo.description')}
            tone="muted"
          >
            {batchRunStatus === 'pending' && !batchExecution ? (
              <EmptyStateCallout
                title={t('workspaceRoute.resultPanel.batch.executionInfo.preparingTitle')}
                description={t('workspaceRoute.resultPanel.batch.executionInfo.preparingDescription')}
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
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.batchExecutionId'), value: batchExecution.batchExecutionId },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.containerType'), value: batchExecution.containerType },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.containerId'), value: batchExecution.containerId },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.startedAt'), value: batchExecution.startedAt },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.completedAt'), value: batchExecution.completedAt },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.duration'), value: t('workspaceRoute.resultPanel.common.durationMs', { durationMs: batchExecution.durationMs }) },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.executionOrder'), value: batchExecution.executionOrder },
                      { label: t('workspaceRoute.resultPanel.batch.executionInfo.labels.continueOnError'), value: batchExecution.continuedAfterFailure ? t('workspaceRoute.resultPanel.batch.executionInfo.values.enabled') : t('workspaceRoute.resultPanel.batch.executionInfo.values.disabled') },
                    ]}
                  />
                </div>
                <div className="workspace-detail-panel__result-support">
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.batch.executionInfo.stepsAriaLabel')}>
                    {batchExecution.steps.map((step) => (
                      <li key={`batch-info-${step.stepIndex}-${step.requestId}`}>
                        <strong>{step.requestName}</strong>: {step.execution.executionId} · {step.execution.executionOutcome} · {formatBatchStepPlacement(step, t)}
                      </li>
                    ))}
                  </ul>
                  {batchRunMessage ? <p className="shared-readiness-note">{batchRunMessage}</p> : null}
                </div>
              </div>
            ) : (
              <EmptyStateCallout
                title={t('workspaceRoute.resultPanel.batch.executionInfo.emptyTitle')}
                description={t('workspaceRoute.resultPanel.batch.executionInfo.emptyDescription')}
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
  const assertionEntries = readAssertionEntries(execution);
  const assertionCount = readAssertionCount(execution);
  const testPreviewItems = createPreviewItems(
    assertionEntries,
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
              value: getRunLaneCopy(runStatus, t),
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
                  <StatusBadge kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus, t)} />
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
                {assertionEntries.length > 0 ? (
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
                  { label: t('workspaceRoute.resultPanel.tests.labels.entries'), value: assertionCount },
                  { label: t('workspaceRoute.resultPanel.tests.labels.testsStage'), value: getStageStatus(executionStageSummaries, 'tests') },
                ]}
              />
              {assertionEntries.length > 0 ? (
                <ul className="history-preview-list">
                  {assertionEntries.map((entry, index) => (
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
                  <StatusBadge kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus, t)} />
              </div>
                <KeyValueMetaList
                  items={[
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.executionId'), value: execution.executionId },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.startedAt'), value: execution.startedAt },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.completedAt'), value: execution.completedAt },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.outcome'), value: execution.executionOutcome },
                    { label: t('workspaceRoute.resultPanel.executionInfo.labels.snapshotSource'), value: getLocalizedExecutionSourceLabel(execution.requestSourceLabel, t) },
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

function getRunLaneCopy(
  runStatus: ReturnType<typeof useRequestCommandStore.getState>['byTabId'][string]['run'],
  t: TranslateFn,
) {
  if (runStatus.status === 'pending') {
    return t('workspaceRoute.resultPanel.summary.values.executionInProgress');
  }

  if (runStatus.status === 'success') {
    switch (runStatus.latestExecution?.executionOutcome) {
      case 'Blocked':
        return t('workspaceRoute.requestBuilder.status.runBlocked');
      case 'Timed out':
        return t('workspaceRoute.requestBuilder.status.runTimedOut');
      default:
        return t('workspaceRoute.requestBuilder.status.runCompleted');
    }
  }

  if (runStatus.status === 'error') {
    return runStatus.message ?? t('workspaceRoute.requestBuilder.status.runError');
  }

  return t('workspaceRoute.resultPanel.summary.values.noExecutionYet');
}





