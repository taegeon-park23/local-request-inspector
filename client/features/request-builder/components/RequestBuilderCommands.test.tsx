import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import { defaultSavedScriptFixtureRecords, defaultScriptTemplateFixtureRecords } from '@client/features/scripts/data/script-fixtures';
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
  const sheet = screen.getByLabelText('Create workspace item');
  await user.type(within(sheet).getByLabelText('Name'), 'Untitled Request');
  await user.click(within(sheet).getByRole('button', { name: 'Create' }));
}

describe('Request builder save/run wiring', () => {
  it('renders the M3-F3 request-builder and observation grouping structure for a new draft', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);

    const builderHeaderCopy = screen.getByRole('heading', { name: 'Untitled Request' }).closest('.request-work-surface__header-copy');
    expect(builderHeaderCopy).not.toBeNull();
    expect(within(builderHeaderCopy as HTMLElement).getByText(/This tab owns editable request state only/i)).toBeInTheDocument();

    const locationSummary = screen.getByText('Unsaved draft');
    expect(locationSummary.closest('.request-builder-core__identity-support')).not.toBeNull();

    expect(screen.getByTestId('save-command-status').closest('.request-builder-core__command-status-list')).not.toBeNull();
    expect(screen.getByTestId('run-command-status').closest('.request-builder-core__command-status-list')).not.toBeNull();
    expect(screen.getByText(/Duplicate stays deferred until saved-request copy semantics are added/i).closest('.request-builder-core__command-support')).not.toBeNull();

    const observationHeaderCopy = screen.getByRole('heading', { name: 'Observation for Untitled Request' }).closest('.workspace-detail-panel__header-copy');
    expect(observationHeaderCopy).not.toBeNull();

    const observationMeta = observationHeaderCopy?.querySelector('.workspace-detail-panel__header-meta');
    expect(observationMeta).not.toBeNull();
    expect(within(observationMeta as HTMLElement).getByText('Detached draft')).toBeInTheDocument();
    expect(within(observationMeta as HTMLElement).getByText('Response')).toBeInTheDocument();
    expect(within(observationMeta as HTMLElement).getByText('No execution yet')).toBeInTheDocument();
  });
  it('saves the active draft, clears dirty state, and reflects the saved request in the explorer', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/environments' && (!init || !init.method || init.method === 'GET')) {
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

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      if (url === '/api/workspaces/local-workspace/requests' && init?.method === 'POST') {
        return createApiResponse({
          request: {
            id: 'request-checkout-flow',
            workspaceId: 'local-workspace',
            name: 'Checkout flow',
            method: 'POST',
            url: 'https://api.example.com/orders',
            selectedEnvironmentId: 'environment-local',
            params: [],
            headers: [],
            bodyMode: 'json',
            bodyText: '{"sku":"123"}',
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
              preRequest: "request.headers.set('x-trace-id', 'checkout-1');",
              postResponse: '',
              tests: '',
            },
            summary: 'POST https://api.example.com/orders',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-20T10:00:00.000Z',
            updatedAt: '2026-03-20T10:01:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request name'), 'Checkout flow');
    await user.selectOptions(screen.getByLabelText('Request method'), 'POST');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/orders');

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Body' }));
    await user.selectOptions(screen.getByLabelText('Body mode'), 'json');
    await user.click(screen.getByLabelText('Body content (JSON)'));
    await user.paste('{"sku":"123"}');

    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await screen.findByLabelText('Pre-request script');
    const savedScriptSelect = await screen.findByLabelText('Saved script');
    expect(within(savedScriptSelect).getByRole('option', { name: 'Pre-request trace seed' })).toBeInTheDocument();
    expect(within(savedScriptSelect).queryByRole('option', { name: 'Health status assertions' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy into stage' }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-trace-id', 'local-dev-trace');");
    expect(screen.getByText('Copied from saved script: Pre-request trace seed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('save-command-status')).toHaveTextContent(/Saved request definition/i));
    expect(screen.queryByLabelText('Checkout flow has unsaved changes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Checkout flow' })).toBeInTheDocument();
    expect(screen.getByText('Run this request to populate Response')).toBeInTheDocument();

    const saveCall = fetchMock.mock.calls.find(
      ([input, init]) => getUrl(input as RequestInfo | URL) === '/api/workspaces/local-workspace/requests' && init?.method === 'POST',
    );

    expect(saveCall).toBeDefined();

    const savePayload = JSON.parse(String(saveCall?.[1]?.body)) as {
      request: {
        selectedEnvironmentId?: string | null;
        scripts: {
          preRequest: {
            mode: 'inline';
            sourceCode: string;
          };
        };
        bodyText: string;
      };
    };

    expect(savePayload.request.selectedEnvironmentId).toBe('environment-local');
    expect(savePayload.request.scripts.preRequest.mode).toBe('inline');
    expect(savePayload.request.scripts.preRequest.sourceCode).toContain('local-dev-trace');
    expect(savePayload.request.bodyText).toContain('sku');
  }, 10000);

  it('flushes pending script input before Save so latest stage source reaches payload', async () => {
    const user = userEvent.setup();
    const latestPreRequestSource = "request.headers.set('x-trace-id', 'flush-check');";

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      if (url === '/api/workspaces/local-workspace/requests' && init?.method === 'POST') {
        return createApiResponse({
          request: {
            id: 'request-script-flush',
            workspaceId: 'local-workspace',
            name: 'Flush check request',
            method: 'GET',
            url: 'https://api.example.com/flush-check',
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
              preRequest: latestPreRequestSource,
              postResponse: '',
              tests: '',
            },
            summary: 'GET https://api.example.com/flush-check',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-27T00:00:00.000Z',
            updatedAt: '2026-03-27T00:00:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request name'), 'Flush check request');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/flush-check');

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await user.type(await screen.findByLabelText('Pre-request script'), latestPreRequestSource);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const saveCall = await waitFor(() => fetchMock.mock.calls.find(
      ([requestInput, requestInit]) => getUrl(requestInput as RequestInfo | URL) === '/api/workspaces/local-workspace/requests'
        && requestInit?.method === 'POST',
    ));

    expect(saveCall).toBeDefined();

    const savePayload = JSON.parse(String(saveCall?.[1]?.body)) as {
      request: {
        scripts: {
          preRequest: {
            mode: 'inline';
            sourceCode: string;
          };
        };
      };
    };

    expect(savePayload.request.scripts.preRequest.mode).toBe('inline');
    expect(savePayload.request.scripts.preRequest.sourceCode).toBe(latestPreRequestSource);
  });

  it('copies only stage-compatible saved scripts into the active script editor stage', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));

    const savedScriptSelect = await screen.findByLabelText('Saved script');
    expect(within(savedScriptSelect).getByRole('option', { name: 'Pre-request trace seed' })).toBeInTheDocument();
    expect(within(savedScriptSelect).queryByRole('option', { name: 'Health status assertions' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy into stage' }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-trace-id', 'local-dev-trace');");

    const scriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.click(within(scriptStages).getByRole('tab', { name: 'Tests' }));

    const testsSavedScriptSelect = await screen.findByLabelText('Saved script');
    expect(within(testsSavedScriptSelect).getByRole('option', { name: 'Health status assertions' })).toBeInTheDocument();
    expect(within(testsSavedScriptSelect).queryByRole('option', { name: 'Pre-request trace seed' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy into stage' }));
    expect(screen.getByLabelText('Tests script')).toHaveValue("assert(response.status === 200);\nassert(response.body.includes('ok'));");
    expect(screen.getByText('Copied from saved script: Health status assertions')).toBeInTheDocument();
  });

  it('links a saved script into the active stage, saves the linked binding, and can detach back to inline copy', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      if (url === '/api/workspaces/local-workspace/requests' && init?.method === 'POST') {
        return createApiResponse({
          request: {
            id: 'request-linked-script',
            workspaceId: 'local-workspace',
            name: 'Linked script request',
            method: 'GET',
            url: 'https://api.example.com/linked-script',
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
              preRequest: {
                mode: 'linked',
                savedScriptId: 'saved-script-pre-trace',
                savedScriptNameSnapshot: 'Pre-request trace seed',
                linkedAt: '2026-03-24T00:00:00.000Z',
              },
              postResponse: '',
              tests: '',
            },
            summary: 'GET https://api.example.com/linked-script',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-24T00:00:00.000Z',
            updatedAt: '2026-03-24T00:00:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request name'), 'Linked script request');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/linked-script');

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await screen.findByLabelText('Saved script');

    await user.click(screen.getByRole('button', { name: 'Link to stage' }));
    expect(screen.queryByLabelText('Pre-request script')).not.toBeInTheDocument();
    expect(screen.getByText('Linked saved script')).toBeInTheDocument();
    expect(screen.getByText('Currently linked to Pre-request trace seed.')).toBeInTheDocument();
    expect(screen.getByLabelText('Resolved source preview')).toHaveValue("request.headers.set('x-trace-id', 'local-dev-trace');");

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const saveCall = fetchMock.mock.calls.find(
      ([input, init]) => getUrl(input as RequestInfo | URL) === '/api/workspaces/local-workspace/requests' && init?.method === 'POST',
    );
    expect(saveCall).toBeDefined();

    const savePayload = JSON.parse(String(saveCall?.[1]?.body)) as {
      request: {
        scripts: {
          preRequest: {
            mode: 'linked';
            savedScriptId: string;
            savedScriptNameSnapshot: string;
            linkedAt: string;
          };
        };
      };
    };

    expect(savePayload.request.scripts.preRequest.mode).toBe('linked');
    expect(savePayload.request.scripts.preRequest.savedScriptId).toBe('saved-script-pre-trace');
    expect(savePayload.request.scripts.preRequest.savedScriptNameSnapshot).toBe('Pre-request trace seed');

    await user.click(screen.getByRole('button', { name: 'Detach to copy' }));
    expect(await screen.findByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-trace-id', 'local-dev-trace');");
    expect(screen.getByText('Copied from saved script: Pre-request trace seed')).toBeInTheDocument();
  });

  it('blocks Run and shows broken-link state when a linked saved script is missing', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({
          items: [
            {
              id: 'request-linked-missing-script',
              workspaceId: 'local-workspace',
              name: 'Linked missing script',
              method: 'GET',
              url: 'https://api.example.com/linked-missing',
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
                preRequest: {
                  mode: 'linked',
                  savedScriptId: 'saved-script-missing',
                  savedScriptNameSnapshot: 'Missing trace seed',
                  linkedAt: '2026-03-24T00:00:00.000Z',
                },
                postResponse: '',
                tests: '',
              },
              summary: 'GET https://api.example.com/linked-missing',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-24T00:00:00.000Z',
              updatedAt: '2026-03-24T00:00:00.000Z',
            },
          ],
        });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(await within(explorer).findByRole('button', { name: 'Open Linked missing script' }));

    expect(await screen.findByText('Repair or detach the missing linked saved script in the Pre-request stage before running.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByText('Broken link')).toBeInTheDocument();
    expect(screen.getByText('The saved script referenced by this stage is no longer available.')).toBeInTheDocument();
  });

  it('shows linked-script degraded state instead of a broken-link state when the scripts library query fails', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({
          items: [
            {
              id: 'request-linked-degraded-script',
              workspaceId: 'local-workspace',
              name: 'Linked degraded script',
              method: 'GET',
              url: 'https://api.example.com/linked-degraded',
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
                preRequest: {
                  mode: 'linked',
                  savedScriptId: 'saved-script-pre-trace',
                  savedScriptNameSnapshot: 'Pre-request trace seed',
                  linkedAt: '2026-03-24T00:00:00.000Z',
                },
                postResponse: '',
                tests: '',
              },
              summary: 'GET https://api.example.com/linked-degraded',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-24T00:00:00.000Z',
              updatedAt: '2026-03-24T00:00:00.000Z',
            },
          ],
        });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return new Response(JSON.stringify({ error: { message: 'Saved scripts are temporarily unavailable.' } }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(await within(explorer).findByRole('button', { name: 'Open Linked degraded script' }));

    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled();

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));

    expect(await screen.findAllByText('Saved script library is unavailable right now. Try again after the Scripts route responds.')).not.toHaveLength(0);
    expect(screen.queryByText('Broken link')).not.toBeInTheDocument();
    expect(screen.queryByText('The saved script referenced by this stage is no longer available.')).not.toBeInTheDocument();
  });
  it('opens the scripts library with request-stage context and returns to the same workspace draft', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      if (url === '/api/script-templates' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultScriptTemplateFixtureRecords });
      }

      if (url.startsWith('/api/scripts/') && (!init || !init.method || init.method === 'GET')) {
        const scriptId = url.split('/').pop() ?? '';
        return createApiResponse({ script: defaultSavedScriptFixtureRecords.find((script) => script.id === scriptId) ?? null });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));

    await screen.findByLabelText('Saved script');
    await user.click(screen.getByRole('button', { name: 'Open Scripts library' }));

    expect(await screen.findByText('Opened from request stage')).toBeInTheDocument();
    expect(screen.getByLabelText('Stage filter')).toHaveValue('pre-request');
    expect(screen.getByText('Requested stage: Pre-request')).toBeInTheDocument();
    expect(screen.getByText('Requested saved script: Pre-request trace seed')).toBeInTheDocument();
    expect(screen.getByLabelText('Script name')).toHaveValue('Pre-request trace seed');

    await user.click(screen.getByRole('button', { name: 'Back to request builder' }));
    expect(await screen.findByRole('heading', { name: 'Untitled Request' })).toBeInTheDocument();
    expect(screen.getByLabelText('Pre-request script')).toBeInTheDocument();
  });
  it('updates a persisted saved request via the update route and keeps explorer identity stable', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
        return createApiResponse({
          items: [
            {
              id: 'request-health-check-live',
              workspaceId: 'local-workspace',
              name: 'Health check',
              method: 'GET',
              url: 'http://localhost:5671/health',
              params: [],
              headers: [{ id: 'health-accept', key: 'Accept', value: 'application/json', enabled: true }],
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
              summary: 'GET http://localhost:5671/health',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T09:58:00.000Z',
              updatedAt: '2026-03-20T10:00:00.000Z',
            },
          ],
        });
      }

      if (url === '/api/requests/request-health-check-live' && init?.method === 'PATCH') {
        return createApiResponse({
          request: {
            id: 'request-health-check-live',
            workspaceId: 'local-workspace',
            name: 'Health check updated',
            method: 'GET',
            url: 'http://localhost:5671/health?mode=full',
            params: [{ id: 'health-mode', key: 'mode', value: 'full', enabled: true }],
            headers: [{ id: 'health-accept', key: 'Accept', value: 'application/json', enabled: true }],
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
            summary: 'GET http://localhost:5671/health?mode=full',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-20T09:58:00.000Z',
            updatedAt: '2026-03-20T10:06:00.000Z',
          },
        });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      throw new Error('Unexpected fetch call: ' + url);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const mainSurface = screen.getByLabelText('Main work surface');
    await within(explorer).findByRole('button', { name: 'Export Health check' });
    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    expect(screen.getByText('Saved Requests', { selector: '.request-builder-core__source-copy' })).toBeInTheDocument();

    const requestNameInput = await within(mainSurface).findByLabelText('Request name');
    await user.clear(requestNameInput);
    await user.type(requestNameInput, 'Health check updated');
    await user.type(screen.getByLabelText('Request URL'), '?mode=full');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('save-command-status')).toHaveTextContent(/Saved request definition/i));
    expect(screen.queryByLabelText('Health check updated has unsaved changes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Health check updated' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, init]) => getUrl(input as RequestInfo | URL) === '/api/requests/request-health-check-live' && init?.method === 'PATCH')).toBe(true);
    expect(fetchMock.mock.calls.some(([input, init]) => getUrl(input as RequestInfo | URL) === '/api/workspaces/local-workspace/requests' && init?.method === 'POST')).toBe(false);
  }, 10000);

  it('blocks save and run when a saved request references a missing environment id', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
        return createApiResponse({
          items: [
            {
              id: 'request-env-missing',
              workspaceId: 'local-workspace',
              name: 'Environment missing',
              method: 'GET',
              url: 'https://api.example.com/env-missing',
              selectedEnvironmentId: 'environment-missing',
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
              summary: 'GET https://api.example.com/env-missing',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T10:00:00.000Z',
              updatedAt: '2026-03-20T10:00:00.000Z',
            },
          ],
        });
      }

      if (url === '/api/workspaces/local-workspace/environments' && (!init || !init.method || init.method === 'GET')) {
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

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await within(explorer).findByRole('button', { name: 'Open Environment missing' });
    await user.click(within(explorer).getByRole('button', { name: 'Open Environment missing' }));

    await waitFor(() => expect(screen.getByLabelText('Request environment')).toHaveValue('environment-missing'));
    expect(screen.getByText('Missing environment')).toBeInTheDocument();
    expect(screen.getByText(/Choose another environment or No environment before saving or running/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  });
  it('runs an unsaved draft, sends script content, and renders stage-aware diagnostics without clearing dirty state', async () => {
    const user = userEvent.setup();
    let resolveRun!: (value: Response) => void;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(createApiResponse({ items: [] }));
      }

      if (url === '/api/workspaces/local-workspace/environments' && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(createApiResponse({
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
        }));
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(createApiResponse({ items: defaultSavedScriptFixtureRecords }));
      }

      if (url === '/api/executions/run' && init?.method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveRun = resolve;
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request name'), 'Runtime probe');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/runtime');

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await screen.findByLabelText('Pre-request script');
    await user.type(screen.getByLabelText('Pre-request script'), "request.headers.set('x-trace-id', 'runtime-1'); console.log('prepared request');");
    const scriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.click(within(scriptStages).getByRole('tab', { name: 'Post-response' }));
    await user.type(screen.getByLabelText('Post-response script'), "console.log('captured response');");
    await user.click(within(scriptStages).getByRole('tab', { name: 'Tests' }));
    await user.type(screen.getByLabelText('Tests script'), "assert(response.status === 201, 'response status is 201');");

    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('button', { name: 'Running...' })).toBeDisabled();
    expect(screen.getByText('Running request')).toBeInTheDocument();

    resolveRun(
      createApiResponse({
        execution: {
          executionId: 'execution-1',
          executionOutcome: 'Succeeded',
          responseStatus: 201,
          responseStatusLabel: 'HTTP 201',
          responseHeaders: [{ name: 'content-type', value: 'application/json' }],
          responseHeadersSummary: '1 response header captured from the latest run.',
          responseBodyPreview: '{"ok":true,"requestId":"demo-1"}',
          responseBodyHint: '30 characters captured from the latest run.',
          responsePreviewSizeLabel: '31 B response body',
          responsePreviewPolicy: 'Preview is bounded before richer diagnostics and raw payload inspection are added.',
          startedAt: '2026-03-20T10:02:00.000Z',
          completedAt: '2026-03-20T10:02:00.120Z',
          durationMs: 120,
          consoleSummary: '2 bounded console entries captured across script stages.',
          consoleEntries: [
            '[pre-request] prepared request',
            '[post-response] captured response',
          ],
          consoleLogCount: 2,
          consoleWarningCount: 0,
          testsSummary: '1 assertion passed. No failures.',
          testEntries: ['PASS response status is 201'],
          requestSnapshotSummary: 'GET https://api.example.com/runtime executed from the active workspace draft with 0 params · 1 headers · No body · No auth.',
          requestInputSummary: '0 params · 1 headers · No body · No auth',
          requestHeaderCount: 1,
          requestParamCount: 0,
          requestBodyMode: 'none',
          authSummary: 'No auth',
          environmentId: 'environment-local',
          environmentLabel: 'Local API',
          environmentResolutionSummary: {
            status: 'resolved',
            summary: 'Resolved 3 environment placeholder(s) in url, headers, and auth.',
            resolvedPlaceholderCount: 3,
            unresolvedPlaceholderCount: 0,
            affectedInputAreas: ['url', 'headers', 'auth'],
          },
          stageSummaries: [
            {
              stageId: 'pre-request',
              label: 'Pre-request',
              status: 'Succeeded',
              summary: 'Added trace header to the outbound request snapshot.',
            },
            {
              stageId: 'transport',
              label: 'Transport',
              status: 'Succeeded',
              summary: 'Transport completed and returned HTTP 201.',
            },
            {
              stageId: 'post-response',
              label: 'Post-response',
              status: 'Succeeded',
              summary: 'Recorded a bounded response note after transport.',
            },
            {
              stageId: 'tests',
              label: 'Tests',
              status: 'Succeeded',
              summary: '1 assertion passed. No failures.',
            },
          ],
        },
      }),
    );

    const routePanelTabs = screen.getByRole('tablist', { name: 'Route panel tabs' });
    await waitFor(() => expect(within(routePanelTabs).getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(screen.getByText('PASS response status is 201')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Tests summary' })).toBeInTheDocument();
    expect(screen.getByText(/This right-hand panel is reserved for run observation only/i)).toBeInTheDocument();
    expect(screen.getByText(/Run does not save automatically and does not clear unsaved authoring changes\./i)).toBeInTheDocument();
    expect(screen.getByText('HTTP 201', { selector: '[data-kind="transportOutcome"]' })).toBeInTheDocument();
    expect(screen.getByText('31 B response body')).toBeInTheDocument();
    expect(screen.getAllByText(/Preview is bounded before richer diagnostics/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByTestId('run-command-status')).toHaveTextContent('Request run completed.');

    expect(screen.getByText('Tests preview')).toBeInTheDocument();
    expect(screen.getByText('Console preview')).toBeInTheDocument();
    expect(screen.getByText('[pre-request] prepared request')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Console' }));
    expect(screen.getByText('2 bounded console entries captured across script stages.')).toBeInTheDocument();
    expect(screen.getByText('[pre-request] prepared request')).toBeInTheDocument();
    expect(screen.getByText('[post-response] captured response')).toBeInTheDocument();

    const resultPanelTabs = screen.getByRole('tablist', { name: 'Result panel tabs' });
    await user.click(within(resultPanelTabs).getByRole('tab', { name: 'Tests' }));
    expect(screen.getByText('PASS response status is 201')).toBeInTheDocument();
    expect(screen.getByText('1 assertion passed. No failures.')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution Info' }));
    const stageSummary = screen.getByLabelText('Execution stage summary');
    expect(within(stageSummary).getByText(/Pre-request/i)).toBeInTheDocument();
    expect(within(stageSummary).getByText(/Added trace header to the outbound request snapshot./i)).toBeInTheDocument();
    expect(screen.getByText('Runtime request snapshot')).toBeInTheDocument();
    expect(screen.getByText('No linked saved request')).toBeInTheDocument();
    expect(screen.getByText('No saved placement recorded')).toBeInTheDocument();
    expect(screen.getByText('Local API', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('Environment resolution')).toBeInTheDocument();
    expect(screen.getByText('Resolved 3 environment placeholder(s) in url, headers, and auth.')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('URL, Headers, Auth')).toBeInTheDocument();
    expect(screen.getByText('0 params · 1 headers · No body · No auth')).toBeInTheDocument();

    const runCall = fetchMock.mock.calls.find(
      ([input, init]) => getUrl(input as RequestInfo | URL) === '/api/executions/run' && init?.method === 'POST',
    );

    expect(runCall).toBeDefined();

    const runPayload = JSON.parse(String(runCall?.[1]?.body)) as {
      request: {
        selectedEnvironmentId?: string | null;
        scripts: {
          preRequest: { mode: 'inline'; sourceCode: string };
          postResponse: { mode: 'inline'; sourceCode: string };
          tests: { mode: 'inline'; sourceCode: string };
        };
      };
    };

    expect(runPayload.request.selectedEnvironmentId).toBe('environment-local');
    expect(runPayload.request.scripts.preRequest.sourceCode).toContain('x-trace-id');
    expect(runPayload.request.scripts.postResponse.sourceCode).toContain('captured response');
    expect(runPayload.request.scripts.tests.sourceCode).toContain('assert');
  }, 20000);

  it('shows blocked stage diagnostics when pre-request execution stops the run before transport', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(createApiResponse({ items: defaultSavedScriptFixtureRecords }));
      }

      if (url === '/api/executions/run' && init?.method === 'POST') {
        return createApiResponse({
          execution: {
            executionId: 'execution-blocked-1',
            executionOutcome: 'Blocked',
            responseStatus: null,
            responseStatusLabel: 'No response',
            responseHeaders: [],
            responseHeadersSummary: 'No response headers were captured.',
            responseBodyPreview: '',
            responseBodyHint: 'No response payload is available because transport never started.',
            responsePreviewSizeLabel: 'No preview stored',
            responsePreviewPolicy: 'Transport did not run because the pre-request stage was blocked before send.',
            startedAt: '2026-03-20T10:03:00.000Z',
            completedAt: '2026-03-20T10:03:00.050Z',
            durationMs: 50,
            consoleSummary: 'No console preview was persisted because the blocked stage returned before bounded logs were emitted.',
            consoleEntries: [],
            consoleLogCount: 0,
            consoleWarningCount: 0,
            testsSummary: 'Tests stage was skipped because pre-request blocked the run.',
            testEntries: [],
            requestSnapshotSummary: 'GET https://api.example.com/failure executed from the active workspace draft with 0 params · 0 headers · No body · No auth.',
            requestInputSummary: '0 params · 0 headers · No body · No auth',
            requestHeaderCount: 0,
            requestParamCount: 0,
            requestBodyMode: 'none',
            authSummary: 'No auth',
            errorCode: 'script_blocked_capability',
            errorSummary: 'Blocked token process is not available in the bounded script runtime.',
            stageSummaries: [
              {
                stageId: 'pre-request',
                label: 'Pre-request',
                status: 'Blocked',
                summary: 'Blocked token process is not available in the bounded script runtime.',
                errorCode: 'script_blocked_capability',
                errorSummary: 'Blocked token process is not available in the bounded script runtime.',
              },
              {
                stageId: 'transport',
                label: 'Transport',
                status: 'Skipped',
                summary: 'Transport did not run because pre-request blocked the execution.',
              },
              {
                stageId: 'post-response',
                label: 'Post-response',
                status: 'Skipped',
                summary: 'Post-response did not run because no transport response was available.',
              },
              {
                stageId: 'tests',
                label: 'Tests',
                status: 'Skipped',
                summary: 'Tests did not run because transport never completed.',
              },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request name'), 'Blocked runtime');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/failure');

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await screen.findByLabelText('Pre-request script');
    await user.type(screen.getByLabelText('Pre-request script'), 'console.log(process.env.SECRET);');

    await user.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(screen.getByTestId('run-command-status')).toHaveTextContent('Request run was blocked before completion.'));
    expect(screen.getByText('No response', { selector: '[data-kind="transportOutcome"]' })).toBeInTheDocument();
    expect(screen.getAllByText(/Transport did not run because the pre-request stage was blocked before send/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Execution Info' }));
    expect(screen.getAllByText('Blocked', { selector: '[data-kind="executionOutcome"]' }).length).toBeGreaterThan(0);
    expect(screen.getByText('script_blocked_capability')).toBeInTheDocument();
    expect(screen.getByText('Blocked token process is not available in the bounded script runtime.')).toBeInTheDocument();
    const stageSummary = screen.getByLabelText('Execution stage summary');
    expect(within(stageSummary).getAllByText('Transport', { selector: 'strong' }).length).toBeGreaterThan(0);
    expect(within(stageSummary).getByText(/Transport did not run because pre-request blocked the execution./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  }, 20000);

  it('saves a replay-created draft without overwriting replay bridge behavior', async () => {
    const user = userEvent.setup();
    const historyReplayRecord = defaultHistoryFixtureScenario.listItems[0]!;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [historyReplayRecord] });
      }

      if (url === `/api/execution-histories/${historyReplayRecord.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ history: historyReplayRecord });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      if (url === '/api/workspaces/local-workspace/requests' && init?.method === 'POST') {
        return createApiResponse({
          request: {
            id: 'request-replay-create-user',
            workspaceId: 'local-workspace',
            name: 'Replay of Create user',
            method: 'POST',
            url: 'https://api.example.com/users',
            params: [],
            headers: [],
            bodyMode: 'json',
            bodyText: '{"name":"Morgan Lee"}',
            formBody: [],
            multipartBody: [],
            auth: {
              type: 'bearer',
              bearerToken: 'qa-token-104',
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
            summary: 'POST https://api.example.com/users',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-20T10:04:00.000Z',
            updatedAt: '2026-03-20T10:04:00.000Z',
          },
        });
      }

      if (url === '/api/requests/request-replay-create-user' && init?.method === 'PATCH') {
        return createApiResponse({
          request: {
            id: 'request-replay-create-user',
            workspaceId: 'local-workspace',
            name: 'Replay of Create user refined',
            method: 'POST',
            url: 'https://api.example.com/users',
            params: [],
            headers: [],
            bodyMode: 'json',
            bodyText: '{"name":"Morgan Lee"}',
            formBody: [],
            multipartBody: [],
            auth: {
              type: 'bearer',
              bearerToken: 'qa-token-104',
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
            summary: 'POST https://api.example.com/users',
            collectionName: 'Saved Requests',
            createdAt: '2026-03-20T10:04:00.000Z',
            updatedAt: '2026-03-20T10:05:00.000Z',
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await user.click(await screen.findByRole('button', { name: 'Open Replay Draft' }));
    await screen.findByRole('heading', { name: 'Workspace' });
    expect(screen.getAllByText('Opened from history', { selector: '.workspace-chip--replay' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('save-command-status')).toHaveTextContent(/Saved request definition/i));
    expect(screen.queryAllByText('Opened from history', { selector: '.workspace-chip--replay' }).length).toBe(0);
    expect(screen.getByText('Saved Requests', { selector: '.request-builder-core__source-copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Replay of Create user' })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Request name'));
    await user.type(screen.getByLabelText('Request name'), 'Replay of Create user refined');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Open Replay of Create user refined' })).toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([input, init]) => getUrl(input as RequestInfo | URL) === '/api/workspaces/local-workspace/requests' && init?.method === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([input, init]) => getUrl(input as RequestInfo | URL) === '/api/requests/request-replay-create-user' && init?.method === 'PATCH')).toBe(true);

    const createCall = fetchMock.mock.calls.find(
      ([input, init]) => getUrl(input as RequestInfo | URL) === '/api/workspaces/local-workspace/requests' && init?.method === 'POST',
    );
    const updateCall = fetchMock.mock.calls.find(
      ([input, init]) => getUrl(input as RequestInfo | URL) === '/api/requests/request-replay-create-user' && init?.method === 'PATCH',
    );

    expect(createCall).toBeDefined();
    expect(updateCall).toBeDefined();

    const createPayload = JSON.parse(String(createCall?.[1]?.body)) as { request: { id?: string; name: string } };
    const updatePayload = JSON.parse(String(updateCall?.[1]?.body)) as { request: { id?: string; name: string } };

    expect(createPayload.request.id).toBeUndefined();
    expect(createPayload.request.name).toBe('Replay of Create user');
    expect(updatePayload.request.id).toBe('request-replay-create-user');
    expect(updatePayload.request.name).toBe('Replay of Create user refined');
  });
});

