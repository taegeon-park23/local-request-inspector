import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RequestBuilderApiError,
  createRequestDefinitionInput,
  parseApiJsonResponse,
  runRequestDefinitionWithUpload,
} from '@client/features/request-builder/request-builder.api';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';

afterEach(() => {
  vi.unstubAllGlobals();
});

function createTab(overrides?: Partial<RequestTabRecord>): RequestTabRecord {
  return {
    id: 'quick-1',
    sourceKey: 'quick-1',
    title: 'Quick Request',
    methodLabel: 'GET',
    source: 'quick',
    tabMode: 'pinned',
    summary: 'Session-only request draft.',
    hasUnsavedChanges: false,
    ...overrides,
  };
}

function createDraft(overrides?: Partial<RequestDraftState>): RequestDraftState {
  return {
    tabId: 'quick-1',
    name: '',
    method: 'GET',
    url: 'https://api.example.com/health',
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
        mode: 'inline',
        sourceCode: '',
      },
      postResponse: {
        mode: 'inline',
        sourceCode: '',
      },
      tests: {
        mode: 'inline',
        sourceCode: '',
      },
    },
    activeEditorTab: 'params',
    dirty: false,
    ...overrides,
  };
}

describe('createRequestDefinitionInput', () => {
  it('uses the localized fallback title when a detached or quick draft name is blank', () => {
    const input = createRequestDefinitionInput(
      createTab(),
      createDraft(),
      { fallbackTitle: '제목 없는 요청' },
    );

    expect(input.name).toBe('제목 없는 요청');
  });

  it('falls back to the tab title when no explicit localized title is provided', () => {
    const input = createRequestDefinitionInput(createTab(), createDraft());

    expect(input.name).toBe('Quick Request');
  });

  it('sanitizes multipart file row values while preserving row type metadata', () => {
    const input = createRequestDefinitionInput(
      createTab(),
      createDraft({
        name: 'Runtime probe',
        method: 'POST',
        bodyMode: 'multipart-form-data',
        multipartBody: [
          {
            id: 'row-file',
            key: 'attachment',
            value: 'legacy-value',
            enabled: true,
            valueType: 'file',
          },
          {
            id: 'row-text',
            key: 'note',
            value: 'keep me',
            enabled: true,
            valueType: 'text',
          },
        ],
      }),
    );

    expect(input.multipartBody).toEqual([
      {
        id: 'row-file',
        key: 'attachment',
        value: '',
        enabled: true,
        valueType: 'file',
      },
      {
        id: 'row-text',
        key: 'note',
        value: 'keep me',
        enabled: true,
        valueType: 'text',
      },
    ]);
  });
});

describe('runRequestDefinitionWithUpload', () => {
  it('posts request JSON and selected files to /api/executions/run-upload', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      expect(url).toBe('/api/executions/run-upload');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeInstanceOf(FormData);

      const body = init?.body as FormData;
      const requestPayload = body.get('request');
      expect(typeof requestPayload).toBe('string');
      expect(JSON.parse(String(requestPayload))).toMatchObject({
        name: 'Runtime probe',
        method: 'POST',
      });

      const uploadedFiles = body.getAll('file:row-file');
      expect(uploadedFiles).toHaveLength(2);

      return new Response(JSON.stringify({
        data: {
          execution: {
            executionId: 'execution-upload-1',
            executionOutcome: 'Succeeded',
            responseStatus: 200,
            responseStatusLabel: '200 OK',
            responseHeaders: [],
            responseHeadersSummary: 'No headers',
            responseBodyPreview: '',
            responseBodyHint: '',
            startedAt: '2026-03-26T00:00:00.000Z',
            completedAt: '2026-03-26T00:00:00.000Z',
            durationMs: 1,
            consoleSummary: 'No console entries.',
            consoleEntries: [],
            testsSummary: 'No tests recorded.',
            testEntries: [],
          },
        },
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const requestInput = createRequestDefinitionInput(
      createTab(),
      createDraft({
        name: 'Runtime probe',
        method: 'POST',
        bodyMode: 'multipart-form-data',
        multipartBody: [
          {
            id: 'row-file',
            key: 'attachment',
            value: '',
            enabled: true,
            valueType: 'file',
          },
        ],
      }),
    );

    const execution = await runRequestDefinitionWithUpload(requestInput, {
      'row-file': [
        new File(['a'], 'a.txt', { type: 'text/plain' }),
        new File(['b'], 'b.txt', { type: 'text/plain' }),
      ],
    });
    expect(execution.executionId).toBe('execution-upload-1');
  });
});

describe('parseApiJsonResponse', () => {
  it('returns the data envelope payload on success', async () => {
    const response = new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const payload = await parseApiJsonResponse<{ ok: boolean }>(response);

    expect(payload.ok).toBe(true);
  });

  it('maps proxy connection failures to backend_unavailable errors', async () => {
    const response = new Response('[vite] http proxy error: AggregateError [ECONNREFUSED]', {
      status: 500,
    });

    await expect(parseApiJsonResponse<{ ok: boolean }>(response)).rejects.toMatchObject({
      name: 'RequestBuilderApiError',
      code: 'backend_unavailable',
      status: 500,
      retryable: true,
    });
  });

  it('throws invalid_api_response when success payload is not JSON envelope', async () => {
    const response = new Response('not-json-response', {
      status: 200,
    });

    await expect(parseApiJsonResponse<{ ok: boolean }>(response)).rejects.toMatchObject({
      name: 'RequestBuilderApiError',
      code: 'invalid_api_response',
      status: 200,
    });
  });

  it('keeps backend-provided api error envelopes intact', async () => {
    const response = new Response(JSON.stringify({
      error: {
        code: 'request_conflict',
        message: 'Conflict detected.',
        details: {
          updatedAt: '2026-03-26T00:00:00.000Z',
        },
        retryable: false,
      },
    }), {
      status: 409,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    try {
      await parseApiJsonResponse<{ ok: boolean }>(response);
      throw new Error('Expected parseApiJsonResponse to throw RequestBuilderApiError.');
    } catch (error) {
      expect(error).toBeInstanceOf(RequestBuilderApiError);
      expect((error as RequestBuilderApiError).code).toBe('request_conflict');
      expect((error as RequestBuilderApiError).status).toBe(409);
      expect((error as RequestBuilderApiError).details).toMatchObject({
        updatedAt: '2026-03-26T00:00:00.000Z',
      });
    }
  });
});