import { create } from 'zustand';

const EXPLORER_UI_STORAGE_KEY = 'workspace-explorer-ui-v1';

interface PersistedExplorerUiState {
  collapsedNodeIds: string[];
}

interface WorkspaceExplorerUiState {
  searchQuery: string;
  focusedItemIndex: number;
  collapsedNodeIds: string[];
  setSearchQuery: (searchQuery: string) => void;
  setFocusedItemIndex: (focusedItemIndex: number) => void;
  setNodeCollapsed: (nodeId: string, collapsed: boolean) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  reset: () => void;
}

function readPersistedExplorerUiState(): PersistedExplorerUiState {
  if (typeof window === 'undefined') {
    return {
      collapsedNodeIds: [],
    };
  }

  const persistedText = window.localStorage.getItem(EXPLORER_UI_STORAGE_KEY);

  if (!persistedText) {
    return {
      collapsedNodeIds: [],
    };
  }

  try {
    const parsedValue = JSON.parse(persistedText) as PersistedExplorerUiState;

    return {
      collapsedNodeIds: Array.isArray(parsedValue?.collapsedNodeIds)
        ? parsedValue.collapsedNodeIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        : [],
    };
  } catch {
    return {
      collapsedNodeIds: [],
    };
  }
}

function persistExplorerUiState(state: PersistedExplorerUiState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(EXPLORER_UI_STORAGE_KEY, JSON.stringify(state));
}

function normalizeCollapsedNodeIds(collapsedNodeIds: string[]) {
  return [...new Set(collapsedNodeIds.map((value) => value.trim()).filter((value) => value.length > 0))]
    .sort((left, right) => left.localeCompare(right));
}

const persistedState = readPersistedExplorerUiState();

const initialWorkspaceExplorerUiState: Pick<WorkspaceExplorerUiState, 'searchQuery' | 'focusedItemIndex' | 'collapsedNodeIds'> = {
  searchQuery: '',
  focusedItemIndex: 0,
  collapsedNodeIds: persistedState.collapsedNodeIds,
};

export const useWorkspaceExplorerStore = create<WorkspaceExplorerUiState>((set) => ({
  ...initialWorkspaceExplorerUiState,
  setSearchQuery: (searchQuery) =>
    set(() => ({
      searchQuery,
      focusedItemIndex: 0,
    })),
  setFocusedItemIndex: (focusedItemIndex) =>
    set(() => ({
      focusedItemIndex: Number.isFinite(focusedItemIndex) ? Math.max(0, Math.trunc(focusedItemIndex)) : 0,
    })),
  setNodeCollapsed: (nodeId, collapsed) =>
    set((state) => {
      const normalizedNodeId = nodeId.trim();

      if (normalizedNodeId.length === 0) {
        return {};
      }

      const nextCollapsedNodeIds = collapsed
        ? normalizeCollapsedNodeIds([...state.collapsedNodeIds, normalizedNodeId])
        : state.collapsedNodeIds.filter((value) => value !== normalizedNodeId);

      persistExplorerUiState({
        collapsedNodeIds: nextCollapsedNodeIds,
      });

      return {
        collapsedNodeIds: nextCollapsedNodeIds,
      };
    }),
  toggleNodeCollapsed: (nodeId) =>
    set((state) => {
      const normalizedNodeId = nodeId.trim();

      if (normalizedNodeId.length === 0) {
        return {};
      }

      const nextCollapsedNodeIds = state.collapsedNodeIds.includes(normalizedNodeId)
        ? state.collapsedNodeIds.filter((value) => value !== normalizedNodeId)
        : normalizeCollapsedNodeIds([...state.collapsedNodeIds, normalizedNodeId]);

      persistExplorerUiState({
        collapsedNodeIds: nextCollapsedNodeIds,
      });

      return {
        collapsedNodeIds: nextCollapsedNodeIds,
      };
    }),
  reset: () =>
    set(() => ({
      ...initialWorkspaceExplorerUiState,
    })),
}));

export function resetWorkspaceExplorerStore() {
  useWorkspaceExplorerStore.getState().reset();
}
