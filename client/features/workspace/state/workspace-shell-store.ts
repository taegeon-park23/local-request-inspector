import { create } from 'zustand';
import type {
  RequestTabRecord,
  SavedWorkspaceRequestSeed,
} from '@client/features/request-builder/request-tab.types';

interface WorkspaceShellState {
  tabs: RequestTabRecord[];
  activeTabId: string | null;
  selectedExplorerItemId: string | null;
  nextDraftSequence: number;
  openNewRequest: () => void;
  openSavedRequest: (request: SavedWorkspaceRequestSeed) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
}

const initialWorkspaceShellState: Pick<
  WorkspaceShellState,
  'tabs' | 'activeTabId' | 'selectedExplorerItemId' | 'nextDraftSequence'
> = {
  tabs: [],
  activeTabId: null,
  selectedExplorerItemId: null,
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
    collectionName: request.collectionName,
    ...(request.folderName ? { folderName: request.folderName } : {}),
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
        };
      }

      const savedTab = createSavedTab(request);

      return {
        tabs: [...state.tabs, savedTab],
        activeTabId: savedTab.id,
        selectedExplorerItemId: request.id,
      };
    }),
  setActiveTab: (tabId) =>
    set((state) => {
      const activeTab = state.tabs.find((tab) => tab.id === tabId);

      if (!activeTab) {
        return {};
      }

      return {
        activeTabId: tabId,
        selectedExplorerItemId: activeTab.requestId ?? null,
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
      };
    }),
}));

export function resetWorkspaceShellStore() {
  useWorkspaceShellStore.setState(initialWorkspaceShellState);
}
