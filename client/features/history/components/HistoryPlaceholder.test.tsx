import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import { useHistoryStore } from '@client/features/history/state/history-store';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createApiError(message: string, status = 500) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'history_query_failed',
        message,
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

describe('History S12 real data integration', () => {
  it('renders persisted execution history from the query seam and switches detail composition by row selection', async () => {
    const user = userEvent.setup();
    const [baseFirstHistory, baseSecondHistory] = defaultHistoryFixtureScenario.listItems as [typeof defaultHistoryFixtureScenario.listItems[number], typeof defaultHistoryFixtureScenario.listItems[number]];
    const firstHistory = {
      ...baseFirstHistory,
      responsePreviewSizeLabel: '73 B preview',
      responsePreviewPolicy: 'Persisted response preview is bounded and redacted before deeper diagnostics are added.',
      requestInputSummary: '0 params · 3 headers · json body · bearer',
      requestParamCount: 0,
      requestHeaderCount: 3,
    };
    const secondHistory = {
      ...baseSecondHistory,
      responsePreviewSizeLabel: '56 B preview',
      responsePreviewPolicy: 'Persisted response preview is bounded and redacted before deeper diagnostics are added.',
      requestInputSummary: '2 params · 2 headers · No body · No auth',
      requestParamCount: 2,
      requestHeaderCount: 2,
      errorCode: 'upstream_503',
      errorSummary: 'Transport returned a retryable 503 summary.',
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [firstHistory, secondHistory] });
      }

      if (url === `/api/execution-histories/${firstHistory.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ history: firstHistory });
      }

      if (url === `/api/execution-histories/${secondHistory.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ history: secondHistory });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByText(/History reads persisted execution summaries from the runtime lane/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Search history')).toBeInTheDocument();
    expect(screen.getByLabelText('Execution outcome filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open history Create user' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'History detail' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'History result tabs' })).toBeInTheDocument();
    expect(screen.getByText('73 B preview')).toBeInTheDocument();
    expect(screen.getByText(/bounded and redacted before deeper diagnostics/i)).toBeInTheDocument();

    expect(screen.getByText('Succeeded', { selector: '[data-kind="executionOutcome"]' })).toHaveAttribute(
      'data-kind',
      'executionOutcome',
    );
    expect(screen.getByText('200 OK', { selector: '[data-kind="transportOutcome"]' })).toHaveAttribute(
      'data-kind',
      'transportOutcome',
    );
    expect(screen.getByText('All tests passed', { selector: '[data-kind="testSummary"]' })).toHaveAttribute(
      'data-kind',
      'testSummary',
    );
    expect(screen.queryByText('Mocked', { selector: '[data-kind="mockOutcome"]' })).not.toBeInTheDocument();

    const historyList = await screen.findByLabelText('History list');
    await user.click(within(historyList).getByRole('button', { name: 'Open history Load dashboard' }));

    expect(screen.getByText(/GET https:\/\/api.example.com\/dashboard ran from an ad hoc tab/i)).toBeInTheDocument();
    expect(screen.getByText('56 B preview')).toBeInTheDocument();
    expect(screen.getAllByText('503 Service Unavailable', { selector: '[data-kind="transportOutcome"]' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Some tests failed', { selector: '[data-kind="testSummary"]' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Console' }));
    expect(screen.getByRole('heading', { name: 'Console summary' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tests' }));
    expect(screen.getByRole('heading', { name: 'Tests summary' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution Info' }));
    expect(screen.getByRole('heading', { name: 'Execution info' })).toBeInTheDocument();
    expect(screen.getByText('upstream_503')).toBeInTheDocument();
    expect(screen.getByText('Transport returned a retryable 503 summary.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => getUrl(input as RequestInfo | URL) === '/api/execution-histories')).toBe(true);
    expect(
      fetchMock.mock.calls.some(([input]) => getUrl(input as RequestInfo | URL) === `/api/execution-histories/${secondHistory.id}`),
    ).toBe(true);
  });

  it('shows empty state when the persisted history query returns no executions', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await waitFor(() => expect(screen.getByText('No history yet')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'No history selected' })).toBeInTheDocument();
  });

  it('shows degraded state when the persisted history query fails', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
        return createApiError('SQLite history query failed');
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await waitFor(() => expect(screen.getByText('History observation is degraded')).toBeInTheDocument());
    expect(screen.getByText(/SQLite history query failed/i)).toBeInTheDocument();
  });

  it('shows a newly run execution in history without merging history state into active-tab result state', async () => {
    const user = userEvent.setup();
    let historyItems = [...defaultHistoryFixtureScenario.listItems];

    const runtimeProbeHistory = {
      ...defaultHistoryFixtureScenario.listItems[0],
      id: 'execution-history-runtime-probe',
      executionId: 'execution-history-runtime-probe',
      requestLabel: 'Runtime probe',
      method: 'GET',
      url: 'https://api.example.com/runtime',
      hostPathHint: 'api.example.com/runtime',
      executedAtLabel: '2026-03-20T10:02:00.120Z',
      startedAtLabel: '2026-03-20T10:02:00.000Z',
      completedAtLabel: '2026-03-20T10:02:00.120Z',
      durationLabel: '120 ms',
      durationMs: 120,
      executionOutcome: 'Succeeded' as const,
      transportOutcome: 'HTTP 201',
      transportStatusCode: 201,
      testOutcome: 'No tests' as const,
      testSummaryLabel: 'No tests persisted',
      responseSummary: 'Persisted history captured HTTP 201 and a bounded response preview.',
      headersSummary: '1 response header persisted in redacted summary form.',
      bodyHint: '30 characters captured from the persisted response preview.',
      bodyPreview: '{"ok":true,"requestId":"demo-1"}',
      requestSnapshotSummary: 'GET https://api.example.com/runtime was persisted as a bounded redacted request snapshot for history review.',
      requestParams: [],
      requestHeaders: [],
      requestBodyMode: 'none' as const,
      requestBodyText: '',
      requestAuth: {
        type: 'none' as const,
        bearerToken: '',
        basicUsername: '',
        basicPassword: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyPlacement: 'header' as const,
      },
      consoleSummary: 'No console entries were persisted. Live script-linked console remains deferred.',
      consolePreview: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testsSummary: 'No persisted test assertions are available for this execution.',
      assertionCount: 0,
      passedAssertions: 0,
      failedAssertions: 0,
      testsPreview: ['No persisted test assertions are available for this execution.'],
      environmentLabel: 'No environment persisted',
      sourceLabel: 'Ad hoc request snapshot',
      timelineEntries: [
        {
          id: 'runtime-prepared',
          title: 'Request prepared',
          summary: 'Prepared GET api.example.com/runtime from a redacted request snapshot.',
        },
        {
          id: 'runtime-transport',
          title: 'Transport completed',
          summary: 'Persisted transport summary recorded HTTP 201.',
        },
        {
          id: 'runtime-finalized',
          title: 'Result finalized',
          summary: 'Persisted history keeps redacted response, console, tests, and execution metadata summaries.',
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/executions/run' && init?.method === 'POST') {
        historyItems = [runtimeProbeHistory, ...historyItems];

        return createApiResponse({
          execution: {
            executionId: 'execution-history-runtime-probe',
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
        });
      }

      if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: historyItems });
      }

      if (url === `/api/execution-histories/${runtimeProbeHistory.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ history: runtimeProbeHistory });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/workspace'] });

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(within(explorer).getByRole('button', { name: 'New Request' }));
    await user.type(screen.getByLabelText('Request name'), 'Runtime probe');
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/runtime');

    await user.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() => expect(screen.getByTestId('request-response-preview')).toHaveTextContent('demo-1'));

    const commandStateEntries = Object.values(useRequestCommandStore.getState().byTabId);
    expect(commandStateEntries).toHaveLength(1);
    expect(commandStateEntries[0]?.run.latestExecution?.executionId).toBe('execution-history-runtime-probe');

    await user.click(screen.getByRole('link', { name: /history/i }));

    expect(await screen.findByRole('button', { name: 'Open history Runtime probe' })).toBeInTheDocument();
    expect(screen.getByText(/GET https:\/\/api.example.com\/runtime was persisted as a bounded redacted request snapshot/i)).toBeInTheDocument();
    expect(screen.getAllByText('HTTP 201', { selector: '[data-kind="transportOutcome"]' }).length).toBeGreaterThan(0);
    expect(screen.getByText('No tests persisted')).toBeInTheDocument();
    expect(useHistoryStore.getState().selectedHistoryId).toBe(null);
    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(1);
  });
});

