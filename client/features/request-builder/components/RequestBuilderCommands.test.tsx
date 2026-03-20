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

function createApiError(message: string, details: Record<string, unknown>, status = 500) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'request_builder_failure',
        message,
        details,
        retryable: false,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
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
    await user.type(screen.getByLabelText('Body content (JSON)'), '{"sku":"123"}');

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

  it('runs an unsaved draft, shows pending state, and renders response output without clearing dirty state', async () => {
    const user = userEvent.setup();
    let resolveRun!: (value: Response) => void;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
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
          startedAt: '2026-03-20T10:02:00.000Z',
          completedAt: '2026-03-20T10:02:00.120Z',
          durationMs: 120,
          consoleSummary: 'No console entries were captured. Script execution is not wired yet.',
          consoleEntries: [],
          testsSummary: 'No tests ran. Script execution is not wired yet.',
          testEntries: [],
        },
      }),
    );

    await waitFor(() => expect(screen.getByTestId('request-response-preview')).toHaveTextContent('"ok":true'));
    expect(screen.getByText('HTTP 201')).toBeInTheDocument();
    expect(screen.getByLabelText('Runtime probe has unsaved changes')).toBeInTheDocument();
    expect(screen.getByTestId('run-command-status')).toHaveTextContent('Request run completed.');
  });

  it('shows execution failure details in the observation panel when a run fails', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/executions/run' && init?.method === 'POST') {
        return createApiError('Connection refused', {
          executionId: 'execution-error-1',
          startedAt: '2026-03-20T10:03:00.000Z',
          completedAt: '2026-03-20T10:03:00.050Z',
          durationMs: 50,
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request name'), 'Broken runtime');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/failure');

    await user.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(screen.getByTestId('run-command-status')).toHaveTextContent('Connection refused'));
    await user.click(screen.getByRole('tab', { name: 'Execution Info' }));
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
    expect(screen.getByText('No response')).toBeInTheDocument();
  });

  it('saves a replay-created draft without overwriting replay bridge behavior', async () => {
    const user = userEvent.setup();
    const historyReplayRecord = defaultHistoryFixtureScenario.listItems[0]!;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || init.method === undefined)) {
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

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await user.click(screen.getByRole('button', { name: 'Open Replay Draft' }));
    await screen.findByRole('heading', { name: 'Workspace' });
    expect(screen.getByText('Opened from history')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('save-command-status')).toHaveTextContent(/Saved request definition/i));
    expect(screen.queryByText('Opened from history')).not.toBeInTheDocument();
    expect(screen.getByText('Saved Requests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Replay of Create user' })).toBeInTheDocument();
  });
});

