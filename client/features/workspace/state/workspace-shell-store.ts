import { create } from 'zustand';
import type { RoutePanelTabId } from '@client/features/route-panel-tabs-layout';
import {
  createRequestPlacementFields,
  readRequestGroupName,
  replaceRequestPlacement,
  resolveRequestPlacement,
  type RequestPlacementValue,
} from '@client/features/request-builder/request-placement';
import type {
  ReplayRequestTabSeed,
  RequestTabRecord,
  SavedWorkspaceRequestSeed,
} from '@client/features/request-builder/request-tab.types';

export type WorkspaceExplorerItemKind = 'collection' | 'request-group' | 'request';

export interface WorkspaceExplorerSelection {
  kind: WorkspaceExplorerItemKind;
  id: string;
}

interface WorkspaceShellState {
  tabs: RequestTabRecord[];
  activeTabId: string | null;
  selectedExplorerItemId: string | null;
  selectedExplorerItemKind: WorkspaceExplorerItemKind | null;
  activeRoutePanel: RoutePanelTabId;
  nextDraftSequence: number;
  openNewRequest: (options?: { source?: 'detached' | 'quick'; placement?: RequestPlacementValue }) => RequestTabRecord;
  openQuickRequest: (options?: { placement?: RequestPlacementValue }) => RequestTabRecord;
  openSavedRequest: (request: SavedWorkspaceRequestSeed, options?: { tabMode?: 'preview' | 'pinned' }) => RequestTabRecord;
  openReplayRequest: (replaySeed: ReplayRequestTabSeed) => RequestTabRecord;
  markTabSaved: (tabId: string, request: SavedWorkspaceRequestSeed) => void;
  detachSavedRequest: (requestId: string) => void;
  pinTab: (tabId: string) => void;
  setSelectedExplorerItem: (selection: WorkspaceExplorerSelection | null) => void;
  syncCollectionPlacement: (collectionId: string, placement: RequestPlacementValue) => void;
  syncRequestGroupPlacement: (requestGroupId: string, placement: RequestPlacementValue) => void;
  setActiveRoutePanel: (panelId: RoutePanelTabId) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
}

const initialWorkspaceShellState: Pick<
  WorkspaceShellState,
  'tabs' | 'activeTabId' | 'selectedExplorerItemId' | 'selectedExplorerItemKind' | 'activeRoutePanel' | 'nextDraftSequence'
> = {
  tabs: [],
  activeTabId: null,
  selectedExplorerItemId: null,
  selectedExplorerItemKind: null,
  activeRoutePanel: 'main',
  nextDraftSequence: 1,
};

function createDraftTab(sequence: number, source: 'detached' | 'quick', placement?: RequestPlacementValue): RequestTabRecord {
  return {
    id: `${source}-${sequence}`,
    sourceKey: `${source}-${sequence}`,
    title: source === 'quick' ? 'Quick Request' : 'Untitled Request',
    methodLabel: 'GET',
    source,
    tabMode: 'pinned',
    summary: source === 'quick' ? 'Session-only request draft.' : 'Unsaved request authoring draft.',
    hasUnsavedChanges: false,
    ...createRequestPlacementFields(resolveRequestPlacement(placement, null)),
  };
}

function createSavedTab(
  request: SavedWorkspaceRequestSeed,
  tabMode: 'preview' | 'pinned',
  existingId?: string,
): RequestTabRecord {
  return {
    id: existingId ?? `saved-${request.id}`,
    sourceKey: `saved-${request.id}`,
    requestId: request.id,
    title: request.name,
    methodLabel: request.methodLabel,
    source: 'saved',
    tabMode,
    summary: request.summary,
    ...createRequestPlacementFields(request),
    hasUnsavedChanges: false,
  };
}

function createReplayTab(sequence: number, replaySeed: ReplayRequestTabSeed): RequestTabRecord {
  return {
    id: `replay-${sequence}`,
    sourceKey: `replay-${replaySeed.replaySource.kind}-${sequence}`,
    title: replaySeed.title,
    methodLabel: replaySeed.methodLabel,
    source: 'replay',
    tabMode: 'pinned',
    summary: replaySeed.summary,
    replaySource: replaySeed.replaySource,
    hasUnsavedChanges: false,
  };
}

function createRequestSelection(requestId: string | null | undefined) {
  return requestId
    ? {
        selectedExplorerItemId: requestId,
        selectedExplorerItemKind: 'request' as const,
      }
    : {
        selectedExplorerItemId: null,
        selectedExplorerItemKind: null,
      };
}

function getNextActiveTabId(tabs: RequestTabRecord[], closedTabId: string): string | null {
  const closedTabIndex = tabs.findIndex((tab) => tab.id === closedTabId);

  if (closedTabIndex === -1) {
    return null;
  }

  const nextRightTab = tabs[closedTabIndex + 1];

  if (nextRightTab) {
    return nextRightTab.id;
  }

  const nextLeftTab = tabs[closedTabIndex - 1];

  return nextLeftTab ? nextLeftTab.id : null;
}

function requireCreatedTab(tab: RequestTabRecord | null, message: string) {
  if (!tab) {
    throw new Error(message);
  }

  return tab;
}

export const useWorkspaceShellStore = create<WorkspaceShellState>((set) => ({
  ...initialWorkspaceShellState,
  openNewRequest: (options = {}) => {
    let createdTab: RequestTabRecord | null = null;

    set((state) => {
      const nextTab = createDraftTab(
        state.nextDraftSequence,
        options.source ?? 'detached',
        options.placement,
      );
      createdTab = nextTab;

      return {
        tabs: [...state.tabs, nextTab],
        activeTabId: nextTab.id,
        selectedExplorerItemId: null,
        selectedExplorerItemKind: null,
        activeRoutePanel: 'main',
        nextDraftSequence: state.nextDraftSequence + 1,
      };
    });

    return requireCreatedTab(createdTab, 'Failed to create request tab.');
  },
  openQuickRequest: (options = {}) => {
    let createdTab: RequestTabRecord | null = null;

    set((state) => {
      const nextTab = createDraftTab(
        state.nextDraftSequence,
        'quick',
        options.placement,
      );
      createdTab = nextTab;

      return {
        tabs: [...state.tabs, nextTab],
        activeTabId: nextTab.id,
        selectedExplorerItemId: null,
        selectedExplorerItemKind: null,
        activeRoutePanel: 'main',
        nextDraftSequence: state.nextDraftSequence + 1,
      };
    });

    return requireCreatedTab(createdTab, 'Failed to create quick request tab.');
  },
  openSavedRequest: (request, options = {}) => {
    let resolvedTab: RequestTabRecord | null = null;

    set((state) => {
      const requestedTabMode = options.tabMode ?? 'preview';
      const existingTab = state.tabs.find((tab) => tab.sourceKey === `saved-${request.id}`) ?? null;

      if (existingTab) {
        const nextTabMode = requestedTabMode === 'pinned' ? 'pinned' : existingTab.tabMode;
        const nextTab: RequestTabRecord = {
          ...existingTab,
          ...createSavedTab(request, nextTabMode, existingTab.id),
          tabMode: nextTabMode,
          hasUnsavedChanges: existingTab.hasUnsavedChanges,
        };
        resolvedTab = nextTab;

        return {
          tabs: state.tabs.map((tab) => (tab.id === existingTab.id ? nextTab : tab)),
          activeTabId: nextTab.id,
          ...createRequestSelection(request.id),
          activeRoutePanel: 'main',
        };
      }

      if (requestedTabMode === 'preview') {
        const previewTab = state.tabs.find((tab) => tab.tabMode === 'preview' && tab.source === 'saved') ?? null;
        const nextPreviewTab = createSavedTab(request, 'preview', previewTab?.id);
        resolvedTab = nextPreviewTab;

        return {
          tabs: previewTab
            ? state.tabs.map((tab) => (tab.id === previewTab.id ? nextPreviewTab : tab))
            : [...state.tabs, nextPreviewTab],
          activeTabId: nextPreviewTab.id,
          ...createRequestSelection(request.id),
          activeRoutePanel: 'main',
        };
      }

      const nextSavedTab = createSavedTab(request, 'pinned');
      resolvedTab = nextSavedTab;

      return {
        tabs: [...state.tabs, nextSavedTab],
        activeTabId: nextSavedTab.id,
        ...createRequestSelection(request.id),
        activeRoutePanel: 'main',
      };
    });

    return requireCreatedTab(resolvedTab, 'Failed to open saved request tab.');
  },
  openReplayRequest: (replaySeed) => {
    let replayTab: RequestTabRecord | null = null;

    set((state) => {
      const nextReplayTab = createReplayTab(state.nextDraftSequence, replaySeed);
      replayTab = nextReplayTab;

      return {
        tabs: [...state.tabs, nextReplayTab],
        activeTabId: nextReplayTab.id,
        selectedExplorerItemId: null,
        selectedExplorerItemKind: null,
        activeRoutePanel: 'main',
        nextDraftSequence: state.nextDraftSequence + 1,
      };
    });

    return requireCreatedTab(replayTab, 'Failed to create replay request tab.');
  },
  markTabSaved: (tabId, request) =>
    set((state) => {
      const existingTab = state.tabs.find((tab) => tab.id === tabId);

      if (!existingTab) {
        return {};
      }

      return {
        tabs: state.tabs.map((tab) => {
          if (tab.id !== tabId) {
            return tab;
          }

          const nextTab: RequestTabRecord = {
            ...tab,
            ...createSavedTab(request, 'pinned', tab.id),
            source: 'saved',
            tabMode: 'pinned',
            hasUnsavedChanges: false,
          };

          delete nextTab.replaySource;

          if (!readRequestGroupName(request)) {
            delete nextTab.requestGroupName;
          }

          return nextTab;
        }),
        ...(state.activeTabId === tabId ? createRequestSelection(request.id) : {}),
      };
    }),
  detachSavedRequest: (requestId) =>
    set((state) => {
      const nextTabs = state.tabs.map((tab) => {
        if (tab.requestId !== requestId) {
          return tab;
        }

        const nextTab: RequestTabRecord = {
          ...tab,
          source: 'detached',
          sourceKey: `detached-${requestId}-${tab.id}`,
          tabMode: 'pinned',
          hasUnsavedChanges: true,
        };

        delete nextTab.requestId;
        delete nextTab.replaySource;

        return nextTab;
      });
      const activeTab = nextTabs.find((tab) => tab.id === state.activeTabId) ?? null;

      return {
        tabs: nextTabs,
        ...createRequestSelection(activeTab?.requestId ?? null),
      };
    }),
  pinTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (
        tab.id === tabId
          ? {
              ...tab,
              tabMode: 'pinned',
            }
          : tab
      )),
    })),
  setSelectedExplorerItem: (selection) =>
    set(() => ({
      selectedExplorerItemId: selection?.id ?? null,
      selectedExplorerItemKind: selection?.kind ?? null,
    })),
  syncCollectionPlacement: (collectionId, placement) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.collectionId !== collectionId) {
          return tab;
        }

        return replaceRequestPlacement(
          tab,
          resolveRequestPlacement(placement, tab),
        );
      }),
    })),
  syncRequestGroupPlacement: (requestGroupId, placement) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.requestGroupId !== requestGroupId) {
          return tab;
        }

        return replaceRequestPlacement(
          tab,
          resolveRequestPlacement(placement, tab),
        );
      }),
    })),
  setActiveRoutePanel: (activeRoutePanel) =>
    set(() => ({ activeRoutePanel })),
  setActiveTab: (tabId) =>
    set((state) => {
      const activeTab = state.tabs.find((tab) => tab.id === tabId);

      if (!activeTab) {
        return {};
      }

      return {
        activeTabId: tabId,
        ...createRequestSelection(activeTab.requestId ?? null),
        activeRoutePanel: 'main',
      };
    }),
  closeTab: (tabId) =>
    set((state) => {
      const nextTabs = state.tabs.filter((tab) => tab.id !== tabId);

      if (state.activeTabId !== tabId) {
        return {
          tabs: nextTabs,
        };
      }

      const fallbackTabId = getNextActiveTabId(state.tabs, tabId);
      const fallbackTab = nextTabs.find((tab) => tab.id === fallbackTabId);

      return {
        tabs: nextTabs,
        activeTabId: fallbackTabId,
        ...createRequestSelection(fallbackTab?.requestId ?? null),
        activeRoutePanel: fallbackTab ? 'main' : state.activeRoutePanel,
      };
    }),
}));

export function resetWorkspaceShellStore() {
  useWorkspaceShellStore.setState(initialWorkspaceShellState);
}
