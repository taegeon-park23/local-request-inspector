import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
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
    expect(within(observationMeta as HTMLElement).getByText('Draft request tab')).toBeInTheDocument();
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

      if (url === '/api/workspaces/local-workspace/requests' && init?.method === 'POST') {
        return createApiResponse({
          request: {
            id: 'request-checkout-flow',
            workspaceId: 'local-workspace',
            name: 'Checkout flow',
            method: 'POST',
            url: 'https://api.example.com/orders',
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
    await user.type(screen.getByLabelText('Pre-request script'), "request.headers.set('x-trace-id', 'checkout-1');");

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
        scripts: {
          preRequest: string;
        };
        bodyText: string;
      };
    };

    expect(savePayload.request.scripts.preRequest).toContain('checkout-1');
    expect(savePayload.request.bodyText).toContain('sku');
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
  });

  it('runs an unsaved draft, sends script content, and renders stage-aware diagnostics without clearing dirty state', async () => {
    const user = userEvent.setup();
    let resolveRun!: (value: Response) => void;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(createApiResponse({ items: [] }));
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

    await waitFor(() => expect(screen.getByTestId('request-response-preview')).toHaveTextContent('demo-1'));
    expect(screen.getByText(/This right-hand panel is reserved for run observation only/i)).toBeInTheDocument();
    expect(screen.getByText(/Run does not save automatically and does not clear unsaved authoring changes\./i)).toBeInTheDocument();
    expect(screen.getByText('HTTP 201', { selector: '[data-kind="transportOutcome"]' })).toBeInTheDocument();
    expect(screen.getByText('31 B response body')).toBeInTheDocument();
    expect(screen.getAllByText(/Preview is bounded before richer diagnostics/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByTestId('run-command-status')).toHaveTextContent('Request run completed.');

    await user.click(screen.getByRole('tab', { name: 'Console' }));
    expect(screen.getByText('2 bounded console entries captured across script stages.')).toBeInTheDocument();
    expect(screen.getByText('[pre-request] prepared request')).toBeInTheDocument();
    expect(screen.getByText('[post-response] captured response')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tests' }));
    expect(screen.getByText('PASS response status is 201')).toBeInTheDocument();
    expect(screen.getByText('1 assertion passed. No failures.')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution Info' }));
    const stageSummary = screen.getByLabelText('Execution stage summary');
    expect(within(stageSummary).getByText(/Pre-request/i)).toBeInTheDocument();
    expect(within(stageSummary).getByText(/Added trace header to the outbound request snapshot./i)).toBeInTheDocument();
    expect(screen.getByText('Runtime request snapshot')).toBeInTheDocument();
    expect(screen.getByText('No linked saved request')).toBeInTheDocument();
    expect(screen.getByText('No saved placement recorded')).toBeInTheDocument();
    expect(screen.getByText('0 params · 1 headers · No body · No auth')).toBeInTheDocument();

    const runCall = fetchMock.mock.calls.find(
      ([input, init]) => getUrl(input as RequestInfo | URL) === '/api/executions/run' && init?.method === 'POST',
    );

    expect(runCall).toBeDefined();

    const runPayload = JSON.parse(String(runCall?.[1]?.body)) as {
      request: {
        scripts: {
          preRequest: string;
          postResponse: string;
          tests: string;
        };
      };
    };

    expect(runPayload.request.scripts.preRequest).toContain('x-trace-id');
    expect(runPayload.request.scripts.postResponse).toContain('captured response');
    expect(runPayload.request.scripts.tests).toContain('assert');
  });

  it('shows blocked stage diagnostics when pre-request execution stops the run before transport', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
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
    expect(within(stageSummary).getByText(/Transport/i)).toBeInTheDocument();
    expect(within(stageSummary).getByText(/Transport did not run because pre-request blocked the execution./i)).toBeInTheDocument();
    expect(screen.getByLabelText('Blocked runtime has unsaved changes')).toBeInTheDocument();
  });

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
