import { describe, expect, it } from 'vitest';
import {
  RequestBuilderApiError,
  createRequestDefinitionInput,
  parseApiJsonResponse,
} from '@client/features/request-builder/request-builder.api';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';

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