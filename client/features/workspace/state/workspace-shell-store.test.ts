import { afterEach, describe, expect, it } from 'vitest';
import {
  resetWorkspaceShellStore,
  useWorkspaceShellStore,
} from '@client/features/workspace/state/workspace-shell-store';

function createSavedRequestSeed(id: string, name: string) {
  return {
    id,
    name,
    methodLabel: 'GET' as const,
    summary: `${name} summary`,
    collectionId: 'collection-saved-requests',
    collectionName: 'Saved Requests',
    requestGroupId: 'request-group-general',
    requestGroupName: 'General',
  };
}

afterEach(() => {
  resetWorkspaceShellStore();
});

describe('workspace-shell-store', () => {
  it('reuses a single preview tab slot for saved requests', () => {
    const firstTab = useWorkspaceShellStore.getState().openSavedRequest(
      createSavedRequestSeed('request-1', 'Health check'),
      { tabMode: 'preview' },
    );

    expect(firstTab.tabMode).toBe('preview');
    expect(useWorkspaceShellStore.getState().tabs).toHaveLength(1);

    const secondTab = useWorkspaceShellStore.getState().openSavedRequest(
      createSavedRequestSeed('request-2', 'Create user'),
      { tabMode: 'preview' },
    );

    const state = useWorkspaceShellStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(secondTab.id).toBe(firstTab.id);
    expect(state.tabs[0]?.requestId).toBe('request-2');
    expect(state.tabs[0]?.title).toBe('Create user');
    expect(state.tabs[0]?.tabMode).toBe('preview');
  });

  it('promotes a quick request tab into a saved pinned tab after save', () => {
    const quickTab = useWorkspaceShellStore.getState().openQuickRequest({
      placement: {
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-general',
        requestGroupName: 'General',
      },
    });

    expect(quickTab.source).toBe('quick');
    expect(quickTab.tabMode).toBe('pinned');

    useWorkspaceShellStore.getState().markTabSaved(
      quickTab.id,
      createSavedRequestSeed('request-quick-saved', 'Quick save'),
    );

    const savedTab = useWorkspaceShellStore.getState().tabs[0];
    expect(savedTab?.source).toBe('saved');
    expect(savedTab?.requestId).toBe('request-quick-saved');
    expect(savedTab?.tabMode).toBe('pinned');
    expect(savedTab?.title).toBe('Quick save');
  });

  it('opens a seeded detached request tab for new authoring flows', () => {
    const detachedTab = useWorkspaceShellStore.getState().openNewRequest({
      placement: {
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-auth',
        requestGroupName: 'Auth',
      },
    });

    expect(detachedTab.source).toBe('detached');
    expect(detachedTab.tabMode).toBe('pinned');
    expect(detachedTab.collectionId).toBe('collection-saved-requests');
    expect(detachedTab.collectionName).toBe('Saved Requests');
    expect(detachedTab.requestGroupId).toBe('request-group-auth');
    expect(detachedTab.requestGroupName).toBe('Auth');
    expect(detachedTab.title).toBe('Untitled Request');
  });
  it('reopens the most recently closed tab from recent history', () => {
    const firstTab = useWorkspaceShellStore.getState().openNewRequest();
    const secondTab = useWorkspaceShellStore.getState().openQuickRequest();

    expect(useWorkspaceShellStore.getState().tabs).toHaveLength(2);

    useWorkspaceShellStore.getState().closeTab(secondTab.id);

    const stateAfterClose = useWorkspaceShellStore.getState();
    expect(stateAfterClose.tabs.map((tab) => tab.id)).toEqual([firstTab.id]);
    expect(stateAfterClose.recentlyClosedTabs[0]?.id).toBe(secondTab.id);

    const reopenedTab = useWorkspaceShellStore.getState().reopenLastClosedTab();

    expect(reopenedTab?.id).toBe(secondTab.id);
    expect(useWorkspaceShellStore.getState().tabs.map((tab) => tab.id)).toEqual([firstTab.id, secondTab.id]);
    expect(useWorkspaceShellStore.getState().activeTabId).toBe(secondTab.id);
    expect(useWorkspaceShellStore.getState().recentlyClosedTabs).toHaveLength(0);
  });
  it('opens collection overview tabs and keeps explorer selection linked to the tab', () => {
    const overviewTab = useWorkspaceShellStore.getState().openCollectionOverview({
      collectionId: 'collection-team',
      collectionName: 'Team API',
    });

    let state = useWorkspaceShellStore.getState();
    expect(overviewTab.source).toBe('collection-overview');
    expect(state.activeTabId).toBe(overviewTab.id);
    expect(state.selectedExplorerItemKind).toBe('collection');
    expect(state.selectedExplorerItemId).toBe('collection-team');

    useWorkspaceShellStore.getState().closeTab(overviewTab.id);
    useWorkspaceShellStore.getState().reopenLastClosedTab();

    state = useWorkspaceShellStore.getState();
    expect(state.activeTabId).toBe(overviewTab.id);
    expect(state.selectedExplorerItemKind).toBe('collection');
    expect(state.selectedExplorerItemId).toBe('collection-team');
  });

  it('keeps a single batch-result tab slot and updates it with the latest execution metadata', () => {
    const firstTab = useWorkspaceShellStore.getState().openBatchResult({
      containerType: 'collection',
      containerId: 'collection-team',
      containerName: 'Team API',
      status: 'pending',
    });

    const secondTab = useWorkspaceShellStore.getState().openBatchResult({
      containerType: 'request-group',
      containerId: 'request-group-auth',
      containerName: 'Auth',
      status: 'success',
      batchExecutionId: 'batch-123',
    });

    const state = useWorkspaceShellStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(secondTab.id).toBe(firstTab.id);
    expect(state.tabs[0]?.source).toBe('batch-result');
    expect(state.tabs[0]?.title).toBe('Auth');
    expect(state.tabs[0]?.requestGroupId).toBe('request-group-auth');
    expect(state.tabs[0]?.batchExecutionId).toBe('batch-123');
  });
});

