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
  const explorer = screen.getByLabelText('Section explorer');
  await user.click(within(explorer).getByRole('button', { name: 'New Request' }));
}

describe('Workspace request builder authoring shell', () => {
  it('renders method and url authoring controls for the active tab', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    await openNewRequest(user);
    expect(screen.getByText(/Workspace remains the authoring surface/i)).toBeInTheDocument();

    expect(screen.getByLabelText('Request method')).toBeInTheDocument();
    expect(screen.getByLabelText('Request URL')).toBeInTheDocument();
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
  });

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

  it('prefers persisted saved requests over starter fixtures and keeps canonical ordering stable', async () => {
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
            schemaVersion: 1,
            resourceKind: 'local-request-inspector-authored-resource-bundle',
            exportedAt: '2026-03-21T12:00:00.000Z',
            workspaceId: 'local-workspace',
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
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(within(explorer).getByRole('button', { name: 'Export Resources' }));

    expect(await within(explorer).findByText(/Exported 1 saved request definition and 1 mock rule from the authored resource lane/i)).toBeInTheDocument();
    expect(await within(explorer).findByText('Saved requests in bundle: 1')).toBeInTheDocument();
    expect(within(explorer).getByText('Mock rules in bundle: 1')).toBeInTheDocument();
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

      if (url === '/api/workspaces/local-workspace/resource-bundle/import-preview' && method === 'POST') {
        previewRequestCount += 1;

        return createApiResponse({
          preview: {
            rejected: [],
            summary: {
              acceptedCount: 2,
              rejectedCount: 0,
              createdRequestCount: 1,
              createdMockRuleCount: 1,
              renamedCount: 2,
              importedNamesPreview: ['Health check (Imported)', 'Latency guard (Imported)'],
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

        persistedRequests.push(importedRequest);
        persistedMockRules.push(importedRule);

        return createApiResponse({
          result: {
            acceptedRequests: [importedRequest],
            acceptedMockRules: [importedRule],
            rejected: [],
            summary: {
              acceptedCount: 2,
              rejectedCount: 0,
              createdRequestCount: 1,
              createdMockRuleCount: 1,
              renamedCount: 2,
              importedNamesPreview: ['Health check (Imported)', 'Latency guard (Imported)'],
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
    expect(await within(explorer).findByRole('button', { name: 'Open Health check' })).toBeInTheDocument();

    const importFile = new File([
      JSON.stringify({
        schemaVersion: 1,
        resourceKind: 'local-request-inspector-authored-resource-bundle',
        exportedAt: '2026-03-21T11:59:00.000Z',
        workspaceId: 'other-workspace',
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
      }),
    ], 'authored-resources.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('Import authored resources'), importFile);

    expect(await within(explorer).findByText(/Preview ready for authored-resources\.json/i)).toBeInTheDocument();
    expect(within(explorer).getByText('Created requests: 1')).toBeInTheDocument();
    expect(within(explorer).getByText('Created mock rules: 1')).toBeInTheDocument();
    expect(within(explorer).getByText('Renamed on import: 2')).toBeInTheDocument();
    expect(within(explorer).getByText(/Imported preview: Health check \(Imported\), Latency guard \(Imported\)/i)).toBeInTheDocument();
    expect(within(explorer).getByRole('button', { name: 'Confirm Import' })).toBeInTheDocument();
    expect(previewRequestCount).toBe(1);
    expect(importRequestCount).toBe(0);
    expect(within(explorer).queryByRole('button', { name: 'Open Health check (Imported)' })).not.toBeInTheDocument();

    await user.click(within(explorer).getByRole('button', { name: 'Confirm Import' }));

    expect(await within(explorer).findByText(/Imported resources received new identities so existing saved resources were not overwritten/i)).toBeInTheDocument();
    expect(importRequestCount).toBe(1);
    expect(await within(explorer).findByRole('button', { name: 'Open Health check (Imported)' })).toBeInTheDocument();
    expect(within(explorer).getByRole('button', { name: 'Open Health check' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /mocks/i }));
    expect(await screen.findByRole('button', { name: 'Open mock rule Latency guard (Imported)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open mock rule Latency guard' })).toBeInTheDocument();
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

      if (url === '/api/workspaces/local-workspace/resource-bundle/import-preview' && method === 'POST') {
        return createApiResponse({
          preview: {
            rejected: [],
            summary: {
              acceptedCount: 2,
              rejectedCount: 0,
              createdRequestCount: 1,
              createdMockRuleCount: 1,
              renamedCount: 2,
              importedNamesPreview: ['Health check (Imported)', 'Latency guard (Imported)'],
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
    expect(await within(explorer).findByRole('button', { name: 'Open Health check' })).toBeInTheDocument();

    const importFile = new File([JSON.stringify({
      schemaVersion: 1,
      resourceKind: 'local-request-inspector-authored-resource-bundle',
      exportedAt: '2026-03-21T11:59:00.000Z',
      workspaceId: 'other-workspace',
      requests: [{ id: 'request-original-health', name: 'Health check' }],
      mockRules: [{ id: 'mock-rule-original-latency', name: 'Latency guard' }],
    })], 'authored-resources.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('Import authored resources'), importFile);

    expect(await within(explorer).findByRole('button', { name: 'Confirm Import' })).toBeInTheDocument();
    await user.click(within(explorer).getByRole('button', { name: 'Cancel Preview' }));

    expect(await within(explorer).findByText('Import preview cleared. No authored resources were written.')).toBeInTheDocument();
    expect(importRequestCount).toBe(0);
    expect(within(explorer).queryByRole('button', { name: 'Confirm Import' })).not.toBeInTheDocument();
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
            schemaVersion: 1,
            resourceKind: 'local-request-inspector-authored-resource-bundle',
            exportedAt: '2026-03-21T12:00:00.000Z',
            workspaceId: 'local-workspace',
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
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    await within(explorer).findByRole('button', { name: 'Export Health check' });
    await user.click(within(explorer).getByRole('button', { name: 'Export Health check' }));

    expect(await within(explorer).findByText(/Exported saved request Health check from the authored resource lane/i)).toBeInTheDocument();
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
});

