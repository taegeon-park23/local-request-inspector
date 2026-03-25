import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('renders localized source labels and bulk-close actions', () => {
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
            id: 'tab-collection-overview',
            title: 'Saved Requests',
            methodLabel: 'GET',
            source: 'collection-overview',
            tabMode: 'pinned',
            summary: 'Collection overview',
          }),
        ]}
        activeTabId="tab-preview"
        onCreateRequest={vi.fn()}
        onCreateQuickRequest={vi.fn()}
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onPinTab={vi.fn()}
        onReopenClosedTab={vi.fn()}
        onCloseCurrentTab={vi.fn()}
        onCloseOtherTabs={vi.fn()}
        onCloseAllTabs={vi.fn()}
        canReopenClosedTab
        canCloseCurrentTab
        canCloseOtherTabs
        canCloseAllTabs
      />,
      { initialLocale: 'ko' },
    );

    expect(screen.getByRole('tablist', { name: '요청 탭 스트립' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '빠른 요청' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫은 탭 다시 열기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '현재 탭 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다른 탭 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모든 탭 닫기' })).toBeInTheDocument();
    expect(screen.getByLabelText('탭 검색')).toBeInTheDocument();
    expect(screen.getByText('GET · 미리보기')).toBeInTheDocument();
    expect(screen.getByText('POST · 빠른')).toBeInTheDocument();
    expect(screen.getByText('컬렉션 개요')).toBeInTheDocument();
    expect(screen.getByLabelText('Health check 고정')).toBeInTheDocument();
    expect(screen.getByLabelText('Saved Requests 닫기')).toBeInTheDocument();
  });

  it('filters tabs by search query and shows empty search result copy', async () => {
    const user = userEvent.setup();

    renderApp(
      <RequestTabShell
        tabs={[
          createTab({
            id: 'tab-alpha',
            title: 'Alpha Request',
            methodLabel: 'GET',
            source: 'saved',
            tabMode: 'pinned',
            summary: 'GET /alpha',
          }),
          createTab({
            id: 'tab-beta',
            title: 'Batch Result',
            methodLabel: 'GET',
            source: 'batch-result',
            tabMode: 'pinned',
            summary: 'Batch run success',
          }),
        ]}
        activeTabId="tab-alpha"
        onCreateRequest={vi.fn()}
        onCreateQuickRequest={vi.fn()}
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onPinTab={vi.fn()}
        onReopenClosedTab={vi.fn()}
        onCloseCurrentTab={vi.fn()}
        onCloseOtherTabs={vi.fn()}
        onCloseAllTabs={vi.fn()}
        canReopenClosedTab={false}
        canCloseCurrentTab
        canCloseOtherTabs
        canCloseAllTabs
      />,
    );

    const searchInput = screen.getByLabelText('Tab search');
    await user.type(searchInput, 'Alpha');

    expect(screen.getByText('Alpha Request')).toBeInTheDocument();
    expect(screen.queryByText('Batch Result')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'no-match');

    expect(screen.getByText('No tabs match the current search.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reopen Closed Tab' })).toBeDisabled();
  });
});
