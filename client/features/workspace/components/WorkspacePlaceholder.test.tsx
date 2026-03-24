import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

async function openNewRequest(user: ReturnType<typeof userEvent.setup>) {
  const mainSurface = screen.getByLabelText('Main work surface');
  await user.click(within(mainSurface).getByRole('button', { name: 'New Request' }));
}

function getSavedResourceManager() {
  return screen.getByLabelText('Saved resource manager');
}

function getManagerSection(name: string) {
  const heading = within(getSavedResourceManager()).getByRole('heading', { name });
  const section = heading.closest('section');

  if (!(section instanceof HTMLElement)) {
    throw new Error(`Manager section ${name} was not found.`);
  }

  return within(section);
}

describe('Workspace request builder authoring shell', () => {


  it('auto-collapses the explorer after request selection and shows the inline selection breadcrumb when reopened', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const detailPanel = screen.getByLabelText('Contextual detail panel');

    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('http://localhost:5671/health');
    expect(within(detailPanel).getByRole('tablist', { name: 'Result panel tabs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    expect(screen.getByLabelText('Section explorer')).toBeInTheDocument();
    expect(within(explorer).getByText('Current selection: Saved Requests / General / Health check')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders method and url authoring controls for the active tab', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    await openNewRequest(user);
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Workspace remains the authoring surface/i)).toBeInTheDocument();

    expect(screen.getByLabelText('Request method')).toBeInTheDocument();
    expect(screen.getByLabelText('Request URL')).toBeInTheDocument();
  });

  it('keeps the explorer navigation-only and exposes saved-resource management in the main surface', () => {
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const manager = getSavedResourceManager();

    expect(within(explorer).queryByRole('button', { name: 'Create collection' })).not.toBeInTheDocument();
    expect(within(explorer).queryByRole('button', { name: 'Export Resources' })).not.toBeInTheDocument();
    expect(within(explorer).queryByRole('button', { name: 'Delete saved request' })).not.toBeInTheDocument();

    expect(within(manager).getByRole('heading', { name: 'Collections' })).toBeInTheDocument();
    expect(within(manager).getByRole('heading', { name: 'Request groups' })).toBeInTheDocument();
    expect(within(manager).getByRole('heading', { name: 'Saved request actions' })).toBeInTheDocument();
    expect(within(manager).getByRole('button', { name: 'Create collection' })).toBeInTheDocument();
    expect(within(manager).getByRole('button', { name: 'Export Resources' })).toBeInTheDocument();
  });

  it('seeds a new request with the current default environment at creation time', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({
          items: [
            {
              id: 'environment-local',
              workspaceId: 'local-workspace',
              name: 'Local API',
              description: 'Primary localhost defaults for development.',
              isDefault: true,
              variableCount: 3,
              enabledVariableCount: 3,
              secretVariableCount: 1,
              resolutionSummary: '3 variables are managed here, including 1 secret-backed entry.',
              createdAt: '2026-03-22T09:00:00.000Z',
              updatedAt: '2026-03-22T09:00:00.000Z',
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);

    await waitFor(() => expect(screen.getByLabelText('Request environment')).toHaveValue('environment-local'));
    expect(screen.getByText('Default environment')).toBeInTheDocument();
    expect(screen.getByText(/Local API contributes 3 enabled variable\(s\) to this request at run time/i)).toBeInTheDocument();
  });

  it('creates a request group from the main-surface manager and reflects it in the canonical collection tree', async () => {
    const user = userEvent.setup();
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/collections/collection-saved-requests/request-groups' && method === 'POST') {
        const payload = JSON.parse(String(init?.body ?? '{}')) as { requestGroup?: { name?: string } };
        const requestGroupName = payload.requestGroup?.name ?? 'Untitled group';
        const requestGroupId = `request-group-${requestGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        requestTreeResponse.requestGroups.push({
          id: requestGroupId,
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: requestGroupName,
          description: '',
        });
        requestTreeResponse.tree[0]?.children.push({
          id: `request-group-node-${requestGroupId}`,
          kind: 'request-group',
          collectionId: 'collection-saved-requests',
          requestGroupId,
          name: requestGroupName,
          description: '',
          children: [],
        });

        return createApiResponse({
          requestGroup: {
            id: requestGroupId,
            workspaceId: 'local-workspace',
            collectionId: 'collection-saved-requests',
            name: requestGroupName,
            description: '',
          },
        }, 201);
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const requestGroupSection = getManagerSection('Request groups');
    await within(explorer).findByText('Saved Requests');

    await user.type(screen.getByLabelText('Request group name'), 'Auth flows');
    await user.click(requestGroupSection.getByRole('button', { name: 'New group' }));

    expect(await within(explorer).findByText('Auth flows')).toBeInTheDocument();
    expect(await within(getSavedResourceManager()).findByText('Created request group Auth flows in the canonical saved tree.')).toBeInTheDocument();
  });

  it('creates a collection from the main-surface manager and reflects it in the canonical saved tree', async () => {
    const user = userEvent.setup();
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/workspaces/local-workspace/collections' && method === 'POST') {
        const payload = JSON.parse(String(init?.body ?? '{}')) as { collection?: { name?: string } };
        const collectionName = payload.collection?.name ?? 'New Collection';
        const collectionId = `collection-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        requestTreeResponse.collections.push({
          id: collectionId,
          workspaceId: 'local-workspace',
          name: collectionName,
          description: '',
        });
        requestTreeResponse.tree.push({
          id: `collection-node-${collectionId}`,
          kind: 'collection',
          collectionId,
          name: collectionName,
          description: '',
          children: [],
        });

        return createApiResponse({
          collection: {
            id: collectionId,
            workspaceId: 'local-workspace',
            name: collectionName,
            description: '',
          },
        }, 201);
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const collectionsSection = getManagerSection('Collections');
    await within(explorer).findByText('Saved Requests');

    await user.type(screen.getByLabelText('Collection name'), 'Team API');
    await user.click(collectionsSection.getByRole('button', { name: 'Create collection' }));

    expect(await within(explorer).findByText('Team API')).toBeInTheDocument();
    expect(await within(getSavedResourceManager()).findByText('Created collection Team API in the canonical saved tree.')).toBeInTheDocument();
  });

  it('renames a collection from the main-surface manager and updates the active draft placement copy', async () => {
    const user = userEvent.setup();
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
        {
          id: 'collection-team-api',
          workspaceId: 'local-workspace',
          name: 'Team API',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
        {
          id: 'request-group-team-requests',
          workspaceId: 'local-workspace',
          collectionId: 'collection-team-api',
          name: 'Team Requests',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
          ],
        },
        {
          id: 'collection-node-collection-team-api',
          kind: 'collection',
          collectionId: 'collection-team-api',
          name: 'Team API',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-team-requests',
              kind: 'request-group',
              collectionId: 'collection-team-api',
              requestGroupId: 'request-group-team-requests',
              name: 'Team Requests',
              description: '',
              children: [],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/collections/collection-team-api' && method === 'PATCH') {
        const payload = JSON.parse(String(init?.body ?? '{}')) as { collection?: { name?: string } };
        const nextName = payload.collection?.name ?? 'Team Platform';
        requestTreeResponse.collections[1]!.name = nextName;
        requestTreeResponse.tree[1]!.name = nextName;

        return createApiResponse({
          collection: {
            id: 'collection-team-api',
            workspaceId: 'local-workspace',
            name: nextName,
            description: '',
          },
        });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.selectOptions(screen.getByLabelText('Save collection'), 'collection-team-api');
    expect(screen.getByText('Request will save to Team API / Team Requests.')).toBeInTheDocument();

    const explorer = screen.getByLabelText('Section explorer');
    const collectionsSection = getManagerSection('Collections');
    await user.selectOptions(screen.getByLabelText('Manage collection'), 'collection-team-api');
    await user.clear(screen.getByLabelText('Collection name'));
    await user.type(screen.getByLabelText('Collection name'), 'Team Platform');
    await user.click(collectionsSection.getByRole('button', { name: 'Rename' }));

    await waitFor(() => expect(screen.getByText('Request will save to Team Platform / Team Requests.')).toBeInTheDocument());
    expect(await within(explorer).findByText('Team Platform')).toBeInTheDocument();
    expect(await within(getSavedResourceManager()).findByText('Renamed collection to Team Platform in the canonical saved tree.')).toBeInTheDocument();
  });

  it('deletes an empty collection from the main-surface manager and falls back the active draft placement to defaults', async () => {
    const user = userEvent.setup();
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
        {
          id: 'collection-temp',
          workspaceId: 'local-workspace',
          name: 'Temp Collection',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
          ],
        },
        {
          id: 'collection-node-collection-temp',
          kind: 'collection',
          collectionId: 'collection-temp',
          name: 'Temp Collection',
          description: '',
          children: [],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/collections/collection-temp' && method === 'DELETE') {
        requestTreeResponse.collections.splice(1, 1);
        requestTreeResponse.tree.splice(1, 1);
        return createApiResponse({ deletedCollectionId: 'collection-temp' });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.selectOptions(screen.getByLabelText('Save collection'), 'collection-temp');
    expect(screen.getByText('First save will create General in Temp Collection / General.')).toBeInTheDocument();
    expect(screen.getByLabelText('Save request group')).toBeDisabled();
    expect(screen.getByRole('option', { name: 'General (created on first save)' })).toBeInTheDocument();

    const explorer = screen.getByLabelText('Section explorer');
    const collectionsSection = getManagerSection('Collections');
    await user.selectOptions(screen.getByLabelText('Manage collection'), 'collection-temp');
    await user.click(collectionsSection.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByText('Request will save to Saved Requests / General.')).toBeInTheDocument());
    await waitFor(() => expect(within(explorer).queryByText('Temp Collection')).not.toBeInTheDocument());
    expect(await within(getSavedResourceManager()).findByText('Deleted collection Temp Collection from the canonical saved tree. Drafts that referenced it moved to the default save placement.')).toBeInTheDocument();
  });
  it('persists placeholder request-group naming when saving into an empty collection', async () => {
    const user = userEvent.setup();
    let savedPayload: Record<string, unknown> | null = null;
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
        {
          id: 'collection-temp',
          workspaceId: 'local-workspace',
          name: 'Temp Collection',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
          ],
        },
        {
          id: 'collection-node-collection-temp',
          kind: 'collection',
          collectionId: 'collection-temp',
          name: 'Temp Collection',
          description: '',
          children: [],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/requests' && method === 'POST') {
        const payload = JSON.parse(String(init?.body ?? '{}')) as { request?: Record<string, unknown> };
        savedPayload = payload.request ?? null;

        return createApiResponse({
          request: {
            id: 'request-temp-general',
            workspaceId: 'local-workspace',
            name: String(payload.request?.name ?? 'Untitled Request'),
            method: String(payload.request?.method ?? 'GET'),
            url: String(payload.request?.url ?? ''),
            selectedEnvironmentId: null,
            params: [],
            headers: [],
            bodyMode: 'none',
            bodyText: '',
            formBody: [],
            multipartBody: [],
            auth: {
              type: 'none',
              bearerToken: '',
              basicUsername: '',
              basicPassword: '',
              apiKeyName: '',
              apiKeyValue: '',
              apiKeyPlacement: 'header',
            },
            scripts: {
              activeStage: 'pre-request',
              preRequest: '',
              postResponse: '',
              tests: '',
            },
            collectionId: 'collection-temp',
            collectionName: 'Temp Collection',
            requestGroupId: 'request-group-general-temp',
            requestGroupName: 'General',

            summary: 'Saved draft in temp collection',
            createdAt: '2026-03-24T10:00:00.000Z',
            updatedAt: '2026-03-24T10:00:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.selectOptions(screen.getByLabelText('Save collection'), 'collection-temp');

    expect(screen.getByText('First save will create General in Temp Collection / General.')).toBeInTheDocument();
    expect(screen.getByLabelText('Save request group')).toBeDisabled();

    await user.type(screen.getByLabelText('Request URL'), 'http://localhost:5671/temp/health');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedPayload).not.toBeNull());
    expect(savedPayload).toMatchObject({
      collectionId: 'collection-temp',
      collectionName: 'Temp Collection',
      requestGroupName: 'General',

    });
    expect(savedPayload).not.toHaveProperty('requestGroupId');
  });
  it('renames a request group from the main-surface manager and updates the active draft placement copy', async () => {
    const user = userEvent.setup();
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
        {
          id: 'request-group-auth-flows',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'Auth flows',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
            {
              id: 'request-group-node-request-group-auth-flows',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-auth-flows',
              name: 'Auth flows',
              description: '',
              children: [],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/request-groups/request-group-auth-flows' && method === 'PATCH') {
        const payload = JSON.parse(String(init?.body ?? '{}')) as { requestGroup?: { name?: string } };
        const nextName = payload.requestGroup?.name ?? 'Authentication';
        requestTreeResponse.requestGroups[1]!.name = nextName;
        requestTreeResponse.tree[0]!.children[1]!.name = nextName;

        return createApiResponse({
          requestGroup: {
            id: 'request-group-auth-flows',
            workspaceId: 'local-workspace',
            collectionId: 'collection-saved-requests',
            name: nextName,
            description: '',
          },
        });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.selectOptions(screen.getByLabelText('Save request group'), 'request-group-auth-flows');
    expect(screen.getByText('Request will save to Saved Requests / Auth flows.')).toBeInTheDocument();

    const explorer = screen.getByLabelText('Section explorer');
    const requestGroupSection = getManagerSection('Request groups');
    await user.selectOptions(screen.getByLabelText('Manage request group'), 'request-group-auth-flows');
    await user.clear(screen.getByLabelText('Request group name'));
    await user.type(screen.getByLabelText('Request group name'), 'Authentication');
    await user.click(requestGroupSection.getByRole('button', { name: 'Rename' }));

    await waitFor(() => expect(screen.getByText('Request will save to Saved Requests / Authentication.')).toBeInTheDocument());
    expect(await within(explorer).findByText('Authentication')).toBeInTheDocument();
    expect(await within(getSavedResourceManager()).findByText('Renamed request group to Authentication in the canonical saved tree.')).toBeInTheDocument();
  });

  it('deletes an empty request group from the main-surface manager and falls back the active draft placement to defaults', async () => {
    const user = userEvent.setup();
    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
        {
          id: 'request-group-temp',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'Temp',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
            {
              id: 'request-group-node-request-group-temp',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-temp',
              name: 'Temp',
              description: '',
              children: [],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/request-groups/request-group-temp' && method === 'DELETE') {
        requestTreeResponse.requestGroups.splice(1, 1);
        requestTreeResponse.tree[0]!.children.splice(1, 1);
        return createApiResponse({ deletedRequestGroupId: 'request-group-temp' });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.selectOptions(screen.getByLabelText('Save request group'), 'request-group-temp');
    expect(screen.getByText('Request will save to Saved Requests / Temp.')).toBeInTheDocument();

    const explorer = screen.getByLabelText('Section explorer');
    const requestGroupSection = getManagerSection('Request groups');
    await user.selectOptions(screen.getByLabelText('Manage request group'), 'request-group-temp');
    await user.click(requestGroupSection.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByText('Request will save to Saved Requests / General.')).toBeInTheDocument());
    await waitFor(() => expect(within(explorer).queryByText('Temp')).not.toBeInTheDocument());
    expect(await within(getSavedResourceManager()).findByText('Deleted request group Temp from the canonical saved tree. Drafts that referenced it moved to the default save placement.')).toBeInTheDocument();
  });
  it('persists the selected collection and request group when saving a draft', async () => {
    const user = userEvent.setup();
    let savedPayload: Record<string, unknown> | null = null;

    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
        {
          id: 'request-group-auth-flows',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'Auth flows',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [],
            },
            {
              id: 'request-group-node-request-group-auth-flows',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-auth-flows',
              name: 'Auth flows',
              description: '',
              children: [],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/requests' && method === 'POST') {
        const payload = JSON.parse(String(init?.body ?? '{}')) as { request?: Record<string, unknown> };
        savedPayload = payload.request ?? null;

        return createApiResponse({
          request: {
            id: 'request-auth-flows',
            workspaceId: 'local-workspace',
            name: String(payload.request?.name ?? 'Untitled Request'),
            method: String(payload.request?.method ?? 'GET'),
            url: String(payload.request?.url ?? ''),
            selectedEnvironmentId: null,
            params: [],
            headers: [],
            bodyMode: 'none',
            bodyText: '',
            formBody: [],
            multipartBody: [],
            auth: {
              type: 'none',
              bearerToken: '',
              basicUsername: '',
              basicPassword: '',
              apiKeyName: '',
              apiKeyValue: '',
              apiKeyPlacement: 'header',
            },
            scripts: {
              activeStage: 'pre-request',
              preRequest: '',
              postResponse: '',
              tests: '',
            },
            collectionId: 'collection-saved-requests',
            collectionName: 'Saved Requests',
            requestGroupId: 'request-group-auth-flows',
            requestGroupName: 'Auth flows',

            summary: 'Saved draft in auth flows',
            createdAt: '2026-03-23T10:00:00.000Z',
            updatedAt: '2026-03-23T10:00:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);

    expect(screen.getByText('Request will save to Saved Requests / General.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Save request group'), 'request-group-auth-flows');
    expect(screen.getByText('Request will save to Saved Requests / Auth flows.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Request URL'), 'http://localhost:5671/auth/health');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedPayload).not.toBeNull());
    expect(savedPayload).toMatchObject({
      collectionId: 'collection-saved-requests',
      collectionName: 'Saved Requests',
      requestGroupId: 'request-group-auth-flows',
      requestGroupName: 'Auth flows',

    });
  });

  it('updates method and url draft values and shows a dirty indicator', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    await openNewRequest(user);

    const methodSelect = screen.getByLabelText('Request method');
    const urlInput = screen.getByLabelText('Request URL');

    await user.selectOptions(methodSelect, 'POST');
    await user.type(urlInput, 'https://api.example.com/users');

    expect(methodSelect).toHaveValue('POST');
    expect(urlInput).toHaveValue('https://api.example.com/users');
    expect(screen.getByLabelText('Untitled Request has unsaved changes')).toBeInTheDocument();
  });

  it('adds and removes params and headers rows', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);

    await user.click(within(mainSurface).getByRole('button', { name: 'Add param' }));
    expect(screen.getByLabelText('Param row 1 key')).toBeInTheDocument();

    await user.click(within(mainSurface).getByRole('button', { name: 'Headers' }));
    await user.click(within(mainSurface).getByRole('button', { name: 'Add header' }));
    expect(screen.getByLabelText('Header row 1 key')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove header row 1' }));
    expect(screen.queryByLabelText('Header row 1 key')).not.toBeInTheDocument();

    await user.click(within(mainSurface).getByRole('button', { name: 'Params' }));
    await user.click(screen.getByRole('button', { name: 'Remove param row 1' }));
    expect(screen.queryByLabelText('Param row 1 key')).not.toBeInTheDocument();
  });

  it('switches body and auth subtabs with real authoring controls', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);

    await user.click(within(mainSurface).getByRole('button', { name: 'Body' }));
    expect(screen.getByLabelText('Body mode')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Body mode'), 'json');
    expect(screen.getByLabelText('Body content (JSON)')).toBeInTheDocument();

    await user.click(within(mainSurface).getByRole('button', { name: 'Auth' }));
    expect(screen.getByLabelText('Auth type')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Auth type'), 'bearer');
    expect(screen.getByLabelText('Bearer token')).toBeInTheDocument();
  });

  it('keeps draft state independent across tabs', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request URL'), 'https://draft-one.example');

    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('http://localhost:5671/health');

    await user.selectOptions(screen.getByLabelText('Request method'), 'PATCH');
    await user.clear(screen.getByLabelText('Request name'));
    await user.type(screen.getByLabelText('Request name'), 'Health patch');

    await user.click(within(mainSurface).getByRole('tab', { name: /Untitled Request/i }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('https://draft-one.example');
    expect(screen.getByLabelText('Request method')).toHaveValue('GET');

    await user.click(within(mainSurface).getByRole('tab', { name: /Health patch/i }));
    expect(screen.getByLabelText('Request method')).toHaveValue('PATCH');
    expect(screen.getByLabelText('Request name')).toHaveValue('Health patch');
  });

  it('loads a stage-aware Scripts editor lazily and keeps stage content independent', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');
    const detailPanel = screen.getByLabelText('Contextual detail panel');

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request URL'), 'https://scripts.example/resource');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));

    expect(await screen.findByTestId('script-editor-loading')).toBeInTheDocument();
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();

    const scriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.type(screen.getByLabelText('Pre-request script'), "request.headers.set('x-trace-id', 'draft-local');");

    await user.click(within(scriptStages).getByRole('tab', { name: 'Post-response' }));
    expect(screen.getByLabelText('Post-response script')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Post-response script'), "console.warn('review response');");

    await user.click(within(scriptStages).getByRole('tab', { name: 'Tests' }));
    expect(screen.getByLabelText('Tests script')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tests script'), 'assert(response.status === 200);');

    await user.click(within(scriptStages).getByRole('tab', { name: 'Pre-request' }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-trace-id', 'draft-local');");

    await user.click(within(scriptStages).getByRole('tab', { name: 'Post-response' }));
    expect(screen.getByLabelText('Post-response script')).toHaveValue("console.warn('review response');");

    await user.click(within(mainSurface).getByRole('button', { name: 'Params' }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('https://scripts.example/resource');

    expect(within(detailPanel).getByRole('tablist', { name: 'Result panel tabs' })).toBeInTheDocument();
    await user.click(within(detailPanel).getByRole('tab', { name: 'Console' }));
    expect(within(detailPanel).getByRole('heading', { name: 'Console summary' })).toBeInTheDocument();
    expect(within(detailPanel).queryByLabelText('Pre-request script')).not.toBeInTheDocument();
  }, 10000);

  it('keeps stage-specific script drafts across workspace tab switches', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await screen.findByLabelText('Pre-request script');

    const firstTabScriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.click(within(firstTabScriptStages).getByRole('tab', { name: 'Tests' }));
    await user.type(screen.getByLabelText('Tests script'), 'assert(response.status === 200);');

    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue('');
    await user.type(screen.getByLabelText('Pre-request script'), "request.headers.set('x-health-check', '1');");

    const tabStrip = screen.getByRole('tablist', { name: 'Request tab strip' });
    await user.click(within(tabStrip).getByRole('tab', { name: /Untitled Request/i }));
    expect(screen.getByLabelText('Tests script')).toHaveValue('assert(response.status === 200);');

    await user.click(within(tabStrip).getByRole('tab', { name: /Health check/i }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-health-check', '1');");
  });

  it('prefers persisted saved requests over fallback fixture content and keeps canonical ordering stable', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({
          items: [
            {
              id: 'request-alpha-persisted',
              workspaceId: 'local-workspace',
              name: 'Alpha persisted',
              method: 'GET',
              url: 'http://localhost:5671/alpha',
              params: [],
              headers: [],
              bodyMode: 'none',
              bodyText: '',
              formBody: [],
              multipartBody: [],
              auth: {
                type: 'none',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                apiKeyName: '',
                apiKeyValue: '',
                apiKeyPlacement: 'header',
              },
              scripts: {
                activeStage: 'pre-request',
                preRequest: '',
                postResponse: '',
                tests: '',
              },
              summary: 'Persisted alpha request',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T09:00:00.000Z',
              updatedAt: '2026-03-20T09:30:00.000Z',
            },
            {
              id: 'request-zeta-persisted',
              workspaceId: 'local-workspace',
              name: 'Zeta persisted',
              method: 'POST',
              url: 'http://localhost:5671/zeta',
              params: [],
              headers: [],
              bodyMode: 'json',
              bodyText: '{"ok":true}',
              formBody: [],
              multipartBody: [],
              auth: {
                type: 'none',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                apiKeyName: '',
                apiKeyValue: '',
                apiKeyPlacement: 'header',
              },
              scripts: {
                activeStage: 'pre-request',
                preRequest: '',
                postResponse: '',
                tests: '',
              },
              summary: 'Persisted zeta request',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T08:00:00.000Z',
              updatedAt: '2026-03-20T10:30:00.000Z',
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await within(explorer).findByRole('button', { name: 'Open Zeta persisted' });
    await waitFor(() => expect(within(explorer).queryByRole('button', { name: 'Open Health check' })).not.toBeInTheDocument());
    const persistedButtons = within(explorer).getAllByRole('button', { name: /^Open / });

    expect(persistedButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open Zeta persisted',
      'Open Alpha persisted',
    ]);

    await user.click(persistedButtons[0]!);

    expect(await screen.findByLabelText('Request name')).toHaveValue('Zeta persisted');
    expect(screen.getByText('Saved request')).toBeInTheDocument();
  });

  it('renders scripts stage copy inside replay drafts without breaking shell composition', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await user.click(await screen.findByRole('button', { name: 'Open Replay Draft' }));
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getAllByText('Opened from history', { selector: '.workspace-chip--replay' }).length).toBeGreaterThan(0);

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();
    expect(screen.getByText('Deferred in later slices')).toBeInTheDocument();
  });
  it('exports authored resource bundles without runtime observation artifacts', async () => {
    const user = userEvent.setup();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:authored-resource-bundle');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/resource-bundle' && method === 'GET') {
        return createApiResponse({
          bundle: {
            schemaVersion: 3,
            resourceKind: 'local-request-inspector-authored-resource-bundle',
            exportedAt: '2026-03-21T12:00:00.000Z',
            workspaceId: 'local-workspace',
            collections: [],
            requestGroups: [],
            requests: [
              {
                id: 'request-exported-1',
                workspaceId: 'local-workspace',
                name: 'Exported request',
                method: 'GET',
                url: 'http://localhost:5671/exported',
                params: [],
                headers: [],
                bodyMode: 'none',
                bodyText: '',
                formBody: [],
                multipartBody: [],
                auth: {
                  type: 'none',
                  bearerToken: '',
                  basicUsername: '',
                  basicPassword: '',
                  apiKeyName: '',
                  apiKeyValue: '',
                  apiKeyPlacement: 'header',
                },
                scripts: {
                  activeStage: 'pre-request',
                  preRequest: '',
                  postResponse: '',
                  tests: '',
                },
                summary: 'Exported request definition',
                collectionName: 'Saved Requests',
                createdAt: '2026-03-21T10:00:00.000Z',
                updatedAt: '2026-03-21T11:00:00.000Z',
              },
            ],
            mockRules: [
              {
                id: 'mock-rule-exported-1',
                workspaceId: 'local-workspace',
                name: 'Exported rule',
                enabled: true,
                priority: 500,
                methodMode: 'exact',
                method: 'GET',
                pathMode: 'exact',
                pathValue: '/exported',
                queryMatchers: [],
                headerMatchers: [],
                bodyMatcherMode: 'none',
                bodyMatcherValue: '',
                responseStatusCode: 200,
                responseHeaders: [],
                responseBody: '{"ok":true}',
                fixedDelayMs: 0,
                createdAt: '2026-03-21T10:00:00.000Z',
                updatedAt: '2026-03-21T11:00:00.000Z',
                ruleState: 'Enabled',
                matcherSummary: 'Method exact: GET with Path exact: /exported with No query matcher with No header matcher with No body matcher',
                responseSummary: 'Static 200 response.',
                methodSummary: 'Method exact: GET',
                pathSummary: 'Path exact: /exported',
                querySummary: 'No query matcher',
                headerSummary: 'No header matcher',
                bodySummary: 'No body matcher',
                responseStatusSummary: '200 OK',
                responseHeadersSummary: 'No static response headers',
                responseBodyPreview: '{"ok":true}',
                fixedDelayLabel: 'No fixed delay',
                diagnosticsSummary: 'Rules are evaluated by enabled state first.',
                deferredSummary: 'Advanced diagnostics remain deferred.',
                sourceLabel: 'Persisted workspace rule',
              },
            ],
            scripts: [
              {
                id: 'saved-script-exported-trace-id',
                workspaceId: 'local-workspace',
                name: 'Trace ID helper',
                description: 'Adds a trace header before transport starts.',
                scriptType: 'pre-request',
                sourceCode: 'request.setHeader("x-trace-id", "abc-123");',
                createdAt: '2026-03-21T10:00:00.000Z',
                updatedAt: '2026-03-21T11:00:00.000Z',
                sourcePreview: 'request.setHeader("x-trace-id", "abc-123");',
                capabilitySummary: 'Pre-request scripts can use bounded request mutation helpers before transport is sent.',
                deferredSummary: 'Request-stage attachment, live shared references, and Monaco-class editor expansion remain deferred.',
                templateSummary: 'Created directly in the scripts library.',
                sourceLabel: 'Persisted workspace script',
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const manager = getSavedResourceManager();
    await user.click(within(manager).getByRole('button', { name: 'Export Resources' }));

    expect(await within(manager).findByText(/Exported 1 saved request definition, 1 mock rule, and 1 saved script from the authored resource lane/i)).toBeInTheDocument();
    expect(await within(manager).findByText('Saved requests in bundle: 1')).toBeInTheDocument();
    expect(within(manager).getByText('Mock rules in bundle: 1')).toBeInTheDocument();
    expect(within(manager).getByText('Saved scripts in bundle: 1')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/workspaces/local-workspace/resource-bundle');
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(linkClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:authored-resource-bundle');

    const exportedBlob = createObjectURLSpy.mock.calls[0]?.[0];
    expect(exportedBlob).toBeInstanceOf(Blob);

    if (!(exportedBlob instanceof Blob)) {
      throw new Error('Exported bundle did not create a Blob.');
    }

    const exportedText = await exportedBlob.text();
    expect(exportedText).toContain('"requests"');
    expect(exportedText).toContain('"mockRules"');
    expect(exportedText).toContain('"scripts"');
    expect(exportedText).toContain('"Trace ID helper"');
    expect(exportedText).not.toContain('executionHistories');
    expect(exportedText).not.toContain('capturedRequests');
  });

  it('previews authored resources before confirm and then refreshes explorer plus mocks lists after import', async () => {
    const user = userEvent.setup();
    const persistedRequests = [
      {
        id: 'request-existing-health',
        workspaceId: 'local-workspace',
        name: 'Health check',
        method: 'GET',
        url: 'http://localhost:5671/health',
        params: [],
        headers: [],
        bodyMode: 'none',
        bodyText: '',
        formBody: [],
        multipartBody: [],
        auth: {
          type: 'none',
          bearerToken: '',
          basicUsername: '',
          basicPassword: '',
          apiKeyName: '',
          apiKeyValue: '',
          apiKeyPlacement: 'header',
        },
        scripts: {
          activeStage: 'pre-request',
          preRequest: '',
          postResponse: '',
          tests: '',
        },
        summary: 'Existing health request',
        collectionName: 'Saved Requests',
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
      },
    ];
    const persistedMockRules = [
      {
        id: 'mock-rule-existing-latency',
        workspaceId: 'local-workspace',
        name: 'Latency guard',
        enabled: true,
        priority: 300,
        methodMode: 'exact',
        method: 'GET',
        pathMode: 'exact',
        pathValue: '/health',
        queryMatchers: [],
        headerMatchers: [],
        bodyMatcherMode: 'none',
        bodyMatcherValue: '',
        responseStatusCode: 200,
        responseHeaders: [],
        responseBody: '{"ok":true}',
        fixedDelayMs: 0,
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
        ruleState: 'Enabled',
        matcherSummary: 'Method exact: GET with Path exact: /health with No query matcher with No header matcher with No body matcher',
        responseSummary: 'Static 200 response.',
        methodSummary: 'Method exact: GET',
        pathSummary: 'Path exact: /health',
        querySummary: 'No query matcher',
        headerSummary: 'No header matcher',
        bodySummary: 'No body matcher',
        responseStatusSummary: '200 OK',
        responseHeadersSummary: 'No static response headers',
        responseBodyPreview: '{"ok":true}',
        fixedDelayLabel: 'No fixed delay',
        diagnosticsSummary: 'Rules are evaluated by enabled state first.',
        deferredSummary: 'Advanced diagnostics remain deferred.',
        sourceLabel: 'Persisted workspace rule',
      },
    ];
    const persistedScripts = [
      {
        id: 'saved-script-existing-trace-id',
        workspaceId: 'local-workspace',
        name: 'Trace ID helper',
        description: 'Adds a trace header before transport starts.',
        scriptType: 'pre-request',
        sourceCode: 'request.setHeader("x-trace-id", "existing-trace");',
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
        sourcePreview: 'request.setHeader("x-trace-id", "existing-trace");',
        capabilitySummary: 'Pre-request scripts can use bounded request mutation helpers before transport is sent.',
        deferredSummary: 'Request-stage attachment, live shared references, and Monaco-class editor expansion remain deferred.',
        templateSummary: 'Created directly in the scripts library.',
        sourceLabel: 'Persisted workspace script',
      },
    ];
    let previewRequestCount = 0;
    let importRequestCount = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: persistedRequests });
      }

      if (url === '/api/workspaces/local-workspace/mock-rules' && method === 'GET') {
        return createApiResponse({ items: persistedMockRules });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && method === 'GET') {
        return createApiResponse({ items: persistedScripts });
      }

      if (url === '/api/script-templates' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/resource-bundle/import-preview' && method === 'POST') {
        previewRequestCount += 1;

        return createApiResponse({
          preview: {
            rejected: [],
            summary: {
              acceptedCount: 3,
              rejectedCount: 0,
              createdCollectionCount: 0,
              createdRequestGroupCount: 0,
              createdRequestCount: 1,
              createdMockRuleCount: 1,
              createdScriptCount: 1,
              renamedCount: 3,
              importedNamesPreview: [
                'Health check (Imported)',
                'Latency guard (Imported)',
                'Trace ID helper (Imported)',
              ],
              rejectedReasonSummary: [],
              duplicateIdentityPolicy: 'new_identity',
            },
          },
        });
      }

      if (url === '/api/workspaces/local-workspace/resource-bundle/import' && method === 'POST') {
        importRequestCount += 1;
        const payload = JSON.parse(String(init?.body ?? '{}')) as { bundleText: string };
        const bundle = JSON.parse(payload.bundleText) as {
          requests: Array<{ id: string; name: string; method: string; url: string }>;
          mockRules: Array<{ id: string; name: string; priority: number }>;
          scripts: Array<{ id: string; name: string; scriptType: string; sourceCode: string }>;
        };

        const importedRequest: (typeof persistedRequests)[number] = {
          ...persistedRequests[0]!,
          ...bundle.requests[0]!,
          id: 'request-imported-health',
          name: 'Health check (Imported)',
          summary: 'Imported request definition',
          createdAt: '2026-03-21T12:00:00.000Z',
          updatedAt: '2026-03-21T12:00:00.000Z',
        };
        const importedRule: (typeof persistedMockRules)[number] = {
          ...persistedMockRules[0]!,
          ...bundle.mockRules[0]!,
          id: 'mock-rule-imported-latency',
          name: 'Latency guard (Imported)',
          createdAt: '2026-03-21T12:00:00.000Z',
          updatedAt: '2026-03-21T12:00:00.000Z',
        };
        const importedScript: (typeof persistedScripts)[number] = {
          ...persistedScripts[0]!,
          ...bundle.scripts[0]!,
          id: 'saved-script-imported-trace-id',
          name: 'Trace ID helper (Imported)',
          createdAt: '2026-03-21T12:00:00.000Z',
          updatedAt: '2026-03-21T12:00:00.000Z',
          sourcePreview: 'request.setHeader("x-trace-id", "imported-trace");',
        };

        persistedRequests.push(importedRequest);
        persistedMockRules.push(importedRule);
        persistedScripts.push(importedScript);

        return createApiResponse({
          result: {
            acceptedCollections: [],
            acceptedRequestGroups: [],
            acceptedRequests: [importedRequest],
            acceptedMockRules: [importedRule],
            acceptedScripts: [importedScript],
            rejected: [],
            summary: {
              acceptedCount: 3,
              rejectedCount: 0,
              createdCollectionCount: 0,
              createdRequestGroupCount: 0,
              createdRequestCount: 1,
              createdMockRuleCount: 1,
              createdScriptCount: 1,
              renamedCount: 3,
              importedNamesPreview: [
                'Health check (Imported)',
                'Latency guard (Imported)',
                'Trace ID helper (Imported)',
              ],
              rejectedReasonSummary: [],
              duplicateIdentityPolicy: 'new_identity',
            },
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const manager = getSavedResourceManager();
    expect(await within(explorer).findByRole('button', { name: 'Open Health check' })).toBeInTheDocument();

    const importFile = new File([
      JSON.stringify({
        schemaVersion: 3,
        resourceKind: 'local-request-inspector-authored-resource-bundle',
        exportedAt: '2026-03-21T11:59:00.000Z',
        workspaceId: 'other-workspace',
        collections: [],
        requestGroups: [],
        requests: [
          {
            id: 'request-original-health',
            workspaceId: 'other-workspace',
            name: 'Health check',
            method: 'GET',
            url: 'http://localhost:5671/health',
            params: [],
            headers: [],
            bodyMode: 'none',
            bodyText: '',
            formBody: [],
            multipartBody: [],
            auth: {
              type: 'none',
              bearerToken: '',
              basicUsername: '',
              basicPassword: '',
              apiKeyName: '',
              apiKeyValue: '',
              apiKeyPlacement: 'header',
            },
            scripts: {
              activeStage: 'pre-request',
              preRequest: '',
              postResponse: '',
              tests: '',
            },
            summary: 'Imported health request',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-21T11:00:00.000Z',
            updatedAt: '2026-03-21T11:00:00.000Z',
          },
        ],
        mockRules: [
          {
            id: 'mock-rule-original-latency',
            workspaceId: 'other-workspace',
            name: 'Latency guard',
            enabled: true,
            priority: 300,
            methodMode: 'exact',
            method: 'GET',
            pathMode: 'exact',
            pathValue: '/health',
            queryMatchers: [],
            headerMatchers: [],
            bodyMatcherMode: 'none',
            bodyMatcherValue: '',
            responseStatusCode: 200,
            responseHeaders: [],
            responseBody: '{"ok":true}',
            fixedDelayMs: 0,
            createdAt: '2026-03-21T11:00:00.000Z',
            updatedAt: '2026-03-21T11:00:00.000Z',
            ruleState: 'Enabled',
            matcherSummary: 'Method exact: GET with Path exact: /health with No query matcher with No header matcher with No body matcher',
            responseSummary: 'Static 200 response.',
            methodSummary: 'Method exact: GET',
            pathSummary: 'Path exact: /health',
            querySummary: 'No query matcher',
            headerSummary: 'No header matcher',
            bodySummary: 'No body matcher',
            responseStatusSummary: '200 OK',
            responseHeadersSummary: 'No static response headers',
            responseBodyPreview: '{"ok":true}',
            fixedDelayLabel: 'No fixed delay',
            diagnosticsSummary: 'Rules are evaluated by enabled state first.',
            deferredSummary: 'Advanced diagnostics remain deferred.',
            sourceLabel: 'Persisted workspace rule',
          },
        ],
        scripts: [
          {
            id: 'saved-script-original-trace-id',
            workspaceId: 'other-workspace',
            name: 'Trace ID helper',
            description: 'Adds a trace header before transport starts.',
            scriptType: 'pre-request',
            sourceCode: 'request.setHeader("x-trace-id", "imported-trace");',
            createdAt: '2026-03-21T11:00:00.000Z',
            updatedAt: '2026-03-21T11:00:00.000Z',
            sourcePreview: 'request.setHeader("x-trace-id", "imported-trace");',
            capabilitySummary: 'Pre-request scripts can use bounded request mutation helpers before transport is sent.',
            deferredSummary: 'Request-stage attachment, live shared references, and Monaco-class editor expansion remain deferred.',
            templateSummary: 'Created directly in the scripts library.',
            sourceLabel: 'Persisted workspace script',
          },
        ],
      }),
    ], 'authored-resources.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('Import authored resources'), importFile);

    expect(await within(manager).findByText(/Preview ready for authored-resources\.json/i)).toBeInTheDocument();
    expect(within(manager).getByText('Created requests: 1')).toBeInTheDocument();
    expect(within(manager).getByText('Created mock rules: 1')).toBeInTheDocument();
    expect(within(manager).getByText('Created saved scripts: 1')).toBeInTheDocument();
    expect(within(manager).getByText('Renamed on import: 3')).toBeInTheDocument();
    expect(within(manager).getByText(/Imported preview: Health check \(Imported\), Latency guard \(Imported\), Trace ID helper \(Imported\)/i)).toBeInTheDocument();
    expect(within(manager).getByRole('button', { name: 'Confirm Import' })).toBeInTheDocument();
    expect(previewRequestCount).toBe(1);
    expect(importRequestCount).toBe(0);
    expect(within(explorer).queryByRole('button', { name: 'Open Health check (Imported)' })).not.toBeInTheDocument();

    await user.click(within(manager).getByRole('button', { name: 'Confirm Import' }));

    expect(await within(manager).findByText(/Imported resources received new identities so existing saved resources were not overwritten/i)).toBeInTheDocument();
    expect(importRequestCount).toBe(1);
    expect(await within(explorer).findByRole('button', { name: 'Open Health check (Imported)' })).toBeInTheDocument();
    expect(within(explorer).getByRole('button', { name: 'Open Health check' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /mocks/i }));
    expect(await screen.findByRole('button', { name: 'Open mock rule Latency guard (Imported)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open mock rule Latency guard' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /scripts/i }));
    expect(await screen.findByRole('button', { name: 'Open script Trace ID helper (Imported)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open script Trace ID helper' })).toBeInTheDocument();
  });

  it('cancels an authored-resource import preview without writing any resources', async () => {
    const user = userEvent.setup();
    const persistedRequests = [
      {
        id: 'request-existing-health',
        workspaceId: 'local-workspace',
        name: 'Health check',
        method: 'GET',
        url: 'http://localhost:5671/health',
        params: [],
        headers: [],
        bodyMode: 'none',
        bodyText: '',
        formBody: [],
        multipartBody: [],
        auth: {
          type: 'none',
          bearerToken: '',
          basicUsername: '',
          basicPassword: '',
          apiKeyName: '',
          apiKeyValue: '',
          apiKeyPlacement: 'header',
        },
        scripts: {
          activeStage: 'pre-request',
          preRequest: '',
          postResponse: '',
          tests: '',
        },
        summary: 'Existing health request',
        collectionName: 'Saved Requests',
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
      },
    ];
    const persistedMockRules = [
      {
        id: 'mock-rule-existing-latency',
        workspaceId: 'local-workspace',
        name: 'Latency guard',
        enabled: true,
        priority: 300,
        methodMode: 'exact',
        method: 'GET',
        pathMode: 'exact',
        pathValue: '/health',
        queryMatchers: [],
        headerMatchers: [],
        bodyMatcherMode: 'none',
        bodyMatcherValue: '',
        responseStatusCode: 200,
        responseHeaders: [],
        responseBody: '{"ok":true}',
        fixedDelayMs: 0,
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
        ruleState: 'Enabled',
        matcherSummary: 'Method exact: GET with Path exact: /health with No query matcher with No header matcher with No body matcher',
        responseSummary: 'Static 200 response.',
        methodSummary: 'Method exact: GET',
        pathSummary: 'Path exact: /health',
        querySummary: 'No query matcher',
        headerSummary: 'No header matcher',
        bodySummary: 'No body matcher',
        responseStatusSummary: '200 OK',
        responseHeadersSummary: 'No static response headers',
        responseBodyPreview: '{"ok":true}',
        fixedDelayLabel: 'No fixed delay',
        diagnosticsSummary: 'Rules are evaluated by enabled state first.',
        deferredSummary: 'Advanced diagnostics remain deferred.',
        sourceLabel: 'Persisted workspace rule',
      },
    ];
    const persistedScripts = [
      {
        id: 'saved-script-existing-trace-id',
        workspaceId: 'local-workspace',
        name: 'Trace ID helper',
        description: 'Adds a trace header before transport starts.',
        scriptType: 'pre-request',
        sourceCode: 'request.setHeader("x-trace-id", "existing-trace");',
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
        sourcePreview: 'request.setHeader("x-trace-id", "existing-trace");',
        capabilitySummary: 'Pre-request scripts can use bounded request mutation helpers before transport is sent.',
        deferredSummary: 'Request-stage attachment, live shared references, and Monaco-class editor expansion remain deferred.',
        templateSummary: 'Created directly in the scripts library.',
        sourceLabel: 'Persisted workspace script',
      },
    ];
    let importRequestCount = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: persistedRequests });
      }

      if (url === '/api/workspaces/local-workspace/mock-rules' && method === 'GET') {
        return createApiResponse({ items: persistedMockRules });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && method === 'GET') {
        return createApiResponse({ items: persistedScripts });
      }

      if (url === '/api/workspaces/local-workspace/resource-bundle/import-preview' && method === 'POST') {
        return createApiResponse({
          preview: {
            rejected: [],
            summary: {
              acceptedCount: 3,
              rejectedCount: 0,
              createdCollectionCount: 0,
              createdRequestGroupCount: 0,
              createdRequestCount: 1,
              createdMockRuleCount: 1,
              createdScriptCount: 1,
              renamedCount: 3,
              importedNamesPreview: [
                'Health check (Imported)',
                'Latency guard (Imported)',
                'Trace ID helper (Imported)',
              ],
              rejectedReasonSummary: [],
              duplicateIdentityPolicy: 'new_identity',
            },
          },
        });
      }

      if (url === '/api/workspaces/local-workspace/resource-bundle/import' && method === 'POST') {
        importRequestCount += 1;
        throw new Error('Import should not run when preview is cancelled.');
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const manager = getSavedResourceManager();
    expect(await within(explorer).findByRole('button', { name: 'Open Health check' })).toBeInTheDocument();

    const importFile = new File([JSON.stringify({
      schemaVersion: 3,
      resourceKind: 'local-request-inspector-authored-resource-bundle',
      exportedAt: '2026-03-21T11:59:00.000Z',
      workspaceId: 'other-workspace',
      requests: [{ id: 'request-original-health', name: 'Health check' }],
      mockRules: [{ id: 'mock-rule-original-latency', name: 'Latency guard' }],
      scripts: [{ id: 'saved-script-original-trace-id', name: 'Trace ID helper' }],
    })], 'authored-resources.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('Import authored resources'), importFile);

    expect(await within(manager).findByRole('button', { name: 'Confirm Import' })).toBeInTheDocument();
    await user.click(within(manager).getByRole('button', { name: 'Cancel Preview' }));

    expect(await within(manager).findByText('Import preview cleared. No authored resources were written.')).toBeInTheDocument();
    expect(importRequestCount).toBe(0);
    expect(within(manager).queryByRole('button', { name: 'Confirm Import' })).not.toBeInTheDocument();
    expect(within(explorer).queryByRole('button', { name: 'Open Health check (Imported)' })).not.toBeInTheDocument();
  });

  it('exports a single persisted request bundle without runtime observation artifacts', async () => {
    const user = userEvent.setup();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:single-request-bundle');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({
          items: [
            {
              id: 'request-health-persisted',
              workspaceId: 'local-workspace',
              name: 'Health check',
              method: 'GET',
              url: 'http://localhost:5671/health',
              params: [],
              headers: [],
              bodyMode: 'none',
              bodyText: '',
              formBody: [],
              multipartBody: [],
              auth: {
                type: 'none',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                apiKeyName: '',
                apiKeyValue: '',
                apiKeyPlacement: 'header',
              },
              scripts: {
                activeStage: 'pre-request',
                preRequest: '',
                postResponse: '',
                tests: '',
              },
              summary: 'Saved health request',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T09:00:00.000Z',
              updatedAt: '2026-03-20T09:30:00.000Z',
            },
          ],
        });
      }

      if (url === '/api/requests/request-health-persisted/resource-bundle' && method === 'GET') {
        return createApiResponse({
          bundle: {
            schemaVersion: 3,
            resourceKind: 'local-request-inspector-authored-resource-bundle',
            exportedAt: '2026-03-21T12:00:00.000Z',
            workspaceId: 'local-workspace',
            collections: [],
            requestGroups: [],
            requests: [
              {
                id: 'request-health-persisted',
                workspaceId: 'local-workspace',
                name: 'Health check',
                method: 'GET',
                url: 'http://localhost:5671/health',
                params: [],
                headers: [],
                bodyMode: 'none',
                bodyText: '',
                formBody: [],
                multipartBody: [],
                auth: {
                  type: 'none',
                  bearerToken: '',
                  basicUsername: '',
                  basicPassword: '',
                  apiKeyName: '',
                  apiKeyValue: '',
                  apiKeyPlacement: 'header',
                },
                scripts: {
                  activeStage: 'pre-request',
                  preRequest: '',
                  postResponse: '',
                  tests: '',
                },
                summary: 'Saved health request',
                collectionName: 'Saved Requests',
                createdAt: '2026-03-20T09:00:00.000Z',
                updatedAt: '2026-03-20T09:30:00.000Z',
              },
            ],
            mockRules: [],
            scripts: [],
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const requestSection = getManagerSection('Saved request actions');
    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    await user.click(requestSection.getByRole('button', { name: 'Export saved request' }));

    expect(await within(getSavedResourceManager()).findByText(/Exported saved request Health check from the authored resource lane/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/requests/request-health-persisted/resource-bundle');
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(linkClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:single-request-bundle');

    const exportedBlob = createObjectURLSpy.mock.calls[0]?.[0];
    expect(exportedBlob).toBeInstanceOf(Blob);

    if (!(exportedBlob instanceof Blob)) {
      throw new Error('Single-request export did not create a Blob.');
    }

    const exportedText = await exportedBlob.text();
    expect(exportedText).toContain('"requests"');
    expect(exportedText).toContain('"Health check"');
    expect(exportedText).not.toContain('"mockRules":[{');
    expect(exportedText).not.toContain('executionHistories');
    expect(exportedText).not.toContain('capturedRequests');
  });
  it('keeps deleted saved-request tabs open as detached drafts and limits manager actions to resave guidance', async () => {
    const user = userEvent.setup();
    const persistedRequests = [
      {
        id: 'request-health-persisted',
        workspaceId: 'local-workspace',
        name: 'Health check',
        method: 'GET',
        url: 'http://localhost:5671/health',
        params: [],
        headers: [],
        bodyMode: 'none',
        bodyText: '',
        formBody: [],
        multipartBody: [],
        auth: {
          type: 'none',
          bearerToken: '',
          basicUsername: '',
          basicPassword: '',
          apiKeyName: '',
          apiKeyValue: '',
          apiKeyPlacement: 'header',
        },
        scripts: {
          activeStage: 'pre-request',
          preRequest: '',
          postResponse: '',
          tests: '',
        },
        summary: 'Saved health request',
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-general',
        requestGroupName: 'General',
        createdAt: '2026-03-20T09:00:00.000Z',
        updatedAt: '2026-03-20T09:30:00.000Z',
      },
    ];

    const requestTreeResponse = {
      defaults: {
        collectionId: 'collection-saved-requests',
        requestGroupId: 'request-group-general',
        collectionName: 'Saved Requests',
        requestGroupName: 'General',
      },
      collections: [
        {
          id: 'collection-saved-requests',
          workspaceId: 'local-workspace',
          name: 'Saved Requests',
          description: '',
        },
      ],
      requestGroups: [
        {
          id: 'request-group-general',
          workspaceId: 'local-workspace',
          collectionId: 'collection-saved-requests',
          name: 'General',
          description: '',
        },
      ],
      tree: [
        {
          id: 'collection-node-collection-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          description: '',
          children: [
            {
              id: 'request-group-node-request-group-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'request-group-general',
              name: 'General',
              description: '',
              children: [
                {
                  id: 'request-node-request-health-persisted',
                  kind: 'request',
                  name: 'Health check',
                  request: {
                    id: 'request-health-persisted',
                    name: 'Health check',
                    methodLabel: 'GET',
                    summary: 'Saved health request',
                    collectionId: 'collection-saved-requests',
                    collectionName: 'Saved Requests',
                    requestGroupId: 'request-group-general',
                    requestGroupName: 'General',
                    updatedAt: '2026-03-20T09:30:00.000Z',
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: persistedRequests });
      }

      if (url === '/api/workspaces/local-workspace/request-tree' && method === 'GET') {
        return createApiResponse(requestTreeResponse);
      }

      if (url === '/api/requests/request-health-persisted' && method === 'GET') {
        return createApiResponse({ request: persistedRequests[0] });
      }

      if (url === '/api/requests/request-health-persisted' && method === 'DELETE') {
        persistedRequests.splice(0, persistedRequests.length);
        requestTreeResponse.tree[0]!.children[0]!.children = [];
        return createApiResponse({ deletedRequestId: 'request-health-persisted' });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(await within(explorer).findByRole('button', { name: 'Open Health check' }));

    const requestSection = getManagerSection('Saved request actions');
    expect(requestSection.getByRole('button', { name: 'Export saved request' })).toBeInTheDocument();
    expect(requestSection.getByRole('button', { name: 'Delete saved request' })).toBeInTheDocument();

    await user.click(requestSection.getByRole('button', { name: 'Delete saved request' }));

    await waitFor(() => expect(within(explorer).queryByRole('button', { name: 'Open Health check' })).not.toBeInTheDocument());
    expect(screen.getByLabelText('Request name')).toHaveValue('Health check');
    expect(screen.getByText('The saved request behind this tab was deleted. This draft still keeps your editable request state, but it no longer belongs to the canonical saved tree.')).toBeInTheDocument();
    expect(screen.getByText('Detached from the canonical saved tree')).toBeInTheDocument();
    expect(within(getSavedResourceManager()).getByText('Deleted the saved request from the canonical saved tree. Open tabs were kept as detached drafts.')).toBeInTheDocument();
    expect(within(getSavedResourceManager()).getByText('This tab was detached from the canonical saved tree after the persisted request was deleted. Save it again to create a new canonical request and restore saved-request actions.')).toBeInTheDocument();
    expect(requestSection.queryByRole('button', { name: 'Export saved request' })).not.toBeInTheDocument();
    expect(requestSection.queryByRole('button', { name: 'Delete saved request' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Detached draft').length).toBeGreaterThan(0);
  });
  it('renders result-panel copy in Korean without changing the English-default contracts', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialLocale: 'ko' });

    const explorer = screen.getByLabelText('섹션 탐색기');
    expect(screen.getByLabelText('작성 리소스 가져오기')).toBeInTheDocument();
    await user.click(within(explorer).getByRole('button', { name: '새 요청' }));

    const detailPanel = screen.getByLabelText('컨텍스트 상세 패널');
    expect(within(detailPanel).getByRole('heading', { name: 'Untitled Request에 대한 관측' })).toBeInTheDocument();
    expect(within(detailPanel).getByRole('tablist', { name: '결과 패널 탭' })).toBeInTheDocument();
    expect(within(detailPanel).getByRole('tab', { name: '응답' })).toBeInTheDocument();
    expect(within(detailPanel).getByRole('heading', { name: '응답 요약' })).toBeInTheDocument();
    expect(within(detailPanel).getByText('응답을 채우려면 이 요청을 실행하세요')).toBeInTheDocument();

    await user.click(within(detailPanel).getByRole('tab', { name: '실행 정보' }));
    expect(within(detailPanel).getByText('아직 실행 정보가 없습니다')).toBeInTheDocument();
  });
});













