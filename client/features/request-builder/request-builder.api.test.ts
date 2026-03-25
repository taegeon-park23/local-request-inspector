import { describe, expect, it } from 'vitest';
import { createRequestDefinitionInput } from '@client/features/request-builder/request-builder.api';
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