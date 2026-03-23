import { create } from 'zustand';
import type { RoutePanelTabId } from '@client/features/shared-section-placeholder';
import type {
  ReplayRequestTabSeed,
  RequestTabRecord,
  SavedWorkspaceRequestSeed,
} from '@client/features/request-builder/request-tab.types';

interface WorkspaceShellState {
  tabs: RequestTabRecord[];
  activeTabId: string | null;
  selectedExplorerItemId: string | null;
  activeRoutePanel: RoutePanelTabId;
  nextDraftSequence: number;
  openNewRequest: () => void;
  openSavedRequest: (request: SavedWorkspaceRequestSeed) => void;
  openReplayRequest: (replaySeed: ReplayRequestTabSeed) => RequestTabRecord;
  markTabSaved: (tabId: string, request: SavedWorkspaceRequestSeed) => void;
  setActiveRoutePanel: (panelId: RoutePanelTabId) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
}

const initialWorkspaceShellState: Pick<
  WorkspaceShellState,
  'tabs' | 'activeTabId' | 'selectedExplorerItemId' | 'activeRoutePanel' | 'nextDraftSequence'
> = {
  tabs: [],
  activeTabId: null,
  selectedExplorerItemId: null,
  activeRoutePanel: 'main',
  nextDraftSequence: 1,
};

function createDraftTab(sequence: number): RequestTabRecord {
  return {
    id: `draft-${sequence}`,
    sourceKey: `draft-${sequence}`,
    title: 'Untitled Request',
    methodLabel: 'GET',
    source: 'draft',
    summary: 'Unsaved request authoring draft.',
    hasUnsavedChanges: false,
  };
}

function createSavedTab(request: SavedWorkspaceRequestSeed): RequestTabRecord {
  return {
    id: `saved-${request.id}`,
    sourceKey: `saved-${request.id}`,
    requestId: request.id,
    title: request.name,
    methodLabel: request.methodLabel,
    source: 'saved',
    summary: request.summary,
    ...(request.collectionId ? { collectionId: request.collectionId } : {}),
    collectionName: request.collectionName,
    ...(request.requestGroupId ? { requestGroupId: request.requestGroupId } : {}),
    ...(request.requestGroupName || request.folderName
      ? {
          requestGroupName: request.requestGroupName ?? request.folderName,
          folderName: request.requestGroupName ?? request.folderName,
        }
      : {}),
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
    summary: replaySeed.summary,
    replaySource: replaySeed.replaySource,
    hasUnsavedChanges: false,
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

export const useWorkspaceShellStore = create<WorkspaceShellState>((set) => ({
  ...initialWorkspaceShellState,
  openNewRequest: () =>
    set((state) => {
      const draftTab = createDraftTab(state.nextDraftSequence);

      return {
        tabs: [...state.tabs, draftTab],
        activeTabId: draftTab.id,
        selectedExplorerItemId: null,
        activeRoutePanel: 'main',
        nextDraftSequence: state.nextDraftSequence + 1,
      };
    }),
  openSavedRequest: (request) =>
    set((state) => {
      const existingTab = state.tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

      if (existingTab) {
        return {
          activeTabId: existingTab.id,
          selectedExplorerItemId: request.id,
          activeRoutePanel: 'main',
        };
      }

      const savedTab = createSavedTab(request);

      return {
        tabs: [...state.tabs, savedTab],
        activeTabId: savedTab.id,
        selectedExplorerItemId: request.id,
        activeRoutePanel: 'main',
      };
    }),
  openReplayRequest: (replaySeed) => {
    let replayTab: RequestTabRecord | null = null;

    set((state) => {
      replayTab = createReplayTab(state.nextDraftSequence, replaySeed);

      return {
        tabs: [...state.tabs, replayTab],
        activeTabId: replayTab.id,
        selectedExplorerItemId: null,
        activeRoutePanel: 'main',
        nextDraftSequence: state.nextDraftSequence + 1,
      };
    });

    return replayTab!;
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
            sourceKey: `saved-${request.id}`,
            requestId: request.id,
            title: request.name,
            methodLabel: request.methodLabel,
            source: 'saved',
            summary: request.summary,
            ...(request.collectionId ? { collectionId: request.collectionId } : {}),
            collectionName: request.collectionName,
            ...(request.requestGroupId ? { requestGroupId: request.requestGroupId } : {}),
            hasUnsavedChanges: false,
          };

          delete nextTab.replaySource;
          delete nextTab.requestGroupName;
          delete nextTab.folderName;

          const requestGroupName = request.requestGroupName ?? request.folderName;

          if (requestGroupName) {
            nextTab.requestGroupName = requestGroupName;
            nextTab.folderName = requestGroupName;
          }

          return nextTab;
        }),
        selectedExplorerItemId: state.activeTabId === tabId ? request.id : state.selectedExplorerItemId,
      };
    }),
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
        selectedExplorerItemId: activeTab.requestId ?? null,
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
        selectedExplorerItemId: fallbackTab?.requestId ?? null,
        activeRoutePanel: fallbackTab ? 'main' : state.activeRoutePanel,
      };
    }),
}));

export function resetWorkspaceShellStore() {
  useWorkspaceShellStore.setState(initialWorkspaceShellState);
}





