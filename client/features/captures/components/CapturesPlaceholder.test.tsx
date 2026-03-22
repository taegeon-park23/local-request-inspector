import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { defaultCaptureFixtureRecords } from '@client/features/captures/data/capture-fixtures';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { syntheticRuntimeCaptureEvents } from '@client/features/runtime-events/data/runtime-events-fixtures';
import { createSyntheticRuntimeEventsAdapter } from '@client/features/runtime-events/runtime-events-adapter';
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
        code: 'captured_request_query_failed',
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

const connectedAdapterFactory = () =>
  createSyntheticRuntimeEventsAdapter({
    captureEvents: [],
    terminalConnectionHealth: 'connected',
  });

describe('Captures S18 fidelity refinement', () => {
  it('renders persisted captures from the query seam and preserves mock outcome family detail', async () => {
    const firstCapture = defaultCaptureFixtureRecords[0]!;
    const secondCapture = defaultCaptureFixtureRecords[1]!;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [firstCapture, secondCapture] });
      }

      if (url === `/api/captured-requests/${firstCapture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture: firstCapture });
      }

      if (url === `/api/captured-requests/${secondCapture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture: secondCapture });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: connectedAdapterFactory,
    });

    expect(screen.getByRole('heading', { name: 'Captures' })).toBeInTheDocument();
    expect(screen.getByText(/Captures is an observation route for inbound traffic/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Search captures')).toBeInTheDocument();
    expect(screen.getByLabelText('Mock outcome filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Open capture POST \/webhooks\/stripe/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('connected', { selector: '[data-kind="connection"]' }).length).toBeGreaterThan(0));

    expect(screen.getByRole('heading', { name: 'Capture detail' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Capture detail tabs' })).toBeInTheDocument();
    expect(screen.getByText(/Real capture data now drives this route/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Request snapshot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Persistence summary' })).toBeInTheDocument();
    expect(screen.getByText('Inbound request snapshot')).toBeInTheDocument();
    expect(screen.getByText(/Persisted capture keeps/i)).toBeInTheDocument();
    expect(screen.getByText('JSON body · 2 field(s)')).toBeInTheDocument();
    expect(screen.getAllByText(/Preview policy/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Stored summary')).toBeInTheDocument();
    expect(screen.getByText('Handling summary')).toBeInTheDocument();
    expect(screen.getByText('Stripe webhook success')).toBeInTheDocument();
    expect(screen.getAllByText(/POST \/webhooks\/stripe(?:\?env=dev)? was observed at localhost:5671 as an inbound capture/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Mocked', { selector: '[data-kind="mockOutcome"]' })).toHaveAttribute('data-kind', 'mockOutcome');
    expect(screen.queryByText('Succeeded', { selector: '[data-kind="executionOutcome"]' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => getUrl(input as RequestInfo | URL) === '/api/captured-requests')).toBe(true);
  });

  it('changes detail when a persisted capture row is selected', async () => {
    const user = userEvent.setup();
    const firstCapture = defaultCaptureFixtureRecords[0]!;
    const secondCapture = defaultCaptureFixtureRecords[1]!;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [firstCapture, secondCapture] });
      }

      if (url === `/api/captured-requests/${firstCapture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture: firstCapture });
      }

      if (url === `/api/captured-requests/${secondCapture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture: secondCapture });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: connectedAdapterFactory,
    });

    const capturesList = await screen.findByLabelText('Captures list');
    await user.click(within(capturesList).getByRole('button', { name: /Open capture GET \/health/i }));

    expect((await screen.findAllByText(/GET \/health was observed at localhost:5671 as an inbound capture/i)).length).toBeGreaterThan(0);
    expect(screen.getByText('No request body preview was stored for this inbound capture.', { selector: 'pre' })).toBeInTheDocument();
    expect(screen.getAllByText('Bypassed', { selector: '[data-kind="mockOutcome"]' }).length).toBeGreaterThan(0);
    expect(useCapturesStore.getState().selectedCaptureId).toBe(secondCapture.id);
  });

  it('shows loading state while persisted captures are being queried', async () => {
    let resolveList!: (value: Response) => void;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(createApiResponse({ items: [] }));
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        return new Promise<Response>((resolve) => {
          resolveList = resolve;
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: connectedAdapterFactory,
    });

    expect(await screen.findByText('Loading persisted captures')).toBeInTheDocument();
    resolveList(createApiResponse({ items: [] }));
    await waitFor(() => expect(screen.getByText('No captures yet')).toBeInTheDocument());
  });

  it('shows empty state when the persisted captures query returns no rows', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: connectedAdapterFactory,
    });

    await waitFor(() => expect(screen.getByText('No captures yet')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'No capture selected' })).toBeInTheDocument();
  });

  it('shows degraded state when the persisted captures query fails', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiError('SQLite capture query failed');
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: connectedAdapterFactory,
    });

    await waitFor(() => expect(screen.getByText('Capture observation is degraded')).toBeInTheDocument());
    expect(screen.getByText(/SQLite capture query failed/i)).toBeInTheDocument();
  });

  it('refreshes persisted captures after a runtime event invalidates the query seam and drops stale detail when the selected row disappears', async () => {
    const firstCapture = defaultCaptureFixtureRecords[1]!;
    const refreshedCapture = defaultCaptureFixtureRecords[0]!;
    let listCallCount = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        listCallCount += 1;
        return createApiResponse({ items: listCallCount === 1 ? [firstCapture] : [refreshedCapture] });
      }

      if (url === `/api/captured-requests/${firstCapture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture: firstCapture });
      }

      if (url === `/api/captured-requests/${refreshedCapture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture: refreshedCapture });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: () =>
        createSyntheticRuntimeEventsAdapter({
          captureEvents: [syntheticRuntimeCaptureEvents[0]!],
          terminalConnectionHealth: 'connected',
        }),
    });

    expect(await screen.findByRole('button', { name: /Open capture GET \/health/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: /Open capture GET \/health/i })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Open capture POST \/webhooks\/stripe/i })).toBeInTheDocument();
    expect((await screen.findAllByText(/POST \/webhooks\/stripe(?:\?env=dev)? was observed at localhost:5671 as an inbound capture/i)).length).toBeGreaterThan(0);
    expect(useCapturesStore.getState().selectedCaptureId).toBe(refreshedCapture.id);
    expect(listCallCount).toBeGreaterThanOrEqual(2);
  });

  it('keeps replay edit-first and separate from request draft state when real capture data is selected', async () => {
    const user = userEvent.setup();
    const capture = defaultCaptureFixtureRecords[0]!;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ items: [capture] });
      }

      if (url === `/api/captured-requests/${capture.id}` && (!init || !init.method || init.method === 'GET')) {
        return createApiResponse({ capture });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: connectedAdapterFactory,
    });

    expect(await screen.findByRole('button', { name: 'Open Replay Draft' })).toBeInTheDocument();
    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Run Replay Now' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Open Replay Draft' }));

    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getAllByText('Opened from capture', { selector: '.workspace-chip--replay' }).length).toBeGreaterThan(0);
    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(1);
  });
});
