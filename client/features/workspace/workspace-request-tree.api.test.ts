import { afterEach, describe, expect, it, vi } from 'vitest';
import { listWorkspaceRequestTree } from '@client/features/workspace/workspace-request-tree.api';

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
