import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestResultPanel } from '@client/features/request-builder/components/RequestResultPanel';
import type { RequestRunObservation } from '@client/features/request-builder/request-builder.api';
import { resetRequestCommandStore, useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { resetWorkspaceBatchRunStore, useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
import { resetWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { renderApp } from '@client/shared/test/render-app';

const batchExecution = {
  batchExecutionId: 'batch-1',
  containerType: 'collection' as const,
  containerId: 'collection-saved-requests',
  containerName: 'Saved Requests',
  executionOrder: 'depth-first-sequential',
  continuedAfterFailure: true,
  startedAt: '2026-03-25T09:00:00.000Z',
  completedAt: '2026-03-25T09:00:03.000Z',
  durationMs: 3000,
  aggregateOutcome: 'Failed' as const,
  requestCount: 2,
  totalRuns: 2,
  succeededCount: 1,
  failedCount: 1,
  blockedCount: 0,
  timedOutCount: 0,
  steps: [
    {
      stepIndex: 1,
      requestId: 'request-1',
      requestName: 'Health check',
      collectionId: 'collection-saved-requests',
      collectionName: 'Saved Requests',
      requestGroupId: 'request-group-general',
      requestGroupName: 'General',
      execution: {
        executionId: 'exec-1',
        executionOutcome: 'Succeeded' as const,
        responseStatus: 200,
        responseStatusLabel: 'HTTP 200',
        responseHeaders: [],
        responseHeadersSummary: 'No response headers were captured.',
        responseBodyPreview: '{"ok":true}',
        responseBodyHint: '11 characters captured from the latest run.',
        startedAt: '2026-03-25T09:00:00.000Z',
        completedAt: '2026-03-25T09:00:01.000Z',
        durationMs: 1000,
        consoleSummary: 'No console entries were recorded for the latest execution.',
        consoleEntries: [],
        testsSummary: '1 assertion passed.',
        testEntries: ['PASS status is 200'],
      },
    },
    {
      stepIndex: 2,
      requestId: 'request-2',
      requestName: 'Create user',
      collectionId: 'collection-saved-requests',
      collectionName: 'Saved Requests',
      requestGroupId: 'request-group-nested',
      requestGroupName: 'Nested',
      execution: {
        executionId: 'exec-2',
        executionOutcome: 'Failed' as const,
        responseStatus: null,
        responseStatusLabel: 'No response',
        responseHeaders: [],
        responseHeadersSummary: 'No response headers were captured.',
        responseBodyPreview: '',
        responseBodyHint: 'No body preview stored.',
        startedAt: '2026-03-25T09:00:01.000Z',
        completedAt: '2026-03-25T09:00:03.000Z',
        durationMs: 2000,
        consoleSummary: 'Transport failed.',
        consoleEntries: ['Create user: transport failed'],
        testsSummary: 'Tests skipped after transport failure.',
        testEntries: [],
        errorSummary: 'Transport failed.',
      },
    },
  ],
};

const requestTab = {
  id: 'tab-request-health-check',
  sourceKey: 'saved-request-health-check',
  title: 'Health check',
  methodLabel: 'GET' as const,
  source: 'saved' as const,
  tabMode: 'pinned' as const,
  summary: 'Saved request',
  requestId: 'request-health-check',
  collectionId: 'collection-saved-requests',
  collectionName: 'Saved Requests',
  requestGroupId: 'request-group-general',
  requestGroupName: 'General',
  hasUnsavedChanges: false,
};

const requestExecution: RequestRunObservation = {
  executionId: 'exec-request-1',
  executionOutcome: 'Succeeded' as const,
  responseStatus: 200,
  responseStatusLabel: 'HTTP 200',
  responseHeaders: [],
  responseHeadersSummary: 'No response headers were captured.',
  responseBodyPreview: '{"status":"ok"}',
  responseBodyHint: '15 characters captured from the latest run.',
  responsePreviewSizeLabel: '15 B',
  responsePreviewPolicy: 'Preview remains bounded to keep the detail panel scanable.',
  startedAt: '2026-03-29T09:00:00.000Z',
  completedAt: '2026-03-29T09:00:01.000Z',
  durationMs: 1000,
  consoleSummary: 'No console entries were recorded for the latest execution.',
  consoleEntries: [],
  testsSummary: 'No tests were recorded for the latest execution.',
  testEntries: [],
  requestSnapshotSummary: 'Request snapshot stayed aligned with the latest draft inputs.',
  requestInputSummary: 'GET https://api.example.com/health',
  requestResourceId: 'request-health-check',
  environmentLabel: 'Staging',
  environmentResolutionSummary: {
    status: 'resolved' as const,
    summary: 'All placeholders resolved before transport.',
    resolvedPlaceholderCount: 2,
    unresolvedPlaceholderCount: 0,
    affectedInputAreas: ['url', 'headers'],
  },
  requestCollectionName: 'Saved Requests',
  requestGroupName: 'General',
  requestSourceLabel: 'Saved request snapshot',
  stageSummaries: [
    {
      stageId: 'transport' as const,
      label: 'Transport',
      status: 'Succeeded' as const,
      summary: 'Transport completed successfully.',
    },
  ],
};

afterEach(() => {
  resetRequestCommandStore();
  resetWorkspaceBatchRunStore();
  resetWorkspaceShellStore();
});

describe('RequestResultPanel batch mode', () => {
  it('renders batch results and lets the user switch detail tabs', async () => {
    useWorkspaceBatchRunStore.getState().finishBatchRunSuccess(batchExecution, 'Batch run completed with failures.');
    const user = userEvent.setup();
    renderApp(<RequestResultPanel activeTab={null} />);

    expect(screen.getByRole('heading', { name: 'Saved Requests' })).toBeInTheDocument();
    expect(screen.getByText('Collection batch run')).toBeInTheDocument();
    expect(screen.getByText('Batch run completed with failures.')).toBeInTheDocument();
    expect(screen.getByText(/Health check/i)).toBeInTheDocument();
    expect(document.querySelectorAll('.workspace-detail-panel .shared-detail-viewer-section--supporting').length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole('tab', { name: 'Execution info' }));
    expect(within(screen.getByText('Batch execution ID').closest('dl') ?? document.body).getByText('batch-1')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tests' }));
    expect(screen.getByText('Health check: 1 assertion passed.')).toBeInTheDocument();
  });

  it('renders localized batch chrome in Korean', async () => {
    useWorkspaceBatchRunStore.getState().finishBatchRunSuccess(batchExecution, 'Batch run completed with failures.');
    const user = userEvent.setup();
    renderApp(<RequestResultPanel activeTab={null} />, { initialLocale: 'ko' });

    expect(screen.getByText('컬렉션 배치 실행')).toBeInTheDocument();
    expect(screen.getByText('배치 결과')).toBeInTheDocument();
    expect(screen.getByText('배치 요약 · 응답')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '실행 정보' }));
    expect(within(screen.getByText('배치 실행 ID').closest('dl') ?? document.body).getByText('batch-1')).toBeInTheDocument();
  });
});

describe('RequestResultPanel request mode', () => {
  it('renders supporting preview sections and response support blocks for request observations', async () => {
    useRequestCommandStore.getState().finishRunSuccess(requestTab.id, requestExecution);
    const user = userEvent.setup();

    renderApp(<RequestResultPanel activeTab={requestTab} />);

    expect(screen.getByRole('heading', { name: 'Response summary' })).toBeInTheDocument();
    expect(document.querySelectorAll('.workspace-detail-panel .shared-detail-viewer-section--supporting')).toHaveLength(2);
    expect(document.querySelectorAll('.workspace-detail-panel__support-block')).toHaveLength(2);
    expect(screen.getByTestId('request-response-preview')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution info' }));

    expect(screen.getByRole('heading', { name: 'Environment resolution' })).toBeInTheDocument();
    expect(within(screen.getByText('Environment').closest('dl') ?? document.body).getByText('Staging')).toBeInTheDocument();
    expect(document.querySelectorAll('.workspace-detail-panel .shared-detail-viewer-section--supporting').length).toBeGreaterThanOrEqual(3);
  });
});

describe('RequestResultPanel replay source localization', () => {
  it('renders localized replay source copy in Korean observation summary', () => {
    renderApp(
      <RequestResultPanel
        activeTab={{
          id: 'replay-1',
          sourceKey: 'replay-capture-1',
          title: 'Replay of POST /webhooks/stripe',
          methodLabel: 'POST',
          source: 'replay',
          tabMode: 'pinned',
          summary: 'Replay draft',
          hasUnsavedChanges: false,
          replaySource: {
            kind: 'capture',
            label: 'Opened from capture',
            description: 'POST localhost:5671/webhooks/stripe captured at 2026-03-25 09:15.',
          },
        }}
      />,
      { initialLocale: 'ko' },
    );

    expect(screen.getAllByText('캡처에서 열림').length).toBeGreaterThan(0);
  });
});


