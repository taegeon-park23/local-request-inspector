import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRequestBuilderCommands } from '@client/features/request-builder/hooks/useRequestBuilderCommands';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { resetRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { resetRequestDraftStore, useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
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
    name: 'Runtime probe',
    method: 'GET',
    url: 'https://api.example.com/runtime',
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

function HookHarness({ activeTab, draft }: { activeTab: RequestTabRecord | null; draft: RequestDraftState | null }) {
  const { saveDisabledReason, runDisabledReason, handleRun, runStatus } = useRequestBuilderCommands(activeTab, draft);

  return (
    <div>
      <p data-testid="save-disabled">{saveDisabledReason ?? ''}</p>
      <p data-testid="run-disabled">{runDisabledReason ?? ''}</p>
      <button type="button" onClick={handleRun}>run</button>
      <p data-testid="response-status">{runStatus.latestExecution?.responseStatusLabel ?? ''}</p>
      <p data-testid="preview-size">{runStatus.latestExecution?.responsePreviewSizeLabel ?? ''}</p>
      <p data-testid="input-summary">{runStatus.latestExecution?.requestInputSummary ?? ''}</p>
      <p data-testid="tests-summary">{runStatus.latestExecution?.testsSummary ?? ''}</p>
      <p data-testid="stage-label">{runStatus.latestExecution?.stageSummaries?.[0]?.label ?? ''}</p>
    </div>
  );
}

afterEach(() => {
  resetRequestCommandStore();
  resetRequestDraftStore();
  vi.unstubAllGlobals();
});

describe('useRequestBuilderCommands localization', () => {
  it('renders Korean save and run disabled reasons for incomplete drafts', () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(
      <HookHarness
        activeTab={createTab()}
        draft={createDraft({ name: '', url: '' })}
      />,
      { initialLocale: 'ko' },
    );

    expect(screen.getByTestId('save-disabled')).toHaveTextContent('저장 전에 요청 이름을 입력하세요.');
    expect(screen.getByTestId('run-disabled')).toHaveTextContent('실행 전에 요청 URL을 입력하세요.');
  });

  it('renders Korean linked-script run guidance when the saved script is missing', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(
      <HookHarness
        activeTab={createTab()}
        draft={createDraft({
          scripts: {
            activeStage: 'pre-request',
            preRequest: {
              mode: 'linked',
              savedScriptId: 'saved-script-missing',
              savedScriptNameSnapshot: 'Missing script',
              linkedAt: '2026-03-25T00:00:00.000Z',
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
        })}
      />,
      { initialLocale: 'ko' },
    );

    await waitFor(() => expect(screen.getByTestId('run-disabled')).toHaveTextContent('실행 전에 사전 요청 단계의 누락된 연결 저장 스크립트를 복구하거나 분리하세요.'));
  });

  it('renders Korean failed-run fallback summaries after a local execution error', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/executions/run' && init?.method === 'POST') {
        throw new Error('Network down');
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(
      <HookHarness activeTab={createTab()} draft={createDraft()} />,
      { initialLocale: 'ko' },
    );

    await user.click(screen.getByRole('button', { name: 'run' }));

    await waitFor(() => expect(screen.getByTestId('response-status')).toHaveTextContent('응답 없음'));
    expect(screen.getByTestId('preview-size')).toHaveTextContent('저장된 미리보기가 없습니다');
    expect(screen.getByTestId('input-summary')).toHaveTextContent('파라미터 0개 · 헤더 0개 · 본문 없음 · 인증 없음');
    expect(screen.getByTestId('tests-summary')).toHaveTextContent('tests 단계가 완료되기 전에 실행 경로가 실패했기 때문에 테스트가 기록되지 않았습니다.');
    expect(screen.getByTestId('stage-label')).toHaveTextContent('전송');
  });
  it('renders multipart file method guidance when file rows are enabled on unsupported methods', () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(
      <HookHarness
        activeTab={createTab()}
        draft={createDraft({
          method: 'GET',
          bodyMode: 'multipart-form-data',
          multipartBody: [
            {
              id: 'multipart-file-row',
              key: 'attachment',
              value: '',
              enabled: true,
              valueType: 'file',
            },
          ],
        })}
      />,
    );

    expect(screen.getByTestId('run-disabled')).toHaveTextContent('Multipart file fields can run only with POST or PUT methods.');
  });

  it('blocks run when enabled multipart file rows have no selected files', () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(
      <HookHarness
        activeTab={createTab()}
        draft={createDraft({
          method: 'POST',
          bodyMode: 'multipart-form-data',
          multipartBody: [
            {
              id: 'multipart-file-row',
              key: 'attachment',
              value: '',
              enabled: true,
              valueType: 'file',
            },
          ],
        })}
      />,
    );

    expect(screen.getByTestId('run-disabled')).toHaveTextContent('Select at least one file for each enabled multipart file field before running.');
  });
  it('runs multipart file rows through run-upload when files are selected', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/executions/run-upload' && init?.method === 'POST') {
        return createApiResponse({
          execution: {
            executionId: 'execution-upload-1',
            executionOutcome: 'Succeeded',
            responseStatus: 200,
            responseStatusLabel: '200 OK',
            responseHeaders: [],
            responseHeadersSummary: 'No headers',
            responseBodyPreview: 'uploaded',
            responseBodyHint: 'preview',
            startedAt: '2026-03-26T00:00:00.000Z',
            completedAt: '2026-03-26T00:00:00.000Z',
            durationMs: 1,
            consoleSummary: 'No console entries.',
            consoleEntries: [],
            testsSummary: 'No tests recorded.',
            testEntries: [],
            stageSummaries: [],
          },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    useRequestDraftStore.setState({
      multipartFilesByTabId: {
        'quick-1': {
          'multipart-file-row': [new File(['hello'], 'demo.txt', { type: 'text/plain' })],
        },
      },
    });

    renderApp(
      <HookHarness
        activeTab={createTab()}
        draft={createDraft({
          method: 'POST',
          bodyMode: 'multipart-form-data',
          multipartBody: [
            {
              id: 'multipart-file-row',
              key: 'attachment',
              value: '',
              enabled: true,
              valueType: 'file',
            },
          ],
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'run' }));

    await waitFor(() => expect(screen.getByTestId('response-status')).toHaveTextContent('200 OK'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/executions/run-upload',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});