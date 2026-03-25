import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequestTabShell } from '@client/features/request-builder/components/RequestTabShell';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { renderApp } from '@client/shared/test/render-app';

function createTab(overrides: Partial<RequestTabRecord> & Pick<RequestTabRecord, 'id' | 'title' | 'methodLabel' | 'source' | 'tabMode' | 'summary'>): RequestTabRecord {
  return {
    sourceKey: overrides.sourceKey ?? overrides.id,
    hasUnsavedChanges: overrides.hasUnsavedChanges ?? false,
    ...overrides,
  };
}

describe('RequestTabShell', () => {
  it('renders localized quick-request and tab source labels', () => {
    renderApp(
      <RequestTabShell
        tabs={[
          createTab({
            id: 'tab-preview',
            title: 'Health check',
            methodLabel: 'GET',
            source: 'saved',
            tabMode: 'preview',
            summary: 'GET /health',
          }),
          createTab({
            id: 'tab-quick',
            title: 'Scratch',
            methodLabel: 'POST',
            source: 'quick',
            tabMode: 'pinned',
            summary: 'POST /scratch',
          }),
          createTab({
            id: 'tab-detached',
            title: 'Recovered',
            methodLabel: 'PATCH',
            source: 'detached',
            tabMode: 'pinned',
            summary: 'PATCH /recovered',
          }),
        ]}
        activeTabId="tab-preview"
        onCreateRequest={vi.fn()}
        onCreateQuickRequest={vi.fn()}
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onPinTab={vi.fn()}
      />,
      { initialLocale: 'ko' },
    );

    expect(screen.getByRole('tablist', { name: '요청 탭 스트립' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '빠른 요청' })).toBeInTheDocument();
    expect(screen.getByText('GET · 미리보기')).toBeInTheDocument();
    expect(screen.getByText('POST · 빠른')).toBeInTheDocument();
    expect(screen.getByText('PATCH · 분리됨')).toBeInTheDocument();
    expect(screen.getByLabelText('Health check 고정')).toBeInTheDocument();
    expect(screen.getByLabelText('Recovered 닫기')).toBeInTheDocument();
  });
});
