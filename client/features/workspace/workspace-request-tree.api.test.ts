import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  listWorkspaceRequestTree,
  runWorkspaceCollection,
  runWorkspaceRequestGroup,
} from '@client/features/workspace/workspace-request-tree.api';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('listWorkspaceRequestTree', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes legacy children arrays into childGroups and requests', async () => {
    const fetchMock = vi.fn(async () => createApiResponse({
      defaults: {
        collectionId: 'collection-a',
        requestGroupId: 'group-a',
        collectionName: 'Collection A',
        requestGroupName: 'Group A',
      },
      collections: [],
      requestGroups: [],
      tree: [
        {
          id: 'collection-node-a',
          kind: 'collection',
          collectionId: 'collection-a',
          name: 'Collection A',
          children: [
            {
              id: 'group-node-a',
              kind: 'request-group',
              collectionId: 'collection-a',
              requestGroupId: 'group-a',
              name: 'Group A',
              children: [
                {
                  id: 'request-node-a',
                  kind: 'request',
                  name: 'Health',
                  request: {
                    id: 'request-a',
                    name: 'Health',
                    methodLabel: 'GET',
                    summary: 'Health check endpoint',
                    collectionId: 'collection-a',
                    collectionName: 'Collection A',
                    requestGroupId: 'group-a',
                    requestGroupName: 'Group A',
                  },
                },
              ],
            },
          ],
        },
      ],
    }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await listWorkspaceRequestTree();

    expect(response.tree).toHaveLength(1);
    expect(response.tree[0]?.childGroups).toHaveLength(1);
    expect(response.tree[0]?.childGroups[0]?.requests).toHaveLength(1);
    expect(response.tree[0]?.childGroups[0]?.requests[0]?.request.id).toBe('request-a');
  });

  it('keeps canonical childGroups contract unchanged', async () => {
    const fetchMock = vi.fn(async () => createApiResponse({
      defaults: {
        collectionId: 'collection-a',
        requestGroupId: 'group-a',
        collectionName: 'Collection A',
        requestGroupName: 'Group A',
      },
      collections: [],
      requestGroups: [],
      tree: [
        {
          id: 'collection-node-a',
          kind: 'collection',
          collectionId: 'collection-a',
          name: 'Collection A',
          childGroups: [
            {
              id: 'group-node-a',
              kind: 'request-group',
              collectionId: 'collection-a',
              requestGroupId: 'group-a',
              name: 'Group A',
              childGroups: [],
              requests: [],
            },
          ],
        },
      ],
    }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await listWorkspaceRequestTree();

    expect(response.tree).toHaveLength(1);
    expect(response.tree[0]?.childGroups[0]?.requestGroupId).toBe('group-a');
  });
});

describe('batch run APIs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts run payload for collection batch runs when input is provided', async () => {
    const fetchMock = vi.fn(async () => createApiResponse({
      batchExecution: {
        batchExecutionId: 'batch-1',
        containerType: 'collection',
        containerId: 'collection-a',
        containerName: 'Collection A',
        executionOrder: 'depth-first-sequential',
        continuedAfterFailure: false,
        startedAt: '2026-03-26T00:00:00.000Z',
        completedAt: '2026-03-26T00:00:01.000Z',
        durationMs: 1000,
        aggregateOutcome: 'Succeeded',
        requestCount: 2,
        totalRuns: 2,
        succeededCount: 2,
        failedCount: 0,
        blockedCount: 0,
        timedOutCount: 0,
        steps: [],
      },
    }));

    vi.stubGlobal('fetch', fetchMock);

    await runWorkspaceCollection('collection-a', {
      executionOrder: 'depth-first-sequential',
      continueOnError: false,
      requestIds: ['request-1', 'request-2'],
      iterationCount: 2,
      environmentId: 'env-ci',
      dataFilePath: './data/ci.csv',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/collections/collection-a/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run: {
          executionOrder: 'depth-first-sequential',
          continueOnError: false,
          requestIds: ['request-1', 'request-2'],
          iterationCount: 2,
          environmentId: 'env-ci',
          dataFilePath: './data/ci.csv',
        },
      }),
    });
  });

  it('posts request-group batch runs without payload by default', async () => {
    const fetchMock = vi.fn(async () => createApiResponse({
      batchExecution: {
        batchExecutionId: 'batch-2',
        containerType: 'request-group',
        containerId: 'group-a',
        containerName: 'Group A',
        executionOrder: 'depth-first-sequential',
        continuedAfterFailure: true,
        startedAt: '2026-03-26T00:00:00.000Z',
        completedAt: '2026-03-26T00:00:01.000Z',
        durationMs: 1000,
        aggregateOutcome: 'Succeeded',
        requestCount: 1,
        totalRuns: 1,
        succeededCount: 1,
        failedCount: 0,
        blockedCount: 0,
        timedOutCount: 0,
        steps: [],
      },
    }));

    vi.stubGlobal('fetch', fetchMock);

    await runWorkspaceRequestGroup('group-a');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/request-groups/group-a/run', {
      method: 'POST',
    });
  });
});
