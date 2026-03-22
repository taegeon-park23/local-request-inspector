import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { resetShellStore } from '@client/app/providers/shell-store';
import { defaultCaptureFixtureRecords } from '@client/features/captures/data/capture-fixtures';
import { resetCapturesStore } from '@client/features/captures/state/captures-store';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import { resetHistoryStore } from '@client/features/history/state/history-store';
import { defaultMockRuleFixtureRecords } from '@client/features/mocks/data/mock-rule-fixtures';
import { resetMocksStore } from '@client/features/mocks/state/mocks-store';
import { resetRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { resetRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { resetWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

let objectUrlSequence = 0;

async function readBlobText(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  return new TextDecoder().decode(buffer);
}

function ensureBrowserApiPolyfills() {
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: () => {
        objectUrlSequence += 1;
        return `blob:test-object-url-${objectUrlSequence}`;
      },
    });
  }

  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  }

  const blobPrototype = globalThis.Blob?.prototype as Blob & {
    text?: () => Promise<string>;
  };

  if (blobPrototype && typeof blobPrototype.text !== 'function') {
    Object.defineProperty(blobPrototype, 'text', {
      configurable: true,
      writable: true,
      value: function text(this: Blob) {
        return readBlobText(this);
      },
    });
  }

  const filePrototype = globalThis.File?.prototype as Blob & {
    text?: () => Promise<string>;
  };

  if (filePrototype && typeof filePrototype.text !== 'function') {
    Object.defineProperty(filePrototype, 'text', {
      configurable: true,
      writable: true,
      value: function text(this: Blob) {
        return readBlobText(this);
      },
    });
  }
}

ensureBrowserApiPolyfills();

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

    if (url === '/api/workspaces/local-workspace/resource-bundle' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({
        bundle: {
          schemaVersion: 1,
          resourceKind: 'local-request-inspector-authored-resource-bundle',
          exportedAt: '2026-03-21T00:00:00.000Z',
          workspaceId: 'local-workspace',
          requests: [],
          mockRules: defaultMockRuleFixtureRecords,
        },
      });
    }

    if (url === '/api/workspaces/local-workspace/resource-bundle/import' && init?.method === 'POST') {
      return createApiResponse({
        result: {
          acceptedRequests: [],
          acceptedMockRules: [],
          rejected: [],
          summary: {
            acceptedCount: 0,
            rejectedCount: 0,
            createdRequestCount: 0,
            createdMockRuleCount: 0,
            renamedCount: 0,
            importedNamesPreview: [],
            rejectedReasonSummary: [],
            duplicateIdentityPolicy: 'new_identity',
          },
        },
      });
    }

    if (url === '/api/workspaces/local-workspace/resource-bundle/import-preview' && init?.method === 'POST') {
      return createApiResponse({
        preview: {
          rejected: [],
          summary: {
            acceptedCount: 0,
            rejectedCount: 0,
            createdRequestCount: 0,
            createdMockRuleCount: 0,
            renamedCount: 0,
            importedNamesPreview: [],
            rejectedReasonSummary: [],
            duplicateIdentityPolicy: 'new_identity',
          },
        },
      });
    }

    if (url.startsWith('/api/requests/') && url.endsWith('/resource-bundle') && (!init || !init.method || init.method === 'GET')) {
      const requestId = url.split('/')[3] ?? '';
      return createApiResponse({
        bundle: {
          schemaVersion: 1,
          resourceKind: 'local-request-inspector-authored-resource-bundle',
          exportedAt: '2026-03-21T00:00:00.000Z',
          workspaceId: 'local-workspace',
          requests: [{
            id: requestId,
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
            createdAt: '2026-03-21T00:00:00.000Z',
            updatedAt: '2026-03-21T00:00:00.000Z',
          }],
          mockRules: [],
        },
      });
    }

    if (url.startsWith('/api/mock-rules/') && url.endsWith('/resource-bundle') && (!init || !init.method || init.method === 'GET')) {
      const mockRuleId = url.split('/')[3] ?? '';
      const rule = defaultMockRuleFixtureRecords.find((item) => item.id === mockRuleId) ?? defaultMockRuleFixtureRecords[0];
      return createApiResponse({
        bundle: {
          schemaVersion: 1,
          resourceKind: 'local-request-inspector-authored-resource-bundle',
          exportedAt: '2026-03-21T00:00:00.000Z',
          workspaceId: 'local-workspace',
          requests: [],
          mockRules: rule ? [rule] : [],
        },
      });
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

    if (url === '/api/workspaces/local-workspace/mock-rules' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultMockRuleFixtureRecords });
    }

    if (url.startsWith('/api/mock-rules/') && (!init || !init.method || init.method === 'GET')) {
      const mockRuleId = url.split('/').pop() ?? '';
      const rule = defaultMockRuleFixtureRecords.find((item) => item.id === mockRuleId);

      return rule
        ? createApiResponse({ rule })
        : createApiError(`Mock rule ${mockRuleId} was not found.`);
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

