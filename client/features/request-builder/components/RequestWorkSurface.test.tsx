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

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '인증' }));
    expect(await screen.findByLabelText('Bearer 토큰')).toHaveValue('demo-token');
  });
});