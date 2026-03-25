import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestWorkSurface } from '@client/features/request-builder/components/RequestWorkSurface';
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
    id: 'detached-1',
    sourceKey: 'detached-1',
    title: 'Untitled Request',
    methodLabel: 'GET',
    source: 'detached',
    tabMode: 'pinned',
    summary: 'Unsaved request authoring draft.',
    hasUnsavedChanges: false,
    ...overrides,
  };
}

afterEach(() => {
  resetRequestDraftStore();
  resetRequestCommandStore();
  vi.unstubAllGlobals();
});

describe('RequestWorkSurface localization', () => {
  it('renders Korean accessibility labels for request controls', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = getUrl(input);

      if (url === '/api/workspaces/local-workspace/environments') {
        return createApiResponse({
          items: [
            {
              id: 'environment-local',
              workspaceId: 'local-workspace',
              name: '로컬 API',
              description: 'Local defaults.',
              isDefault: true,
              variableCount: 2,
              enabledVariableCount: 2,
              secretVariableCount: 0,
              resolutionSummary: '2 variables',
              createdAt: '2026-03-25T00:00:00.000Z',
              updatedAt: '2026-03-25T00:00:00.000Z',
            },
          ],
        });
      }

      if (url === '/api/workspaces/local-workspace/scripts') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const activeTab = createTab();
    useRequestDraftStore.getState().ensureDraftForTab(activeTab, {
      name: '인증 점검',
      method: 'POST',
      url: 'https://api.example.com/auth-check',
      selectedEnvironmentId: 'environment-local',
      collectionId: 'collection-team',
      collectionName: '팀 API',
      requestGroupId: 'group-auth',
      requestGroupName: '인증',
      params: [
        {
          id: 'param-env',
          enabled: true,
          key: 'env',
          value: 'local',
        },
      ],
      headers: [
        {
          id: 'header-trace',
          enabled: true,
          key: 'x-trace-id',
          value: 'trace-1',
        },
      ],
      auth: {
        type: 'bearer',
        bearerToken: 'demo-token',
      },
    }, { replace: true });

    renderApp(
      <RequestWorkSurface
        activeTab={activeTab}
        onCreateRequest={vi.fn()}
        placementOptions={[
          {
            collectionId: 'collection-team',
            collectionName: '팀 API',
            requestGroups: [
              {
                requestGroupId: 'group-auth',
                requestGroupName: '인증',
                requestGroupPathLabel: '인증',
              },
            ],
          },
        ]}
      />,
      { initialLocale: 'ko' },
    );

    await waitFor(() => expect(screen.getByLabelText('요청 이름')).toHaveValue('인증 점검'));
    expect(screen.getByLabelText('저장 컬렉션')).toHaveValue('collection-team');
    expect(screen.getByLabelText('저장 요청 그룹')).toHaveValue('group-auth');
    expect(screen.getByLabelText('요청 환경')).toHaveValue('environment-local');
    expect(screen.getByLabelText('요청 헤더 작업')).toBeInTheDocument();
    expect(screen.getByLabelText('요청 메서드')).toHaveValue('POST');
    expect(screen.getByLabelText('요청 URL')).toHaveValue('https://api.example.com/auth-check');
    expect(screen.getByLabelText('요청 URL')).toHaveAttribute('placeholder', 'https://api.example.com/resource');
    expect(screen.getByLabelText('편집기 표면 탭')).toBeInTheDocument();
    expect(screen.getByLabelText('파라미터 1행 키')).toHaveValue('env');
    expect(screen.getByLabelText('파라미터 1행 값')).toHaveValue('local');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '헤더' }));
    expect(screen.getByLabelText('헤더 1행 키')).toHaveValue('x-trace-id');
    expect(screen.getByRole('button', { name: '헤더 1행 제거' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '인증' }));
    expect(await screen.findByLabelText('Bearer 토큰')).toHaveValue('demo-token');

    await user.click(screen.getByRole('button', { name: '스크립트' }));
    expect(await screen.findByRole('tablist', { name: '스크립트 단계' })).toBeInTheDocument();
    expect(screen.getByLabelText('사전 요청 스크립트')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '응답 후' }));
    expect(screen.getByLabelText('응답 후 스크립트')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '테스트' }));
    expect(screen.getByLabelText('테스트 스크립트')).toBeInTheDocument();
  });
  it('renders Korean replay source copy from semantic replay metadata', async () => {
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

    const replayTab = createTab({
      id: 'replay-1',
      sourceKey: 'replay-capture-1',
      title: 'Replay of POST /webhooks/stripe',
      methodLabel: 'POST',
      source: 'replay',
      summary: 'Replay draft',
      replaySource: {
        kind: 'capture',
        label: 'Opened from capture',
        description: 'POST localhost:5671/webhooks/stripe captured at 2026-03-25 09:15.',
        methodLabel: 'POST',
        targetLabel: 'localhost:5671/webhooks/stripe',
        timestampLabel: '2026-03-25 09:15',
      },
    });

    useRequestDraftStore.getState().ensureDraftForTab(replayTab, {
      name: 'Replay of POST /webhooks/stripe',
      method: 'POST',
      url: 'http://localhost:5671/webhooks/stripe',
    }, { replace: true });

    renderApp(
      <RequestWorkSurface
        activeTab={replayTab}
        onCreateRequest={vi.fn()}
        placementOptions={[]}
      />,
      { initialLocale: 'ko' },
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Replay of POST /webhooks/stripe' })).toBeInTheDocument());
    expect(screen.getAllByText('캡처에서 열림', { selector: '.workspace-chip--replay' }).length).toBeGreaterThan(0);
    expect(screen.getByText('2026-03-25 09:15에 수신된 POST localhost:5671/webhooks/stripe 캡처에서 열었습니다.')).toBeInTheDocument();
  });
});