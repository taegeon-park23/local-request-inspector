import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { resetShellStore } from '@client/app/providers/shell-store';
import { defaultCaptureFixtureRecords } from '@client/features/captures/data/capture-fixtures';
import { resetCapturesStore } from '@client/features/captures/state/captures-store';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import { resetHistoryStore } from '@client/features/history/state/history-store';
import { resetMocksStore } from '@client/features/mocks/state/mocks-store';
import { resetRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { resetRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { resetWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createApiError(message: string, status = 404) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'not_found',
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

beforeEach(() => {
  const defaultFetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrl(input);

    if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: [] });
    }

    if (url === '/api/captured-requests' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultCaptureFixtureRecords });
    }

    if (url.startsWith('/api/captured-requests/') && (!init || !init.method || init.method === 'GET')) {
      const capturedRequestId = url.split('/').pop() ?? '';
      const capture = defaultCaptureFixtureRecords.find((item) => item.id === capturedRequestId);

      return capture
        ? createApiResponse({ capture })
        : createApiError(`Captured request ${capturedRequestId} was not found.`);
    }

    if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultHistoryFixtureScenario.listItems });
    }

    if (url.startsWith('/api/execution-histories/') && (!init || !init.method || init.method === 'GET')) {
      const executionId = url.split('/').pop() ?? '';
      const history = defaultHistoryFixtureScenario.listItems.find((item) => item.id === executionId || item.executionId === executionId);

      return history
        ? createApiResponse({ history })
        : createApiError(`Execution history ${executionId} was not found.`);
    }

    throw new Error(`Unhandled fetch in test setup: ${url}`);
  });

  vi.stubGlobal('fetch', defaultFetchMock);
});

afterEach(() => {
  cleanup();
  resetShellStore();
  resetCapturesStore();
  resetHistoryStore();
  resetMocksStore();
  resetWorkspaceShellStore();
  resetRequestDraftStore();
  resetRequestCommandStore();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
