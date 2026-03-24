import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import {
  resetShellStore,
  shellDensityPreferenceStorageKey,
  shellFloatingExplorerDefaultOpenStorageKey,
  shellNavRailPreferenceStorageKey,
} from '@client/app/providers/shell-store';
import { defaultCaptureFixtureRecords } from '@client/features/captures/data/capture-fixtures';
import { resetCapturesStore } from '@client/features/captures/state/captures-store';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import { resetHistoryStore } from '@client/features/history/state/history-store';
import { defaultMockRuleFixtureRecords } from '@client/features/mocks/data/mock-rule-fixtures';
import { resetMocksStore } from '@client/features/mocks/state/mocks-store';
import { defaultEnvironmentFixtureDetails, defaultEnvironmentFixtureSummaries } from '@client/features/environments/data/environment-fixtures';
import { resetRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { resetRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { defaultScriptTemplateFixtureRecords, defaultSavedScriptFixtureRecords } from '@client/features/scripts/data/script-fixtures';
import { defaultRuntimeStatusFixture } from '@client/features/settings/data/runtime-status-fixtures';
import { resetWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { resetWorkspaceUiStore } from '@client/features/workspace/state/workspace-ui-store';
import { resetReplayRunStore } from '@client/shared/replay-run-store';

let objectUrlSequence = 0;

async function readBlobText(blob: Blob) {
  const blobWithArrayBuffer = blob as Blob & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof blobWithArrayBuffer.arrayBuffer === 'function') {
    const buffer = await blobWithArrayBuffer.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  if (typeof FileReader === 'function') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => {
        reject(reader.error ?? new Error('Failed to read blob text in the test environment.'));
      };
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        if (reader.result instanceof ArrayBuffer) {
          resolve(new TextDecoder().decode(reader.result));
          return;
        }

        resolve('');
      };
      reader.readAsText(blob);
    });
  }

  throw new Error('Blob text reading is not available in the test environment.');
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

const defaultWorkspaceSavedRequest = {
  id: 'request-health-check',
  workspaceId: 'local-workspace',
  name: 'Health check',
  method: 'GET',
  url: 'http://localhost:5671/health',
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
  requestGroupId: 'request-group-general',
  requestGroupName: 'General',

  summary: 'Starter persisted health check request.',
  createdAt: '2026-03-21T00:00:00.000Z',
  updatedAt: '2026-03-21T00:00:00.000Z',
} as const;

beforeEach(() => {
  const defaultFetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrl(input);

    if (url === '/api/workspaces/local-workspace/requests' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: [defaultWorkspaceSavedRequest] });
    }

    if (url === '/api/workspaces/local-workspace/request-tree' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({
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
                    id: 'request-node-request-health-check',
                    kind: 'request',
                    name: 'Health check',
                    request: {
                      id: 'request-health-check',
                      name: 'Health check',
                      methodLabel: 'GET',
                      summary: 'Starter persisted health check request.',
                      collectionId: 'collection-saved-requests',
                      collectionName: 'Saved Requests',
                      requestGroupId: 'request-group-general',
                      requestGroupName: 'General',
                    
                      updatedAt: '2026-03-21T00:00:00.000Z',
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    if (url.startsWith('/api/requests/') && (!init || !init.method || init.method === 'GET') && !url.endsWith('/resource-bundle')) {
      const requestId = url.split('/').pop() ?? '';
      return requestId === defaultWorkspaceSavedRequest.id
        ? createApiResponse({ request: defaultWorkspaceSavedRequest })
        : createApiError(`Saved request ${requestId} was not found.`);
    }

    if (url.startsWith('/api/requests/') && init?.method === 'DELETE') {
      const requestId = url.split('/').pop() ?? '';
      return createApiResponse({ deletedRequestId: requestId });
    }

    if (url === '/api/workspaces/local-workspace/environments' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultEnvironmentFixtureSummaries });
    }

    if (url.startsWith('/api/environments/') && (!init || !init.method || init.method === 'GET')) {
      const environmentId = url.split('/').pop() ?? '';
      const environment = defaultEnvironmentFixtureDetails.find((item) => item.id === environmentId);

      return environment
        ? createApiResponse({ environment })
        : createApiError(`Environment ${environmentId} was not found.`);
    }

    if (url === '/api/workspaces/local-workspace/scripts' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultSavedScriptFixtureRecords });
    }

    if (url.startsWith('/api/scripts/') && (!init || !init.method || init.method === 'GET')) {
      const scriptId = url.split('/').pop() ?? '';
      const script = defaultSavedScriptFixtureRecords.find((item) => item.id === scriptId);

      return script
        ? createApiResponse({ script })
        : createApiError(`Saved script ${scriptId} was not found.`);
    }

    if (url === '/api/script-templates' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultScriptTemplateFixtureRecords });
    }

    if (url.startsWith('/api/script-templates/') && (!init || !init.method || init.method === 'GET')) {
      const templateId = url.split('/').pop() ?? '';
      const template = defaultScriptTemplateFixtureRecords.find((item) => item.id === templateId);

      return template
        ? createApiResponse({ template })
        : createApiError(`Script template ${templateId} was not found.`);
    }

    if (url === '/api/settings/runtime-status' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ status: defaultRuntimeStatusFixture });
    }

    if (url === '/api/workspaces/local-workspace/resource-bundle' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({
        bundle: {
          schemaVersion: 3,
          resourceKind: 'local-request-inspector-authored-resource-bundle',
          exportedAt: '2026-03-21T00:00:00.000Z',
          workspaceId: 'local-workspace',
          collections: [{
            id: 'collection-saved-requests',
            workspaceId: 'local-workspace',
            name: 'Saved Requests',
            description: '',
          }],
          requestGroups: [{
            id: 'request-group-general',
            workspaceId: 'local-workspace',
            collectionId: 'collection-saved-requests',
            name: 'General',
            description: '',
          }],
          requests: [defaultWorkspaceSavedRequest],
          mockRules: defaultMockRuleFixtureRecords,
          scripts: defaultSavedScriptFixtureRecords,
        },
      });
    }

    if (url === '/api/workspaces/local-workspace/resource-bundle/import' && init?.method === 'POST') {
      return createApiResponse({
        result: {
          acceptedCollections: [],
          acceptedRequestGroups: [],
          acceptedRequests: [],
          acceptedMockRules: [],
          acceptedScripts: [],
          rejected: [],
          summary: {
            acceptedCount: 0,
            rejectedCount: 0,
            createdCollectionCount: 0,
            createdRequestGroupCount: 0,
            createdRequestCount: 0,
            createdMockRuleCount: 0,
            createdScriptCount: 0,
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
            createdCollectionCount: 0,
            createdRequestGroupCount: 0,
            createdRequestCount: 0,
            createdMockRuleCount: 0,
            createdScriptCount: 0,
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
          schemaVersion: 3,
          resourceKind: 'local-request-inspector-authored-resource-bundle',
          exportedAt: '2026-03-21T00:00:00.000Z',
          workspaceId: 'local-workspace',
          collections: [{
            id: 'collection-saved-requests',
            workspaceId: 'local-workspace',
            name: 'Saved Requests',
            description: '',
          }],
          requestGroups: [{
            id: 'request-group-general',
            workspaceId: 'local-workspace',
            collectionId: 'collection-saved-requests',
            name: 'General',
            description: '',
          }],
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
            collectionId: 'collection-saved-requests',
            collectionName: 'Saved Requests',
            requestGroupId: 'request-group-general',
            requestGroupName: 'General',
          
            createdAt: '2026-03-21T00:00:00.000Z',
            updatedAt: '2026-03-21T00:00:00.000Z',
          }],
          mockRules: [],
          scripts: [],
        },
      });
    }

    if (url.startsWith('/api/mock-rules/') && url.endsWith('/resource-bundle') && (!init || !init.method || init.method === 'GET')) {
      const mockRuleId = url.split('/')[3] ?? '';
      const rule = defaultMockRuleFixtureRecords.find((item) => item.id === mockRuleId) ?? defaultMockRuleFixtureRecords[0];
      return createApiResponse({
        bundle: {
          schemaVersion: 3,
          resourceKind: 'local-request-inspector-authored-resource-bundle',
          exportedAt: '2026-03-21T00:00:00.000Z',
          workspaceId: 'local-workspace',
          collections: [],
          requestGroups: [],
          requests: [],
          mockRules: rule ? [rule] : [],
          scripts: [],
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

    if (url.startsWith('/api/captured-requests/') && url.endsWith('/replay') && init?.method === 'POST') {
      const capturedRequestId = url.split('/')[3] ?? '';
      const capture = defaultCaptureFixtureRecords.find((item) => item.id === capturedRequestId);

      return capture
        ? createApiResponse({
          request: {
            name: `Replay of ${capture.method} ${capture.path}`,
            workspaceId: 'local-workspace',
            method: capture.method,
            url: capture.url,
            selectedEnvironmentId: null,
            params: [],
            headers: capture.requestHeaders.map((header, index) => ({
              id: `capture-header-${index + 1}`,
              key: header.key,
              value: header.value,
              enabled: true,
            })),
            bodyMode: capture.bodyModeHint,
            bodyText: capture.bodyModeHint === 'none' ? '' : capture.bodyPreview,
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
          },
        })
        : createApiError(`Captured request ${capturedRequestId} was not found.`);
    }

    if (url === '/api/execution-histories' && (!init || !init.method || init.method === 'GET')) {
      return createApiResponse({ items: defaultHistoryFixtureScenario.listItems });
    }

    if (
      url.startsWith('/api/execution-histories/')
      && !url.endsWith('/result')
      && !url.endsWith('/test-results')
      && (!init || !init.method || init.method === 'GET')
    ) {
      const executionId = url.split('/').pop() ?? '';
      const history = defaultHistoryFixtureScenario.listItems.find((item) => item.id === executionId || item.executionId === executionId);

      return history
        ? createApiResponse({ history })
        : createApiError(`Execution history ${executionId} was not found.`);
    }

    if (url.startsWith('/api/execution-histories/') && url.endsWith('/result') && (!init || !init.method || init.method === 'GET')) {
      const executionId = url.split('/')[3] ?? '';
      const history = defaultHistoryFixtureScenario.listItems.find((item) => item.id === executionId || item.executionId === executionId);

      return history
        ? createApiResponse({
          result: {
            executionId: history.executionId,
            responseStatus: history.transportStatusCode,
            responseHeaders: [{ name: 'content-type', value: 'application/json' }],
            responseBodyPreview: history.bodyPreview,
            responseBodyRedacted: true,
            stageStatus: {
              transport: history.stageSummaries?.find((entry) => entry.stageId === 'transport'),
            },
            logSummary: {
              consoleEntries: history.consoleLogCount,
              consoleWarnings: history.consoleWarningCount,
              consolePreview: history.consolePreview,
            },
            requestSnapshot: {},
            redactionApplied: true,
          },
        })
        : createApiError(`Execution history ${executionId} was not found.`);
    }

    if (url.startsWith('/api/execution-histories/') && url.endsWith('/test-results') && (!init || !init.method || init.method === 'GET')) {
      const executionId = url.split('/')[3] ?? '';
      const history = defaultHistoryFixtureScenario.listItems.find((item) => item.id === executionId || item.executionId === executionId);

      return history
        ? createApiResponse({
          items: history.testsPreview.map((entry, index) => ({
            id: `${executionId}-test-${index + 1}`,
            executionId: history.executionId,
            testName: entry,
            status: entry.toLowerCase().includes('failed') ? 'failed' : 'passed',
            message: entry,
            details: { stage: 'tests' },
            recordedAt: '2026-03-24T00:00:00.000Z',
          })),
        })
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
  window.localStorage.removeItem(shellNavRailPreferenceStorageKey);
  window.localStorage.removeItem(shellFloatingExplorerDefaultOpenStorageKey);
  window.localStorage.removeItem(shellDensityPreferenceStorageKey);
  resetShellStore();
  resetCapturesStore();
  resetHistoryStore();
  resetMocksStore();
  resetWorkspaceShellStore();
  resetWorkspaceUiStore();
  resetReplayRunStore();
  resetRequestDraftStore();
  resetRequestCommandStore();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});


