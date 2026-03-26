import { afterEach, describe, expect, it } from 'vitest';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { resetRequestDraftStore, useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';

function createTab(
  overrides: Partial<RequestTabRecord> & Pick<RequestTabRecord, 'id' | 'title' | 'methodLabel' | 'source' | 'tabMode' | 'summary'>,
): RequestTabRecord {
  return {
    sourceKey: overrides.sourceKey ?? overrides.id,
    hasUnsavedChanges: overrides.hasUnsavedChanges ?? false,
    ...overrides,
  };
}

afterEach(() => {
  resetRequestDraftStore();
});

describe('request-draft-store', () => {
  it('starts detached and quick drafts with an empty editable name so locale fallback stays in the presentation layer', () => {
    const detachedTab = createTab({
      id: 'detached-1',
      title: 'Untitled Request',
      methodLabel: 'GET',
      source: 'detached',
      tabMode: 'pinned',
      summary: 'Unsaved request authoring draft.',
    });
    const quickTab = createTab({
      id: 'quick-1',
      title: 'Quick Request',
      methodLabel: 'GET',
      source: 'quick',
      tabMode: 'pinned',
      summary: 'Session-only request draft.',
    });

    const store = useRequestDraftStore.getState();
    store.ensureDraftForTab(detachedTab);
    store.ensureDraftForTab(quickTab);

    expect(useRequestDraftStore.getState().draftsByTabId['detached-1']?.draft.name).toBe('');
    expect(useRequestDraftStore.getState().draftsByTabId['quick-1']?.draft.name).toBe('');
  });

  it('preserves saved and replay titles as editable draft names when no explicit seed is supplied', () => {
    const savedTab = createTab({
      id: 'saved-1',
      sourceKey: 'saved-1',
      title: 'Health check',
      methodLabel: 'GET',
      source: 'saved',
      tabMode: 'pinned',
      summary: 'GET /health',
      requestId: 'request-1',
    });
    const replayTab = createTab({
      id: 'replay-1',
      sourceKey: 'replay-history-1',
      title: 'Replay of Create user',
      methodLabel: 'POST',
      source: 'replay',
      tabMode: 'pinned',
      summary: 'Replay draft',
      replaySource: {
        kind: 'history',
        label: 'History replay',
        description: 'Replay draft from execution history.',
      },
    });

    const store = useRequestDraftStore.getState();
    store.ensureDraftForTab(savedTab);
    store.ensureDraftForTab(replayTab);

    expect(useRequestDraftStore.getState().draftsByTabId['saved-1']?.draft.name).toBe('Health check');
    expect(useRequestDraftStore.getState().draftsByTabId['replay-1']?.draft.name).toBe('Replay of Create user');
  });


  it('tracks multipart row file selections per tab and clears them when the row type switches to text', () => {
    const tab = createTab({
      id: 'detached-multipart',
      title: 'Multipart draft',
      methodLabel: 'POST',
      source: 'detached',
      tabMode: 'pinned',
      summary: 'Multipart upload draft.',
    });

    const store = useRequestDraftStore.getState();
    store.ensureDraftForTab(tab, {
      method: 'POST',
      url: 'https://api.example.com/upload',
      bodyMode: 'multipart-form-data',
      multipartBody: [
        {
          id: 'row-file-1',
          key: 'attachment',
          value: '',
          enabled: true,
          valueType: 'file',
        },
      ],
    }, { replace: true });

    const selectedFile = new File(['hello'], 'demo.txt', { type: 'text/plain' });
    store.setMultipartRowFiles(tab.id, 'row-file-1', [selectedFile]);

    expect(useRequestDraftStore.getState().multipartFilesByTabId[tab.id]?.['row-file-1']).toHaveLength(1);

    store.updateRow(tab.id, 'multipartBody', 'row-file-1', 'valueType', 'text');

    expect(useRequestDraftStore.getState().multipartFilesByTabId[tab.id]?.['row-file-1']).toBeUndefined();
  });

  it('clears multipart file selections when body mode changes away from multipart', () => {
    const tab = createTab({
      id: 'detached-mode-switch',
      title: 'Mode switch draft',
      methodLabel: 'POST',
      source: 'detached',
      tabMode: 'pinned',
      summary: 'Body mode switch draft.',
    });

    const store = useRequestDraftStore.getState();
    store.ensureDraftForTab(tab, {
      method: 'POST',
      url: 'https://api.example.com/upload',
      bodyMode: 'multipart-form-data',
      multipartBody: [
        {
          id: 'row-file-2',
          key: 'file',
          value: '',
          enabled: true,
          valueType: 'file',
        },
      ],
    }, { replace: true });

    const selectedFile = new File(['hello'], 'demo.txt', { type: 'text/plain' });
    store.setMultipartRowFiles(tab.id, 'row-file-2', [selectedFile]);
    expect(useRequestDraftStore.getState().multipartFilesByTabId[tab.id]?.['row-file-2']).toHaveLength(1);

    store.updateBodyMode(tab.id, 'json');

    expect(useRequestDraftStore.getState().multipartFilesByTabId[tab.id]).toBeUndefined();
  });

});
