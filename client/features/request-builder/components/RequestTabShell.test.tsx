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
  it('renders localized bulk actions and pin controls for all tab sources', async () => {
    const user = userEvent.setup();
    const onPinTab = vi.fn();
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
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onPinTab={onPinTab}
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
    expect(screen.getByRole('button', { name: '닫은 탭 다시 열기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '현재 탭 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다른 탭 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모든 탭 닫기' })).toBeInTheDocument();
    expect(screen.getByLabelText('탭 검색')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '새 요청' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '빠른 요청' })).not.toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /Health check/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Scratch/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Saved Requests/i })).toBeInTheDocument();

    expect(screen.getByLabelText('Health check 고정')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scratch 고정됨' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saved Requests 고정됨' })).toBeDisabled();
    expect(screen.getByLabelText('Saved Requests 닫기')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Health check 고정'));
    expect(onPinTab).toHaveBeenCalledWith('tab-preview');
    expect(onPinTab).toHaveBeenCalledTimes(1);
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

    expect(screen.getByRole('tab', { name: /Alpha Request/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Batch Result/i })).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'no-match');

    expect(screen.getByText('No tabs match the current search.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reopen Closed Tab' })).toBeDisabled();
  });
});

