import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceContextPanel } from '@client/features/workspace/components/WorkspaceContextPanel';
import { resetWorkspaceBatchRunStore, useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
import { resetWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { renderApp } from '@client/shared/test/render-app';

const workspaceContext = {
  collections: [
    {
      id: 'collection-saved-requests',
      workspaceId: 'local-workspace',
      name: 'Saved Requests',
      variables: [
        {
          id: 'collection-var-api-base',
          key: 'apiBase',
          value: 'https://api.example.com',
          isEnabled: true,
        },
      ],
      runConfig: {
        continueOnError: true,
      },
    },
  ],
  requestGroups: [
    {
      id: 'request-group-general',
      workspaceId: 'local-workspace',
      collectionId: 'collection-saved-requests',
      parentRequestGroupId: null,
      name: 'General',
      variables: [
        {
          id: 'request-group-var-region',
          key: 'region',
          value: 'ap-northeast-2',
          isEnabled: true,
        },
      ],
      runConfig: {
        iterations: 3,
      },
    },
  ],
  tree: [
    {
      id: 'collection-node-saved-requests',
      kind: 'collection' as const,
      collectionId: 'collection-saved-requests',
      name: 'Saved Requests',
      childGroups: [
        {
          id: 'request-group-node-general',
          kind: 'request-group' as const,
          collectionId: 'collection-saved-requests',
          requestGroupId: 'request-group-general',
          parentRequestGroupId: null,
          name: 'General',
          childGroups: [],
          requests: [
            {
              id: 'request-node-health-check',
              kind: 'request' as const,
              name: 'Health check',
              request: {
                id: 'request-health-check',
                name: 'Health check',
                methodLabel: 'GET' as const,
                summary: 'Health endpoint',
                collectionId: 'collection-saved-requests',
                collectionName: 'Saved Requests',
                requestGroupId: 'request-group-general',
                requestGroupName: 'General',
              },
            },
          ],
        },
      ],
    },
  ],
};

const collectionOverviewTab = {
  id: 'tab-collection-overview',
  sourceKey: 'collection-overview-collection-saved-requests',
  title: 'Saved Requests',
  methodLabel: 'GET' as const,
  source: 'collection-overview' as const,
  tabMode: 'pinned' as const,
  summary: 'Collection overview',
  collectionId: 'collection-saved-requests',
  collectionName: 'Saved Requests',
  hasUnsavedChanges: false,
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

const collectionBatchExecution = {
  batchExecutionId: 'batch-collection-1',
  containerType: 'collection' as const,
  containerId: 'collection-saved-requests',
  containerName: 'Saved Requests',
  executionOrder: 'depth-first-sequential',
  continuedAfterFailure: true,
  startedAt: '2026-03-26T03:00:00.000Z',
  completedAt: '2026-03-26T03:00:01.000Z',
  durationMs: 1000,
  aggregateOutcome: 'Succeeded' as const,
  requestCount: 1,
  totalRuns: 1,
  succeededCount: 1,
  failedCount: 0,
  blockedCount: 0,
  timedOutCount: 0,
  steps: [
    {
      stepIndex: 1,
      requestId: 'request-health-check',
      requestName: 'Health check',
      collectionId: 'collection-saved-requests',
      collectionName: 'Saved Requests',
      requestGroupId: 'request-group-general',
      requestGroupName: 'General',
      execution: {
        executionId: 'exec-health-check',
        executionOutcome: 'Succeeded' as const,
        responseStatus: 200,
        responseStatusLabel: 'HTTP 200',
        responseHeaders: [],
        responseHeadersSummary: 'No response headers were captured.',
        responseBodyPreview: '{"status":"ok"}',
        responseBodyHint: '13 characters captured from the latest run.',
        startedAt: '2026-03-26T03:00:00.000Z',
        completedAt: '2026-03-26T03:00:01.000Z',
        durationMs: 1000,
        consoleSummary: 'No console entries were recorded for the latest execution.',
        consoleEntries: [],
        testsSummary: 'No tests were recorded for the latest execution.',
        testEntries: [],
      },
    },
  ],
};

afterEach(() => {
  resetWorkspaceBatchRunStore();
  resetWorkspaceShellStore();
});

describe('WorkspaceContextPanel', () => {
  it('renders overview metadata for collection overview tabs', () => {
    renderApp(
      <WorkspaceContextPanel
        activeTab={collectionOverviewTab}
        workspaceContext={workspaceContext}
      />,
    );

    expect(screen.getByRole('tablist', { name: 'Context panel tabs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Context overview' })).toBeInTheDocument();
    expect(within(screen.getByText('Collection id').closest('dl') ?? document.body).getByText('collection-saved-requests')).toBeInTheDocument();
    expect(within(screen.getByText('Request groups').closest('dl') ?? document.body).getByText('1')).toBeInTheDocument();
  });

  it('renders container run summary with supporting steps and history sections', async () => {
    useWorkspaceBatchRunStore.getState().finishBatchRunSuccess(collectionBatchExecution);
    const user = userEvent.setup();

    renderApp(
      <WorkspaceContextPanel
        activeTab={collectionOverviewTab}
        workspaceContext={workspaceContext}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Runs' }));

    expect(screen.getByRole('heading', { name: 'Run summary' })).toBeInTheDocument();
    expect(within(screen.getByText('Outcome').closest('dl') ?? document.body).getByText('Succeeded')).toBeInTheDocument();
    expect(within(screen.getByText('Run history').closest('dl') ?? document.body).getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ordered steps' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent run history' })).toBeInTheDocument();
    expect(screen.getByText(/Health check/i)).toBeInTheDocument();
  });

  it('renders inheritance comparison sections as supporting cards for request tabs', async () => {
    const user = userEvent.setup();

    renderApp(
      <WorkspaceContextPanel
        activeTab={requestTab}
        workspaceContext={workspaceContext}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Inheritance' }));

    expect(screen.getByRole('heading', { name: 'Inheritance snapshot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Variables' })).toBeInTheDocument();
    expect(document.querySelectorAll('.workspace-context-panel__comparison-grid .shared-detail-viewer-section--supporting')).toHaveLength(4);
  });

  it('keeps request-result tabs inside runs context for request tabs', () => {
    renderApp(
      <WorkspaceContextPanel
        activeTab={requestTab}
        workspaceContext={workspaceContext}
      />,
    );

    expect(screen.getByRole('tablist', { name: 'Context panel tabs' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Result panel tabs' })).toBeInTheDocument();
  });
});
