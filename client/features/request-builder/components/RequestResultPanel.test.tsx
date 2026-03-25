import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestResultPanel } from '@client/features/request-builder/components/RequestResultPanel';
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

afterEach(() => {
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

